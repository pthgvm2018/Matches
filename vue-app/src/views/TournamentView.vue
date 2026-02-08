<template>
  <div v-if="loading" class="empty-state" style="padding-top:60px;"><p>載入中...</p></div>

  <template v-else-if="data">
    <div class="site-header">
      <h1>{{ data.name }}</h1>
      <div class="header-meta">
        <span v-if="data.date">{{ data.date }}</span>
        <span v-if="data.venue">{{ data.venue }}</span>
      </div>
    </div>

    <!-- Tab 導航 -->
    <div class="nav-bar">
      <ul>
        <li>
          <button :class="{ active: activeTab === 'rules' }" @click="activeTab = 'rules'">
            賽事規則
          </button>
        </li>
        <li v-for="ev in data.events" :key="ev.id">
          <button :class="{ active: activeTab === ev.id }" @click="activeTab = ev.id">
            {{ ev.label }}
          </button>
        </li>
      </ul>
    </div>

    <div class="container" style="padding-top:24px;padding-bottom:40px;">
      <!-- 賽事規則 -->
      <template v-if="activeTab === 'rules'">
        <div class="section-title"><span class="icon">R</span> 賽事規則</div>
        <div class="card">
          <div v-if="data.events?.length" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <span v-for="ev in data.events" :key="ev.id" class="badge badge-accent">
              {{ ev.label }}：{{ bestOfLabel(ev.matchBestOf) }}
            </span>
          </div>
          <div v-if="rulesText" style="white-space:pre-wrap;line-height:1.8;">{{ rulesText }}</div>
          <p v-else class="empty-state">尚未設定比賽規則</p>
        </div>
      </template>

      <!-- 各項目內容 -->
      <template v-if="activeEvent">
        <RoundRobinView v-if="activeEvent.format === 'round_robin'" :event="activeEvent" />
        <EliminationView v-else-if="activeEvent.format === 'elimination'" :event="activeEvent" />
        <GroupKnockoutView v-else-if="activeEvent.format === 'group_knockout'" :event="activeEvent" />
      </template>
    </div>
  </template>

  <div v-else class="empty-state" style="padding-top:60px;">
    <p>找不到此賽事</p>
    <router-link to="/" class="btn btn-outline" style="margin-top:12px;">返回首頁</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTournament } from '../composables/useTournaments.js'
import { BEST_OF_OPTIONS, generateRulesText } from '../lib/tournament.js'
import RoundRobinView from '../components/RoundRobinView.vue'
import EliminationView from '../components/EliminationView.vue'
import GroupKnockoutView from '../components/GroupKnockoutView.vue'

const route = useRoute()
const tid = route.params.id
const { data, loading, load, listen, stop } = useTournament(tid)

const activeTab = ref('rules')
const activeEvent = computed(() => {
  if (!data.value || activeTab.value === 'rules') return null
  return data.value.events.find(e => e.id === activeTab.value) || null
})

const rulesText = computed(() => {
  if (!data.value) return ''
  return generateRulesText(data.value)
})

function bestOfLabel(b) {
  return BEST_OF_OPTIONS.find(x => x.value === b)?.label || `${b}局`
}

onMounted(async () => {
  await load()
  listen()
})
onUnmounted(stop)
</script>
