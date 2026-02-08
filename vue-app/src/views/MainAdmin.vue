<template>
  <div class="admin-banner">管理模式 - 編輯比賽資料</div>

  <header class="site-header">
    <div class="container">
      <h1>{{ data.tournament.name || '乒乓球錦標賽' }} - 管理後台</h1>
    </div>
  </header>

  <nav class="nav-bar">
    <div class="container">
      <ul>
        <li><button class="nav-link" :class="{ active: tab === 'settings' }" @click="tab = 'settings'">賽事設定</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'teams' }" @click="tab = 'teams'">隊伍管理</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'groups' }" @click="tab = 'groups'">小組賽</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'groupmatches' }" @click="tab = 'groupmatches'">小組比賽</button></li>
        <li><button class="nav-link" :class="{ active: tab === 'knockout' }" @click="tab = 'knockout'">淘汰賽</button></li>
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
          <input v-model="form.name" class="form-control" placeholder="例如：2026 乒乓球錦標賽">
        </div>
        <div class="form-row">
          <div class="form-group"><label>日期</label><input v-model="form.date" class="form-control" placeholder="例如：2026年2月4日-8日"></div>
          <div class="form-group"><label>地點</label><input v-model="form.location" class="form-control" placeholder="例如：台北體育館"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>小組賽賽制</label>
            <select v-model="form.groupFormat" class="form-control">
              <option value="三局兩勝">三局兩勝</option>
              <option value="五局三勝">五局三勝</option>
              <option value="七局四勝">七局四勝</option>
            </select>
          </div>
          <div class="form-group">
            <label>淘汰賽賽制</label>
            <select v-model="form.knockoutFormat" class="form-control">
              <option value="五局三勝">五局三勝</option>
              <option value="七局四勝">七局四勝</option>
            </select>
          </div>
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
      <div class="section-title"><span class="icon">T</span> 隊伍管理 <span class="badge badge-accent">{{ data.teams.length }} / 10</span></div>
      <div class="card">
        <div class="form-group" style="display:flex;gap:8px;">
          <input v-model="newTeamName" class="form-control" placeholder="輸入隊伍名稱" style="flex:1;" @keydown.enter="addTeam">
          <button class="btn btn-primary" @click="addTeam">新增隊伍</button>
        </div>
        <div v-if="data.teams.length === 0" class="empty-state"><p>尚未新增任何隊伍</p></div>
        <div v-for="(team, ti) in data.teams" :key="team.id" class="card" style="padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="team-number">{{ ti + 1 }}</span>
              <input v-model="team.name" class="form-control" style="width:auto;display:inline-block;font-weight:700;padding:2px 8px;">
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" @click="persist(); showToast(team.name + ' 已儲存')">儲存名稱</button>
              <button class="btn btn-danger btn-sm" @click="removeTeam(team.id)">刪除隊伍</button>
            </div>
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;">選手名單（10 人，每 2 人為一組雙打）：</div>
          <div class="player-grid">
            <input
              v-for="p in 10" :key="p"
              v-model="team.players[p - 1]"
              class="player-input"
              :placeholder="'第' + (Math.floor((p-1)/2)+1) + '點 ' + ((p-1)%2===0?'A':'B')"
            >
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:8px;" @click="persist(); showToast(team.name + ' 選手已儲存')">儲存選手</button>
        </div>
      </div>
    </section>

    <!-- Groups -->
    <section v-show="tab === 'groups'" class="section active">
      <div class="section-title"><span class="icon">G</span> 小組分組</div>
      <div class="card">
        <div class="form-group" style="display:flex;gap:8px;align-items:flex-end;">
          <div style="flex:1;">
            <label>小組數量</label>
            <select v-model.number="groupCount" class="form-control">
              <option :value="2">2 組</option>
              <option :value="3">3 組</option>
              <option :value="4">4 組</option>
            </select>
          </div>
          <div style="flex:1;">
            <label>每組晉級人數</label>
            <select v-model.number="advanceCount" class="form-control">
              <option :value="1">每組 1 隊</option>
              <option :value="2">每組 2 隊</option>
              <option :value="3">每組 3 隊</option>
            </select>
          </div>
          <button class="btn btn-warning" @click="autoGroup">自動分組</button>
        </div>
      </div>
      <div class="group-config">
        <div v-for="(g, gi) in data.groups" :key="gi" class="group-card">
          <div class="group-card-title">{{ g.name }} <span class="badge badge-accent">{{ g.teamIds.length }} 隊</span></div>
          <div v-for="tid in g.teamIds" :key="tid" class="group-team-item">
            <span>{{ teamName(tid) }}</span>
            <button class="btn btn-danger btn-sm" @click="removeFromGroup(gi, tid)">移除</button>
          </div>
          <div v-if="availableTeams(gi).length" style="margin-top:8px;display:flex;gap:6px;">
            <select v-model.number="addToGroupSel[gi]" class="form-control" style="flex:1;">
              <option value="">選擇隊伍...</option>
              <option v-for="t in availableTeams(gi)" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <button class="btn btn-primary btn-sm" @click="addToGroup(gi)">加入</button>
          </div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <button class="btn btn-success" @click="saveGroupsAndGenerate">儲存分組並產生賽程</button>
      </div>
    </section>

    <!-- Group Matches -->
    <section v-show="tab === 'groupmatches'" class="section active">
      <div class="section-title"><span class="icon">M</span> 小組比賽成績</div>
      <div v-if="!data.groupMatches || !data.groupMatches.length" class="empty-state"><p>請先完成分組設定</p></div>
      <div v-for="(group, gi) in data.groups" :key="gi" class="card">
        <div class="card-title">{{ group.name }}</div>
        <GroupMatchEditor
          v-for="(m, mi) in getGroupMatches(gi)"
          :key="m.id"
          :match="m"
          :teams="data.teams"
          :uid="'gm_' + gi + '_' + mi"
          @save="saveTeamMatch(m)"
          @reset="resetTeamMatch(m)"
        />
      </div>
    </section>

    <!-- Knockout -->
    <section v-show="tab === 'knockout'" class="section active">
      <div class="section-title"><span class="icon">K</span> 淘汰賽</div>
      <div class="card">
        <div class="btn-group" style="margin-bottom:16px;">
          <button class="btn btn-primary" @click="addKnockoutRound">新增輪次</button>
          <button class="btn btn-warning" @click="autoKnockout">自動產生淘汰賽</button>
        </div>
      </div>
      <div v-if="!koRounds.length" class="empty-state"><p>尚未設定淘汰賽</p></div>
      <div v-for="(round, ri) in koRounds" :key="ri" class="knockout-round-card">
        <div class="knockout-round-header">
          <h3>{{ round.name }}</h3>
          <div class="btn-group">
            <button class="btn btn-primary btn-sm" @click="addKoMatch(ri)">新增比賽</button>
            <button class="btn btn-danger btn-sm" @click="deleteKoRound(ri)">刪除輪次</button>
          </div>
        </div>
        <KnockoutMatchEditor
          v-for="(m, mi) in round.matches"
          :key="m.id"
          :match="m"
          :teams="data.teams"
          :uid="'ko_' + ri + '_' + mi"
          @save="saveKoMatch(ri, mi)"
          @delete="deleteKoMatch(ri, mi)"
        />
      </div>
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
    <div class="container">乒乓球錦標賽管理系統</div>
  </footer>
