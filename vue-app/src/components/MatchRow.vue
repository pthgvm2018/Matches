<template>
  <div v-if="!match.completed && !match.team1Id && !match.team2Id" />
  <div v-else class="match-row">
    <!-- Header (always shown) -->
    <div class="match-row-header" @click="toggleOpen">
      <span class="team left" :class="match.completed ? (w1 ? 'winner' : 'loser') : ''">{{ t1 }}</span>
      <span class="score-box">
        <span class="s" :class="match.completed ? (w1 ? 'winner' : 'loser') : ''">{{ match.completed ? match.score1 : '-' }}</span>
        <span class="divider">:</span>
        <span class="s" :class="match.completed ? (w1 ? 'loser' : 'winner') : ''">{{ match.completed ? match.score2 : '-' }}</span>
      </span>
      <span class="team right" :class="match.completed ? (w1 ? 'loser' : 'winner') : ''">{{ t2 }}</span>
      <span v-if="match.completed" class="toggle-arrow">{{ open ? '\u25B2' : '\u25BC' }}</span>
    </div>

    <!-- Body (expandable) -->
    <div v-if="match.completed && open" class="match-row-body">
      <div class="players">
        <span :class="w1 ? 'winner' : 'loser'">{{ p1 }}</span>
        <span style="color:var(--text-muted);">vs</span>
        <span :class="w1 ? 'loser' : 'winner'">{{ p2 }}</span>
      </div>
      <div class="games-list">
        <div v-for="(g, gi) in match.games" :key="gi" class="game-badge">
          <span :class="g.s1 > g.s2 ? 'gw' : 'gl'">{{ g.s1 }}</span>
          -
          <span :class="g.s2 > g.s1 ? 'gw' : 'gl'">{{ g.s2 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getTeamName, getPlayersDisplay } from '../lib/ko16-storage'

const props = defineProps({
  match: { type: Object, required: true },
  teams: { type: Array, required: true },
  uid: { type: String, default: '' },
})

const open = ref(false)
const w1 = computed(() => props.match.completed && props.match.score1 > props.match.score2)
const t1 = computed(() => getTeamName(props.teams, props.match.team1Id))
const t2 = computed(() => getTeamName(props.teams, props.match.team2Id))
const p1 = computed(() => getPlayersDisplay(props.teams, props.match.team1Id))
const p2 = computed(() => getPlayersDisplay(props.teams, props.match.team2Id))

function toggleOpen() {
  if (props.match.completed) open.value = !open.value
}
</script>

<style scoped>
.match-row {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; margin-bottom: 8px; overflow: hidden;
}
.match-row-header {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.15s;
}
.match-row-header:hover { background: rgba(255,255,255,0.03); }
.match-row-header .team { font-weight: 600; min-width: 60px; }
.match-row-header .team.left { text-align: right; }
.match-row-header .team.right { text-align: left; }
.match-row-header .winner { color: var(--accent); }
.match-row-header .loser { color: var(--text-muted); }
.match-row-header .score-box {
  display: flex; gap: 4px; align-items: center; font-size: 1.3rem; font-weight: 800;
}
.match-row-header .score-box .divider { color: var(--text-muted); font-size: 1rem; }
.match-row-header .toggle-arrow { color: var(--text-muted); font-size: 0.7rem; margin-left: 8px; }

.match-row-body { padding: 10px 16px 14px; border-top: 1px solid var(--border); }
.match-row-body .players {
  display: flex; justify-content: center; gap: 20px;
  font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;
}
.match-row-body .games-list { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
.game-badge {
  background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
  padding: 3px 8px; font-size: 0.8rem; font-weight: 600;
}
.game-badge .gw { color: var(--accent); }
.game-badge .gl { color: var(--text-muted); }
</style>
