<template>
  <div v-if="loading" class="empty-state" style="padding-top:60px;"><p>載入中...</p></div>

  <template v-else-if="data">
    <div class="admin-banner">管理模式 - {{ data.name }}</div>

    <div class="site-header" style="padding:16px 0;">
      <h1 style="font-size:1.5rem;">{{ data.name }}</h1>
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

      <!-- 各項目管理 -->
      <template v-if="activeEvent">
        <RoundRobinAdmin v-if="activeEvent.format === 'round_robin'"
                         :event="activeEvent" @save="saveData" />
        <EliminationAdmin v-else-if="activeEvent.format === 'elimination'"
                          :event="activeEvent" @save="saveData" />
        <GroupKnockoutAdmin v-else-if="activeEvent.format === 'group_knockout'"
                            :event="activeEvent" @save="saveData" />
      </template>

      <!-- 分享連結 -->
      <div class="card" style="margin-top:24px;">
        <div class="card-title">分享</div>
        <div class="form-group">
          <label>查看連結</label>
          <div class="share-url-box">
            <input class="share-url-input" readonly :value="viewUrl">
            <button class="btn btn-primary btn-sm" @click="copy(viewUrl)">複製</button>
          </div>
        </div>
        <div class="form-group">
          <label>管理連結</label>
          <div class="share-url-box">
            <input class="share-url-input" readonly :value="adminUrl">
            <button class="btn btn-primary btn-sm" @click="copy(adminUrl)">複製</button>
          </div>
        </div>
      </div>

      <!-- 危險操作 -->
      <div class="card" style="margin-top:16px;border-color:var(--red);">
        <div class="card-title" style="color:var(--red);">危險操作</div>
        <button class="btn btn-danger btn-sm" @click="confirmDelete">刪除此賽事</button>
      </div>
    </div>
  </template>

  <div v-else class="empty-state" style="padding-top:60px;">
    <p>找不到此賽事</p>
    <router-link to="/admin" class="btn btn-outline" style="margin-top:12px;">返回管理</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournament } from '../composables/useTournaments.js'
import { BEST_OF_OPTIONS, generateRulesText } from '../lib/tournament.js'
import RoundRobinAdmin from '../components/RoundRobinAdmin.vue'
import EliminationAdmin from '../components/EliminationAdmin.vue'
import GroupKnockoutAdmin from '../components/GroupKnockoutAdmin.vue'

const route = useRoute()
const router = useRouter()
const tid = route.params.id
const { data, loading, load, listen, save, remove, stop } = useTournament(tid)

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

const viewUrl = computed(() => `${window.location.origin}/Matches/#/t/${tid}`)
const adminUrl = computed(() => `${window.location.origin}/Matches/#/admin/t/${tid}`)

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

async function saveData() {
  if (!data.value) return
  await save(data.value)
}

async function confirmDelete() {
  if (!confirm(`確定要刪除「${data.value.name}」？此操作無法復原。`)) return
  await remove()
  router.push('/admin')
}

onMounted(async () => {
  await load()
  if (data.value && data.value.events.length > 0) {
    activeTab.value = data.value.events[0].id
  }
  listen()
})
onUnmounted(stop)
</script>
