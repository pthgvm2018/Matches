<template>
  <div>
    <div class="section-title"><span class="icon">T</span>{{ event.label }} - 淘汰賽管理</div>

    <!-- 籤表（查看用） -->
    <EliminationView :event="event" />

    <!-- 逐輪編輯 -->
    <div v-for="(round, ri) in (event.bracket?.rounds || [])" :key="ri"
         class="card" style="margin-top:16px;">
      <div class="card-title">{{ roundName(ri) }}</div>
      <div v-for="(match, mi) in round" :key="match.id">
        <template v-if="!match.isBye && match.p1 && match.p2">
          <ScoreEditor :match="match" :bestOf="event.matchBestOf"
                       @update="(d) => onScoreUpdate(ri, mi, match, d)" />
        </template>
        <div v-else-if="match.isBye" class="match-edit-item" style="opacity:0.5;">
          <span style="font-size:0.85rem;color:var(--text-muted);">
            {{ match.p1?.name || match.p2?.name || '-' }} (輪空)
          </span>
        </div>
        <div v-else class="match-edit-item" style="opacity:0.5;">
          <span style="font-size:0.85rem;color:var(--text-muted);">等待前一輪結果</span>
        </div>
      </div>
    </div>

    <button class="btn btn-success" style="margin-top:16px;" @click="$emit('save')">
      儲存變更
    </button>
  </div>
</template>

<script setup>
import EliminationView from './EliminationView.vue'
import ScoreEditor from './ScoreEditor.vue'
import { setBracketWinner } from '../lib/tournament.js'

const props = defineProps({ event: Object })
const emit = defineEmits(['save'])

function roundName(ri) {
  const total = props.event.bracket.rounds.length
  const fromEnd = total - ri
  if (fromEnd === 1) return '決賽'
  if (fromEnd === 2) return '準決賽'
  if (fromEnd === 3) return '半準決賽'
  return `第 ${ri + 1} 輪`
}

function onScoreUpdate(ri, mi, match, { scores, winner }) {
  match.scores = scores
  if (winner === 1) {
    setBracketWinner(props.event.bracket.rounds, ri, mi, match.p1)
  } else if (winner === 2) {
    setBracketWinner(props.event.bracket.rounds, ri, mi, match.p2)
  } else {
    match.winner = null
  }
}
</script>
