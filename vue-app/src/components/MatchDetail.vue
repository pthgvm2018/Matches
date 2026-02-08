<template>
  <!-- 未完成的比賽 -->
  <div v-if="!match.winner" class="match-item match-pending">
    <span class="team left">{{ match.p1?.name || '-' }}</span>
    <span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>
    <span class="team right">{{ match.p2?.name || '-' }}</span>
  </div>

  <!-- 已完成的比賽：可展開看每局比分 -->
  <div v-else class="match-detail-wrapper">
    <div class="match-item match-decided" @click="open = !open">
      <span class="team left" :class="isP1Winner ? 'winner' : 'loser'">{{ match.p1?.name }}</span>
      <span class="score-box">
        <span class="s" :class="isP1Winner ? 'winner' : 'loser'">{{ gs[0] }}</span>
        <span class="divider">:</span>
        <span class="s" :class="isP1Winner ? 'loser' : 'winner'">{{ gs[1] }}</span>
      </span>
      <span class="team right" :class="isP1Winner ? 'loser' : 'winner'">{{ match.p2?.name }}</span>
      <span v-if="match.scores?.length" class="toggle-arrow">{{ open ? '\u25B2' : '\u25BC' }}</span>
    </div>

    <div v-if="open && match.scores?.length" class="games-detail">
      <div class="games-list">
        <div v-for="(g, gi) in match.scores" :key="gi" class="game-badge">
          <span :class="g.a > g.b ? 'gw' : 'gl'">{{ g.a }}</span>
          <span class="gsep">-</span>
          <span :class="g.b > g.a ? 'gw' : 'gl'">{{ g.b }}</span>
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
</script>

<style scoped>
.match-detail-wrapper { margin-bottom: 4px; }
.match-decided { cursor: pointer; user-select: none; position: relative; }
.match-decided:hover { border-color: var(--accent); }
.match-pending { color: var(--text-muted); font-style: italic; }

.games-detail {
  background: var(--bg-card); border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 4px 4px; padding: 10px 12px;
}
.games-list {
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
}
.game-badge {
  display: inline-flex; align-items: center; gap: 3px;
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 4px; padding: 3px 8px; font-size: 0.82rem; font-weight: 600;
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
