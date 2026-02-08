<template>
  <div>
    <div class="section-title"><span class="icon">R</span>{{ event.label }} - 循環賽</div>

    <!-- 團體賽積分榜 -->
    <div v-if="isTeam" class="card">
      <div class="card-title">積分榜</div>
      <div style="overflow-x:auto;">
        <table class="standings-table">
          <thead>
            <tr><th>#</th><th>隊伍</th><th>賽</th><th>勝</th><th>負</th><th>點勝</th><th>點負</th><th>點差</th><th>局勝</th><th>局負</th><th>積分</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in teamStandings" :key="row.participant.id">
              <td>{{ i + 1 }}</td>
              <td class="team-name" style="text-align:left;">{{ row.participant.name }}</td>
              <td>{{ row.matchesPlayed }}</td>
              <td>{{ row.wins }}</td>
              <td>{{ row.losses }}</td>
              <td>{{ row.rubbersWon }}</td>
              <td>{{ row.rubbersLost }}</td>
              <td>{{ diffStr(row.rubbersWon - row.rubbersLost) }}</td>
              <td>{{ row.gamesWon }}</td>
              <td>{{ row.gamesLost }}</td>
              <td><strong>{{ row.rankPoints }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 一般積分榜 -->
    <div v-else class="card">
      <div class="card-title">積分榜</div>
      <div style="overflow-x:auto;">
        <table class="standings-table">
          <thead>
            <tr><th>#</th><th>選手</th><th>積分</th><th>勝</th><th>負</th><th>局差</th><th>分差</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in normalStandings" :key="row.participant.id">
              <td>{{ i + 1 }}</td>
              <td class="team-name" style="text-align:left;">{{ row.participant.name }}</td>
              <td>{{ row.rankPoints }}</td>
              <td>{{ row.wins }}</td>
              <td>{{ row.losses }}</td>
              <td>{{ row.gamesWon - row.gamesLost }}</td>
              <td>{{ row.pointsWon - row.pointsLost }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 團體賽對戰結果 (可折疊) -->
    <div v-if="isTeam" class="card" style="margin-top:16px;">
      <div class="card-title">比賽結果</div>
      <div class="match-list">
        <TeamMatchDetail v-for="m in (event.roundRobinMatches || [])" :key="m.id" :match="m" />
      </div>
    </div>

    <!-- 一般對戰結果（可展開看每局比分） -->
    <div v-else class="card" style="margin-top:16px;">
      <div class="card-title">對戰結果</div>
      <div class="match-list">
        <MatchDetail v-for="m in event.roundRobinMatches" :key="m.id" :match="m" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateRoundRobinStandings, calculateTeamStandings, gameScore } from '../lib/tournament.js'
import TeamMatchDetail from './TeamMatchDetail.vue'
import MatchDetail from './MatchDetail.vue'

const props = defineProps({ event: Object })

const isTeam = computed(() => props.event.type === 'team')

const teamStandings = computed(() => {
  return calculateTeamStandings(
    props.event.participants || [],
    props.event.roundRobinMatches || []
  )
})

const normalStandings = computed(() => {
  return calculateRoundRobinStandings(
    props.event.participants || [],
    props.event.roundRobinMatches || []
  )
})

function gs(m) { return gameScore(m.scores) }
function diffStr(n) { return n > 0 ? '+' + n : '' + n }
</script>
