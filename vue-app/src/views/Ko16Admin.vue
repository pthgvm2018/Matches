<template>
  <div class="admin-banner">管理模式 - 編輯比賽資料</div>

  <header class="site-header">
    <div class="container">
      <h1>{{ data.tournament.name || '16強雙打淘汰賽' }} - 管理後台</h1>
    </div>
  </header>

  <nav class="nav-bar">
    <div class="container">
      <ul>
        <li><button class="nav-link" :class="{ active: tab === 'settings' }" @click="tab = 'settings'">賽事設定</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'teams' }" @click="tab = 'teams'">隊伍管理</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'bracket' }" @click="tab = 'bracket'">對戰排序</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'matches' }" @click="tab = 'matches'">比賽成績</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'share' }" @click="tab = 'share'">分享</button></li>
      </ul>
    </div>
  </nav>

  <main class="container">
    <!-- Settings -->
    <section v-show="tab === 'settings'" class="section active">
      <div class="section-title"><span class="icon">S</span> 賽事設定</div>
      <div class="card">
        <div class="form-group">
          <label>比賽名稱</label>
          <input v-model="form.name" class="form-control" placeholder="例如：2026 春季雙打淘汰賽">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>日期</label>
            <input v-model="form.date" class="form-control" placeholder="例如：2026年3月22日">
          </div>
          <div class="form-group">
            <label>地點</label>
            <input v-model="form.location" class="form-control" placeholder="例如：台北體育館">
          </div>
        </div>
        <div class="form-group">
          <label>賽制</label>
          <select v-model="form.format" class="form-control">
            <option value="三局兩勝">三局兩勝</option>
            <option value="五局三勝">五局三勝</option>
            <option value="七局四勝">七局四勝</option>
          </select>
        </div>
        <div class="form-group">
          <label>比賽規則</label>
          <textarea v-model="form.rules" class="form-control" rows="8" placeholder="輸入比賽規則說明..."></textarea>
        </div>
        <button class="btn btn-primary" @click="saveSettings">儲存設定</button>
      </div>
    </section>

    <!-- Teams -->
    <section v-show="tab === 'teams'" class="section active">
      <div class="section-title"><span class="icon">T</span> 隊伍管理 <span class="badge badge-accent">{{ data.teams.length }} / 16</span></div>
      <div class="card">
        <div class="form-group" style="display:flex;gap:8px;">
          <input v-model="newTeamName" class="form-control" placeholder="輸入組別名稱" style="flex:1;" @keydown.enter="addTeam">
          <button class="btn btn-primary" @click="addTeam">新增</button>
        </div>
        <div v-if="data.teams.length === 0" class="empty-state"><p>尚未新增任何隊伍</p></div>
        <div v-for="(team, ti) in data.teams" :key="team.id" class="card" style="padding:12px;margin-top:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="team-number">{{ ti + 1 }}</span>
              <input v-model="team.name" class="form-control" style="width:120px;font-weight:700;padding:2px 8px;">
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" @click="saveTeam(team)">儲存</button>
              <button class="btn btn-danger btn-sm" @click="removeTeam(team.id)">刪除</button>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <input v-model="team.players[0]" class="form-control" style="flex:1;padding:4px 8px;font-size:0.85rem;" placeholder="選手 A">
            <input v-model="team.players[1]" class="form-control" style="flex:1;padding:4px 8px;font-size:0.85rem;" placeholder="選手 B">
          </div>
        </div>
      </div>
    </section>

    <!-- Bracket Seeding -->
    <section v-show="tab === 'bracket'" class="section active">
      <div class="section-title"><span class="icon">B</span> 對戰排序</div>
      <div class="card">
        <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:12px;">
          將 16 組排入對戰位置，或使用隨機抽籤。
        </p>
        <div class="btn-group" style="margin-bottom:16px;">
          <button class="btn btn-warning" @click="randomSeed">隨機抽籤</button>
          <button class="btn btn-success" @click="saveBracket">儲存對戰表</button>
        </div>
        <div v-for="(m, mi) in seedingMatches" :key="mi" class="card" style="padding:10px;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.9rem;">
            <span style="color:var(--text-muted);font-weight:600;min-width:50px;">第 {{ mi + 1 }} 場</span>
            <select v-model="seedSlots[mi * 2]" class="form-control" style="flex:1;padding:4px 6px;font-size:0.85rem;">
              <option :value="null">-- 選擇 --</option>
              <option v-for="t in data.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <span style="color:var(--text-muted);font-weight:700;">VS</span>
            <select v-model="seedSlots[mi * 2 + 1]" class="form-control" style="flex:1;padding:4px 6px;font-size:0.85rem;">
              <option :value="null">-- 選擇 --</option>
              <option v-for="t in data.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Matches -->
    <section v-show="tab === 'matches'" class="section active">
      <div class="section-title"><span class="icon">M</span> 比賽成績</div>
      <div v-if="!data.rounds || data.rounds.length === 0" class="empty-state"><p>尚未設定對戰表</p></div>
      <template v-else>
        <div v-for="(round, ri) in allRoundsForEdit" :key="ri" class="card" style="margin-bottom:12px;">
          <div class="card-title">{{ round.name }}</div>
          <div v-for="(m, mi) in round.matches" :key="m.id || mi" class="match-edit-item" style="margin-bottom:10px;">
            <div class="match-edit-header">
              <div class="match-edit-teams">
                <span>{{ teamName(m.team1Id) }}</span>
                <span class="vs">vs</span>
                <span>{{ teamName(m.team2Id) }}</span>
              </div>
              <span class="badge" :class="m.completed ? 'badge-green' : 'badge-yellow'">
                {{ m.completed ? m.score1 + ':' + m.score2 : '未開始' }}
              </span>
            </div>

            <template v-if="m.team1Id && m.team2Id">
              <div style="font-size:0.82rem;color:var(--text-secondary);text-align:center;margin:6px 0;">
                {{ playersDisplay(m.team1Id) }}
                <span style="color:var(--text-muted);"> vs </span>
                {{ playersDisplay(m.team2Id) }}
              </div>
              <div class="game-scores" style="justify-content:center;">
                <div v-for="g in maxGames" :key="g" class="game-score-pair">
                  <input
                    type="number" class="score-input" style="width:40px;padding:4px;" min="0" max="99"
                    :value="getGameScore(m, g - 1, 1)"
                    @input="setGameScore(m, g - 1, 1, $event)"
                  >
                  <span style="color:var(--text-muted);">-</span>
                  <input
                    type="number" class="score-input" style="width:40px;padding:4px;" min="0" max="99"
                    :value="getGameScore(m, g - 1, 2)"
                    @input="setGameScore(m, g - 1, 2, $event)"
                  >
                </div>
              </div>
              <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
                <button class="btn btn-success btn-sm" @click="saveMatchScores(round, ri, m, mi)">儲存成績</button>
                <button v-if="m.completed" class="btn btn-outline btn-sm" @click="resetMatch(round, ri, m, mi)">重置</button>
              </div>
            </template>
            <div v-else class="empty-state" style="padding:8px;"><p style="font-size:0.85rem;">等待對手確定</p></div>
          </div>
        </div>
      </template>
    </section>

    <!-- Share -->
    <section v-show="tab === 'share'" class="section active">
      <div class="section-title"><span class="icon">S</span> 分享連結</div>
      <div class="card">
        <div class="card-title">觀看連結</div>
        <div class="share-url-box">
          <input :value="viewUrl" class="share-url-input" readonly>
          <button class="btn btn-primary" @click="copyText(viewUrl); showToast('觀看連結已複製')">複製</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">管理連結</div>
        <div class="share-url-box">
          <input :value="adminUrl" class="share-url-input" readonly>
          <button class="btn btn-primary" @click="copyText(adminUrl); showToast('管理連結已複製')">複製</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">匯出 / 匯入資料</div>
        <div class="btn-group">
          <button class="btn btn-outline" @click="exportJson">匯出 JSON</button>
          <button class="btn btn-outline" @click="$refs.fileImport.click()">匯入 JSON</button>
        </div>
        <input ref="fileImport" type="file" accept=".json" style="display:none;" @change="importJson">
      </div>
      <div class="card">
        <div class="card-title">重置資料</div>
        <button class="btn btn-danger" @click="resetAll">重置所有資料</button>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">16強雙打淘汰賽管理系統</div>
  </footer>
