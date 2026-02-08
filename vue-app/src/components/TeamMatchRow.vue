<template>
  <div v-if="!match.completed" class="match-item match-pending">
    <span class="team left">{{ t1 }}</span>
    <span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>
    <span class="team right">{{ t2 }}</span>
  </div>
  <div v-else class="team-match-wrapper">
    <div class="match-item team-match-header" @click="open = !open">
      <span class="team left" :class="w1 ? 'winner' : 'loser'">{{ t1 }}</span>
      <span class="score-box">
        <span class="s" :class="w1 ? 'winner' : 'loser'">{{ match.score1 }}</span>
        <span class="divider">:</span>
        <span class="s" :class="w1 ? 'loser' : 'winner'">{{ match.score2 }}</span>
      </span>
      <span class="team right" :class="w1 ? 'loser' : 'winner'">{{ t2 }}</span>
      <span class="toggle-arrow">{{ open ? '\u25B2' : '\u25BC' }}</span>
    </div>
    <div v-if="open" class="doubles-detail">
      <div v-for="(d, di) in match.doubles" :key="di" class="doubles-item">
        <div class="doubles-label">第 {{ di + 1 }} 點</div>
        <div class="doubles-row">
          <span class="doubles-player" :class="d.score1 > d.score2 ? 'winner' : 'loser'">{{ doublesDisplay(team1, d.t1p) }}</span>
          <span class="doubles-score">
            <span :class="d.score1 > d.score2 ? 'winner' : 'loser'">{{ d.score1 }}</span>
            :
            <span :class="d.score2 > d.score1 ? 'winner' : 'loser'">{{ d.score2 }}</span>
          </span>
          <span class="doubles-player" :class="d.score2 > d.score1 ? 'winner' : 'loser'">{{ doublesDisplay(team2, d.t2p) }}</span>
        </div>
        <div v-if="d.games && d.games.length" class="doubles-games">
          ({{ d.games.map(g => g.s1 + '-' + g.s2).join(', ') }})
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getTeamName, getTeamById, getDoublesDisplay } from '../lib/main-storage'

const props = defineProps({
  match: { type: Object, required: true },
  teams: { type: Array, required: true },
  uid: { type: String, default: '' },
})

const open = ref(false)
const w1 = computed(() => props.match.score1 > props.match.score2)
const t1 = computed(() => getTeamName(props.teams, props.match.team1Id))
const t2 = computed(() => getTeamName(props.teams, props.match.team2Id))
const team1 = computed(() => getTeamById(props.teams, props.match.team1Id))
const team2 = computed(() => getTeamById(props.teams, props.match.team2Id))

function doublesDisplay(team, indices) {
  return getDoublesDisplay(team, indices)
}
</script>

<style scoped>
.team-match-wrapper { margin-bottom: 4px; }
.team-match-header { cursor: pointer; user-select: none; position: relative; }
.team-match-header:hover { border-color: var(--accent); }
.match-pending { color: var(--text-muted); font-style: italic; }

.doubles-detail {
  background: var(--bg-card); border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 4px 4px; padding: 12px;
}
.doubles-item { padding: 8px 0; border-bottom: 1px solid var(--border); }
.doubles-item:last-child { border-bottom: none; }
.doubles-label { font-size: 0.75rem; font-weight: 600; color: var(--accent); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.doubles-row { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.doubles-player { flex: 1; font-weight: 500; }
.doubles-player:first-child { text-align: right; }
.doubles-player:last-child { text-align: left; }
.doubles-score { font-weight: 700; font-size: 1rem; min-width: 50px; text-align: center; }
.doubles-games { text-align: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.winner { color: var(--accent); }
.loser { color: var(--text-muted); }

.toggle-arrow {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 0.7rem; color: var(--text-muted);
}
</style>