</template>

<script setup>
import { ref, reactive, computed, provide, onMounted } from 'vue'
import { useFirestore } from '../composables/useFirestore'
import { useToast } from '../composables/useToast'
import {
  STORAGE_KEY, loadData, getDefaultData, getTeamName, getTeamById,
  nextTeamId, calculateStandings, createEmptyDoubles, generateRoundRobinMatches, recalcTeamScore,
} from '../lib/main-storage'
import GroupMatchEditor from '../components/GroupMatchEditor.vue'
import KnockoutMatchEditor from '../components/KnockoutMatchEditor.vue'

const { showToast } = useToast()
const { syncStatus, syncText, loadFromCloud, startListening, saveToCloud } = useFirestore(STORAGE_KEY)
provide('syncStatus', syncStatus)
provide('syncText', syncText)

const tab = ref('settings')
const data = reactive(loadData())
const form = reactive({
  name: '', date: '', location: '', rules: '',
  groupFormat: '五局三勝', knockoutFormat: '七局四勝',
})

function applyData(d) {
  Object.assign(data, d)
  const t = d.tournament
  form.name = t.name || ''
  form.date = t.date || ''
  form.location = t.location || ''
  form.rules = t.rules || ''
  form.groupFormat = t.groupFormat || '五局三勝'
  form.knockoutFormat = t.knockoutFormat || '七局四勝'
}

onMounted(async () => {
  const cloudData = await loadFromCloud()
  if (cloudData) applyData(cloudData)
  else applyData(loadData())
  startListening(() => {})
})

async function persist() { await saveToCloud(JSON.parse(JSON.stringify(data))) }

function teamName(id) { return getTeamName(data.teams, id) }

// ===== Settings =====
function saveSettings() {
  data.tournament.name = form.name.trim()
  data.tournament.date = form.date.trim()
  data.tournament.location = form.location.trim()
  data.tournament.rules = form.rules
  data.tournament.groupFormat = form.groupFormat
  data.tournament.knockoutFormat = form.knockoutFormat
  persist()
  showToast('設定已儲存')
}

