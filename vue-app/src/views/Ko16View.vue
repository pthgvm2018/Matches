<template>
  <header class="site-header">
    <div class="container">
      <h1>{{ data.tournament.name || '16強雙打淘汰賽' }}</h1>
      <div class="header-meta">
        <span v-if="data.tournament.date">{{ data.tournament.date }}</span>
        <span v-if="data.tournament.location">{{ data.tournament.location }}</span>
      </div>
    </div>
  </header>

  <nav class="nav-bar">
    <div class="container">
      <ul>
        <li><a href="#" class="nav-link" :class="{ active: activeTab === 'rules' }" @click.prevent="activeTab = 'rules'">賽事規則</a></li>
        <li><a href="#" class="nav-link" :class="{ active: activeTab === 'bracket' }" @click.prevent="activeTab = 'bracket'">對戰表</a></li>
        <li><a href="#" class="nav-link" :class="{ active: activeTab === 'detail' }" @click.prevent="activeTab = 'detail'">比賽詳情</a></li>
      </ul>
    </div>
  </nav>

  <main class="container">
    <!-- Rules -->
    <section v-show="activeTab === 'rules'" class="section active">
      <div class="section-title"><span class="icon">R</span> 賽事規則</div>
      <div class="card">
        <div v-if="data.tournament.format" style="margin-bottom:16px;">
          <span class="badge badge-accent">賽制：{{ data.tournament.format }}</span>
        </div>
        <div v-if="data.tournament.rules" style="white-space:pre-wrap;">{{ data.tournament.rules }}</div>
        <p v-if="!data.tournament.rules && !data.tournament.format" class="empty-state">尚未設定比賽規則</p>
      </div>
    </section>

    <!-- Bracket -->
    <section v-show="activeTab === 'bracket'" class="section active">
      <div class="section-title"><span class="icon">B</span> 對戰表</div>
      <div class="card" style="overflow-x:auto;">
        <BracketTree :rounds="data.rounds" :teams="data.teams" :third-place="data.thirdPlace" />
      </div>
    </section>

    <!-- Detail -->
    <section v-show="activeTab === 'detail'" class="section active">
      <div class="section-title"><span class="icon">D</span> 比賽詳情</div>
      <MatchDetailList :rounds="data.rounds" :teams="data.teams" :third-place="data.thirdPlace" />
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">16強雙打淘汰賽管理系統</div>
  </footer>
</template>

<script setup>
import { ref, reactive, provide, onMounted } from 'vue'
import { useFirestore } from '../composables/useFirestore'
import { STORAGE_KEY, loadData } from '../lib/ko16-storage'
import BracketTree from '../components/BracketTree.vue'
import MatchDetailList from '../components/MatchDetailList.vue'

const activeTab = ref('rules')
const data = reactive(loadData())

const { syncStatus, syncText, loadFromCloud, startListening } = useFirestore(STORAGE_KEY)
provide('syncStatus', syncStatus)
provide('syncText', syncText)

function applyData(d) {
  Object.assign(data, d)
}

onMounted(async () => {
  const cloudData = await loadFromCloud()
  if (cloudData) applyData(cloudData)
  else applyData(loadData())
  startListening((d) => applyData(d))
})
</script>
