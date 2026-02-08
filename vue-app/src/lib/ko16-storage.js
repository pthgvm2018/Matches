export const STORAGE_KEY = 'ko16_tournament'
export const ROUND_NAMES = ['十六強', '八強', '準決賽', '決賽']
export const ROUND_MATCH_COUNT = [8, 4, 2, 1]

export function getDefaultData() {
  return {
    tournament: { name: '', date: '', location: '', rules: '', format: '五局三勝' },
    teams: [],
    rounds: createEmptyRounds(),
    thirdPlace: null,
  }
}

export function createEmptyRounds() {
  return ROUND_NAMES.map((name, r) => ({
    name,
    matches: Array.from({ length: ROUND_MATCH_COUNT[r] }, (_, m) =>
      createEmptyMatch(`r${r}_m${m}`)
    ),
  }))
}

export function createEmptyMatch(id) {
  return { id, team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false }
}

export function recalcMatch(match) {
  let s1 = 0, s2 = 0
  match.games.forEach(g => {
    if (g.s1 > g.s2) s1++
    else if (g.s2 > g.s1) s2++
  })
  match.score1 = s1
  match.score2 = s2
  match.completed = match.games.length > 0 && (s1 >= 3 || s2 >= 3)
}

export function getWinnerId(match) {
  if (!match.completed) return null
  return match.score1 > match.score2 ? match.team1Id : match.team2Id
}

export function getLoserId(match) {
  if (!match.completed) return null
  return match.score1 > match.score2 ? match.team2Id : match.team1Id
}

export function getTeamById(teams, id) {
  return teams.find(t => t.id === id) || null
}

export function getTeamName(teams, id) {
  const t = getTeamById(teams, id)
  return t ? t.name : 'TBD'
}

export function getPlayersDisplay(teams, id) {
  const t = getTeamById(teams, id)
  if (!t) return 'TBD'
  const a = t.players[0] || '選手1', b = t.players[1] || '選手2'
  return a + ' / ' + b
}

export function nextTeamId(teams) {
  let max = 0
  teams.forEach(t => { if (t.id > max) max = t.id })
  return max + 1
}

export function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.teams && parsed.teams.length > 0) return parsed
    } catch (e) { console.error(e) }
  }
  return getDefaultData()
}
