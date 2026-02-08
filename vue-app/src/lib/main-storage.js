export const STORAGE_KEY = 'pingpong_tournament'

export function getDefaultData() {
  return {
    tournament: {
      name: '',
      date: '',
      location: '',
      rules: '',
      groupFormat: '五局三勝',
      knockoutFormat: '七局四勝',
    },
    teams: [],
    groups: [],
    groupMatches: [],
    knockout: { rounds: [] },
  }
}

export function getTeamName(teams, teamId) {
  const team = teams.find(t => t.id === teamId)
  return team ? team.name : 'TBD'
}

export function getTeamById(teams, teamId) {
  return teams.find(t => t.id === teamId) || null
}

export function getPlayerName(team, playerIdx) {
  if (!team || !team.players || playerIdx == null || playerIdx < 0) return '?'
  return team.players[playerIdx] || '?'
}

export function getDoublesDisplay(team, indices) {
  if (!team || !indices || indices.length < 2) return 'TBD'
  return getPlayerName(team, indices[0]) + ' / ' + getPlayerName(team, indices[1])
}

export function calculateStandings(groupIndex, teamIds, groupMatches) {
  const standings = {}
  teamIds.forEach(teamId => {
    standings[teamId] = {
      teamId, played: 0, wins: 0, losses: 0,
      doublesFor: 0, doublesAgainst: 0,
      gamesFor: 0, gamesAgainst: 0,
      pointsFor: 0, pointsAgainst: 0,
      matchPoints: 0,
    }
  })

  groupMatches.filter(m => m.groupIndex === groupIndex && m.completed).forEach(match => {
    const s1 = standings[match.team1Id]
    const s2 = standings[match.team2Id]
    if (!s1 || !s2) return

    s1.played++; s2.played++
    s1.doublesFor += match.score1; s1.doublesAgainst += match.score2
    s2.doublesFor += match.score2; s2.doublesAgainst += match.score1

    if (match.doubles) {
      match.doubles.forEach(d => {
        if (!d.completed) return
        s1.gamesFor += d.score1; s1.gamesAgainst += d.score2
        s2.gamesFor += d.score2; s2.gamesAgainst += d.score1
        if (d.games) {
          d.games.forEach(g => {
            s1.pointsFor += g.s1; s1.pointsAgainst += g.s2
            s2.pointsFor += g.s2; s2.pointsAgainst += g.s1
          })
        }
      })
    }

    if (match.score1 > match.score2) {
      s1.wins++; s2.losses++
      s1.matchPoints += 2; s2.matchPoints += 1
    } else if (match.score2 > match.score1) {
      s2.wins++; s1.losses++
      s2.matchPoints += 2; s1.matchPoints += 1
    }
  })

  return Object.values(standings).sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
    const dDiff = (b.doublesFor - b.doublesAgainst) - (a.doublesFor - a.doublesAgainst)
    if (dDiff !== 0) return dDiff
    const gDiff = (b.gamesFor - b.gamesAgainst) - (a.gamesFor - a.gamesAgainst)
    if (gDiff !== 0) return gDiff
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  })
}

export function createEmptyDoubles() {
  return Array.from({ length: 5 }, () => ({
    t1p: [null, null], t2p: [null, null],
    score1: 0, score2: 0, games: [], completed: false,
  }))
}

export function generateRoundRobinMatches(groupIndex, teamIds) {
  const matches = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        id: `g${groupIndex}_${teamIds[i]}_${teamIds[j]}`,
        groupIndex, team1Id: teamIds[i], team2Id: teamIds[j],
        score1: 0, score2: 0, doubles: createEmptyDoubles(), completed: false,
      })
    }
  }
  return matches
}

export function nextTeamId(teams) {
  if (teams.length === 0) return 1
  return Math.max(...teams.map(t => t.id)) + 1
}

export function recalcTeamScore(match) {
  let s1 = 0, s2 = 0
  if (match.doubles) {
    match.doubles.forEach(d => {
      if (d.completed) {
        if (d.score1 > d.score2) s1++
        else if (d.score2 > d.score1) s2++
      }
    })
  }
  match.score1 = s1
  match.score2 = s2
  match.completed = (match.doubles || []).filter(d => d.completed).length === 5
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
