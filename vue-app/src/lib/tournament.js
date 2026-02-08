// ===== 賽事資料模型與工具函式 =====

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

// 計算最近的 2 的冪次（容納 n 個參賽者的籤表大小）
export function bracketSize(n) {
  if (n <= 1) return 1
  let s = 1
  while (s < n) s *= 2
  return s
}

// 計算 bye 數量
export function byeCount(n) {
  return bracketSize(n) - n
}

// 產生標準種子位（Seeding placement）
// 確保高種子在籤表不同半區
export function seedOrder(size) {
  if (size === 1) return [0]
  const half = seedOrder(size / 2)
  return half.reduce((acc, pos) => {
    acc.push(pos * 2)
    acc.push(pos * 2 + 1)
    return acc
  }, [])
}

// 產生淘汰賽賽程（含 bye）
// participants: [{ id, name, seed }]
// 回傳 rounds 陣列
export function generateBracket(participants) {
  const n = participants.length
  if (n === 0) return { size: 0, rounds: [] }

  const size = bracketSize(n)
  const totalRounds = Math.log2(size)
  const order = seedOrder(size)

  // 把選手依種子排入，其餘為 bye
  const slots = new Array(size).fill(null)
  const sorted = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999))
  for (let i = 0; i < sorted.length; i++) {
    slots[order[i]] = sorted[i]
  }

  // 產生第一輪比賽
  const rounds = []
  const firstRound = []
  for (let i = 0; i < size; i += 2) {
    const p1 = slots[i]
    const p2 = slots[i + 1]
    const isBye = !p1 || !p2
    firstRound.push({
      id: uid(),
      p1: p1 || null,
      p2: p2 || null,
      isBye,
      winner: isBye ? (p1 || p2) : null,
      scores: [],
    })
  }
  rounds.push(firstRound)

  // 產生後續輪次（空的，等待前一輪結果）
  let prevCount = firstRound.length
  for (let r = 1; r < totalRounds; r++) {
    const round = []
    for (let i = 0; i < prevCount / 2; i++) {
      round.push({
        id: uid(),
        p1: null,
        p2: null,
        isBye: false,
        winner: null,
        scores: [],
      })
    }
    rounds.push(round)
    prevCount = round.length
  }

  // 將 bye 的晉級者自動填入第二輪
  if (rounds.length > 1) {
    propagateByes(rounds)
  }

  return { size, rounds }
}

// 把 bye 勝出者推進下一輪
function propagateByes(rounds) {
  for (let r = 0; r < rounds.length - 1; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const match = rounds[r][i]
      if (match.winner) {
        const nextIdx = Math.floor(i / 2)
        const nextMatch = rounds[r + 1][nextIdx]
        if (i % 2 === 0) {
          nextMatch.p1 = match.winner
        } else {
          nextMatch.p2 = match.winner
        }
      }
    }
  }
}

// 更新淘汰賽：設定某場比賽的勝者，並推進下一輪
export function setBracketWinner(rounds, roundIdx, matchIdx, winner) {
  const match = rounds[roundIdx][matchIdx]
  match.winner = winner

  // 推進至下一輪
  if (roundIdx < rounds.length - 1) {
    const nextIdx = Math.floor(matchIdx / 2)
    const nextMatch = rounds[roundIdx + 1][nextIdx]
    if (matchIdx % 2 === 0) {
      nextMatch.p1 = winner
    } else {
      nextMatch.p2 = winner
    }
  }
}

// ===== 循環賽 =====

// 產生循環賽對陣表
// participants: [{ id, name }]
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
        scores: [], // [[11,9],[8,11],[11,7],...]
      })
    }
  }
  return matches
}

