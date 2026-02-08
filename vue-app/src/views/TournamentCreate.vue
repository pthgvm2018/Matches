<template>
  <div class="container" style="padding-top:24px;padding-bottom:40px;">
    <!-- 步驟指示器 -->
    <div class="steps-bar">
      <div v-for="(s, i) in stepLabels" :key="i"
           :class="['step-item', { active: step === i, done: step > i }]">
        <span class="step-num">{{ step > i ? '✓' : i + 1 }}</span>
        <span class="step-label">{{ s }}</span>
      </div>
    </div>

    <!-- Step 0: 基本資訊 -->
    <div v-if="step === 0" class="card">
      <div class="card-title">基本資訊</div>
      <div class="form-group">
        <label>賽事名稱 <span class="required">*必填</span></label>
        <input class="form-control" v-model="form.name" placeholder="例：2026 潮州乒乓球邀請賽"
               :class="{ 'input-error': step === 0 && !form.name.trim() && touched }">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>日期</label>
          <input class="form-control" type="date" v-model="form.date">
        </div>
        <div class="form-group">
          <label>地點</label>
          <input class="form-control" v-model="form.venue" placeholder="例：潮州國小地下室">
        </div>
      </div>
    </div>

    <!-- Step 1: 選擇項目與賽制 -->
    <div v-if="step === 1">
      <div class="card">
        <div class="card-title">選擇比賽項目</div>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">
          勾選本次賽事要舉辦的項目（可多選）
        </p>
        <div class="event-grid">
          <label v-for="preset in eventPresets" :key="preset.key"
                 :class="['event-option', { selected: selectedEvents.has(preset.key) }]">
            <input type="checkbox" :value="preset.key"
                   :checked="selectedEvents.has(preset.key)"
                   @change="toggleEvent(preset.key)">
            <span class="event-label">{{ preset.label }}</span>
            <span class="event-desc">{{ preset.desc }}</span>
          </label>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-title">選擇賽制</div>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">
          所有項目採用相同賽制（建立後可個別調整）
        </p>
        <div class="format-grid">
          <div v-for="f in formatPresets" :key="f.value"
               :class="['format-option', { selected: selectedFormat === f.value }]"
               @click="selectedFormat = f.value">
            <span class="format-icon">{{ f.icon }}</span>
            <span class="format-label">{{ f.label }}</span>
            <span class="format-desc">{{ f.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: 各項目設定 -->
    <div v-if="step === 2">
      <div v-for="(ev, idx) in events" :key="ev.id" class="card" style="margin-bottom:16px;">
        <div class="card-title">{{ ev.label }}
          <span class="badge badge-accent" style="margin-left:8px;">{{ formatLabel(ev.format) }}</span>
        </div>

        <!-- 每場局制 -->
        <div class="form-row">
          <div class="form-group">
            <label>{{ ev.format === 'group_knockout' ? '小組賽每場比賽' : '每場比賽' }}</label>
            <select class="form-control" v-model="ev.matchBestOf">
              <option v-for="b in bestOfOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
          </div>
          <div class="form-group" v-if="ev.format === 'group_knockout'">
            <label>淘汰賽每場比賽</label>
            <select class="form-control" v-model="ev.knockoutBestOf">
              <option v-for="b in bestOfOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
          </div>
        </div>

        <!-- 參賽者 -->
        <div class="form-group">
          <label>
            參賽{{ ev.type === 'team' ? '隊伍' : (ev.type === 'doubles' || ev.type === 'mixed_doubles' ? '組合' : '選手') }}
            <span class="badge badge-accent" style="margin-left:8px;">{{ ev.participants.length }}{{ ev.type === 'team' ? '隊' : '人' }}</span>
          </label>
          <textarea class="form-control" v-model="ev.participantText"
                    :placeholder="ev.type === 'team' ? '每行一隊，例：\n潮州隊\n屏東隊\n高雄隊' :
                                  (ev.type === 'doubles' || ev.type === 'mixed_doubles') ? '每行一組，例：\n王小明/李大華\n張三/李四' :
                                  '每行一位選手，例：\n王小明\n李大華\n張三'"
                    rows="6"
                    @input="parseParticipants(ev)"></textarea>
        </div>

        <!-- 人數相關的自動提示 -->
        <div v-if="ev.participants.length >= 2" class="format-info">
          <template v-if="ev.format === 'elimination'">
            <span class="badge badge-accent">籤表大小：{{ bracketSizeOf(ev.participants.length) }}</span>
            <span class="badge badge-yellow" v-if="byeCountOf(ev.participants.length) > 0">
              輪空：{{ byeCountOf(ev.participants.length) }}
            </span>
            <span class="badge badge-green">共 {{ bracketSizeOf(ev.participants.length) - 1 }} 場</span>
          </template>
          <template v-if="ev.format === 'round_robin'">
            <span class="badge badge-green">共 {{ ev.participants.length * (ev.participants.length - 1) / 2 }} 場</span>
          </template>
          <template v-if="ev.format === 'group_knockout'">
            <div style="margin-top:8px;">
              <div class="form-row">
                <div class="form-group">
                  <label>分組數</label>
                  <input class="form-control" type="number" min="2" max="16"
                         v-model.number="ev.numGroups">
                </div>
                <div class="form-group">
                  <label>每組晉級</label>
                  <input class="form-control" type="number" min="1" max="8"
                         v-model.number="ev.advancePerGroup">
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span class="badge badge-accent">{{ ev.numGroups }} 組，每組約 {{ Math.ceil(ev.participants.length / ev.numGroups) }} {{ ev.type === 'team' ? '隊' : '人' }}</span>
                <span class="badge badge-green">淘汰賽 {{ ev.numGroups * ev.advancePerGroup }} {{ ev.type === 'team' ? '隊' : '人' }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 團體賽專屬設定 -->
        <template v-if="ev.type === 'team'">
          <div class="form-group" style="margin-top:16px;">
            <label>每隊人數</label>
            <input class="form-control" type="number" min="2" max="20" v-model.number="ev.teamSize">
          </div>
          <div class="form-group">
            <label>團體賽對戰模式</label>
            <select class="form-control" v-model="ev.teamMatchFormat" @change="onTeamFormatChange(ev)">
              <option v-for="t in teamFormats" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div v-if="ev.teamMatchFormat !== 'custom'" class="format-info" style="margin-top:8px;">
            {{ getTeamFormatDesc(ev.teamMatchFormat) }}
          </div>

          <!-- 自訂場次 -->
          <div v-if="ev.teamMatchFormat === 'custom'" style="margin-top:12px;">
            <div class="form-group">
              <label>幾點幾勝</label>
              <div class="form-row">
                <div class="form-group">
                  <label>總點數</label>
                  <input class="form-control" type="number" min="1" max="15"
                         v-model.number="ev.customRubberCount">
                </div>
                <div class="form-group">
                  <label>勝點數</label>
                  <input class="form-control" type="number" min="1"
                         v-model.number="ev.pointsToWin">
                </div>
              </div>
            </div>
            <div v-for="(r, ri) in ev.customRubbers" :key="ri" class="rubber-item">
              <span>第{{ ri + 1 }}點</span>
              <select class="form-control" style="width:auto;" v-model="r.type">
                <option value="singles">單打</option>
                <option value="doubles">雙打</option>
                <option value="mixed_doubles">混雙</option>
              </select>
              <input class="form-control" style="flex:1;" v-model="r.label" :placeholder="`第${ri+1}點`">
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Step 3: 確認 -->
    <div v-if="step === 3" class="card">
      <div class="card-title">確認賽事設定</div>
      <div class="confirm-section">
        <h3>{{ form.name || '未命名賽事' }}</h3>
        <p style="color:var(--text-secondary);">{{ form.date }} &nbsp; {{ form.venue }}</p>
      </div>
      <div v-for="ev in events" :key="ev.id" class="confirm-event">
        <div class="confirm-event-title">{{ ev.label }}</div>
        <div class="confirm-details">
          <span class="badge badge-accent">{{ formatLabel(ev.format) }}</span>
          <span v-if="ev.format === 'group_knockout'" class="badge badge-green">小組{{ bestOfLabel(ev.matchBestOf) }}</span>
          <span v-if="ev.format === 'group_knockout'" class="badge badge-green">淘汰{{ bestOfLabel(ev.knockoutBestOf || ev.matchBestOf) }}</span>
          <span v-if="ev.format !== 'group_knockout'" class="badge badge-green">{{ bestOfLabel(ev.matchBestOf) }}</span>
          <span class="badge badge-yellow">{{ ev.participants.length }} {{ ev.type === 'team' ? '隊' : '人' }}</span>
          <span v-if="ev.type === 'team'" class="badge badge-accent">每隊 {{ ev.teamSize }} 人</span>
        </div>
        <div v-if="ev.format === 'group_knockout'" style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">
          {{ ev.numGroups }} 組，每組取 {{ ev.advancePerGroup }}，淘汰賽 {{ ev.numGroups * ev.advancePerGroup }} {{ ev.type === 'team' ? '隊' : '人' }}
        </div>
      </div>
    </div>

    <!-- 底部按鈕 -->
    <div class="wizard-actions">
      <button v-if="step > 0" class="btn btn-outline" @click="step--">上一步</button>
      <div style="flex:1;"></div>
      <button v-if="step < 3" class="btn btn-primary" @click="nextStep" :disabled="!canNext">
        下一步
      </button>
      <button v-if="step === 3" class="btn btn-warning" @click="submitSimulated" :disabled="submitting">
        {{ submitting ? '建立中...' : '模擬賽事結果' }}
      </button>
      <button v-if="step === 3" class="btn btn-success" @click="submit" :disabled="submitting">
        {{ submitting ? '建立中...' : '建立賽事' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FORMATS, BEST_OF_OPTIONS, TEAM_MATCH_FORMATS, TEAM_RUBBER_TEMPLATES, TEAM_NAMES,
  createTournament, createEvent, generateEventMatches, simulateEvent,
  bracketSize, byeCount, suggestGroups, uid, makeEventLabel, randomName,
} from '../lib/tournament.js'
import { createTournamentDoc } from '../composables/useTournaments.js'

const router = useRouter()

const step = ref(0)
const submitting = ref(false)
const stepLabels = ['基本資訊', '選擇項目', '項目設定', '確認建立']
const formats = FORMATS
const bestOfOptions = BEST_OF_OPTIONS
const teamFormats = TEAM_MATCH_FORMATS

// Step 0
const form = reactive({ name: '', date: '', venue: '' })
const touched = ref(false)

// Step 1
const selectedFormat = ref('elimination')
const formatPresets = [
  { value: 'elimination', label: '淘汰賽', desc: '輸一場即淘汰', icon: '🏆' },
  { value: 'round_robin', label: '循環賽', desc: '每位選手互相對戰', icon: '🔄' },
  { value: 'group_knockout', label: '分組循環＋淘汰', desc: '先分組循環，再進入淘汰賽', icon: '📊' },
]
const eventPresets = [
  { key: 'ms', label: '男子單打', desc: '男子 1v1', type: 'singles', gender: 'male' },
  { key: 'ws', label: '女子單打', desc: '女子 1v1', type: 'singles', gender: 'female' },
  { key: 'md', label: '男子雙打', desc: '男子 2v2', type: 'doubles', gender: 'male' },
  { key: 'wd', label: '女子雙打', desc: '女子 2v2', type: 'doubles', gender: 'female' },
  { key: 'xd', label: '混合雙打', desc: '男女各一 2v2', type: 'mixed_doubles', gender: 'mixed' },
  { key: 'mt', label: '男子團體', desc: '男子隊伍對抗', type: 'team', gender: 'male' },
  { key: 'wt', label: '女子團體', desc: '女子隊伍對抗', type: 'team', gender: 'female' },
  { key: 'xt', label: '混合團體', desc: '男女混合隊伍', type: 'team', gender: 'mixed' },
]
const selectedEvents = reactive(new Set())

function toggleEvent(key) {
  if (selectedEvents.has(key)) selectedEvents.delete(key)
  else selectedEvents.add(key)
}

// Step 2 - 各項目的設定
const events = ref([])

watch(step, (val) => {
  if (val === 2) buildEvents()
})

function buildEvents() {
  // 根據 selectedEvents 建立 event 物件（保留已有的）
  const existing = new Map(events.value.map(e => [e.presetKey, e]))
  const result = []
  let teamNameIdx = 0
  for (const preset of eventPresets) {
    if (!selectedEvents.has(preset.key)) continue
    if (existing.has(preset.key)) {
      // 更新既有 event 的 format 為最新選擇
      const ev = existing.get(preset.key)
      ev.format = selectedFormat.value
      if (selectedFormat.value === 'group_knockout' && !ev.knockoutBestOf) {
        ev.knockoutBestOf = ev.matchBestOf || 5
      }
      result.push(ev)
    } else {
      const fmt = selectedFormat.value
      const defaultTeamSize = preset.type === 'team' ? 10 : undefined
      const ev = reactive({
        ...createEvent({
          type: preset.type,
          gender: preset.gender,
          format: fmt,
          matchBestOf: 5,
          knockoutBestOf: fmt === 'group_knockout' ? 5 : undefined,
          teamSize: defaultTeamSize,
          teamMatchFormat: preset.type === 'team' ? 'swaythling' : undefined,
        }),
        presetKey: preset.key,
        participantText: '',
        numGroups: 2,
        advancePerGroup: 2,
        customRubberCount: 5,
        customRubbers: Array.from({ length: 5 }, (_, i) => ({
          order: i + 1, type: 'singles', label: `第${i + 1}點`,
        })),
      })

      // 團體賽：自動填入 10 隊，隊伍一～隊伍十，每隊選手自動產生
      if (preset.type === 'team') {
        const demoCount = 10
        const teamNames = []
        const usedNames = new Set()
        const cnNum = ['一','二','三','四','五','六','七','八','九','十']
        for (let t = 0; t < demoCount; t++) {
          const tName = `隊伍${cnNum[t] || (t + 1)}`
          teamNames.push(tName)
          const players = []
          for (let j = 0; j < (defaultTeamSize || 10); j++) {
            let name
            do { name = randomName() } while (usedNames.has(name))
            usedNames.add(name)
            players.push(name)
          }
          ev.participants.push({ id: uid(), name: tName, seed: t + 1, players })
        }
        ev.participantText = teamNames.join('\n')
      }

      result.push(ev)
    }
  }
  events.value = result
}

function parseParticipants(ev) {
  const lines = ev.participantText.split('\n').map(l => l.trim()).filter(Boolean)
  // 保留已存在的隊伍資料（依名稱比對）
  const existingMap = new Map(ev.participants.map(p => [p.name, p]))
  const teamSize = ev.teamSize || 6
  const usedNames = new Set()
  // 收集已使用的選手名字
  for (const p of ev.participants) {
    for (const name of (p.players || [])) { if (name) usedNames.add(name) }
  }

  ev.participants = lines.map((name, i) => {
    const existing = existingMap.get(name)
    if (existing) {
      existing.seed = i + 1
      return existing
    }
    const p = { id: uid(), name, seed: i + 1 }
    if (ev.type === 'team') {
      // 新隊伍自動填入選手名字
      p.players = []
      for (let j = 0; j < teamSize; j++) {
        let pName
        do { pName = randomName() } while (usedNames.has(pName))
        usedNames.add(pName)
        p.players.push(pName)
      }
    }
    return p
  })

  // 自動更新分組建議
  if (ev.format === 'group_knockout' && ev.participants.length >= 2) {
    const s = suggestGroups(ev.participants.length)
    ev.numGroups = s.groups
    ev.advancePerGroup = s.advance
  }
}

// 當格式改為 group_knockout 時，自動初始化 knockoutBestOf
watch(() => events.value.map(e => e.format), () => {
  for (const ev of events.value) {
    if (ev.format === 'group_knockout' && !ev.knockoutBestOf) {
      ev.knockoutBestOf = ev.matchBestOf || 5
    }
  }
}, { deep: true })

// 監聽自訂場次數量變化
watch(() => events.value.map(e => e.customRubberCount), () => {
  for (const ev of events.value) {
    if (ev.type !== 'team' || ev.teamMatchFormat !== 'custom') continue
    const count = ev.customRubberCount || 5
    while (ev.customRubbers.length < count) {
      ev.customRubbers.push({ order: ev.customRubbers.length + 1, type: 'singles', label: `第${ev.customRubbers.length + 1}點` })
    }
    while (ev.customRubbers.length > count) {
      ev.customRubbers.pop()
    }
  }
}, { deep: true })

function onTeamFormatChange(ev) {
  if (ev.teamMatchFormat !== 'custom') {
    const tmpl = TEAM_RUBBER_TEMPLATES[ev.teamMatchFormat]
    if (tmpl) {
      ev.pointsToWin = tmpl.pointsToWin
    }
  }
}

function getTeamFormatDesc(fmt) {
  const tmpl = TEAM_RUBBER_TEMPLATES[fmt]
  return tmpl ? tmpl.description : ''
}

// helpers
const bracketSizeOf = bracketSize
const byeCountOf = byeCount

function formatLabel(f) { return FORMATS.find(x => x.value === f)?.label || f }
function bestOfLabel(b) { return BEST_OF_OPTIONS.find(x => x.value === b)?.label || `${b}局` }

// Navigation
const canNext = computed(() => {
  if (step.value === 0) return form.name.trim().length > 0
  if (step.value === 1) return selectedEvents.size > 0 && !!selectedFormat.value
  if (step.value === 2) return events.value.every(e => e.participants.length >= 2)
  return true
})

function nextStep() {
  touched.value = true
  if (!canNext.value) return
  touched.value = false
  step.value++
}

// Submit with simulation
async function submitSimulated() {
  submitting.value = true
  try {
    const t = buildTournament()
    for (const ev of t.events) {
      simulateEvent(ev)
    }
    await createTournamentDoc(t)
    router.push(`/admin/t/${t.id}`)
  } catch (e) {
    console.error('模擬建立失敗:', e)
    alert('模擬建立失敗：' + e.message)
  } finally {
    submitting.value = false
  }
}

// Build tournament object from form data
function buildTournament() {
  const t = createTournament(form.name, form.date, form.venue)

  for (const ev of events.value) {
    const config = {}
    if (ev.format === 'group_knockout') {
      config.numGroups = ev.numGroups
      config.advancePerGroup = ev.advancePerGroup
    }
    if (ev.type === 'team' && ev.teamMatchFormat === 'custom') {
      ev.rubbers = ev.customRubbers.map((r, i) => ({
        order: i + 1, type: r.type, label: r.label,
      }))
    }
    generateEventMatches(ev, config)

    const clean = { ...ev }
    delete clean.participantText
    delete clean.presetKey
    delete clean.numGroups
    // 注意：advancePerGroup 由 generateEventMatches 設定，不可刪除
    delete clean.customRubberCount
    delete clean.customRubbers
    t.events.push(clean)
  }
  return t
}

// Submit
async function submit() {
  submitting.value = true
  try {
    const t = buildTournament()
    await createTournamentDoc(t)
    router.push(`/t/${t.id}`)
  } catch (e) {
    console.error('建立失敗:', e)
    alert('建立失敗：' + e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.steps-bar {
  display: flex; justify-content: center; gap: 4px; margin-bottom: 24px;
}
.step-item {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  color: var(--text-muted); font-size: 0.85rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.step-item.active { color: var(--accent); border-bottom-color: var(--accent); }
.step-item.done { color: var(--green); }
.step-num {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700;
  background: var(--bg-secondary); border: 1px solid var(--border);
}
.step-item.active .step-num { background: var(--accent); color: #fff; border-color: var(--accent); }
.step-item.done .step-num { background: var(--green); color: #fff; border-color: var(--green); }

.event-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
}
.format-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.format-option {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px 12px; border: 2px solid var(--border); border-radius: var(--radius);
  background: var(--bg-secondary); cursor: pointer; transition: all 0.2s;
  text-align: center;
}
.format-option:hover { border-color: var(--accent); }
.format-option.selected { border-color: var(--accent); background: var(--accent-light); }
.format-icon { font-size: 1.5rem; }
.format-label { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
.format-desc { font-size: 0.8rem; color: var(--text-secondary); }
.event-option {
  display: flex; flex-direction: column; gap: 4px;
  padding: 16px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--bg-secondary); cursor: pointer; transition: all 0.2s;
}
.event-option:hover { border-color: var(--accent); }
.event-option.selected { border-color: var(--accent); background: var(--accent-light); }
.event-option input { display: none; }
.event-label { font-weight: 600; color: var(--text-primary); }
.event-desc { font-size: 0.8rem; color: var(--text-secondary); }

.format-info {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;
  font-size: 0.85rem; color: var(--text-secondary);
}

.rubber-item {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  font-size: 0.85rem; color: var(--text-secondary);
}

.wizard-actions {
  display: flex; gap: 12px; margin-top: 24px; padding: 16px 0;
  border-top: 1px solid var(--border);
}

.confirm-section h3 { font-size: 1.3rem; color: #fff; margin-bottom: 4px; }
.confirm-event {
  padding: 12px 0; border-bottom: 1px solid var(--border);
}
.confirm-event:last-child { border-bottom: none; }
.confirm-event-title { font-weight: 600; color: var(--accent); margin-bottom: 6px; }
.confirm-details { display: flex; gap: 8px; flex-wrap: wrap; }

.required { color: var(--red); font-size: 0.8rem; font-weight: 400; }
.input-error { border-color: var(--red) !important; }
.btn:disabled {
  opacity: 0.4; cursor: not-allowed; transform: none !important;
}

@media (max-width: 768px) {
  .event-grid { grid-template-columns: 1fr 1fr; }
  .format-grid { grid-template-columns: 1fr; }
  .steps-bar { flex-wrap: wrap; }
  .step-label { display: none; }
}
</style>