// ===== Teams =====
const newTeamName = ref('')
function addTeam() {
  const name = newTeamName.value.trim()
  if (!name) return
  if (data.teams.length >= 10) { showToast('最多 10 支隊伍'); return }
  if (data.teams.some(t => t.name === name)) { showToast('名稱已存在'); return }
  data.teams.push({ id: nextTeamId(data.teams), name, players: ['','','','','','','','','',''] })
  persist(); newTeamName.value = ''
  showToast('已新增隊伍：' + name)
}
function removeTeam(id) {
  if (!confirm('確定刪除此隊伍？')) return
  data.teams = data.teams.filter(t => t.id !== id)
  data.groups.forEach(g => { g.teamIds = g.teamIds.filter(tid => tid !== id) })
  data.groupMatches = data.groupMatches.filter(m => m.team1Id !== id && m.team2Id !== id)
  persist(); showToast('隊伍已刪除')
}

// ===== Groups =====
const groupCount = ref(2)
const advanceCount = ref(2)
const addToGroupSel = reactive({})

function autoGroup() {
  if (data.teams.length < 2) { showToast('至少 2 支隊伍'); return }
  const shuffled = [...data.teams].sort(() => Math.random() - 0.5)
  const names = ['A','B','C','D','E','F']
  const groups = []
  for (let i = 0; i < groupCount.value; i++) {
    groups.push({ name: names[i] + ' 組', teamIds: [], advanceCount: advanceCount.value })
  }
  shuffled.forEach((t, i) => groups[i % groupCount.value].teamIds.push(t.id))
  data.groups = groups
  persist(); showToast('已自動分組')
}

function availableTeams(gi) {
  const group = data.groups[gi]
  return data.teams.filter(t => !group.teamIds.includes(t.id))
}
function removeFromGroup(gi, tid) {
  data.groups[gi].teamIds = data.groups[gi].teamIds.filter(id => id !== tid)
  persist()
}
function addToGroup(gi) {
  const tid = addToGroupSel[gi]
  if (!tid) return
  data.groups.forEach(g => { g.teamIds = g.teamIds.filter(id => id !== tid) })
  data.groups[gi].teamIds.push(tid)
  addToGroupSel[gi] = ''
  persist()
}
function saveGroupsAndGenerate() {
  data.groups.forEach(g => g.advanceCount = advanceCount.value)
  if (!data.groups.some(g => g.teamIds.length >= 2)) { showToast('每組至少 2 隊'); return }
  const existing = {}
  data.groupMatches.filter(m => m.completed).forEach(m => { existing[m.id] = m })
  const newM = []
  data.groups.forEach((g, gi) => {
    generateRoundRobinMatches(gi, g.teamIds).forEach(m => { newM.push(existing[m.id] || m) })
  })
  data.groupMatches = newM
  persist(); showToast('賽程已產生')
}

function getGroupMatches(gi) {
  return (data.groupMatches || []).filter(m => m.groupIndex === gi)
}

// ===== Group Match Save =====
function saveTeamMatch(m) {
  recalcTeamScore(m)
  persist(); showToast('成績已儲存')
}
function resetTeamMatch(m) {
  m.score1 = 0; m.score2 = 0; m.completed = false
  m.doubles = createEmptyDoubles()
  persist(); showToast('已重置')
}

// ===== Knockout =====
const koRounds = computed(() => (data.knockout && data.knockout.rounds) || [])

function addKnockoutRound() {
  const defaults = ['八強','準決賽','季軍戰','決賽']
  const name = prompt('輸入輪次名稱：', defaults[koRounds.value.length] || '輪次')
  if (!name) return
  if (!data.knockout) data.knockout = { rounds: [] }
  data.knockout.rounds.push({ name, matches: [] })
  persist()
}
function addKoMatch(ri) {
  data.knockout.rounds[ri].matches.push({
    id: 'k_' + ri + '_' + Date.now(),
    team1Id: null, team2Id: null, score1: 0, score2: 0,
    doubles: createEmptyDoubles(), completed: false,
  })
  persist()
}
function deleteKoRound(ri) {
  if (!confirm('刪除此輪次？')) return
  data.knockout.rounds.splice(ri, 1)
  persist()
}
function deleteKoMatch(ri, mi) {
  data.knockout.rounds[ri].matches.splice(mi, 1)
  persist()
}
function saveKoMatch(ri, mi) {
  const m = data.knockout.rounds[ri].matches[mi]
  recalcTeamScore(m)
  persist(); showToast('淘汰賽成績已儲存')
}

