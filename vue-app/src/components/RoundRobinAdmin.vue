<template>
  <div>
    <div class="section-title"><span class="icon">R</span>{{ event.label }} - 循環賽管理</div>

    <div v-if="isTeam" class="sub-nav">
      <button :class="{ active: tab === 'teams' }" @click="tab = 'teams'">隊伍管理</button>
      <button :class="{ active: tab === 'matches' }" @click="tab = 'matches'">比賽管理</button>
    </div>

    <!-- 隊伍管理 -->
    <div v-if="isTeam && tab === 'teams'" class="card">
      <div class="card-title">隊伍管理 <span class="badge badge-accent">{{ allParticipants.length }} 隊</span></div>
      <TeamRosterEditor v-for="(p, i) in allParticipants" :key="p.id"
        :participant="p" :index="i" :teamSize="event.teamSize || 10"
        @update="$emit('save')" />
    </div>

    <template v-if="!isTeam || tab === 'matches'">
      <!-- 積分榜 -->
      <RoundRobinView :event="event" />

      <!-- 團體賽比賽編輯 -->
      <div v-if="isTeam" class="card" style="margin-top:16px;">
        <div class="card-title">編輯比分</div>
        <TeamMatchEditor v-for="m in event.roundRobinMatches" :key="m.id" :match="m"
          :bestOf="event.matchBestOf" :pointsToWin="event.pointsToWin || 3"
          :participants="allParticipants"
          @update="(d) => onTeamMatchUpdate(m, d)" />
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RoundRobinView from './RoundRobinView.vue'
import ScoreEditor from './ScoreEditor.vue'
import TeamMatchEditor from './TeamMatchEditor.vue'
import TeamRosterEditor from './TeamRosterEditor.vue'
import { determineWinner } from '../lib/tournament.js'

const props = defineProps({ event: Object })
const isTeam = computed(() => props.event.type === 'team')
const emit = defineEmits(['save'])
const tab = ref('matches')

// 收集所有參賽者
const allParticipants = computed(() => {
  const seen = new Set()
  const result = []
  for (const p of (props.event.participants || [])) {
    if (p && !seen.has(p.id)) { seen.add(p.id); result.push(p) }
  }
  // 也從 matches 收集
  for (const m of (props.event.roundRobinMatches || [])) {
    if (m.p1 && !seen.has(m.p1.id)) { seen.add(m.p1.id); result.push(m.p1) }
    if (m.p2 && !seen.has(m.p2.id)) { seen.add(m.p2.id); result.push(m.p2) }
  }
  return result
})

function onScoreUpdate(match, { scores, winner }) {
  match.scores = scores
  if (winner === 1) match.winner = match.p1
  else if (winner === 2) match.winner = match.p2
  else match.winner = null
}

function onTeamMatchUpdate(match, { rubberResults, teamScore, winner }) {
  match.rubberResults = rubberResults
  match.teamScore = teamScore
  if (winner === 1) match.winner = match.p1
  else if (winner === 2) match.winner = match.p2
  else match.winner = null
  emit('save')
}
</script>

<style scoped>
.sub-nav {
  display: flex; justify-content: center; gap: 0;
  background: var(--bg-secondary); border-bottom: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0; margin-bottom: 16px;
}
.sub-nav button {
  padding: 10px 24px; background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--text-secondary); font-size: 0.9rem; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}
.sub-nav button:hover { color: var(--accent); }
.sub-nav button.active { color: var(--accent); border-bottom-color: var(--accent); }
</style>
