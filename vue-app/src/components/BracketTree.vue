<template>
  <div v-if="!rounds || rounds.length === 0" class="empty-state"><p>尚無對戰資料</p></div>
  <div v-else class="bracket-wrap">
    <div class="bracket">
      <div v-for="(round, ri) in rounds" :key="ri" class="round">
        <div
          v-for="m in round.matches"
          :key="m.id"
          class="match-wrap"
          :class="{
            'connect-prev': ri > 0,
            'connect-next': ri < lastRi,
            'connect-straight': ri === lastRi && m.completed,
          }"
        >
          <div class="match-box">
            <div class="match-team top" :class="{ winner: m.completed && m.score1 > m.score2 }">
              <span class="tname">{{ teamName(m.team1Id) }}</span>
              <span class="tscore">{{ m.completed ? m.score1 : (m.team1Id ? '-' : '') }}</span>
            </div>
            <div class="match-team bot" :class="{ winner: m.completed && m.score2 > m.score1 }">
              <span class="tname">{{ teamName(m.team2Id) }}</span>
              <span class="tscore">{{ m.completed ? m.score2 : (m.team2Id ? '-' : '') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Champion -->
      <div v-if="champion" class="round round-champ">
        <div class="match-wrap connect-prev">
          <div class="champion-label">{{ champion }}</div>
        </div>
      </div>
    </div>

    <!-- Third Place -->
    <div v-if="thirdPlace" class="third-place-section">
      <div class="tp-title">季軍戰</div>
      <div class="tp-row" :class="{ winner: thirdPlace.completed && thirdPlace.score1 > thirdPlace.score2 }">
        <span class="tname">{{ teamName(thirdPlace.team1Id) }}</span>
        <span class="tscore">{{ thirdPlace.completed ? thirdPlace.score1 : '-' }}</span>
      </div>
      <div class="tp-row" :class="{ winner: thirdPlace.completed && thirdPlace.score2 > thirdPlace.score1 }">
        <span class="tname">{{ teamName(thirdPlace.team2Id) }}</span>
        <span class="tscore">{{ thirdPlace.completed ? thirdPlace.score2 : '-' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getTeamName } from '../lib/ko16-storage'

const props = defineProps({
  rounds: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  thirdPlace: { type: Object, default: null },
})

const lastRi = computed(() => props.rounds.length - 1)

function teamName(id) {
  return getTeamName(props.teams, id)
}

const champion = computed(() => {
  if (props.rounds.length === 0) return null
  const fm = props.rounds[lastRi.value]?.matches[0]
  if (!fm || !fm.completed) return null
  const cid = fm.score1 > fm.score2 ? fm.team1Id : fm.team2Id
  return teamName(cid)
})
</script>

<style scoped>
.bracket-wrap { overflow-x: auto; padding: 16px 0; }
.bracket {
  display: flex; flex-direction: row; align-items: stretch; gap: 40px;
}
.round {
  display: flex; flex-direction: column; min-width: 180px;
}
.match-wrap {
  flex: 1; display: flex; align-items: center;
  position: relative; min-height: 58px;
}
.match-box {
  width: 100%; background: var(--surface);
  border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
}
.match-team {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 10px; font-size: 0.82rem; white-space: nowrap;
}
.match-team.top { border-bottom: 1px solid var(--border); }
.match-team .tname {
  flex: 1; overflow: hidden; text-overflow: ellipsis;
  color: var(--text-secondary); margin-right: 6px;
}
.match-team .tscore {
  font-weight: 800; min-width: 20px; text-align: center; color: var(--text-secondary);
}
.match-team.winner .tname { color: var(--accent); font-weight: 700; }
.match-team.winner .tscore { color: var(--accent); }

/* Connector lines: right (branching) */
.match-wrap.connect-next::after {
  content: ""; position: absolute;
  right: -21px; width: 21px; height: 50%;
  border-right: 2px solid #4a5568;
}
.match-wrap.connect-next:nth-child(odd)::after {
  top: 50%; border-top: 2px solid #4a5568;
}
.match-wrap.connect-next:nth-child(even)::after {
  top: 0; border-bottom: 2px solid #4a5568;
}

/* Connector lines: left (incoming) */
.match-wrap.connect-prev::before {
  content: ""; position: absolute;
  left: -21px; width: 21px; top: 50%;
  border-top: 2px solid #4a5568;
}

/* Straight connector: final → champion */
.match-wrap.connect-straight::after {
  content: ""; position: absolute;
  right: -21px; width: 21px; top: 50%;
  height: 0; border-top: 2px solid #4a5568; border-right: none;
}

/* Champion */
.round-champ { min-width: auto; }
.champion-label {
  padding: 6px 14px; font-size: 0.85rem; font-weight: 700;
  color: var(--accent); background: var(--surface);
  border: 2px solid var(--accent); border-radius: 4px;
  text-align: center; white-space: nowrap;
}

/* Third Place */
.third-place-section {
  margin-top: 20px; padding: 12px 16px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  display: inline-block; font-size: 0.85rem; min-width: 200px;
}
.tp-title { font-size: 0.8rem; font-weight: 700; color: var(--accent); margin-bottom: 8px; text-align: center; }
.tp-row { display: flex; justify-content: space-between; padding: 4px 0; }
.tp-row.winner .tname { color: var(--accent); font-weight: 700; }
.tp-row.winner .tscore { color: var(--accent); font-weight: 800; }
.tp-row .tname { min-width: 60px; }
.tp-row .tscore { font-weight: 700; min-width: 20px; text-align: center; margin-left: 12px; }
</style>
