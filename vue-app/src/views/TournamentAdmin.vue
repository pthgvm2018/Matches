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
            賽事設定
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
      <!-- 賽事設定 -->
      <template v-if="activeTab === 'rules'">
        <!-- 基本資訊編輯 -->
        <div class="section-title"><span class="icon">E</span> 基本資訊</div>
        <div class="card">
          <div class="form-group">
            <label>賽事名稱</label>
            <input class="form-control" v-model="data.name" @change="saveData">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>日期</label>
              <input class="form-control" type="date" v-model="data.date" @change="saveData">
            </div>
            <div class="form-group">
              <label>地點</label>
              <input class="form-control" v-model="data.venue" @change="saveData">
            </div>
          </div>
        </div>

        <!-- 各項目設定 -->
        <div class="section-title" style="margin-top:20px;"><span class="icon">S</span> 項目設定</div>
        <div v-for="ev in data.events" :key="ev.id" class="card" style="margin-bottom:12px;">
          <div class="card-title">{{ ev.label }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ ev.format === 'group_knockout' ? '小組賽每場比賽' : '每場比賽' }}</label>
              <select class="form-control" v-model="ev.matchBestOf" @change="saveData">
                <option v-for="b in bestOfOpts" :key="b.value" :value="b.value">{{ b.label }}</option>
              </select>
            </div>
            <div class="form-group" v-if="ev.format === 'group_knockout'">
              <label>淘汰賽每場比賽</label>
              <select class="form-control" v-model="ev.knockoutBestOf" @change="saveData">
                <option v-for="b in bestOfOpts" :key="b.value" :value="b.value">{{ b.label }}</option>
              </select>
            </div>
            <div class="form-group" v-if="ev.format === 'group_knockout'">
              <label>每組晉級人數</label>
              <select class="form-control" v-model.number="ev.advancePerGroup" @change="saveData">
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" v-if="ev.type === 'team'">
              <label>團體賽模式</label>
              <select class="form-control" v-model="ev.teamMatchFormat" @change="onTeamFormatChange(ev)">
                <option v-for="t in teamFmtOpts" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="form-group" v-if="ev.type === 'team'">
              <label>每隊選手人數</label>
              <input class="form-control" type="number" min="1" max="30"
                     v-model.number="ev.teamSize" @change="onTeamSizeChange(ev)">
            </div>
          </div>
          <!-- 自訂場次編輯 -->
          <template v-if="ev.type === 'team' && ev.teamMatchFormat === 'custom'">
            <div class="form-row" style="margin-top:12px;">
              <div class="form-group">
                <label>總點數</label>
                <input class="form-control" type="number" min="1" max="15"
                       :value="ev.rubbers?.length || 5"
                       @change="onCustomRubberCountChange(ev, $event)">
              </div>
              <div class="form-group">
                <label>勝點數</label>
                <input class="form-control" type="number" min="1"
                       v-model.number="ev.pointsToWin" @change="saveData">
              </div>
            </div>
            <div v-for="(r, ri) in (ev.rubbers || [])" :key="ri"
                 style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:0.85rem;">
              <span style="min-width:50px;color:var(--text-muted);">第{{ ri + 1 }}點</span>
              <select class="form-control" style="width:auto;" v-model="r.type" @change="onCustomRubberEdit(ev)">
                <option value="singles">單打</option>
                <option value="doubles">雙打</option>
                <option value="mixed_doubles">混雙</option>
              </select>
              <input class="form-control" style="flex:1;" v-model="r.label"
                     :placeholder="`第${ri+1}點`" @change="onCustomRubberEdit(ev)">
            </div>
          </template>

          <div class="format-info" style="margin-top:8px;">
            <span class="badge badge-accent">{{ formatLabel(ev.format) }}</span>
            <span v-if="ev.format === 'group_knockout'" class="badge badge-green">小組{{ bestOfLabel(ev.matchBestOf) }}</span>
            <span v-if="ev.format === 'group_knockout'" class="badge badge-green">淘汰{{ bestOfLabel(ev.knockoutBestOf || ev.matchBestOf) }}</span>
            <span v-if="ev.format !== 'group_knockout'" class="badge badge-green">{{ bestOfLabel(ev.matchBestOf) }}</span>
            <span v-if="ev.format === 'group_knockout'" class="badge">每組晉級 {{ ev.advancePerGroup || 2 }} 名</span>
            <span v-if="ev.type === 'team'" class="badge badge-yellow">
              {{ ev.teamMatchFormat === 'custom' ? (ev.rubbers?.length || 0) + '點' + (ev.pointsToWin || 3) + '勝' : getTeamFormatDesc(ev.teamMatchFormat) }}
            </span>
            <span v-if="ev.type === 'team'" class="badge">每隊 {{ ev.teamSize || 10 }} 人</span>
          </div>
        </div>

        <!-- 賽事規則預覽 -->
        <div class="section-title" style="margin-top:20px;"><span class="icon">R</span> 賽事規則預覽</div>
        <div class="card">
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
import { BEST_OF_OPTIONS, FORMATS, TEAM_MATCH_FORMATS, TEAM_RUBBER_TEMPLATES, generateRulesText, attachRubbersToEvent } from '../lib/tournament.js'
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

const bestOfOpts = BEST_OF_OPTIONS
const teamFmtOpts = TEAM_MATCH_FORMATS

function bestOfLabel(b) {
  return BEST_OF_OPTIONS.find(x => x.value === b)?.label || `${b}局`
}

function formatLabel(f) {
  return FORMATS.find(x => x.value === f)?.label || f
}

function getTeamFormatDesc(fmt) {
  const tmpl = TEAM_RUBBER_TEMPLATES[fmt]
  return tmpl ? tmpl.description : '自訂'
}

