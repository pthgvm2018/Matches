<template>
  <div>
    <div class="section-title"><span class="icon">G</span>{{ event.label }} - 分組循環＋淘汰管理</div>

    <div class="sub-nav">
      <button :class="{ active: tab === 'groups' }" @click="tab = 'groups'">小組賽</button>
      <button :class="{ active: tab === 'knockout' }" @click="tab = 'knockout'">淘汰賽</button>
      <button :class="{ active: tab === 'promote' }" @click="tab = 'promote'">晉級操作</button>
    </div>

    <!-- 小組賽管理 -->
    <div v-if="tab === 'groups'">
      <div v-for="group in (event.groups || [])" :key="group.id"
           class="card" style="margin-bottom:16px;">
        <div class="card-title">{{ group.name }} 組</div>

        <div style="overflow-x:auto;margin-bottom:12px;">
          <table class="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ isTeam ? '隊伍' : '選手' }}</th>
                <th>積分</th>
                <th>勝</th>
                <th>負</th>
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
              </tr>
            </tbody>
          </table>
        </div>

        <div v-for="m in group.matches" :key="m.id">
          <ScoreEditor :match="m" :bestOf="event.matchBestOf"
                       @update="(d) => onGroupScoreUpdate(m, d)" />
        </div>
      </div>

      <button class="btn btn-success" @click="$emit('save')">儲存變更</button>
    </div>

    <!-- 晉級操作 -->
    <div v-if="tab === 'promote'" class="card">
      <div class="card-title">將各組前 {{ event.advancePerGroup }} 名送入淘汰賽</div>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">
        確認小組賽結果正確後，點擊下方按鈕自動把晉級者填入淘汰賽籤表。
      </p>

      <div v-for="group in (event.groups || [])" :key="group.id" style="margin-bottom:12px;">
        <strong style="color:var(--accent);">{{ group.name }} 組晉級：</strong>
        <span v-for="(row, i) in groupStandings(group).slice(0, event.advancePerGroup)"
              :key="row.participant.id" class="badge badge-green" style="margin-left:6px;">
          {{ row.participant.name }}
        </span>
      </div>

      <button class="btn btn-warning" @click="promote">確認晉級並更新淘汰賽</button>
    </div>

    <!-- 淘汰賽管理 -->
    <div v-if="tab === 'knockout'">
      <EliminationAdmin :event="knockoutEvent" @save="$emit('save')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateRoundRobinStandings, generateBracket } from '../lib/tournament.js'
import ScoreEditor from './ScoreEditor.vue'
import EliminationAdmin from './EliminationAdmin.vue'

const props = defineProps({ event: Object })
const emit = defineEmits(['save'])

const tab = ref('groups')
const isTeam = computed(() => props.event.type === 'team')

function groupStandings(group) {
  return calculateRoundRobinStandings(group.participants, group.matches)
}

function onGroupScoreUpdate(match, { scores, winner }) {
  match.scores = scores
  if (winner === 1) match.winner = match.p1
  else if (winner === 2) match.winner = match.p2
  else match.winner = null
}

function promote() {
  // 收集各組晉級者
  const promoted = []
  for (const group of (props.event.groups || [])) {
    const standings = groupStandings(group)
    for (let i = 0; i < props.event.advancePerGroup && i < standings.length; i++) {
      promoted.push({
        ...standings[i].participant,
        seed: promoted.length + 1,
      })
    }
  }

  // 重新產生淘汰賽
  props.event.bracket = generateBracket(promoted)
  emit('save')
  tab.value = 'knockout'
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
