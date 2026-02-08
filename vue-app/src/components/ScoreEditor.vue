<template>
  <div class="score-editor">
    <div class="se-header">
      <span class="se-p1" :class="{ winner: winnerSide === 1 }">{{ match.p1?.name || '-' }}</span>
      <span class="se-vs">vs</span>
      <span class="se-p2" :class="{ winner: winnerSide === 2 }">{{ match.p2?.name || '-' }}</span>
      <span v-if="winnerSide" class="badge badge-green" style="margin-left:8px;">
        {{ gScore[0] }}:{{ gScore[1] }}
      </span>
      <span v-else class="badge badge-yellow" style="margin-left:8px;">未完成</span>
    </div>

    <div class="se-games">
      <div v-for="gi in bestOf" :key="gi" class="se-game"
           :class="{ disabled: isGameDisabled(gi - 1) }">
        <span class="se-game-label">G{{ gi }}</span>
        <input class="score-input" type="number" min="0" max="99"
               :value="scores[gi - 1]?.a || ''"
               :disabled="isGameDisabled(gi - 1)"
               @input="setScore(gi - 1, 'a', $event)">
        <span class="se-colon">:</span>
        <input class="score-input" type="number" min="0" max="99"
               :value="scores[gi - 1]?.b || ''"
               :disabled="isGameDisabled(gi - 1)"
               @input="setScore(gi - 1, 'b', $event)">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { determineWinner, gameScore } from '../lib/tournament.js'

const props = defineProps({
  match: Object,
  bestOf: { type: Number, default: 5 },
})
const emit = defineEmits(['update'])

const scores = ref(initScores())

function initScores() {
  const arr = []
  for (let i = 0; i < props.bestOf; i++) {
    const s = props.match.scores?.[i]
    arr.push({ a: s?.a || 0, b: s?.b || 0 })
  }
  return arr
}

const gScore = computed(() => gameScore(scores.value))
const winnerSide = computed(() => determineWinner(scores.value, props.bestOf))

// 已決出勝負後，後面的局數不能再輸入
function isGameDisabled(gi) {
  const toWin = Math.ceil(props.bestOf / 2)
  let w1 = 0, w2 = 0
  for (let i = 0; i < gi; i++) {
    const g = scores.value[i]
    if ((g.a || 0) > 0 || (g.b || 0) > 0) {
      if (g.a > g.b) w1++
      else if (g.b > g.a) w2++
    }
  }
  return w1 >= toWin || w2 >= toWin
}

function setScore(gi, side, event) {
  scores.value[gi][side] = parseInt(event.target.value) || 0
  onInput()
}

function onInput() {
  // 只傳有效的比分（有輸入過的）
  const validScores = []
  for (let i = 0; i < scores.value.length; i++) {
    if (isGameDisabled(i)) break
    const g = scores.value[i]
    if ((g.a || 0) > 0 || (g.b || 0) > 0) {
      validScores.push({ a: g.a || 0, b: g.b || 0 })
    }
  }
  emit('update', {
    scores: validScores,
    winner: winnerSide.value,
  })
}

watch(() => props.match.scores, (newVal) => {
  if (newVal) {
    scores.value = initScores()
  }
}, { deep: true })
</script>

<style scoped>
.score-editor {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 12px; margin-bottom: 10px;
}
.se-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  font-weight: 600; flex-wrap: wrap;
}
.se-vs { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; }
.se-p1, .se-p2 { color: var(--text-primary); }
.se-p1.winner, .se-p2.winner { color: var(--accent); }
.se-games { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.se-game { display: flex; align-items: center; gap: 4px; }
.se-game.disabled { opacity: 0.3; pointer-events: none; }
.se-game-label { font-size: 0.75rem; color: var(--text-muted); min-width: 22px; }
.se-colon { color: var(--text-muted); }
</style>
