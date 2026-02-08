<template>
  <div>
    <div class="section-title"><span class="icon">G</span>{{ event.label }} - 分組循環＋淘汰</div>

    <!-- 子導航 -->
    <div class="sub-nav">
      <button :class="{ active: tab === 'groups' }" @click="tab = 'groups'">小組賽</button>
      <button :class="{ active: tab === 'knockout' }" @click="tab = 'knockout'">淘汰賽</button>
    </div>

    <!-- 小組賽 -->
    <div v-if="tab === 'groups'">
      <div v-for="group in (event.groups || [])" :key="group.id" class="card" style="margin-bottom:16px;">
        <div class="card-title">{{ group.name }} 組</div>

        <!-- 團體賽積分榜 -->
        <div v-if="isTeam" style="overflow-x:auto;">
          <table class="standings-table">
            <thead>
              <tr><th>#</th><th>隊伍</th><th>賽</th><th>勝</th><th>負</th><th>點勝</th><th>點負</th><th>點差</th><th>局勝</th><th>局負</th><th>積分</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in teamGroupStandings(group)" :key="row.participant.id"
                  :class="{ qualified: i < event.advancePerGroup }">
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

        <!-- 一般積分榜 -->
        <div v-else style="overflow-x:auto;">
          <table class="standings-table">
            <thead>
              <tr><th>#</th><th>選手</th><th>積分</th><th>勝</th><th>負</th><th>局差</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in normalGroupStandings(group)" :key="row.participant.id"
                  :class="{ qualified: i < event.advancePerGroup }">
                <td>{{ i + 1 }}</td>
                <td class="team-name" style="text-align:left;">{{ row.participant.name }}</td>
                <td>{{ row.rankPoints }}</td>
                <td>{{ row.wins }}</td>
                <td>{{ row.losses }}</td>
                <td>{{ row.gamesWon - row.gamesLost }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 團體賽對戰結果 (可折疊) -->
        <div v-if="isTeam && hasCompletedMatches(group.matches)" style="margin-top:16px;">
          <h4 style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:10px;">比賽結果</h4>
          <div class="match-list">
            <TeamMatchDetail v-for="m in group.matches" :key="m.id" :match="m" />
          </div>
        </div>

        <!-- 一般對戰結果（可展開看每局比分） -->
        <div v-if="!isTeam" class="match-list" style="margin-top:12px;">
          <MatchDetail v-for="m in group.matches" :key="m.id" :match="m" />
        </div>
      </div>
    </div>

    <!-- 淘汰賽 -->
    <div v-if="tab === 'knockout'">
      <EliminationView :event="knockoutEvent" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateRoundRobinStandings, calculateTeamStandings, gameScore } from '../lib/tournament.js'
import EliminationView from './EliminationView.vue'
import TeamMatchDetail from './TeamMatchDetail.vue'
import MatchDetail from './MatchDetail.vue'

const props = defineProps({ event: Object })

const tab = ref('groups')

const isTeam = computed(() => props.event.type === 'team')

function teamGroupStandings(group) {
  return calculateTeamStandings(group.participants, group.matches)
}

function normalGroupStandings(group) {
  return calculateRoundRobinStandings(group.participants, group.matches)
}

function gs(m) { return gameScore(m.scores) }

function diffStr(n) { return n > 0 ? '+' + n : '' + n }

function hasCompletedMatches(matches) {
  return matches?.some(m => m.winner)
}

const knockoutEvent = computed(() => ({
  ...props.event,
  format: 'elimination',
  label: props.event.label,
}))
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
