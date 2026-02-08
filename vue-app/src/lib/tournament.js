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

export function generateTeamMatch(team1, team2, rubbers) {
  return {
    id: uid(),
    team1, team2,
    winner: null,
    rubberResults: rubbers.map(r => ({
      ...r, id: uid(),
      p1: null, p2: null, winner: null, scores: [],
    })),
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
  return event
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
