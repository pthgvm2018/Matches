<template>
  <header class="site-header">
    <div class="container">
      <h1>{{ data.tournament.name || '乒乓球錦標賽' }}</h1>
      <div class="header-meta">
        <span v-if="data.tournament.date">{{ data.tournament.date }}</span>
        <span v-if="data.tournament.location">{{ data.tournament.location }}</span>
      </div>
    </div>
  </header>

  <nav class="nav-bar">
    <div class="container">
      <ul>
        <li><a href="#" class="nav-link" :class="{ active: tab === 'rules' }" @click.prevent="tab = 'rules'">賽事規則</a></li>
        <li><a href="#" class="nav-link" :class="{ active: tab === 'groups' }" @click.prevent="tab = 'groups'">小組賽</a></li>
        <li><a href="#" class="nav-link" :class="{ active: tab === 'knockout' }" @click.prevent="tab = 'knockout'">淘汰賽</a></li>
      </ul>
    </div>
  </nav>

  <main class="container">
    <!-- Rules -->
    <section v-show="tab === 'rules'" class="section active">
      <div class="section-title"><span class="icon">R</span> 賽事規則</div>
      <div class="card">
        <div v-if="data.tournament.groupFormat || data.tournament.knockoutFormat" style="margin-bottom:16px;">
          <span v-if="data.tournament.groupFormat" class="badge badge-accent" style="margin-right:8px;">小組賽每點：{{ data.tournament.groupFormat }}</span>
          <span v-if="data.tournament.knockoutFormat" class="badge badge-accent">淘汰賽每點：{{ data.tournament.knockoutFormat }}</span>
        </div>
        <div v-if="data.tournament.rules" style="white-space:pre-wrap;">{{ data.tournament.rules }}</div>
        <p v-if="!data.tournament.rules && !data.tournament.groupFormat && !data.tournament.knockoutFormat" class="empty-state">尚未設定比賽規則</p>
      </div>
    </section>

    <!-- Groups -->
    <section v-show="tab === 'groups'" class="section active">
      <div class="section-title"><span class="icon">G</span> 小組賽</div>
      <div v-if="!data.groups || data.groups.length === 0" class="empty-state"><p>尚無小組賽資料</p></div>
      <div v-for="(group, gi) in data.groups" :key="gi" class="card">
        <div class="card-title">{{ group.name }}</div>
        <!-- Standings table -->
        <div class="table-responsive">
          <table class="standings-table">
            <thead>
              <tr><th>#</th><th>隊伍</th><th>賽</th><th>勝</th><th>負</th><th>點勝</th><th>點負</th><th>點差</th><th>局勝</th><th>局負</th><th>積分</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in getStandings(gi, group)" :key="s.teamId" :class="{ qualified: i < (group.advanceCount || 2) }">
                <td>{{ i + 1 }}</td>
                <td class="team-name">{{ teamName(s.teamId) }}</td>
                <td>{{ s.played }}</td><td>{{ s.wins }}</td><td>{{ s.losses }}</td>
                <td>{{ s.doublesFor }}</td><td>{{ s.doublesAgainst }}</td>
                <td>{{ diffStr(s.doublesFor - s.doublesAgainst) }}</td>
                <td>{{ s.gamesFor }}</td><td>{{ s.gamesAgainst }}</td>
                <td><strong>{{ s.matchPoints }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Group matches -->
        <div v-if="getGroupMatches(gi).length" style="margin-top:16px;">
          <h4 style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:10px;">比賽結果</h4>
          <div class="match-list">
            <TeamMatchRow v-for="(m, mi) in getGroupMatches(gi)" :key="m.id" :match="m" :teams="data.teams" :uid="'gm_' + gi + '_' + mi" />
          </div>
        </div>
      </div>
    </section>

    <!-- Knockout -->
    <section v-show="tab === 'knockout'" class="section active">
      <div class="section-title"><span class="icon">K</span> 淘汰賽</div>
      <div v-if="!koRounds.length" class="empty-state"><p>尚無淘汰賽資料</p></div>
      <template v-else>
        <!-- Simple bracket view -->
        <div class="card" style="overflow-x:auto;">
          <div style="display:flex;gap:32px;padding:16px 0;">
            <div v-for="(round, ri) in koRounds" :key="ri" style="min-width:200px;">
              <div style="text-align:center;margin-bottom:12px;">
                <span class="badge badge-accent">{{ round.name }}</span>
              </div>
              <div v-for="m in round.matches" :key="m.id" style="margin-bottom:12px;">
                <div class="match-box-simple">
                  <div class="mb-team" :class="{ winner: m.completed && m.score1 > m.score2 }">
                    <span>{{ teamName(m.team1Id) }}</span>
                    <span style="font-weight:700;">{{ m.completed ? m.score1 : '-' }}</span>
                  </div>
                  <div class="mb-team" :class="{ winner: m.completed && m.score2 > m.score1 }">
                    <span>{{ teamName(m.team2Id) }}</span>
                    <span style="font-weight:700;">{{ m.completed ? m.score2 : '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Knockout detail -->
        <div v-for="(round, ri) in koRounds" :key="'d' + ri" class="card" style="margin-top:16px;">
          <div class="card-title">{{ round.name }}</div>
          <div class="match-list">
            <TeamMatchRow v-for="(m, mi) in round.matches" :key="m.id" :match="m" :teams="data.teams" :uid="'ko_' + ri + '_' + mi" />
          </div>
        </div>
      </template>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">乒乓球錦標賽管理系統</div>
  </footer>
</template>

<script setup>
import { ref, reactive, computed, provide, onMounted } from 'vue'
import { useFirestore } from '../composables/useFirestore'
import { STORAGE_KEY, loadData, getTeamName, getTeamById, calculateStandings, getDoublesDisplay } from '../lib/main-storage'
import TeamMatchRow from '../components/TeamMatchRow.vue'

const tab = ref('rules')
const data = reactive(loadData())

const { syncStatus, syncText, loadFromCloud, startListening } = useFirestore(STORAGE_KEY)
provide('syncStatus', syncStatus)
provide('syncText', syncText)

function applyData(d) { Object.assign(data, d) }

onMounted(async () => {
  const cloudData = await loadFromCloud()
  if (cloudData) applyData(cloudData)
  else applyData(loadData())
  startListening(d => applyData(d))
})

function teamName(id) { return getTeamName(data.teams, id) }
function diffStr(n) { return n > 0 ? '+' + n : '' + n }

function getStandings(gi, group) {
  return calculateStandings(gi, group.teamIds, data.groupMatches)
}

function getGroupMatches(gi) {
  return (data.groupMatches || []).filter(m => m.groupIndex === gi)
}

const koRounds = computed(() => (data.knockout && data.knockout.rounds) || [])
</script>

<style scoped>
.match-box-simple {
  background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
}
.mb-team {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 12px; font-size: 0.85rem; color: var(--text-secondary);
}
.mb-team:first-child { border-bottom: 1px solid var(--border); }
.mb-team.winner { color: var(--accent); font-weight: 700; }
</style>