</template>

<script setup>
import { ref, reactive, computed, provide, onMounted } from 'vue'
import { useFirestore } from '../composables/useFirestore'
import { useToast } from '../composables/useToast'
import {
  STORAGE_KEY, loadData, getDefaultData, createEmptyRounds, createEmptyMatch,
  getTeamName, getPlayersDisplay, nextTeamId,
} from '../lib/ko16-storage'

const { showToast } = useToast()
const { syncStatus, syncText, loadFromCloud, startListening, saveToCloud } = useFirestore(STORAGE_KEY)
provide('syncStatus', syncStatus)
provide('syncText', syncText)

const tab = ref('settings')
const data = reactive(loadData())

// Settings form
const form = reactive({
  name: data.tournament.name || '',
  date: data.tournament.date || '',
  location: data.tournament.location || '',
  format: data.tournament.format || '五局三勝',
  rules: data.tournament.rules || '',
})

function applyData(d) {
  Object.assign(data, d)
  form.name = d.tournament.name || ''
  form.date = d.tournament.date || ''
  form.location = d.tournament.location || ''
  form.format = d.tournament.format || '五局三勝'
  form.rules = d.tournament.rules || ''
  initSeedSlots()
}

onMounted(async () => {
  const cloudData = await loadFromCloud()
  if (cloudData) applyData(cloudData)
  else applyData(loadData())
  startListening(() => {}) // Admin doesn't auto-refresh to avoid form loss
})

