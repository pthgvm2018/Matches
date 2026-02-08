// ===== 賽事資料模型與工具函式 =====
// Firestore 不支援巢狀陣列，因此：
// - bracket.rounds: [{matches: [...]}, ...] 而非 [[...], ...]
// - match.scores: [{a:11, b:5}, ...] 而非 [[11,5], ...]

// --- 常數 ---
export const EVENT_TYPES = [
  { value: 'singles', label: '單打' },
  { value: 'doubles', label: '雙打' },
  { value: 'mixed_doubles', label: '混合雙打' },
  { value: 'team', label: '團體' },
]

export const GENDERS = [
  { value: 'male', label: '男子' },
  { value: 'female', label: '女子' },
  { value: 'mixed', label: '混合' },
]

export const FORMATS = [
  { value: 'elimination', label: '單淘汰' },
  { value: 'round_robin', label: '循環賽' },
  { value: 'group_knockout', label: '分組循環＋淘汰' },
]

export const BEST_OF_OPTIONS = [
  { value: 3, label: '三局兩勝' },
  { value: 5, label: '五局三勝' },
  { value: 7, label: '七局四勝' },
]

export const TEAM_MATCH_FORMATS = [
  { value: 'swaythling', label: '全單打（Swaythling 世錦賽制）' },
  { value: 'olympic', label: '單打＋雙打（奧運制）' },
  { value: 'custom', label: '自訂場次組合' },
]

// --- 預設團體賽場次模板 ---
export const TEAM_RUBBER_TEMPLATES = {
  swaythling: {
    description: '5點3勝：A-X, B-Y, C-Z, A-Y, B-X',
    pointsToWin: 3,
    rubbers: [
      { order: 1, type: 'singles', label: '第一點 A-X' },
      { order: 2, type: 'singles', label: '第二點 B-Y' },
      { order: 3, type: 'singles', label: '第三點 C-Z' },
      { order: 4, type: 'singles', label: '第四點 A-Y' },
      { order: 5, type: 'singles', label: '第五點 B-X' },
    ],
  },
  olympic: {
    description: '5點3勝：1雙打 + 4單打',
    pointsToWin: 3,
    rubbers: [
      { order: 1, type: 'doubles', label: '第一點 雙打' },
      { order: 2, type: 'singles', label: '第二點 單打' },
      { order: 3, type: 'singles', label: '第三點 單打' },
      { order: 4, type: 'singles', label: '第四點 單打' },
      { order: 5, type: 'singles', label: '第五點 單打' },
    ],
  },
}

// --- 產生事件標籤 ---
export function makeEventLabel(gender, type) {
  const g = GENDERS.find(x => x.value === gender)?.label || ''
  const t = EVENT_TYPES.find(x => x.value === type)?.label || ''
  if (type === 'mixed_doubles') return '混合雙打'
  if (type === 'team') return g ? `${g}團體` : '團體'
  return `${g}${t}`
}

// --- 產生唯一 ID ---
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ===== 淘汰賽 =====

export function bracketSize(n) {
  if (n <= 1) return 1
  let s = 1
  while (s < n) s *= 2
  return s
}

export function byeCount(n) {
  return bracketSize(n) - n
}

export function seedOrder(size) {
  if (size === 1) return [0]
  const half = seedOrder(size / 2)
  return half.reduce((acc, pos) => {
    acc.push(pos * 2)
    acc.push(pos * 2 + 1)
    return acc
  }, [])
}

// 產生淘汰賽賽程
// 回傳 { size, rounds: [{matches: [...]}, ...] }
export function generateBracket(participants) {
  const n = participants.length
  if (n === 0) return { size: 0, rounds: [] }

  const size = bracketSize(n)
  const totalRounds = Math.log2(size)
  const order = seedOrder(size)

  const slots = new Array(size).fill(null)
  const sorted = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999))
  for (let i = 0; i < sorted.length; i++) {
    slots[order[i]] = sorted[i]
  }

  const rounds = []
  const firstRoundMatches = []
  for (let i = 0; i < size; i += 2) {
    const p1 = slots[i]
    const p2 = slots[i + 1]
    const isBye = !p1 || !p2
    firstRoundMatches.push({
      id: uid(),
      p1: p1 || null,
      p2: p2 || null,
      isBye,
      winner: isBye ? (p1 || p2) : null,
      scores: [],
    })
  }
  rounds.push({ matches: firstRoundMatches })

  let prevCount = firstRoundMatches.length
  for (let r = 1; r < totalRounds; r++) {
    const roundMatches = []
    for (let i = 0; i < prevCount / 2; i++) {
      roundMatches.push({
        id: uid(),
        p1: null,
        p2: null,
        isBye: false,
        winner: null,
        scores: [],
      })
    }
    rounds.push({ matches: roundMatches })
    prevCount = roundMatches.length
  }

  if (rounds.length > 1) {
    propagateByes(rounds)
  }

  return { size, rounds }
}

