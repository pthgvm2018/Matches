<template>
  <div class="match-edit-item">
    <div class="match-edit-header">
      <div class="match-edit-teams">
        <span>{{ match.p1?.name || '-' }}</span>
        <span class="vs">vs</span>
        <span>{{ match.p2?.name || '-' }}</span>
      </div>
      <span class="badge" :class="matchWinner ? 'badge-green' : 'badge-yellow'">
        {{ matchWinner ? '已完成 (' + teamScore.a + ':' + teamScore.b + ')' : '未開始' }}
      </span>
    </div>

    <!-- 各點編輯 -->
    <div v-for="(rubber, ri) in rubbers" :key="ri" class="rubber-edit-item"
         :class="{ disabled: isRubberDisabled(ri) }">
      <div class="rubber-edit-label">
        {{ rubber.label || `第 ${ri + 1} 點` }}
        <span v-if="rubberWinner(ri)" class="rubber-result-tag"
              :class="rubberWinner(ri) === 1 ? 'tag-p1' : 'tag-p2'">
          {{ rubberWinner(ri) === 1 ? (rubber.p1Name || match.p1?.name) : (rubber.p2Name || match.p2?.name) }} 勝
          ({{ rubberGameScore(ri)[0] }}:{{ rubberGameScore(ri)[1] }})
        </span>
      </div>

      <!-- 選手選擇：有球員名單時用下拉選單 -->
      <div v-if="hasPlayerRosters" class="rubber-edit-row">
        <template v-if="rubber.type === 'doubles' || rubber.type === 'mixed_doubles'">
          <select class="player-select" v-model="rubber.p1Indices[0]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team1Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
          <span class="sep">/</span>
          <select class="player-select" v-model="rubber.p1Indices[1]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team1Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
          <span class="vs-small">VS</span>
          <select class="player-select" v-model="rubber.p2Indices[0]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team2Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
          <span class="sep">/</span>
          <select class="player-select" v-model="rubber.p2Indices[1]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team2Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
        </template>
        <template v-else>
          <select class="player-select" v-model="rubber.p1Indices[0]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team1Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
          <span class="vs-small">VS</span>
          <select class="player-select" v-model="rubber.p2Indices[0]"
                  :disabled="isRubberDisabled(ri)" @change="syncPlayerNames(ri)">
            <option :value="-1">--</option>
            <option v-for="(p, pi) in team2Players" :key="pi" :value="pi">
              {{ p || '選手' + (pi + 1) }}
            </option>
          </select>
        </template>
      </div>

      <!-- 沒有球員名單時用文字輸入 -->
      <div v-else class="rubber-edit-row">
        <input class="name-input" v-model="rubber.p1Name"
               :placeholder="match.p1?.name + ' 選手'"
               :disabled="isRubberDisabled(ri)">
        <span class="vs-small">VS</span>
        <input class="name-input" v-model="rubber.p2Name"
               :placeholder="match.p2?.name + ' 選手'"
               :disabled="isRubberDisabled(ri)">
      </div>

      <!-- 各局比分（固定 bestOf 組，橫排） -->
      <div class="game-scores">
        <div v-for="gi in bestOf" :key="gi" class="game-score-pair">
          <input type="number" class="score-input" min="0" max="99"
                 :value="getGameScore(ri, gi - 1, 'a')"
                 :disabled="isRubberDisabled(ri)"
                 @input="setGameScore(ri, gi - 1, 'a', $event)">
          <span class="game-sep">-</span>
          <input type="number" class="score-input" min="0" max="99"
                 :value="getGameScore(ri, gi - 1, 'b')"
                 :disabled="isRubberDisabled(ri)"
                 @input="setGameScore(ri, gi - 1, 'b', $event)">
        </div>
      </div>
    </div>

    <div style="margin-top:8px;display:flex;gap:8px;">
      <button class="btn btn-success btn-sm" @click="save">儲存整場成績</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { gameScore } from '../lib/tournament.js'

const props = defineProps({
  match: Object,
  bestOf: { type: Number, default: 5 },
  pointsToWin: { type: Number, default: 3 },
  participants: { type: Array, default: () => [] },
  rubbers: { type: Array, default: () => [] },
})
const emit = defineEmits(['update'])

const rubbers = ref(initRubbers())