async function persist() { await saveToCloud(JSON.parse(JSON.stringify(data))) }

// ===== Settings =====
function saveSettings() {
  data.tournament.name = form.name.trim()
  data.tournament.date = form.date.trim()
  data.tournament.location = form.location.trim()
  data.tournament.rules = form.rules
  data.tournament.format = form.format
  persist()
  showToast('設定已儲存')
}

// ===== Teams =====
const newTeamName = ref('')

function addTeam() {
  const name = newTeamName.value.trim()
  if (!name) return
  if (data.teams.length >= 16) { showToast('最多 16 組'); return }
  if (data.teams.some(t => t.name === name)) { showToast('名稱已存在'); return }
  data.teams.push({ id: nextTeamId(data.teams), name, players: ['', ''] })
  persist()
  newTeamName.value = ''
  showToast('已新增：' + name)
}

function saveTeam(team) {
  if (!team.name.trim()) { showToast('名稱不能為空'); return }
  persist()
  showToast(team.name + ' 已儲存')
}

function removeTeam(tid) {
  if (!confirm('確定刪除？')) return
  data.teams = data.teams.filter(t => t.id !== tid)
  data.rounds.forEach(round => {
    round.matches.forEach(m => {
      if (m.team1Id === tid) { m.team1Id = null; m.completed = false; m.games = []; m.score1 = 0; m.score2 = 0 }
      if (m.team2Id === tid) { m.team2Id = null; m.completed = false; m.games = []; m.score1 = 0; m.score2 = 0 }
    })
  })
  if (data.thirdPlace) {
    if (data.thirdPlace.team1Id === tid) data.thirdPlace.team1Id = null
    if (data.thirdPlace.team2Id === tid) data.thirdPlace.team2Id = null
  }
  persist()
  showToast('已刪除')
}