function propagateByes(rounds) {
  for (let r = 0; r < rounds.length - 1; r++) {
    const curMatches = rounds[r].matches
    const nextMatches = rounds[r + 1].matches
    for (let i = 0; i < curMatches.length; i++) {
      const match = curMatches[i]
      if (match.winner) {
        const nextIdx = Math.floor(i / 2)
        if (i % 2 === 0) {
          nextMatches[nextIdx].p1 = match.winner
        } else {
          nextMatches[nextIdx].p2 = match.winner
        }
      }
    }
  }
}

export function setBracketWinner(rounds, roundIdx, matchIdx, winner) {
  const match = rounds[roundIdx].matches[matchIdx]
  match.winner = winner

  if (roundIdx < rounds.length - 1) {
    const nextIdx = Math.floor(matchIdx / 2)
    const nextMatch = rounds[roundIdx + 1].matches[nextIdx]
    if (matchIdx % 2 === 0) {
      nextMatch.p1 = winner
    } else {
      nextMatch.p2 = winner
    }
  }
}

// ===== 循環賽 =====

export function generateRoundRobin(participants) {
  const n = participants.length
  const matches = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        id: uid(),
        p1: participants[i],
        p2: participants[j],
        winner: null,
        scores: [], // [{a:11, b:9}, {a:8, b:11}, ...]
      })
    }
  }
  return matches
}

// 計算循環賽積分榜
export function calculateRoundRobinStandings(participants, matches) {
  const stats = {}
  for (const p of participants) {
    stats[p.id] = {
      participant: p,
      wins: 0, losses: 0, matchesPlayed: 0,
      gamesWon: 0, gamesLost: 0,
      pointsWon: 0, pointsLost: 0,
      rankPoints: 0,
    }
  }

  for (const m of matches) {
    if (!m.winner) continue
    const s1 = stats[m.p1.id]
    const s2 = stats[m.p2.id]
    if (!s1 || !s2) continue

    s1.matchesPlayed++
    s2.matchesPlayed++

    if (m.winner.id === m.p1.id) {
      s1.wins++; s1.rankPoints += 2
      s2.losses++; s2.rankPoints += 1
    } else {
      s2.wins++; s2.rankPoints += 2
      s1.losses++; s1.rankPoints += 1
    }

    for (const game of (m.scores || [])) {
      s1.gamesWon += (game.a > game.b ? 1 : 0)
      s1.gamesLost += (game.a < game.b ? 1 : 0)
      s2.gamesWon += (game.a < game.b ? 1 : 0)
      s2.gamesLost += (game.a > game.b ? 1 : 0)
      s1.pointsWon += game.a
      s1.pointsLost += game.b
      s2.pointsWon += game.b
      s2.pointsLost += game.a
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.rankPoints !== a.rankPoints) return b.rankPoints - a.rankPoints
    if (b.wins !== a.wins) return b.wins - a.wins
    const gdA = a.gamesWon - a.gamesLost
    const gdB = b.gamesWon - b.gamesLost
    if (gdB !== gdA) return gdB - gdA
    const pdA = a.pointsWon - a.pointsLost
    const pdB = b.pointsWon - b.pointsLost
    return pdB - pdA
  })
}

// ===== 分組循環 + 淘汰 =====

