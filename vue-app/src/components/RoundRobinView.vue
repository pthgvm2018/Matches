<template>
  <div>
    <div class="section-title"><span class="icon">R</span>{{ event.label }} - 循環賽</div>

    <!-- 積分榜 -->
    <div class="card">
      <div class="card-title">積分榜</div>
      <div style="overflow-x:auto;">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ isTeam ? '隊伍' : '選手' }}</th>
              <th>積分</th>
              <th>勝</th>
              <th>負</th>
              <th>局差</th>
              <th>分差</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in standings" :key="row.participant.id">
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

    <!-- 對戰結果 -->
    <div class="card" style="margin-top:16px;">
      <div class="card-title">對戰結果</div>
      <div class="match-list">
        <div v-for="m in event.roundRobinMatches" :key="m.id" class="match-item">
          <span class="team left" :class="{ winner: m.winner?.id === m.p1.id }">{{ m.p1.name }}</span>
          <div class="score-box">
            <span class="s">{{ gs(m)[0] }}</span>
            <span class="divider">:</span>
            <span class="s">{{ gs(m)[1] }}</span>
          </div>
          <span class="team right" :class="{ winner: m.winner?.id === m.p2.id }">{{ m.p2.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateRoundRobinStandings, gameScore } from '../lib/tournament.js'

const props = defineProps({ event: Object })

const isTeam = computed(() => props.event.type === 'team')

const standings = computed(() => {
  return calculateRoundRobinStandings(
    props.event.participants || [],
    props.event.roundRobinMatches || []
  )
})

function gs(m) { return gameScore(m.scores) }
</script>