// 找到 p1, p2 的球員名單
const team1Data = computed(() => props.participants.find(p => p.id === props.match.p1?.id))
const team2Data = computed(() => props.participants.find(p => p.id === props.match.p2?.id))
const team1Players = computed(() => team1Data.value?.players || [])
const team2Players = computed(() => team2Data.value?.players || [])
const hasPlayerRosters = computed(() =>
  team1Players.value.length > 0 && team1Players.value.some(p => p)
)

function initRubbers() {
  const results = props.match.rubberResults || []
  if (results.length > 0) {
    return results.map(r => ({
      order: r.order,
      label: r.label,
      type: r.type,
      p1Name: r.p1Name || '',
      p2Name: r.p2Name || '',
      p1Indices: parseIndices(r.p1Name, r.type, 'p1'),
      p2Indices: parseIndices(r.p2Name, r.type, 'p2'),
      scores: initScores(r.scores),
    }))
  }
  // Generate default rubbers from template or based on pointsToWin
  const template = props.rubbers && props.rubbers.length > 0
    ? props.rubbers
    : Array.from({ length: props.pointsToWin * 2 - 1 }, (_, i) => ({
        order: i + 1, label: `第${i + 1}點`, type: 'singles',
      }))
  return template.map(r => ({
    order: r.order,
    label: r.label,
    type: r.type,
    p1Name: '',
    p2Name: '',
    p1Indices: (r.type === 'doubles' || r.type === 'mixed_doubles') ? [-1, -1] : [-1],
    p2Indices: (r.type === 'doubles' || r.type === 'mixed_doubles') ? [-1, -1] : [-1],
    scores: initScores([]),
  }))
}

// 嘗試從名字反推球員 index
function parseIndices(name, type, side) {
  const isDoubles = type === 'doubles' || type === 'mixed_doubles'
  const players = side === 'p1' ? team1Players.value : team2Players.value
  if (!name || !players.length) return isDoubles ? [-1, -1] : [-1]

  if (isDoubles) {
    const parts = name.split(/\s*\/\s*/)
    return [
      players.indexOf(parts[0] || '') >= 0 ? players.indexOf(parts[0]) : -1,
      players.indexOf(parts[1] || '') >= 0 ? players.indexOf(parts[1]) : -1,
    ]
  }
  const idx = players.indexOf(name)
  return [idx >= 0 ? idx : -1]
}

function initScores(scores) {
  const arr = []
  for (let i = 0; i < props.bestOf; i++) {
    const s = scores && scores[i]
    arr.push({ a: s?.a || 0, b: s?.b || 0 })
  }
  return arr
}

// 從下拉選單同步到 p1Name/p2Name
function syncPlayerNames(ri) {
  const rubber = rubbers.value[ri]
  const isDoubles = rubber.type === 'doubles' || rubber.type === 'mixed_doubles'
  const t1p = team1Players.value
  const t2p = team2Players.value

  if (isDoubles) {
    const a1 = rubber.p1Indices[0] >= 0 ? (t1p[rubber.p1Indices[0]] || '') : ''
    const a2 = rubber.p1Indices[1] >= 0 ? (t1p[rubber.p1Indices[1]] || '') : ''
    rubber.p1Name = [a1, a2].filter(Boolean).join(' / ')

    const b1 = rubber.p2Indices[0] >= 0 ? (t2p[rubber.p2Indices[0]] || '') : ''
    const b2 = rubber.p2Indices[1] >= 0 ? (t2p[rubber.p2Indices[1]] || '') : ''
    rubber.p2Name = [b1, b2].filter(Boolean).join(' / ')
  } else {
    rubber.p1Name = rubber.p1Indices[0] >= 0 ? (t1p[rubber.p1Indices[0]] || '') : ''
    rubber.p2Name = rubber.p2Indices[0] >= 0 ? (t2p[rubber.p2Indices[0]] || '') : ''
  }
}

function getGameScore(ri, gi, side) {
  const g = rubbers.value[ri]?.scores?.[gi]
  if (!g) return ''
  return g[side] || ''
}

function setGameScore(ri, gi, side, event) {
  const rubber = rubbers.value[ri]
  if (!rubber.scores) rubber.scores = []
  while (rubber.scores.length <= gi) rubber.scores.push({ a: 0, b: 0 })
  rubber.scores[gi][side] = parseInt(event.target.value) || 0
}