function autoKnockout() {
  if (!data.groups.length) { showToast('請先分組'); return }
  const qualified = []
  data.groups.forEach((g, gi) => {
    const st = calculateStandings(gi, g.teamIds, data.groupMatches)
    st.slice(0, g.advanceCount || 2).forEach((s, rank) => {
      qualified.push({ teamId: s.teamId, gi, rank })
    })
  })
  if (qualified.length < 2) { showToast('晉級隊伍不足'); return }
  const n = qualified.length
  const rounds = []
  const emptyD = () => createEmptyDoubles()

  if (n <= 2) {
    rounds.push({ name: '決賽', matches: [{ id:'k_f_1', team1Id: qualified[0]?.teamId, team2Id: qualified[1]?.teamId, score1:0, score2:0, doubles: emptyD(), completed:false }] })
  } else if (n <= 4) {
    const ga = qualified.filter(t => t.gi === 0), gb = qualified.filter(t => t.gi === 1)
    const sf = []
    if (ga.length >= 2 && gb.length >= 2) {
      sf.push({ id:'k_sf_1', team1Id: ga[0].teamId, team2Id: gb[1].teamId, score1:0, score2:0, doubles: emptyD(), completed:false })
      sf.push({ id:'k_sf_2', team1Id: gb[0].teamId, team2Id: ga[1].teamId, score1:0, score2:0, doubles: emptyD(), completed:false })
    }
    rounds.push({ name: '準決賽', matches: sf })
    rounds.push({ name: '季軍戰', matches: [{ id:'k_3rd_1', team1Id:null, team2Id:null, score1:0, score2:0, doubles: emptyD(), completed:false }] })
    rounds.push({ name: '決賽', matches: [{ id:'k_f_1', team1Id:null, team2Id:null, score1:0, score2:0, doubles: emptyD(), completed:false }] })
  } else {
    const qf = []
    for (let i = 0; i < n; i += 2) {
      if (i + 1 < n) qf.push({ id:'k_qf_'+(i/2+1), team1Id: qualified[i].teamId, team2Id: qualified[i+1].teamId, score1:0, score2:0, doubles: emptyD(), completed:false })
    }
    rounds.push({ name: '八強', matches: qf })
    const sfc = Math.ceil(qf.length / 2)
    const sfm = []
    for (let i = 0; i < sfc; i++) sfm.push({ id:'k_sf_'+(i+1), team1Id:null, team2Id:null, score1:0, score2:0, doubles: emptyD(), completed:false })
    rounds.push({ name: '準決賽', matches: sfm })
    rounds.push({ name: '季軍戰', matches: [{ id:'k_3rd_1', team1Id:null, team2Id:null, score1:0, score2:0, doubles: emptyD(), completed:false }] })
    rounds.push({ name: '決賽', matches: [{ id:'k_f_1', team1Id:null, team2Id:null, score1:0, score2:0, doubles: emptyD(), completed:false }] })
  }
  data.knockout.rounds = rounds
  persist(); showToast('淘汰賽已產生')
}

// ===== Share =====
const viewUrl = computed(() => window.location.origin + '/Matches/#/')
const adminUrl = computed(() => window.location.origin + '/Matches/#/admin')

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
  a.href = URL.createObjectURL(blob); a.download = (data.tournament.name || 'tournament') + '.json'; a.click()
  showToast('已匯出')
}
function importJson(e) {
  const f = e.target.files[0]; if (!f) return
  const r = new FileReader()
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result)
      if (d.tournament && d.teams) { applyData(d); persist(); showToast('已匯入') }
      else showToast('格式錯誤')
    } catch { showToast('匯入失敗') }
  }
  r.readAsText(f); e.target.value = ''
}
function resetAll() {
  if (!confirm('確定重置？')) return
  if (!confirm('真的確定？')) return
  applyData(getDefaultData()); persist(); showToast('已重置')
}
</script>

<style scoped>
.team-number {
  width: 28px; height: 28px; background: var(--accent-light); color: var(--accent);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700;
}
.player-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px; margin-top: 8px; }
.player-input {
  padding: 6px 10px; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: 4px; color: var(--text-primary); font-size: 0.85rem; font-family: inherit;
}
.player-input:focus { outline: none; border-color: var(--accent); }
.player-input::placeholder { color: var(--text-muted); }

.group-config { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.group-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
.group-card-title { font-size: 1rem; font-weight: 600; color: var(--accent); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.group-team-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }

.knockout-round-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.knockout-round-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.knockout-round-header h3 { color: var(--accent); font-size: 1rem; }

@media (max-width: 768px) {
  .player-grid { grid-template-columns: repeat(2, 1fr); }
  .group-config { grid-template-columns: 1fr; }
}
</style>