export function suggestGroups(n) {
  if (n <= 4) return { groups: 1, perGroup: n, advance: Math.min(2, n) }
  if (n <= 6) return { groups: 2, perGroup: Math.ceil(n / 2), advance: 2 }
  if (n <= 8) return { groups: 2, perGroup: Math.ceil(n / 2), advance: 2 }
  if (n <= 12) return { groups: 3, perGroup: Math.ceil(n / 3), advance: 2 }
  if (n <= 16) return { groups: 4, perGroup: Math.ceil(n / 4), advance: 2 }
  if (n <= 24) return { groups: 4, perGroup: Math.ceil(n / 4), advance: 4 }
  if (n <= 32) return { groups: 8, perGroup: Math.ceil(n / 8), advance: 2 }
  return { groups: 8, perGroup: Math.ceil(n / 8), advance: 4 }
}

export function snakeSeed(participants, numGroups) {
  const sorted = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999))
  const groups = Array.from({ length: numGroups }, () => [])
  sorted.forEach((p, i) => {
    const round = Math.floor(i / numGroups)
    const idx = i % numGroups
    const groupIdx = round % 2 === 0 ? idx : (numGroups - 1 - idx)
    groups[groupIdx].push(p)
  })
  return groups
}

export function generateGroupKnockout(participants, numGroups, advancePerGroup) {
  const grouped = snakeSeed(participants, numGroups)
  const groups = grouped.map((members, i) => ({
    id: uid(),
    name: String.fromCharCode(65 + i),
    participants: members,
    matches: generateRoundRobin(members),
  }))

  const knockoutSize = numGroups * advancePerGroup
  const knockoutPlaceholders = Array.from({ length: knockoutSize }, (_, i) => ({
    id: `placeholder_${i}`,
    name: `晉級者 ${i + 1}`,
    seed: i + 1,
  }))
  const bracket = generateBracket(knockoutPlaceholders)
  return { groups, bracket, advancePerGroup }
}

// ===== 團體賽 =====

// 為團體賽的比賽附加各點 (rubber) 模板
function attachRubberResults(matches, rubbers) {
  for (const m of matches) {
    if (m.isBye || m.rubberResults) continue
    m.rubberResults = rubbers.map(r => ({
      order: r.order, label: r.label, type: r.type,
      p1Name: '', p2Name: '',
      winner: null, scores: [],
    }))
    m.teamScore = { a: 0, b: 0 }
  }
}

export function attachRubbersToEvent(event) {
  let rubbers = event.rubbers || []
  // 如果沒有 rubbers 模板，自動補上預設模板（swaythling 5點3勝）
  if (!rubbers.length) {
    const fmt = event.teamMatchFormat || 'swaythling'
    const tmpl = TEAM_RUBBER_TEMPLATES[fmt] || TEAM_RUBBER_TEMPLATES.swaythling
    event.rubbers = tmpl.rubbers
    if (!event.pointsToWin) event.pointsToWin = tmpl.pointsToWin
    rubbers = event.rubbers
  }
  if (event.roundRobinMatches) {
    attachRubberResults(event.roundRobinMatches, rubbers)
  }
  if (event.groups) {
    for (const g of event.groups) attachRubberResults(g.matches, rubbers)
  }
  if (event.bracket?.rounds) {
    for (const r of event.bracket.rounds) attachRubberResults(r.matches, rubbers)
  }
}

// ===== 建立空白賽事 =====

export function createEvent(config) {
  const { type, gender, format, matchBestOf, teamSize, teamMatchFormat, teamBestOf, customRubbers } = config
  const event = {
    id: uid(), type, gender,
    label: makeEventLabel(gender, type),
    format, matchBestOf: matchBestOf || 5,
    participants: [],
    groups: null, bracket: null, roundRobinMatches: null, advancePerGroup: null,
  }
  if (type === 'team') {
    event.teamSize = teamSize || 3
    event.teamMatchFormat = teamMatchFormat || 'swaythling'
    event.teamBestOf = teamBestOf || 5
    if (teamMatchFormat === 'custom' && customRubbers) {
      event.rubbers = customRubbers
    } else {
      const tmpl = TEAM_RUBBER_TEMPLATES[teamMatchFormat || 'swaythling']
      event.rubbers = tmpl ? tmpl.rubbers : []
      event.pointsToWin = tmpl ? tmpl.pointsToWin : 3
    }
  }
  return event
}

export function createTournament(name, date, venue) {
  return { id: uid(), name, date, venue, events: [], createdAt: Date.now() }
}

