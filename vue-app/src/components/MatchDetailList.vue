<template>
  <div v-if="!rounds || rounds.length === 0" class="empty-state"><p>尚無比賽資料</p></div>
  <template v-else>
    <div v-for="round in allRounds" :key="round.name" class="card detail-card">
      <div class="card-title">{{ round.name }}</div>
      <template v-for="(m, mi) in round.matches" :key="m.id || mi">
        <MatchRow :match="m" :teams="teams" :uid="round.name + '_' + mi" />
      </template>
    </div>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import MatchRow from './MatchRow.vue'

const props = defineProps({
  rounds: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  thirdPlace: { type: Object, default: null },
})

const allRounds = computed(() => {
  const arr = [...props.rounds]
  if (props.thirdPlace) {
    arr.push({ name: '季軍戰', matches: [props.thirdPlace] })
  }
  return arr
})
</script>

<style scoped>
.detail-card { margin-top: 20px; }
</style>
