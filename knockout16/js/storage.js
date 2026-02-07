// ===== 16強雙打淘汰賽 - 資料模型 =====
var STORAGE_KEY = 'ko16_tournament';

var ROUND_NAMES = ['十六強', '八強', '準決賽', '決賽'];
var ROUND_MATCH_COUNT = [8, 4, 2, 1];

function getDefaultData() {
  return {
    tournament: { name: '', date: '', location: '', rules: '', format: '五局三勝' },
    teams: [],
    rounds: createEmptyRounds(),
    thirdPlace: null
  };
}

function createEmptyRounds() {
  var rounds = [];
  for (var r = 0; r < 4; r++) {
    var matches = [];
    for (var m = 0; m < ROUND_MATCH_COUNT[r]; m++) {
      matches.push(createEmptyMatch('r' + r + '_m' + m));
    }
    rounds.push({ name: ROUND_NAMES[r], matches: matches });
  }
  return rounds;
}

function createEmptyMatch(id) {
  return { id: id, team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false };
}

function recalcMatch(match) {
  var s1 = 0, s2 = 0;
  match.games.forEach(function (g) {
    if (g.s1 > g.s2) s1++;
    else if (g.s2 > g.s1) s2++;
  });
  match.score1 = s1;
  match.score2 = s2;
  match.completed = match.games.length > 0 && (s1 >= 3 || s2 >= 3);
}

function getWinnerId(match) {
  if (!match.completed) return null;
  return match.score1 > match.score2 ? match.team1Id : match.team2Id;
}

function getLoserId(match) {
  if (!match.completed) return null;
  return match.score1 > match.score2 ? match.team2Id : match.team1Id;
}

function getTeamById(teams, id) {
  return teams.find(function (t) { return t.id === id; }) || null;
}

function getTeamName(teams, id) {
  var t = getTeamById(teams, id);
  return t ? t.name : 'TBD';
}

function getPlayersDisplay(teams, id) {
  var t = getTeamById(teams, id);
  if (!t) return 'TBD';
  var a = t.players[0] || '選手1', b = t.players[1] || '選手2';
  return a + ' / ' + b;
}

function nextTeamId(teams) {
  var max = 0;
  teams.forEach(function (t) { if (t.id > max) max = t.id; });
  return max + 1;
}

// ===== 儲存與讀取 =====
function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function loadData() {
  var stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      var parsed = JSON.parse(stored);
      if (parsed.teams && parsed.teams.length > 0) return parsed;
    } catch (e) { console.error(e); }
  }
  if (typeof DEMO_DATA !== 'undefined') return JSON.parse(JSON.stringify(DEMO_DATA));
  return getDefaultData();
}

// ===== URL 資料分享 =====
function generateViewURL(data) {
  var base = window.location.origin + window.location.pathname.replace(/admin\.html.*/, 'index.html');
  var compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  return base + '#data=' + compressed;
}

function generateAdminURL(data) {
  var base = window.location.origin + window.location.pathname.replace(/index\.html.*/, 'admin.html');
  var compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  return base + '#data=' + compressed;
}

function getDataFromURL() {
  var hash = window.location.hash;
  if (!hash || !hash.startsWith('#data=')) return null;
  try {
    var compressed = hash.substring(6);
    var json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) { return null; }
}