export function generateEventMatches(event, config = {}) {
  const n = event.participants.length
  if (n < 2) return event
  if (event.format === 'elimination') {
    event.bracket = generateBracket(event.participants)
  } else if (event.format === 'round_robin') {
    event.roundRobinMatches = generateRoundRobin(event.participants)
  } else if (event.format === 'group_knockout') {
    const numGroups = config.numGroups || suggestGroups(n).groups
    const advance = config.advancePerGroup || suggestGroups(n).advance
    const gk = generateGroupKnockout(event.participants, numGroups, advance)
    event.groups = gk.groups
    event.bracket = gk.bracket
    event.advancePerGroup = advance
  }
  // 團體賽：為所有比賽附加各點模板
  if (event.type === 'team') {
    attachRubbersToEvent(event)
  }
  return event
}

// ===== 模擬賽事結果 =====

const SURNAMES = ['王','李','張','劉','陳','楊','趙','黃','周','吳','徐','孫','林','馬','高','胡','鄭','郭','何','羅']
const GIVEN_NAMES = ['大明','志強','建華','文傑','俊宏','家豪','振偉','彥廷','冠宇','柏翰','宗穎','建志','家銘','國強','明哲','承恩','浩然','宇翔','雅婷','怡君','佳蓉','淑芬','雅琪','惠如','詩涵','欣怡','靜宜','心怡','婉婷','雅文']
export const TEAM_NAMES = ['龍騰','鳳翔','虎嘯','豹躍','鷹揚','獅吼','熊霸','鶴舞','麒麟','玄武','朱雀','青龍','白虎','天狼','飛鷹','雷霆','烈焰','蒼穹','銀河','北斗']

export function randomName() {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] +
         GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)]
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 為團體賽填入隊伍名稱與選手名單
function populateTeamRosters(event) {
  if (event.type !== 'team') return

  const teamSize = event.teamSize || 10
  const usedNames = new Set()
  const availableTeamNames = [...TEAM_NAMES].sort(() => Math.random() - 0.5)

  // 收集所有參賽者（可能在 participants、groups、bracket 中）
  const allParticipants = new Map()
  function collect(p) { if (p && !allParticipants.has(p.id)) allParticipants.set(p.id, p) }

  for (const p of (event.participants || [])) collect(p)
  for (const g of (event.groups || [])) {
    for (const p of (g.participants || [])) collect(p)
    for (const m of (g.matches || [])) { collect(m.p1); collect(m.p2) }
  }
  for (const round of (event.bracket?.rounds || [])) {
    for (const m of (round.matches || [])) { collect(m.p1); collect(m.p2) }
  }
  for (const m of (event.roundRobinMatches || [])) { collect(m.p1); collect(m.p2) }

  let teamIdx = 0
  for (const [id, p] of allParticipants) {
    // 填入隊名（如果是預設名稱）
    if (!p.name || /^隊伍/.test(p.name)) {
      p.name = teamIdx < availableTeamNames.length ? availableTeamNames[teamIdx] : `隊伍${teamIdx + 1}`
    }
    teamIdx++

    // 填入選手名單
    if (!p.players) p.players = []
    while (p.players.length < teamSize) p.players.push('')
    for (let i = 0; i < p.players.length; i++) {
      if (!p.players[i]) {
        let name
        do { name = randomName() } while (usedNames.has(name))
        usedNames.add(name)
        p.players[i] = name
      }
    }
  }

  // 同步：match.p1/p2 可能是 shallow copy，需要同步 name 和 players
  function syncMatch(m) {
    if (!m) return
    for (const side of ['p1', 'p2']) {
      if (m[side] && allParticipants.has(m[side].id)) {
        const src = allParticipants.get(m[side].id)
        m[side].name = src.name
        m[side].players = src.players
      }
    }
  }
  for (const g of (event.groups || [])) {
    for (const gp of (g.participants || [])) {
      if (allParticipants.has(gp.id)) {
        const src = allParticipants.get(gp.id)
        gp.name = src.name
        gp.players = src.players
      }
    }
    for (const m of (g.matches || [])) syncMatch(m)
  }
  for (const round of (event.bracket?.rounds || [])) {
    for (const m of (round.matches || [])) syncMatch(m)
  }
  for (const m of (event.roundRobinMatches || [])) syncMatch(m)
}