// ===== Bracket Seeding =====
const seedSlots = ref([])
const seedingMatches = computed(() => {
  if (!data.rounds || data.rounds.length === 0) return []
  return data.rounds[0].matches
})

function initSeedSlots() {
  const slots = []
  if (data.rounds && data.rounds.length > 0) {
    data.rounds[0].matches.forEach(m => {
      slots.push(m.team1Id)
      slots.push(m.team2Id)
    })
  }
  seedSlots.value = slots
}
initSeedSlots()

function randomSeed() {
  if (data.teams.length < 2) { showToast('至少需要 2 組'); return }
  const shuffled = [...data.teams].sort(() => Math.random() - 0.5)
  const slots = new Array(16).fill(null)
  for (let i = 0; i < Math.min(shuffled.length, 16); i++) {
    slots[i] = shuffled[i].id
  }
  seedSlots.value = slots
  showToast('已隨機排列，請按「儲存對戰表」確認')
}

function saveBracket() {
  const used = {}
  let valid = true
  seedSlots.value.forEach(val => {
    if (val) {
      if (used[val]) valid = false
      used[val] = true
    }
  })
  if (!valid) { showToast('同一隊不能出現兩次'); return }

  const hasResults = data.rounds && data.rounds.some(r => r.matches.some(m => m.completed))
  let changed = false
  if (data.rounds && data.rounds.length >= 1) {
    data.rounds[0].matches.forEach((m, mi) => {
      if (m.team1Id !== seedSlots.value[mi * 2]) changed = true
      if (m.team2Id !== seedSlots.value[mi * 2 + 1]) changed = true
    })
  } else { changed = true }

  if (hasResults && changed) {
    if (!confirm('變更對戰排序將清除所有已完成的比賽成績，確定？')) return
  }

  if (!data.rounds || data.rounds.length < 4) data.rounds = createEmptyRounds()

  if (changed) {
    data.rounds.forEach((round, ri) => {
      round.matches.forEach(m => {
        if (ri > 0) { m.team1Id = null; m.team2Id = null }
        m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false
      })
    })
    data.thirdPlace = null
  }

  data.rounds[0].matches.forEach((m, mi) => {
    m.team1Id = seedSlots.value[mi * 2]
    m.team2Id = seedSlots.value[mi * 2 + 1]
  })

  persist()
  showToast('對戰表已儲存')
}

// ===== Matches =====
const maxGames = computed(() => {
  const fmt = data.tournament.format || '五局三勝'
  if (fmt === '三局兩勝') return 3
  if (fmt === '七局四勝') return 7
  return 5
})

const allRoundsForEdit = computed(() => {
  const arr = data.rounds ? [...data.rounds] : []
  if (data.thirdPlace) {
    arr.push({ name: '季軍戰', matches: [data.thirdPlace], isThirdPlace: true })
  }
  return arr
})

function teamName(id) { return getTeamName(data.teams, id) }
function playersDisplay(id) { return getPlayersDisplay(data.teams, id) }

// Temporary game scores stored per match
const tempScores = reactive({})

function getGameScore(m, gi, side) {
  const key = m.id + '_g' + gi + '_s' + side
  if (tempScores[key] !== undefined) return tempScores[key]
  const g = m.games && m.games[gi]
  if (!g) return ''
  return side === 1 ? g.s1 : g.s2
}

function setGameScore(m, gi, side, event) {
  const key = m.id + '_g' + gi + '_s' + side
  tempScores[key] = event.target.value
}