function rubberWinner(ri) {
  const rubber = rubbers.value[ri]
  const toWin = Math.ceil(props.bestOf / 2)
  let w1 = 0, w2 = 0
  for (const g of (rubber.scores || [])) {
    if ((g.a || 0) > 0 || (g.b || 0) > 0) {
      if (g.a > g.b) w1++
      else if (g.b > g.a) w2++
    }
  }
  if (w1 >= toWin) return 1
  if (w2 >= toWin) return 2
  return 0
}

function rubberGameScore(ri) {
  return gameScore(rubbers.value[ri].scores)
}

function isRubberDisabled(ri) {
  let s1 = 0, s2 = 0
  for (let i = 0; i < ri; i++) {
    const w = rubberWinner(i)
    if (w === 1) s1++
    else if (w === 2) s2++
  }
  return s1 >= props.pointsToWin || s2 >= props.pointsToWin
}

const teamScore = computed(() => {
  let a = 0, b = 0
  for (let i = 0; i < rubbers.value.length; i++) {
    if (isRubberDisabled(i)) break
    const w = rubberWinner(i)
    if (w === 1) a++
    else if (w === 2) b++
  }
  return { a, b }
})

const matchWinner = computed(() => {
  if (teamScore.value.a >= props.pointsToWin) return 1
  if (teamScore.value.b >= props.pointsToWin) return 2
  return 0
})

function save() {
  const rubberResults = rubbers.value.map((r, ri) => {
    const disabled = isRubberDisabled(ri)
    const validScores = []
    if (!disabled) {
      for (const g of r.scores) {
        if ((g.a || 0) > 0 || (g.b || 0) > 0) {
          validScores.push({ a: g.a || 0, b: g.b || 0 })
        }
      }
    }
    return {
      order: r.order, label: r.label, type: r.type,
      p1Name: disabled ? '' : r.p1Name,
      p2Name: disabled ? '' : r.p2Name,
      winner: disabled ? null : rubberWinner(ri) || null,
      scores: validScores,
    }
  })

  emit('update', {
    rubberResults,
    teamScore: { a: teamScore.value.a, b: teamScore.value.b },
    winner: matchWinner.value,
  })
}

watch(() => props.match.rubberResults, (newVal) => {
  if (newVal && newVal.length > 0) {
    rubbers.value = initRubbers()
  }
}, { deep: true })

// Also re-init when rubbers template prop changes
watch(() => props.rubbers, () => {
  if (!props.match.rubberResults?.length) {
    rubbers.value = initRubbers()
  }
}, { deep: true })
</script>

<style scoped>
.match-edit-item {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;
}
.match-edit-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
}
.match-edit-teams { font-weight: 600; font-size: 0.95rem; }
.match-edit-teams .vs {
  color: var(--text-muted); font-weight: 400; font-size: 0.85rem; margin: 0 8px;
}

.rubber-edit-item {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 4px; padding: 10px; margin-bottom: 8px;
}
.rubber-edit-item.disabled { opacity: 0.3; pointer-events: none; }
.rubber-edit-label {
  font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-bottom: 6px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.rubber-result-tag {
  font-size: 0.7rem; font-weight: 500; padding: 1px 6px;
  border-radius: 3px; white-space: nowrap;
}
.tag-p1 { background: rgba(38,166,154,0.15); color: var(--accent); }
.tag-p2 { background: rgba(255,152,0,0.15); color: #ff9800; }

.rubber-edit-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;
}
.player-select {
  flex: 1; min-width: 70px; padding: 4px 6px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-card); color: var(--text-primary);
  font-size: 0.82rem; font-family: inherit;
}
.player-select:focus { border-color: var(--accent); outline: none; }
.sep { color: var(--text-muted); font-size: 0.8rem; }
.name-input {
  flex: 1; min-width: 80px; padding: 4px 8px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-card); color: var(--text-primary);
  font-size: 0.82rem; font-family: inherit;
}
.name-input:focus { border-color: var(--accent); outline: none; }
.vs-small { color: var(--text-muted); font-weight: 600; margin: 0 4px; font-size: 0.8rem; }

.game-scores {
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
}
.game-score-pair {
  display: flex; align-items: center; gap: 2px;
}
.game-sep { color: var(--text-muted); font-size: 0.8rem; }
.score-input {
  width: 38px; padding: 3px 4px; text-align: center;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-card); color: var(--text-primary);
  font-size: 0.85rem; font-family: inherit;
}
.score-input:focus { border-color: var(--accent); outline: none; }
</style>
