<template>
  <div>
    <div v-if="!embedded" class="section-title"><span class="icon">T</span>{{ event.label }} - 淘汰賽管理</div>

    <div v-if="isTeam && !embedded" class="sub-nav">
      <button :class="{ active: tab === 'teams' }" @click="tab = 'teams'">隊伍管理</button>
      <button :class="{ active: tab === 'matches' }" @click="tab = 'matches'">比賽管理</button>
    </div>

    <!-- 隊伍管理（僅獨立使用時顯示，嵌入時由父元件處理） -->
    <div v-if="isTeam && !embedded && tab === 'teams'" class="card">
      <div class="card-title">隊伍管理 <span class="badge badge-accent">{{ allParticipants.length }} 隊</span></div>
      <TeamRosterEditor v-for="(p, i) in allParticipants" :key="p.id"
        :participant="p" :index="i" :teamSize="event.teamSize || 10"
        @update="$emit('save')" />
    </div>

    <template v-if="!isTeam || embedded || tab === 'matches'">
      <!-- 籤表（查看用） -->
      <EliminationView :event="event" />

      <!-- 逐輪編輯 -->
      <div v-for="(round, ri) in (event.bracket?.rounds || [])" :key="ri"
           class="card" style="margin-top:16px;">
        <div class="card-title">{{ roundName(ri) }}</div>
        <div v-for="(match, mi) in round.matches" :key="match.id">
          <template v-if="!match.isBye && match.p1 && match.p2">
            <TeamMatchEditor v-if="isTeam" :match="match"
              :bestOf="event.matchBestOf" :pointsToWin="event.pointsToWin || 3"
              :participants="allParticipants" :rubbers="event.rubbers || []"
              @update="(d) => onTeamScoreUpdate(ri, mi, match, d)" />
            <ScoreEditor v-else :match="match" :bestOf="event.matchBestOf"
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import EliminationView from './EliminationView.vue'
import ScoreEditor from './ScoreEditor.vue'
import TeamMatchEditor from './TeamMatchEditor.vue'
import TeamRosterEditor from './TeamRosterEditor.vue'
import { setBracketWinner } from '../lib/tournament.js'

const props = defineProps({ event: Object, embedded: { type: Boolean, default: false } })
const isTeam = computed(() => props.event.type === 'team')
const emit = defineEmits(['save'])
const tab = ref('matches')

// 收集所有參賽者（從 bracket rounds 或 event.participants）
const allParticipants = computed(() => {
  const seen = new Set()
  const result = []
  function add(p) {
    if (p && !seen.has(p.id)) { seen.add(p.id); result.push(p) }
  }
  // 從 participants 陣列
  for (const p of (props.event.participants || [])) add(p)
  // 從 bracket rounds
  for (const round of (props.event.bracket?.rounds || [])) {
    for (const m of (round.matches || [])) {
      add(m.p1); add(m.p2)
    }
  }
  return result
})

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

function onTeamScoreUpdate(ri, mi, match, { rubberResults, teamScore, winner }) {
  match.rubberResults = rubberResults
  match.teamScore = teamScore
  if (winner === 1) {
    setBracketWinner(props.event.bracket.rounds, ri, mi, match.p1)
  } else if (winner === 2) {
    setBracketWinner(props.event.bracket.rounds, ri, mi, match.p2)
  } else {
    match.winner = null
  }
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
