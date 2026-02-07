// ===== Tournament Data Storage Module =====
const STORAGE_KEY = 'pingpong_tournament';

function getDefaultData() {
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
    knockout: { rounds: [] }
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.error(e); }
  }
  // 若無儲存資料且有 DEMO_DATA，載入展示用測試資料
  if (typeof DEMO_DATA !== 'undefined') {
    return JSON.parse(JSON.stringify(DEMO_DATA));
  }
  return getDefaultData();
}

function encodeDataForURL(data) {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

function decodeDataFromURL(encoded) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (json) return JSON.parse(json);
  } catch (e) { console.error(e); }
  return null;
}

function getDataFromURL() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#data=')) {
    return decodeDataFromURL(hash.substring(6));
  }
  return null;
}

function generateViewURL(data) {
  const encoded = encodeDataForURL(data);
  const base = window.location.href.split('#')[0].split('?')[0];
  const viewBase = base.replace(/admin\.html$/, 'index.html').replace(/\/$/, '/index.html');
  return viewBase + '#data=' + encoded;
}

function generateAdminURL(data) {
  const encoded = encodeDataForURL(data);
  const base = window.location.href.split('#')[0].split('?')[0];
  const adminBase = base.replace(/index\.html$/, 'admin.html').replace(/\/$/, '/admin.html');
  return adminBase + '#data=' + encoded;
}

function getTeamName(teams, teamId) {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : 'TBD';
}

function getTeamById(teams, teamId) {
  return teams.find(t => t.id === teamId) || null;
}

function calculateStandings(groupIndex, teams, groupMatches) {
  const group = teams;
  const standings = {};
  group.forEach(teamId => {
    standings[teamId] = {
      teamId, played: 0, wins: 0, losses: 0,
      gamesFor: 0, gamesAgainst: 0,
      pointsFor: 0, pointsAgainst: 0,
      points: 0
    };
  });

  groupMatches.filter(m => m.groupIndex === groupIndex && m.completed).forEach(match => {
    const s1 = standings[match.team1Id];
    const s2 = standings[match.team2Id];
    if (!s1 || !s2) return;

    s1.played++; s2.played++;
    s1.gamesFor += match.score1; s1.gamesAgainst += match.score2;
    s2.gamesFor += match.score2; s2.gamesAgainst += match.score1;

    if (match.games) {
      match.games.forEach(g => {
        s1.pointsFor += g.s1; s1.pointsAgainst += g.s2;
        s2.pointsFor += g.s2; s2.pointsAgainst += g.s1;
      });
    }

    if (match.score1 > match.score2) {
      s1.wins++; s2.losses++; s1.points += 2; s2.points += 1;
    } else if (match.score2 > match.score1) {
      s2.wins++; s1.losses++; s2.points += 2; s1.points += 1;
    }
  });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diff = (b.gamesFor - b.gamesAgainst) - (a.gamesFor - a.gamesAgainst);
    if (diff !== 0) return diff;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });
}

function generateRoundRobinMatches(groupIndex, teamIds) {
  const matches = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        id: `g${groupIndex}_${teamIds[i]}_${teamIds[j]}`,
        groupIndex,
        team1Id: teamIds[i],
        team2Id: teamIds[j],
        score1: 0, score2: 0,
        games: [],
        completed: false
      });
    }
  }
  return matches;
}

let _nextTeamId = 1;
function nextTeamId(teams) {
  if (teams.length === 0) return 1;
  return Math.max(...teams.map(t => t.id)) + 1;
}
