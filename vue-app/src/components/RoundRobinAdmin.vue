<template>
  <div>
    <div class="section-title"><span class="icon">R</span>{{ event.label }} - 循環賽管理</div>

    <!-- 積分榜 -->
    <RoundRobinView :event="event" />

    <!-- 團體賽比賽結果 -->
    <div v-if="isTeam" class="card" style="margin-top:16px;">
      <div class="card-title">比賽結果</div>
      <div class="match-list">
        <TeamMatchDetail v-for="m in event.roundRobinMatches" :key="m.id" :match="m" />
      </div>
      <button class="btn btn-success" style="margin-top:12px;" @click="$emit('save')">
        儲存變更
      </button>
    </div>

    <!-- 一般編輯比分 -->
    <div v-else class="card" style="margin-top:16px;">
      <div class="card-title">編輯比分</div>
      <div v-for="m in event.roundRobinMatches" :key="m.id">
        <ScoreEditor :match="m" :bestOf="event.matchBestOf"
                     @update="(d) => onScoreUpdate(m, d)" />
      </div>
      <button class="btn btn-success" style="margin-top:12px;" @click="$emit('save')">
        儲存變更
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RoundRobinView from './RoundRobinView.vue'
import ScoreEditor from './ScoreEditor.vue'
import TeamMatchDetail from './TeamMatchDetail.vue'
import { determineWinner } from '../lib/tournament.js'

const props = defineProps({ event: Object })
const isTeam = computed(() => props.event.type === 'team')
const emit = defineEmits(['save'])

function onScoreUpdate(match, { scores, winner }) {
  match.scores = scores
  if (winner === 1) match.winner = match.p1
  else if (winner === 2) match.winner = match.p2
  else match.winner = null
}
</script>
