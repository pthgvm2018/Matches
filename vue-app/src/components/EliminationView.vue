<template>
  <div>
    <div class="section-title"><span class="icon">T</span>{{ event.label }} - 淘汰賽</div>

    <div v-if="!event.bracket || !event.bracket.rounds" class="empty-state">
      <p>尚未產生賽程</p>
    </div>

    <!-- 籤表 -->
    <div v-else class="bracket-container">
      <div class="bracket-scroll">
        <div class="bracket">
          <div v-for="(round, ri) in event.bracket.rounds" :key="ri" class="bracket-round">
            <div class="round-label">{{ roundName(ri) }}</div>
            <div class="bracket-matches">
              <div v-for="(match, mi) in round" :key="match.id"
                   :class="['bracket-match', { bye: match.isBye, decided: !!match.winner }]">
                <div :class="['bm-player', 'bm-top', { winner: match.winner?.id === match.p1?.id }]">
                  <span class="bm-seed" v-if="ri === 0 && match.p1">{{ match.p1.seed }}</span>
                  <span class="bm-name">{{ match.p1?.name || (match.isBye && !match.p1 ? 'BYE' : '-') }}</span>
                  <span class="bm-score" v-if="match.scores?.length">{{ gameScore(match.scores)[0] }}</span>
                </div>
                <div :class="['bm-player', 'bm-bot', { winner: match.winner?.id === match.p2?.id }]">
                  <span class="bm-seed" v-if="ri === 0 && match.p2">{{ match.p2.seed }}</span>
                  <span class="bm-name">{{ match.p2?.name || (match.isBye && !match.p2 ? 'BYE' : '-') }}</span>
                  <span class="bm-score" v-if="match.scores?.length">{{ gameScore(match.scores)[1] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 比賽詳情 -->
    <div v-if="completedMatches.length" class="card" style="margin-top:20px;">
      <div class="card-title">比賽詳情</div>
      <div class="match-list">
        <div v-for="m in completedMatches" :key="m.id" class="match-item">
          <span class="team left" :class="{ winner: m.winner?.id === m.p1?.id }">{{ m.p1?.name }}</span>
          <div class="score-box">
            <span class="s">{{ gameScore(m.scores)[0] }}</span>
            <span class="divider">:</span>
            <span class="s">{{ gameScore(m.scores)[1] }}</span>
          </div>
          <span class="team right" :class="{ winner: m.winner?.id === m.p2?.id }">{{ m.p2?.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameScore as gs } from '../lib/tournament.js'

const props = defineProps({ event: Object })

function gameScore(scores) { return gs(scores) }

function roundName(ri) {
  const total = props.event.bracket.rounds.length
  const fromEnd = total - ri
  if (fromEnd === 1) return '決賽'
  if (fromEnd === 2) return '準決賽'
  if (fromEnd === 3) return '半準決賽'
  return `第 ${ri + 1} 輪`
}

const completedMatches = computed(() => {
  if (!props.event.bracket) return []
  return props.event.bracket.rounds.flat().filter(m => m.winner && !m.isBye && m.scores?.length > 0)
})
</script>

<style scoped>
.bracket-container { margin-top: 16px; }
.bracket-scroll { overflow-x: auto; padding-bottom: 16px; }
.bracket {
  display: flex; gap: 0; min-width: max-content;
}
.bracket-round {
  display: flex; flex-direction: column; min-width: 200px;
}
.round-label {
  text-align: center; font-size: 0.8rem; font-weight: 600;
  color: var(--accent); padding: 8px; border-bottom: 1px solid var(--border);
}
.bracket-matches {
  flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding: 8px 4px;
}
.bracket-match {
  margin: 4px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-secondary); overflow: hidden;
}
.bracket-match.bye { opacity: 0.5; }
.bracket-match.decided { border-color: var(--border-light); }

.bm-player {
  display: flex; align-items: center; gap: 6px; padding: 6px 10px;
  font-size: 0.85rem; color: var(--text-secondary);
}
.bm-top { border-bottom: 1px solid var(--border); }
.bm-player.winner { color: var(--accent); font-weight: 600; }
.bm-seed { font-size: 0.7rem; color: var(--text-muted); min-width: 16px; }
.bm-name { flex: 1; }
.bm-score { font-weight: 700; min-width: 16px; text-align: center; }
</style>