function saveMatchScores(round, ri, m, mi) {
  const winGames = Math.ceil(maxGames.value / 2)
  m.games = []
  m.score1 = 0
  m.score2 = 0

  for (let g = 0; g < maxGames.value; g++) {
    const k1 = m.id + '_g' + g + '_s1'
    const k2 = m.id + '_g' + g + '_s2'
    const v1 = tempScores[k1] !== undefined ? tempScores[k1] : (m.games[g]?.s1 ?? '')
    const v2 = tempScores[k2] !== undefined ? tempScores[k2] : (m.games[g]?.s2 ?? '')
    if (v1 !== '' || v2 !== '') {
      const s1 = parseInt(v1) || 0, s2 = parseInt(v2) || 0
      if (s1 > 0 || s2 > 0) {
        m.games.push({ s1, s2 })
        if (s1 > s2) m.score1++
        else if (s2 > s1) m.score2++
      }
    }
  }
  m.completed = m.games.length > 0 && (m.score1 >= winGames || m.score2 >= winGames)

  // Auto advance
  if (m.completed) {
    const winnerId = m.score1 > m.score2 ? m.team1Id : m.team2Id
    const loserId = m.score1 > m.score2 ? m.team2Id : m.team1Id
    const isThirdPlace = round.isThirdPlace
    const actualRi = isThirdPlace ? -1 : ri

    if (actualRi >= 0 && actualRi < 3 && data.rounds[actualRi + 1]) {
      const nextMi = Math.floor(mi / 2)
      const nextSlot = mi % 2
      const nextMatch = data.rounds[actualRi + 1].matches[nextMi]
      if (nextMatch) {
        if (nextSlot === 0) nextMatch.team1Id = winnerId
        else nextMatch.team2Id = winnerId
      }
    }

    // Semi-final losers go to third place match
    if (actualRi === 2) {
      if (!data.thirdPlace) data.thirdPlace = createEmptyMatch('third')
      if (mi === 0) data.thirdPlace.team1Id = loserId
      if (mi === 1) data.thirdPlace.team2Id = loserId
    }
  }

  // Clear temp scores for this match
  for (let g = 0; g < maxGames.value; g++) {
    delete tempScores[m.id + '_g' + g + '_s1']
    delete tempScores[m.id + '_g' + g + '_s2']
  }

  persist()
  showToast('成績已儲存')
}

function resetMatch(round, ri, m, mi) {
  m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false
  const isThirdPlace = round.isThirdPlace
  const actualRi = isThirdPlace ? -1 : ri
  if (actualRi >= 0 && actualRi < 3) {
    clearAdvance(actualRi + 1, Math.floor(mi / 2), mi % 2)
  }
  persist()
  showToast('已重置')
}

function clearAdvance(ri, mi, slot) {
  if (ri >= data.rounds.length || !data.rounds[ri]?.matches[mi]) return
  const m = data.rounds[ri].matches[mi]
  if (slot === 0) m.team1Id = null
  else m.team2Id = null
  m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false
  if (ri < 3) clearAdvance(ri + 1, Math.floor(mi / 2), mi % 2)
}

// ===== Share =====
const viewUrl = computed(() => {
  const base = window.location.origin + '/Matches/#/knockout16'
  return base
})
const adminUrl = computed(() => {
  const base = window.location.origin + '/Matches/#/knockout16/admin'
  return base
})

function copyText(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => fbCopy(text))
  else fbCopy(text)
}
function fbCopy(text) {
  const t = document.createElement('textarea')
  t.value = text; t.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
}

function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (data.tournament.name || 'ko16') + '.json'
  a.click()
  showToast('已匯出')
}

function importJson(e) {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result)
      if (d.tournament && d.teams) { applyData(d); persist(); showToast('已匯入') }
      else showToast('格式錯誤')
    } catch { showToast('匯入失敗') }
  }
  r.readAsText(f)
  e.target.value = ''
}

function resetAll() {
  if (!confirm('確定重置？')) return
  if (!confirm('真的確定？')) return
  applyData(getDefaultData())
  persist()
  showToast('已重置')
}
</script>

<style scoped>
.team-number {
  width: 28px; height: 28px; background: var(--accent-light); color: var(--accent);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700;
}
</style>
