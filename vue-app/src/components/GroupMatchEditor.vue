<template>
  <div class="match-edit-item">
    <div class="match-edit-header">
      <div class="match-edit-teams">
        <span>{{ t1n }}</span><span class="vs">vs</span><span>{{ t2n }}</span>
      </div>
      <span class="badge" :class="match.completed ? 'badge-green' : 'badge-yellow'">
        {{ match.completed ? '已完成 (' + match.score1 + ':' + match.score2 + ')' : '未開始' }}
      </span>
    </div>

    <!-- 5 doubles -->
    <div v-for="(d, di) in match.doubles" :key="di" class="doubles-edit-item">
      <div class="doubles-edit-label">第 {{ di + 1 }} 點雙打</div>
      <div class="doubles-edit-row">
        <select v-model.number="d.t1p[0]" class="form-control" style="flex:1;min-width:70px;padding:4px 6px;font-size:0.82rem;">
          <option :value="null">--</option>
          <option v-for="(p, pi) in (team1?.players || [])" :key="pi" :value="pi">{{ p || '選手' + (pi+1) }}</option>
        </select>
        /
        <select v-model.number="d.t1p[1]" class="form-control" style="flex:1;min-width:70px;padding:4px 6px;font-size:0.82rem;">
          <option :value="null">--</option>
          <option v-for="(p, pi) in (team1?.players || [])" :key="pi" :value="pi">{{ p || '選手' + (pi+1) }}</option>
        </select>
        <span style="color:var(--text-muted);font-weight:600;margin:0 4px;">VS</span>
        <select v-model.number="d.t2p[0]" class="form-control" style="flex:1;min-width:70px;padding:4px 6px;font-size:0.82rem;">
          <option :value="null">--</option>
          <option v-for="(p, pi) in (team2?.players || [])" :key="pi" :value="pi">{{ p || '選手' + (pi+1) }}</option>
        </select>
        /
        <select v-model.number="d.t2p[1]" class="form-control" style="flex:1;min-width:70px;padding:4px 6px;font-size:0.82rem;">
          <option :value="null">--</option>
          <option v-for="(p, pi) in (team2?.players || [])" :key="pi" :value="pi">{{ p || '選手' + (pi+1) }}</option>
        </select>
      </div>
      <div class="game-scores">
        <div v-for="g in 5" :key="g" class="game-score-pair">
          <input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99"
            :value="gameScore(d, g-1, 1)" @input="setGameScore(d, g-1, 1, $event)">
          <span style="color:var(--text-muted);">-</span>
          <input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99"
            :value="gameScore(d, g-1, 2)" @input="setGameScore(d, g-1, 2, $event)">
        </div>
      </div>
    </div>

    <div style="margin-top:8px;display:flex;gap:8px;">
      <button class="btn btn-success btn-sm" @click="save">儲存整場成績</button>
      <button v-if="match.completed" class="btn btn-outline btn-sm" @click="$emit('reset')">重置</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getTeamName, getTeamById } from '../lib/main-storage'

const props = defineProps({
  match: { type: Object, required: true },
  teams: { type: Array, required: true },
  uid: { type: String, default: '' },
})
const emit = defineEmits(['save', 'reset'])

const t1n = computed(() => getTeamName(props.teams, props.match.team1Id))
const t2n = computed(() => getTeamName(props.teams, props.match.team2Id))
const team1 = computed(() => getTeamById(props.teams, props.match.team1Id))
const team2 = computed(() => getTeamById(props.teams, props.match.team2Id))

function gameScore(d, gi, side) {
  const g = d.games && d.games[gi]
  if (!g) return ''
  return side === 1 ? g.s1 : g.s2
}

function setGameScore(d, gi, side, event) {
  if (!d.games) d.games = []
  while (d.games.length <= gi) d.games.push({ s1: 0, s2: 0 })
  if (side === 1) d.games[gi].s1 = parseInt(event.target.value) || 0
  else d.games[gi].s2 = parseInt(event.target.value) || 0
}

function save() {
  // Recalc each doubles point
  props.match.doubles.forEach(d => {
    // Clean empty trailing games
    const validGames = []
    let s1 = 0, s2 = 0
    ;(d.games || []).forEach(g => {
      if (g.s1 > 0 || g.s2 > 0) {
        validGames.push(g)
        if (g.s1 > g.s2) s1++
        else if (g.s2 > g.s1) s2++
      }
    })
    d.games = validGames
    d.score1 = s1
    d.score2 = s2
    d.completed = validGames.length > 0 && (s1 >= 3 || s2 >= 3)
  })
  emit('save')
}
</script>

<style scoped>
.doubles-edit-item {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 4px; padding: 10px; margin-bottom: 8px;
}
.doubles-edit-label { font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-bottom: 6px; }
.doubles-edit-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
</style>
