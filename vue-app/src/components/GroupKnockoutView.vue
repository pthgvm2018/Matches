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

        <!-- 積分榜 -->
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
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in groupStandings(group)" :key="row.participant.id"
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

        <!-- 對戰結果 -->
        <div class="match-list" style="margin-top:12px;">
          <div v-for="m in group.matches" :key="m.id" class="match-item">
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

    <!-- 淘汰賽 -->
    <div v-if="tab === 'knockout'">
      <EliminationView :event="knockoutEvent" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateRoundRobinStandings, gameScore } from '../lib/tournament.js'
import EliminationView from './EliminationView.vue'

const props = defineProps({ event: Object })

const tab = ref('groups')

const isTeam = computed(() => props.event.type === 'team')

function groupStandings(group) {
  return calculateRoundRobinStandings(group.participants, group.matches)
}

function gs(m) { return gameScore(m.scores) }

// 建立一個假的 event 物件給 EliminationView 使用
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
