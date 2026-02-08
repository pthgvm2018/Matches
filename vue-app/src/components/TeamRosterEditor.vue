<template>
  <div class="roster-card">
    <div class="roster-header">
      <span class="roster-number">{{ index + 1 }}</span>
      <input class="roster-team-name" v-model="localName" @change="onNameChange"
             :placeholder="'隊伍' + (index + 1)">
    </div>
    <div class="roster-label">選手名單（{{ teamSize }} 人）：</div>
    <div class="roster-grid">
      <input v-for="(_, pi) in localPlayers" :key="pi"
             class="roster-player-input" v-model="localPlayers[pi]"
             :placeholder="'選手' + (pi + 1)" @change="onPlayersChange">
    </div>
    <button class="btn btn-primary btn-sm" style="margin-top:8px;" @click="savePlayers">
      儲存選手
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  participant: Object,
  index: Number,
  teamSize: { type: Number, default: 10 },
})
const emit = defineEmits(['update'])

const localName = ref(props.participant.name || '')
const localPlayers = ref(initPlayers())

function initPlayers() {
  const arr = []
  for (let i = 0; i < props.teamSize; i++) {
    arr.push(props.participant.players?.[i] || '')
  }
  return arr
}

function onNameChange() {
  props.participant.name = localName.value
  emit('update')
}

function onPlayersChange() {
  // 即時更新
}

function savePlayers() {
  props.participant.players = [...localPlayers.value]
  props.participant.name = localName.value
  emit('update')
}

watch(() => props.participant, () => {
  localName.value = props.participant.name || ''
  localPlayers.value = initPlayers()
}, { deep: true })
</script>

<style scoped>
.roster-card {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px;
}
.roster-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.roster-number {
  font-weight: 700; font-size: 1rem; color: var(--accent);
  min-width: 24px; text-align: center;
}
.roster-team-name {
  flex: 1; padding: 6px 10px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--bg-card);
  color: var(--text-primary); font-size: 0.95rem; font-weight: 600;
  font-family: inherit;
}
.roster-team-name:focus { border-color: var(--accent); outline: none; }
.roster-label {
  font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;
}
.roster-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
}
.roster-player-input {
  padding: 5px 8px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--bg-card);
  color: var(--text-primary); font-size: 0.82rem; font-family: inherit;
}
.roster-player-input:focus { border-color: var(--accent); outline: none; }
</style>