// 產生一局擬真桌球比分 (11分制, deuce 需贏兩分)
function simulateGameScore(pWin = 0.55) {
  let a = 0, b = 0
  while (true) {
    if (a >= 11 && a - b >= 2) return { a, b }
    if (b >= 11 && b - a >= 2) return { a, b }
    if (Math.random() < pWin) a++; else b++
  }
}

// 根據種子差距計算 p1 勝率
function seedWinProb(p1, p2) {
  const s1 = p1?.seed || 50
  const s2 = p2?.seed || 50
  const diff = s2 - s1
  return 0.5 + Math.min(Math.max(diff * 0.02, -0.15), 0.15)
}

// 模擬一場個人賽 (bestOf 局)
function simulateMatch(match, bestOf) {
  if (!match.p1 || !match.p2 || match.isBye) return

  const pWin = seedWinProb(match.p1, match.p2)
  const toWin = Math.ceil(bestOf / 2)
  let w1 = 0, w2 = 0
  const scores = []

  while (w1 < toWin && w2 < toWin) {
    const gamePWin = pWin + (Math.random() - 0.5) * 0.2
    const game = simulateGameScore(Math.min(Math.max(gamePWin, 0.3), 0.7))
    scores.push(game)
    if (game.a > game.b) w1++; else w2++
  }

  match.scores = scores
  match.winner = w1 > w2 ? match.p1 : match.p2
}

// 模擬一場團體賽 (各點逐點模擬)
function simulateTeamMatch(match, event) {
  if (!match.p1 || !match.p2 || match.isBye) return

  const rubbers = match.rubberResults || []
  const ptw = event.pointsToWin || 3
  const bestOf = event.matchBestOf || 5
  let s1 = 0, s2 = 0

  // 從隊伍名單中取選手（有填的優先）
  const t1p = (match.p1.players || []).filter(p => p)
  const t2p = (match.p2.players || []).filter(p => p)
  const used1 = new Set(), used2 = new Set()

  function pickPlayer(team, usedSet) {
    const available = team.filter((_, i) => !usedSet.has(i))
    if (available.length > 0) {
      const idx = team.indexOf(available[Math.floor(Math.random() * available.length)])
      usedSet.add(idx)
      return team[idx]
    }
    return randomName()
  }

  for (const rubber of rubbers) {
    // 已分出勝負的點不再比賽
    if (s1 >= ptw || s2 >= ptw) {
      rubber.scores = []
      rubber.winner = null
      rubber.p1Name = ''
      rubber.p2Name = ''
      continue
    }

    // 從名單中選出選手
    const isDoubles = rubber.type === 'doubles' || rubber.type === 'mixed_doubles'
    if (isDoubles) {
      rubber.p1Name = pickPlayer(t1p, used1) + ' / ' + pickPlayer(t1p, used1)
      rubber.p2Name = pickPlayer(t2p, used2) + ' / ' + pickPlayer(t2p, used2)
    } else {
      rubber.p1Name = pickPlayer(t1p, used1)
      rubber.p2Name = pickPlayer(t2p, used2)
    }

    // 模擬各局比分
    const pWin = 0.5 + (Math.random() - 0.5) * 0.3
    const toWin = Math.ceil(bestOf / 2)
    let w1 = 0, w2 = 0
    rubber.scores = []

    while (w1 < toWin && w2 < toWin) {
      const gp = pWin + (Math.random() - 0.5) * 0.15
      const g = simulateGameScore(Math.min(Math.max(gp, 0.3), 0.7))
      rubber.scores.push(g)
      if (g.a > g.b) w1++; else w2++
    }

    rubber.winner = w1 > w2 ? 1 : 2
    if (w1 > w2) s1++; else s2++
  }

  match.teamScore = { a: s1, b: s2 }
  match.winner = s1 > s2 ? match.p1 : match.p2
  match.scores = [] // 團體賽不使用 match.scores
}

// 模擬循環賽
function simulateRoundRobinMatches(matches, bestOf, isTeam, event) {
  for (const m of matches) {
    if (isTeam) simulateTeamMatch(m, event)
    else simulateMatch(m, bestOf)
  }
}