// 計算循環賽積分榜
// matches: 上面產生的 matches 陣列
// 回傳 [{ participant, wins, losses, matchesPlayed, gamesWon, gamesLost, pointsWon, pointsLost }]
export function calculateRoundRobinStandings(participants, matches) {
  const stats = {}
  for (const p of participants) {
    stats[p.id] = {
      participant: p,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      pointsWon: 0,
      pointsLost: 0,
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

    // 計算局數和分數
    for (const game of (m.scores || [])) {
      const [a, b] = game
      s1.gamesWon += (a > b ? 1 : 0)
      s1.gamesLost += (a < b ? 1 : 0)
      s2.gamesWon += (a < b ? 1 : 0)
      s2.gamesLost += (a > b ? 1 : 0)
      s1.pointsWon += a
      s1.pointsLost += b
      s2.pointsWon += b
      s2.pointsLost += a
    }
  }

  // 排序：積分 → 勝場 → 局差 → 分差
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

// 根據參賽者人數建議分組方式
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

// 蛇形分組（根據種子序位分配到各組）
export function snakeSeed(participants, numGroups) {
  const sorted = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999))
  const groups = Array.from({ length: numGroups }, () => [])

  sorted.forEach((p, i) => {
    const round = Math.floor(i / numGroups)
    const idx = i % numGroups
    // 蛇形：奇數輪反向
    const groupIdx = round % 2 === 0 ? idx : (numGroups - 1 - idx)
    groups[groupIdx].push(p)
  })

  return groups
}

// 產生分組循環 + 淘汰的完整結構
export function generateGroupKnockout(participants, numGroups, advancePerGroup) {
  const grouped = snakeSeed(participants, numGroups)

  const groups = grouped.map((members, i) => ({
    id: uid(),
    name: String.fromCharCode(65 + i), // A, B, C, ...
    participants: members,
    matches: generateRoundRobin(members),
  }))

  // 淘汰賽先產生空的，等分組賽結束後填入
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

// 產生團體賽單場對戰（兩隊之間的各點）
export function generateTeamMatch(team1, team2, rubbers) {
  return {
    id: uid(),
    team1,
    team2,
    winner: null,
    rubberResults: rubbers.map(r => ({
      ...r,
      id: uid(),
      p1: null, // 出場名單待填
      p2: null,
      winner: null,
      scores: [],
    })),
  }
}

// ===== 建立空白賽事 =====

export function createEvent(config) {
  const {
    type, gender, format, matchBestOf,
    teamSize, teamMatchFormat, teamBestOf, customRubbers,
  } = config

  const event = {
    id: uid(),
    type,
    gender,
    label: makeEventLabel(gender, type),
    format,
    matchBestOf: matchBestOf || 5,
    participants: [], // 之後填入選手/隊伍
    // 根據 format 不同，初始化不同結構
    groups: null,
    bracket: null,
    roundRobinMatches: null,
    advancePerGroup: null,
  }

  // 團體賽專屬設定
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

// ===== 建立空白賽事 =====

export function createTournament(name, date, venue) {
  return {
    id: uid(),
    name,
    date,
    venue,
    events: [],
    createdAt: Date.now(),
  }
}

// ===== 根據參賽者產生對陣 =====
// 在新增完參賽者後呼叫，依據 format 產生對應的比賽結構
export function generateEventMatches(event, config = {}) {
  const n = event.participants.length
  if (n < 2) return event

  if (event.format === 'elimination') {
    const bracket = generateBracket(event.participants)
    event.bracket = bracket
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

  return event
}

// ===== 比分計算 =====

// 根據 scores 陣列判斷勝者（bestOf 局制）
// scores: [[11,5],[9,11],[11,8],...]
// 回傳 1（p1勝）、2（p2勝）、0（未完賽）
export function determineWinner(scores, bestOf) {
  const toWin = Math.ceil(bestOf / 2)
  let w1 = 0, w2 = 0
  for (const [a, b] of scores) {
    if (a > b) w1++
    else if (b > a) w2++
    if (w1 >= toWin) return 1
    if (w2 >= toWin) return 2
  }
  return 0
}

// 格式化比分顯示
export function formatScores(scores) {
  if (!scores || scores.length === 0) return ''
  return scores.map(([a, b]) => `${a}:${b}`).join(', ')
}

// 算出目前局數 (p1贏幾局 : p2贏幾局)
export function gameScore(scores) {
  let w1 = 0, w2 = 0
  for (const [a, b] of (scores || [])) {
    if (a > b) w1++
    else if (b > a) w2++
  }
  return [w1, w2]
}
