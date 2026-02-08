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

      <!-- 選手名稱 -->
      <div class="rubber-edit-row">
        <input class="name-input" v-model="rubber.p1Name"
               :placeholder="match.p1?.name + ' 選手'"
               :disabled="isRubberDisabled(ri)" @input="emitUpdate">
        <span class="vs-small">VS</span>
        <input class="name-input" v-model="rubber.p2Name"
               :placeholder="match.p2?.name + ' 選手'"
               :disabled="isRubberDisabled(ri)" @input="emitUpdate">
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
})
const emit = defineEmits(['update'])

// 初始化 rubbers 資料
const rubbers = ref(initRubbers())

function initRubbers() {
  return (props.match.rubberResults || []).map(r => ({
    order: r.order,
    label: r.label,
    type: r.type,
    p1Name: r.p1Name || '',
    p2Name: r.p2Name || '',
    scores: initScores(r.scores),
  }))
}

function initScores(scores) {
  const arr = []
  for (let i = 0; i < props.bestOf; i++) {
    const s = scores && scores[i]
    arr.push({ a: s?.a || 0, b: s?.b || 0 })
  }
  return arr
}

// 取得某點某局的分數
function getGameScore(ri, gi, side) {
  const g = rubbers.value[ri]?.scores?.[gi]
  if (!g) return ''
  return g[side] || ''
}

// 設定某點某局的分數
function setGameScore(ri, gi, side, event) {
  const rubber = rubbers.value[ri]
  if (!rubber.scores) rubber.scores = []
  while (rubber.scores.length <= gi) rubber.scores.push({ a: 0, b: 0 })
  rubber.scores[gi][side] = parseInt(event.target.value) || 0
  emitUpdate()
}

// 計算某點勝者：誰先拿到 ceil(bestOf/2) 局
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
  const rubber = rubbers.value[ri]
  return gameScore(rubber.scores)
}

// 這點是否因為比賽已結束而被停用
function isRubberDisabled(ri) {
  let s1 = 0, s2 = 0
  for (let i = 0; i < ri; i++) {
    const w = rubberWinner(i)
    if (w === 1) s1++
    else if (w === 2) s2++
  }
  return s1 >= props.pointsToWin || s2 >= props.pointsToWin
}

// 計算 teamScore
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

function emitUpdate() {
  // 即時通知 parent 比分變化
}

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

// 外部資料更新同步
watch(() => props.match.rubberResults, (newVal) => {
  if (newVal) {
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