// 模擬淘汰賽 (含自動晉級傳播)
function simulateEliminationRounds(rounds, bestOf, isTeam, event) {
  for (let r = 0; r < rounds.length; r++) {
    const curMatches = rounds[r].matches
    for (let i = 0; i < curMatches.length; i++) {
      const match = curMatches[i]
      if (!match.isBye && match.p1 && match.p2) {
        // 團體賽淘汰賽的比賽也需要 rubberResults
        if (isTeam && !match.rubberResults) {
          const rubbers = event.rubbers || []
          match.rubberResults = rubbers.map(rb => ({
            order: rb.order, label: rb.label, type: rb.type,
            p1Name: '', p2Name: '', winner: null, scores: [],
          }))
          match.teamScore = { a: 0, b: 0 }
        }
        if (isTeam) simulateTeamMatch(match, event)
        else simulateMatch(match, bestOf)
      }
      // 傳播勝者到下一輪
      if (match.winner && r < rounds.length - 1) {
        const nextIdx = Math.floor(i / 2)
        const nextMatch = rounds[r + 1].matches[nextIdx]
        if (i % 2 === 0) nextMatch.p1 = match.winner
        else nextMatch.p2 = match.winner
      }
    }
  }
}

// 模擬整個項目
export function simulateEvent(event) {
  const bestOf = event.matchBestOf || 5
  const isTeam = event.type === 'team'

  // 團體賽：先填入隊名和選手名單
  if (isTeam) populateTeamRosters(event)

  if (event.format === 'round_robin') {
    simulateRoundRobinMatches(event.roundRobinMatches || [], bestOf, isTeam, event)

  } else if (event.format === 'elimination') {
    if (event.bracket?.rounds) {
      simulateEliminationRounds(event.bracket.rounds, bestOf, isTeam, event)
    }

  } else if (event.format === 'group_knockout') {
    // 1. 模擬各組循環賽
    for (const group of (event.groups || [])) {
      simulateRoundRobinMatches(group.matches, bestOf, isTeam, event)
    }

    // 2. 晉級：各組前 N 名進入淘汰賽
    const promoted = []
    const standingsFn = isTeam ? calculateTeamStandings : calculateRoundRobinStandings
    for (const group of (event.groups || [])) {
      const standings = standingsFn(group.participants, group.matches)
      const advance = event.advancePerGroup || 2
      for (let i = 0; i < advance && i < standings.length; i++) {
        promoted.push({
          ...standings[i].participant,
          seed: promoted.length + 1,
        })
      }
    }

    // 3. 用實際晉級者重新產生淘汰賽並模擬
    if (promoted.length >= 2) {
      event.bracket = generateBracket(promoted)
      simulateEliminationRounds(event.bracket.rounds, bestOf, isTeam, event)
    }
  }

  return event
}

// ===== 團體賽積分榜 =====

export function calculateTeamStandings(participants, matches) {
  const stats = {}
  for (const p of participants) {
    stats[p.id] = {
      participant: p,
      wins: 0, losses: 0, matchesPlayed: 0,
      rubbersWon: 0, rubbersLost: 0,
      gamesWon: 0, gamesLost: 0,
      rankPoints: 0,
    }
  }

  for (const m of matches) {
    if (!m.winner) continue
    const s1 = stats[m.p1?.id]
    const s2 = stats[m.p2?.id]
    if (!s1 || !s2) continue

    s1.matchesPlayed++
    s2.matchesPlayed++

    if (m.winner.id === m.p1.id) {
      s1.wins++; s1.rankPoints += 2
      s2.losses++; s2.rankPoints += 1
    } else {
      s2.wins++; s2.rankPoints += 2
      s1.losses++; s1.rankPoints += 1
    }

    // 計算點數 (rubbers)
    const ts = m.teamScore || { a: 0, b: 0 }
    s1.rubbersWon += ts.a; s1.rubbersLost += ts.b
    s2.rubbersWon += ts.b; s2.rubbersLost += ts.a

    // 計算局數 (games across all rubbers)
    for (const r of (m.rubberResults || [])) {
      for (const g of (r.scores || [])) {
        if (g.a > g.b) { s1.gamesWon++; s2.gamesLost++ }
        else if (g.b > g.a) { s2.gamesWon++; s1.gamesLost++ }
      }
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.rankPoints !== a.rankPoints) return b.rankPoints - a.rankPoints
    if (b.wins !== a.wins) return b.wins - a.wins
    const rdA = a.rubbersWon - a.rubbersLost
    const rdB = b.rubbersWon - b.rubbersLost
    if (rdB !== rdA) return rdB - rdA
    const gdA = a.gamesWon - a.gamesLost
    const gdB = b.gamesWon - b.gamesLost
    return gdB - gdA
  })
}

