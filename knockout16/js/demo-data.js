// ===== 16強雙打淘汰賽 - 測試資料 =====
(function () {
  var _seed = 2026;
  function rand() {
    _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
    return _seed / 0x7fffffff;
  }

  function genGame(pWin) {
    var w = rand() < pWin;
    var loserScore = Math.floor(rand() * 10);
    if (loserScore >= 10) loserScore = 9;
    var winnerScore = 11;
    if (loserScore >= 10) {
      var extra = Math.floor(rand() * 3);
      winnerScore = 12 + extra;
      loserScore = winnerScore - 2;
    }
    return w ? { s1: winnerScore, s2: loserScore } : { s1: loserScore, s2: winnerScore };
  }

  function genMatch(id, t1, t2, pWin) {
    var games = [], s1 = 0, s2 = 0;
    while (s1 < 3 && s2 < 3) {
      var g = genGame(pWin);
      games.push(g);
      if (g.s1 > g.s2) s1++; else s2++;
    }
    return { id: id, team1Id: t1, team2Id: t2, score1: s1, score2: s2, games: games, completed: true };
  }

  var teams = [
    { id: 1,  name: '雷霆組', players: ['王大明', '李志強'] },
    { id: 2,  name: '閃電組', players: ['張家豪', '陳建志'] },
    { id: 3,  name: '烈火組', players: ['林冠宇', '黃俊傑'] },
    { id: 4,  name: '寒冰組', players: ['吳宗翰', '劉柏均'] },
    { id: 5,  name: '旋風組', players: ['蔡承恩', '楊子軒'] },
    { id: 6,  name: '飛鷹組', players: ['周信宏', '鄭宏達'] },
    { id: 7,  name: '猛虎組', players: ['謝育成', '許文豪'] },
    { id: 8,  name: '蒼龍組', players: ['曹家瑋', '洪嘉偉'] },
    { id: 9,  name: '銀狐組', players: ['馬振華', '蕭志遠'] },
    { id: 10, name: '金鵬組', players: ['潘奕辰', '盧品言'] },
    { id: 11, name: '黑豹組', players: ['賴彥廷', '葉俊宏'] },
    { id: 12, name: '白鯊組', players: ['范振偉', '彭家銘'] },
    { id: 13, name: '赤焰組', players: ['何宗穎', '傅柏翰'] },
    { id: 14, name: '紫電組', players: ['江明達', '廖建宏'] },
    { id: 15, name: '青隼組', players: ['鍾志豪', '田家維'] },
    { id: 16, name: '玄武組', players: ['羅國強', '方世傑'] }
  ];

  var strength = {};
  teams.forEach(function (t) { strength[t.id] = 0.3 + rand() * 0.5; });
  // 讓前幾隊稍強
  strength[1] = 0.80; strength[3] = 0.75; strength[5] = 0.70; strength[8] = 0.72;

  // 十六強 (8場)
  var r0 = [];
  var seeds = [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
  for (var i = 0; i < 8; i++) {
    var t1 = seeds[i * 2], t2 = seeds[i * 2 + 1];
    var pWin = 0.5 + (strength[t1] - strength[t2]) * 0.5;
    pWin = Math.max(0.25, Math.min(0.75, pWin));
    r0.push(genMatch('r0_m' + i, t1, t2, pWin));
  }

  // 八強 (4場)
  var r1 = [];
  for (var i = 0; i < 4; i++) {
    var w1 = r0[i * 2].score1 > r0[i * 2].score2 ? r0[i * 2].team1Id : r0[i * 2].team2Id;
    var w2 = r0[i * 2 + 1].score1 > r0[i * 2 + 1].score2 ? r0[i * 2 + 1].team1Id : r0[i * 2 + 1].team2Id;
    var pWin = 0.5 + (strength[w1] - strength[w2]) * 0.5;
    pWin = Math.max(0.25, Math.min(0.75, pWin));
    r1.push(genMatch('r1_m' + i, w1, w2, pWin));
  }

  // 準決賽 (2場)
  var r2 = [];
  for (var i = 0; i < 2; i++) {
    var w1 = r1[i * 2].score1 > r1[i * 2].score2 ? r1[i * 2].team1Id : r1[i * 2].team2Id;
    var w2 = r1[i * 2 + 1].score1 > r1[i * 2 + 1].score2 ? r1[i * 2 + 1].team1Id : r1[i * 2 + 1].team2Id;
    var pWin = 0.5 + (strength[w1] - strength[w2]) * 0.5;
    pWin = Math.max(0.25, Math.min(0.75, pWin));
    r2.push(genMatch('r2_m' + i, w1, w2, pWin));
  }

  // 季軍戰
  var sf1Loser = r2[0].score1 > r2[0].score2 ? r2[0].team2Id : r2[0].team1Id;
  var sf2Loser = r2[1].score1 > r2[1].score2 ? r2[1].team2Id : r2[1].team1Id;
  var pWin3 = 0.5 + (strength[sf1Loser] - strength[sf2Loser]) * 0.5;
  var thirdPlace = genMatch('third', sf1Loser, sf2Loser, Math.max(0.25, Math.min(0.75, pWin3)));

  // 決賽
  var sf1Winner = r2[0].score1 > r2[0].score2 ? r2[0].team1Id : r2[0].team2Id;
  var sf2Winner = r2[1].score1 > r2[1].score2 ? r2[1].team1Id : r2[1].team2Id;
  var pWinF = 0.5 + (strength[sf1Winner] - strength[sf2Winner]) * 0.5;
  var finalMatch = genMatch('r3_m0', sf1Winner, sf2Winner, Math.max(0.25, Math.min(0.75, pWinF)));

  window.DEMO_DATA = {
    tournament: {
      name: '2026 春季雙打淘汰賽',
      date: '2026年3月22日 - 3月23日',
      location: '台北市立體育館',
      rules: '一、賽事簡介\n本賽事為 16 組雙打單淘汰制。\n\n二、賽制\n1. 16 組雙打，每組 2 名選手。\n2. 單淘汰制，共 4 輪：十六強 → 八強 → 準決賽 → 決賽。\n3. 每場比賽採五局三勝制。\n4. 每局 11 分，10 平後須連贏 2 分。\n5. 準決賽敗者進行季軍戰。\n\n三、獎項\n冠軍、亞軍、季軍各頒發獎盃。',
      format: '五局三勝'
    },
    teams: teams,
    rounds: [
      { name: '十六強', matches: r0 },
      { name: '八強', matches: r1 },
      { name: '準決賽', matches: r2 },
      { name: '決賽', matches: [finalMatch] }
    ],
    thirdPlace: thirdPlace
  };
})();
