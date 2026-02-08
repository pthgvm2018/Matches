<template>
  <div class="score-editor">
    <div class="se-header">
      <span class="se-p1" :class="{ winner: winnerSide === 1 }">{{ match.p1?.name || '-' }}</span>
      <span class="se-vs">vs</span>
      <span class="se-p2" :class="{ winner: winnerSide === 2 }">{{ match.p2?.name || '-' }}</span>
      <span v-if="winnerSide" class="badge badge-green" style="margin-left:8px;">
        {{ gameScore[0] }}:{{ gameScore[1] }}
      </span>
    </div>

    <div class="se-games">
      <div v-for="(game, gi) in scores" :key="gi" class="se-game">
        <span class="se-game-label">G{{ gi + 1 }}</span>
        <input class="score-input" type="number" min="0" max="99"
               v-model.number="game[0]" @input="onInput">
        <span class="se-colon">:</span>
        <input class="score-input" type="number" min="0" max="99"
               v-model.number="game[1]" @input="onInput">
        <button v-if="gi === scores.length - 1 && scores.length > 1"
                class="btn-remove" @click="removeGame(gi)">×</button>
      </div>
      <button v-if="canAddGame" class="btn btn-outline btn-sm" @click="addGame"
              style="margin-top:4px;">
        + 新增一局
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { determineWinner, gameScore as gs } from '../lib/tournament.js'

const props = defineProps({
  match: Object,
  bestOf: { type: Number, default: 5 },
})
const emit = defineEmits(['update'])

const scores = ref(
  props.match.scores?.length > 0
    ? props.match.scores.map(s => [...s])
    : [[0, 0]]
)

const toWin = computed(() => Math.ceil(props.bestOf / 2))
const gameScore = computed(() => gs(scores.value))
const winnerSide = computed(() => determineWinner(scores.value, props.bestOf))

const canAddGame = computed(() => {
  return scores.value.length < props.bestOf && winnerSide.value === 0
})

function addGame() {
  scores.value.push([0, 0])
}

function removeGame(i) {
  scores.value.splice(i, 1)
  onInput()
}

function onInput() {
  emit('update', {
    scores: scores.value.map(s => [...s]),
    winner: winnerSide.value,
  })
}

// If match changes externally, sync
watch(() => props.match.scores, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(scores.value)) {
    scores.value = newVal.map(s => [...s])
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

.se-games { display: flex; flex-direction: column; gap: 6px; }
.se-game {
  display: flex; align-items: center; gap: 6px;
}
.se-game-label { font-size: 0.75rem; color: var(--text-muted); min-width: 24px; }
.se-colon { color: var(--text-muted); }
.btn-remove {
  background: none; border: none; color: var(--red); cursor: pointer;
  font-size: 1.1rem; padding: 2px 6px; border-radius: 4px;
}
.btn-remove:hover { background: rgba(239,83,80,0.15); }
</style>