// ===== 自動產生賽事規則文字 =====

export function generateRulesText(tournament) {
  const lines = []
  const events = tournament.events || []
  if (!events.length) return ''

  lines.push('一、賽事簡介')
  const evLabels = events.map(e => e.label).join('、')
  lines.push(`本${tournament.name || '賽事'}設有${evLabels}等項目。`)
  lines.push('')

  let section = 2
  for (const ev of events) {
    const numLabel = ['','一','二','三','四','五','六','七','八','九','十'][section] || section
    const bestOfLabel = BEST_OF_OPTIONS.find(x => x.value === ev.matchBestOf)?.label || `${ev.matchBestOf}局`
    const formatLabel = FORMATS.find(x => x.value === ev.format)?.label || ev.format
    const pCount = ev.participants?.length || 0
    const unit = ev.type === 'team' ? '隊' : '人'
    const typeLabel = EVENT_TYPES.find(x => x.value === ev.type)?.label || ''

    lines.push(`${numLabel}、${ev.label}`)
    lines.push(`1. 共 ${pCount} ${unit}參賽，賽制：${formatLabel}。`)
    lines.push(`2. 每場比賽採${bestOfLabel}制。`)
    lines.push(`3. 每局 11 分，10 平後須連贏 2 分。`)

    if (ev.type === 'team') {
      const rubbers = ev.rubbers || []
      const rubberTypes = rubbers.map(r => {
        const t = EVENT_TYPES.find(x => x.value === r.type)?.label || r.type
        return t
      })
      const ptw = ev.pointsToWin || 3
      const totalPts = rubbers.length
      lines.push(`4. 團體賽採 ${totalPts} 點 ${ptw} 勝制。`)
      const typeSet = [...new Set(rubberTypes)]
      if (typeSet.length === 1) {
        lines.push(`5. 每點為${typeSet[0]}，採${bestOfLabel}制。`)
      } else {
        lines.push(`5. 各點內容：${rubbers.map(r => r.label).join('、')}。`)
      }
    }

    if (ev.format === 'group_knockout') {
      const nGroups = ev.groups?.length || 0
      const adv = ev.advancePerGroup || 2
      const groupNames = (ev.groups || []).map(g => g.name).join('、')
      lines.push(`${ev.type === 'team' ? '6' : '4'}. ${pCount} ${unit}分為 ${groupNames} 共 ${nGroups} 組。`)
      lines.push(`${ev.type === 'team' ? '7' : '5'}. 採組內單循環賽制，各組前 ${adv} 名晉級淘汰賽。`)
      lines.push(`${ev.type === 'team' ? '8' : '6'}. 積分規則：勝場得 2 分，負場得 1 分。`)
      lines.push(`${ev.type === 'team' ? '9' : '7'}. 若積分相同，依序比較：勝負關係 → ${ev.type === 'team' ? '點差 → ' : ''}局差 → 小分差。`)
    }

    lines.push('')
    section++
  }

  return lines.join('\n')
}

// ===== 比分計算 =====

// scores: [{a:11,b:5}, {a:9,b:11}, ...]
export function determineWinner(scores, bestOf) {
  const toWin = Math.ceil(bestOf / 2)
  let w1 = 0, w2 = 0
  for (const g of scores) {
    if (g.a > g.b) w1++
    else if (g.b > g.a) w2++
    if (w1 >= toWin) return 1
    if (w2 >= toWin) return 2
  }
  return 0
}

export function formatScores(scores) {
  if (!scores || scores.length === 0) return ''
  return scores.map(g => `${g.a}:${g.b}`).join(', ')
}

// 回傳 [p1贏的局數, p2贏的局數]
export function gameScore(scores) {
  let w1 = 0, w2 = 0
  for (const g of (scores || [])) {
    if (g.a > g.b) w1++
    else if (g.b > g.a) w2++
  }
  return [w1, w2]
}