function onTeamFormatChange(ev) {
  if (ev.teamMatchFormat && ev.teamMatchFormat !== 'custom') {
    const tmpl = TEAM_RUBBER_TEMPLATES[ev.teamMatchFormat]
    if (tmpl) {
      ev.rubbers = tmpl.rubbers.map(r => ({ ...r }))
      ev.pointsToWin = tmpl.pointsToWin
    }
  } else if (ev.teamMatchFormat === 'custom') {
    // 初始化自訂場次（如果還沒有的話）
    if (!ev.rubbers || !ev.rubbers.length) {
      ev.rubbers = Array.from({ length: 5 }, (_, i) => ({
        order: i + 1, type: 'singles', label: `第${i + 1}點`,
      }))
      ev.pointsToWin = 3
    }
  }
  // 清除舊的 rubberResults 讓 attachRubbersToEvent 重新產生
  clearRubberResults(ev)
  attachRubbersToEvent(ev)
  saveData()
}

function onTeamSizeChange(ev) {
  const size = ev.teamSize || 10
  // 調整所有參賽者的 players 陣列長度
  const resizePlayers = (p) => {
    if (!p) return
    if (!p.players) p.players = []
    while (p.players.length < size) p.players.push('')
    while (p.players.length > size) p.players.pop()
  }
  for (const g of (ev.groups || [])) {
    for (const p of (g.participants || [])) resizePlayers(p)
    for (const m of (g.matches || [])) { resizePlayers(m.p1); resizePlayers(m.p2) }
  }
  for (const p of (ev.participants || [])) resizePlayers(p)
  for (const round of (ev.bracket?.rounds || [])) {
    for (const m of (round.matches || [])) { resizePlayers(m.p1); resizePlayers(m.p2) }
  }
  for (const m of (ev.roundRobinMatches || [])) { resizePlayers(m.p1); resizePlayers(m.p2) }
  saveData()
}

function onCustomRubberCountChange(ev, event) {
  const count = parseInt(event.target.value) || 5
  if (!ev.rubbers) ev.rubbers = []
  while (ev.rubbers.length < count) {
    ev.rubbers.push({ order: ev.rubbers.length + 1, type: 'singles', label: `第${ev.rubbers.length + 1}點` })
  }
  while (ev.rubbers.length > count) {
    ev.rubbers.pop()
  }
  clearRubberResults(ev)
  attachRubbersToEvent(ev)
  saveData()
}

function onCustomRubberEdit(ev) {
  clearRubberResults(ev)
  attachRubbersToEvent(ev)
  saveData()
}

function clearRubberResults(ev) {
  const clearMatches = (matches) => {
    for (const m of (matches || [])) {
      delete m.rubberResults
      delete m.teamScore
    }
  }
  for (const g of (ev.groups || [])) clearMatches(g.matches)
  clearMatches(ev.roundRobinMatches)
  if (ev.bracket?.rounds) {
    for (const r of ev.bracket.rounds) clearMatches(r.matches)
  }
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

// 確保團體賽參賽者都有 players 陣列（舊賽事遷移）
function ensureTeamPlayers(ev) {
  const teamSize = ev.teamSize || 10
  const ensurePlayer = (p) => {
    if (p && !p.players) {
      p.players = Array.from({ length: teamSize }, () => '')
    }
  }
  // 從各組收集
  for (const g of (ev.groups || [])) {
    for (const p of (g.participants || [])) ensurePlayer(p)
    for (const m of (g.matches || [])) { ensurePlayer(m.p1); ensurePlayer(m.p2) }
  }
  // participants 陣列
  for (const p of (ev.participants || [])) ensurePlayer(p)
  // bracket rounds
  for (const round of (ev.bracket?.rounds || [])) {
    for (const m of (round.matches || [])) { ensurePlayer(m.p1); ensurePlayer(m.p2) }
  }
  // roundRobinMatches
  for (const m of (ev.roundRobinMatches || [])) { ensurePlayer(m.p1); ensurePlayer(m.p2) }
}

// 每次資料載入或更新後，確保團體賽有 rubberResults 和 players，並補齊缺少的欄位
function applyTeamMigrations() {
  if (!data.value || !data.value.events) return
  let needsSave = false
  for (const ev of data.value.events) {
    // 補齊 group_knockout 格式的 knockoutBestOf
    if (ev.format === 'group_knockout' && !ev.knockoutBestOf) {
      ev.knockoutBestOf = ev.matchBestOf || 5
      needsSave = true
    }
    if (ev.type === 'team') {
      // 檢查是否需要遷移
      const hadRubbers = ev.rubbers && ev.rubbers.length > 0
      attachRubbersToEvent(ev)
      ensureTeamPlayers(ev)
      // 如果之前沒有 rubbers 模板，代表是第一次遷移
      if (!hadRubbers) needsSave = true
      // 檢查比賽是否缺少 rubberResults
      const matches = getAllMatches(ev)
      if (matches.some(m => !m.isBye && m.p1 && m.p2 && !m.rubberResults)) {
        needsSave = true
      }
    }
  }
  return needsSave
}

function getAllMatches(ev) {
  const all = []
  for (const g of (ev.groups || [])) all.push(...(g.matches || []))
  all.push(...(ev.roundRobinMatches || []))
  for (const r of (ev.bracket?.rounds || [])) all.push(...(r.matches || []))
  return all
}

onMounted(async () => {
  await load()
  if (data.value && data.value.events.length > 0) {
    const needsSave = applyTeamMigrations()
    activeTab.value = data.value.events[0].id
    // 遷移後儲存到 Firestore，確保 rubberResults 永久存在
    if (needsSave) {
      await saveData()
    }
  }
  listen(applyTeamMigrations)
})
onUnmounted(stop)
</script>
