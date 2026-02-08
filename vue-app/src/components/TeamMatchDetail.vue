<template>
  <!-- 未完成的比賽 -->
  <div v-if="!match.winner" class="match-item match-pending">
    <span class="team left">{{ match.p1?.name || '-' }}</span>
    <span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>
    <span class="team right">{{ match.p2?.name || '-' }}</span>
  </div>

  <!-- 已完成的比賽：可展開 -->
  <div v-else class="team-match-wrapper">
    <div class="match-item team-match-header" @click="open = !open">
      <span class="team left" :class="isP1Winner ? 'winner' : 'loser'">{{ match.p1?.name }}</span>
      <span class="score-box">
        <span class="s" :class="isP1Winner ? 'winner' : 'loser'">{{ match.teamScore?.a ?? gs[0] }}</span>
        <span class="divider">:</span>
        <span class="s" :class="isP1Winner ? 'loser' : 'winner'">{{ match.teamScore?.b ?? gs[1] }}</span>
      </span>
      <span class="team right" :class="isP1Winner ? 'loser' : 'winner'">{{ match.p2?.name }}</span>
      <span class="toggle-arrow">{{ open ? '\u25B2' : '\u25BC' }}</span>
    </div>

    <div v-if="open" class="rubbers-detail">
      <div v-for="(r, ri) in playedRubbers" :key="ri" class="rubber-item">
        <div class="rubber-label">{{ r.label || `第 ${ri + 1} 點` }}</div>
        <div class="rubber-row">
          <span class="rubber-player" :class="r.winner === 1 ? 'winner' : 'loser'">
            {{ r.p1Name || match.p1?.name }}
          </span>
          <span class="rubber-score">
            <span :class="r.winner === 1 ? 'winner' : 'loser'">{{ rubberGS(r)[0] }}</span>:<span :class="r.winner === 2 ? 'winner' : 'loser'">{{ rubberGS(r)[1] }}</span>
          </span>
          <span class="rubber-player" :class="r.winner === 2 ? 'winner' : 'loser'">
            {{ r.p2Name || match.p2?.name }}
          </span>
        </div>
        <div v-if="r.scores?.length" class="rubber-games">
          <div v-for="(g, gi) in r.scores" :key="gi" class="game-badge">
            <span :class="g.a > g.b ? 'gw' : 'gl'">{{ g.a }}</span>
            <span class="gsep">-</span>
            <span :class="g.b > g.a ? 'gw' : 'gl'">{{ g.b }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { gameScore } from '../lib/tournament.js'

const props = defineProps({ match: Object })
const open = ref(false)

const isP1Winner = computed(() => props.match.winner?.id === props.match.p1?.id)
const gs = computed(() => gameScore(props.match.scores))

// 顯示有 winner 或有比分資料的點
const playedRubbers = computed(() =>
  (props.match.rubberResults || []).filter(r => r.winner || (r.scores?.length > 0))
)

function rubberGS(r) { return gameScore(r.scores) }
</script>

<style scoped>
.team-match-wrapper { margin-bottom: 4px; }
.team-match-header { cursor: pointer; user-select: none; position: relative; }
.team-match-header:hover { border-color: var(--accent); }
.match-pending { color: var(--text-muted); font-style: italic; }

.rubbers-detail {
  background: var(--bg-card); border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 4px 4px; padding: 12px;
}
.rubber-item { padding: 8px 0; border-bottom: 1px solid var(--border); }
.rubber-item:last-child { border-bottom: none; }
.rubber-label {
  font-size: 0.75rem; font-weight: 600; color: var(--accent);
  margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
}
.rubber-row { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.rubber-player { flex: 1; font-weight: 500; }
.rubber-player:first-child { text-align: right; }
.rubber-player:last-child { text-align: left; }
.rubber-score { font-weight: 700; font-size: 1rem; min-width: 50px; text-align: center; }

.rubber-games {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 6px;
}
.game-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 4px; padding: 2px 7px; font-size: 0.78rem; font-weight: 600;
}
.gw { color: var(--accent); }
.gl { color: var(--text-muted); }
.gsep { color: var(--text-muted); font-weight: 400; }

.winner { color: var(--accent); }
.loser { color: var(--text-muted); }

.toggle-arrow {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 0.7rem; color: var(--text-muted);
}
</style>
