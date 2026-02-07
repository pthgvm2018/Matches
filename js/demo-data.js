// ===== Demo Data Generator =====
// 使用確定性隨機數產生一致的測試資料
(function () {
  var _seed = 2026;
  function rand() {
    _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
    return _seed / 0x7fffffff;
  }

  // 產生單局比分（到11分，deuce到2分差）
  function genGame(pWin) {
    var w = rand() < pWin;
    var loserScore = Math.floor(rand() * 10); // 0-9
    if (loserScore >= 10) loserScore = 9;
    var winnerScore = 11;
    if (loserScore === 10) {
      // deuce
      var extra = Math.floor(rand() * 3); // 0,1,2
      winnerScore = 12 + extra;
      loserScore = winnerScore - 2;
    }
    return w ? { s1: winnerScore, s2: loserScore } : { s1: loserScore, s2: winnerScore };
  }

  // 產生一場雙打比賽（五局三勝）
  function genDoublesMatch(pWin, t1p, t2p) {
    var games = [], s1 = 0, s2 = 0;
    while (s1 < 3 && s2 < 3) {
      var g = genGame(pWin);
      games.push(g);
      if (g.s1 > g.s2) s1++; else s2++;
    }
    return { t1p: t1p, t2p: t2p, score1: s1, score2: s2, games: games, completed: true };
  }

  // 產生一場團體賽（5點雙打）
  function genTeamMatch(id, groupIndex, t1, t2, t1Strength, t2Strength) {
    var doubles = [];
    for (var d = 0; d < 5; d++) {
      var t1p = [d * 2, d * 2 + 1];
      var t2p = [d * 2, d * 2 + 1];
      // 勝率根據雙方實力差計算
      var pWin = 0.5 + (t1Strength - t2Strength) * 0.4 + (rand() - 0.5) * 0.2;
      pWin = Math.max(0.25, Math.min(0.75, pWin));
      doubles.push(genDoublesMatch(pWin, t1p, t2p));
    }
    var s1 = 0, s2 = 0;
    doubles.forEach(function (dd) { if (dd.score1 > dd.score2) s1++; else s2++; });
    return {
      id: id, groupIndex: groupIndex,
      team1Id: t1, team2Id: t2,
      score1: s1, score2: s2,
      doubles: doubles, completed: true
    };
  }

  // 產生淘汰賽一場（七局四勝）
  function genDoublesMatchKO(pWin, t1p, t2p) {
    var games = [], s1 = 0, s2 = 0;
    while (s1 < 4 && s2 < 4) {
      var g = genGame(pWin);
      games.push(g);
      if (g.s1 > g.s2) s1++; else s2++;
    }
    return { t1p: t1p, t2p: t2p, score1: s1, score2: s2, games: games, completed: true };
  }

  function genTeamMatchKO(id, t1, t2, t1Strength, t2Strength) {
    var doubles = [];
    for (var d = 0; d < 5; d++) {
      var t1p = [d * 2, d * 2 + 1];
      var t2p = [d * 2, d * 2 + 1];
      var pWin = 0.5 + (t1Strength - t2Strength) * 0.35 + (rand() - 0.5) * 0.2;
      pWin = Math.max(0.25, Math.min(0.75, pWin));
      doubles.push(genDoublesMatchKO(pWin, t1p, t2p));
    }
    var s1 = 0, s2 = 0;
    doubles.forEach(function (dd) { if (dd.score1 > dd.score2) s1++; else s2++; });
    return {
      id: id, team1Id: t1, team2Id: t2,
      score1: s1, score2: s2,
      doubles: doubles, completed: true
    };
  }

  var teams = [
    { id: 1, name: "龍騰", players: ["王大明","李志強","張家豪","陳建志","林冠宇","黃俊傑","吳宗翰","劉柏均","蔡承恩","楊子軒"] },
    { id: 2, name: "鳳翔", players: ["周信宏","鄭宏達","謝育成","許文豪","曹家瑋","洪嘉偉","馬振華","蕭志遠","潘奕辰","盧品言"] },
    { id: 3, name: "虎嘯", players: ["賴彥廷","葉俊宏","范振偉","彭家銘","何宗穎","傅柏翰","江明達","廖建宏","鍾志豪","田家維"] },
    { id: 4, name: "熊霸", players: ["羅國強","方世傑","高志明","邱俊達","施柏安","宋政融","薛宇翔","石家瑋","杜承翰","韓志偉"] },
    { id: 5, name: "鷹擊", players: ["余建成","梁文傑","龔冠宇","夏振豪","康家銘","甘俊宏","姜柏翰","游宗穎","溫志遠","秦奕辰"] },
    { id: 6, name: "狼群", players: ["童國豪","毛世杰","莊志明","呂俊偉","巫柏安","華振華","段家維","湯承恩","雷子軒","饒品言"] },
    { id: 7, name: "豹速", players: ["白信宏","藍宏達","柯育成","翁文豪","涂家瑋","丁嘉偉","魏振偉","朱俊傑","沈柏均","任志豪"] },
    { id: 8, name: "獅吼", players: ["章彥廷","尤建宏","紀明達","凌宗翰","殷家銘","管俊達","單政融","古宇翔","嚴承翰","顏志偉"] },
    { id: 9, name: "蛇行", players: ["戴國強","卓世傑","連冠宇","詹振豪","簡柏翰","閔宗穎","鄧志遠","郭奕辰","程品言","苗子軒"] },
    { id: 10, name: "麒麟", players: ["包信宏","阮宏達","屈育成","費文豪","顧家瑋","焦嘉偉","聶振華","鮑志明","邵明遠","錢浩然"] }
  ];

  // 各隊實力值（影響勝率）
  // A組: 1龍騰0.85, 3虎嘯0.55, 5鷹擊0.72, 6狼群0.42, 9蛇行0.28
  // B組: 2鳳翔0.82, 4熊霸0.70, 7豹速0.55, 8獅吼0.40, 10麒麟0.25
  var strength = { 1: 0.85, 2: 0.82, 3: 0.55, 4: 0.70, 5: 0.72, 6: 0.42, 7: 0.55, 8: 0.40, 9: 0.28, 10: 0.25 };

  var groupA = [1, 3, 5, 6, 9];
  var groupB = [2, 4, 7, 8, 10];

  var groupMatches = [];
  // A 組循環賽
  for (var i = 0; i < groupA.length; i++) {
    for (var j = i + 1; j < groupA.length; j++) {
      var t1 = groupA[i], t2 = groupA[j];
      groupMatches.push(genTeamMatch('g0_' + t1 + '_' + t2, 0, t1, t2, strength[t1], strength[t2]));
    }
  }
  // B 組循環賽
  for (var i = 0; i < groupB.length; i++) {
    for (var j = i + 1; j < groupB.length; j++) {
      var t1 = groupB[i], t2 = groupB[j];
      groupMatches.push(genTeamMatch('g1_' + t1 + '_' + t2, 1, t1, t2, strength[t1], strength[t2]));
    }
  }

  // 計算小組排名以決定淘汰賽對陣
  function simpleStandings(gIdx, tids) {
    var pts = {};
    tids.forEach(function (t) { pts[t] = { id: t, mp: 0, df: 0 }; });
    groupMatches.filter(function (m) { return m.groupIndex === gIdx; }).forEach(function (m) {
      if (m.score1 > m.score2) { pts[m.team1Id].mp += 2; pts[m.team2Id].mp += 1; }
      else { pts[m.team2Id].mp += 2; pts[m.team1Id].mp += 1; }
      pts[m.team1Id].df += m.score1 - m.score2;
      pts[m.team2Id].df += m.score2 - m.score1;
    });
    return Object.values(pts).sort(function (a, b) {
      return b.mp !== a.mp ? b.mp - a.mp : b.df - a.df;
    });
  }

  var standA = simpleStandings(0, groupA);
  var standB = simpleStandings(1, groupB);

  var a1 = standA[0].id, a2 = standA[1].id;
  var b1 = standB[0].id, b2 = standB[1].id;

  // 淘汰賽
  var sf1 = genTeamMatchKO('k_sf_1', a1, b2, strength[a1], strength[b2]);
  var sf2 = genTeamMatchKO('k_sf_2', b1, a2, strength[b1], strength[a2]);
  var sf1Winner = sf1.score1 > sf1.score2 ? sf1.team1Id : sf1.team2Id;
  var sf1Loser = sf1.score1 > sf1.score2 ? sf1.team2Id : sf1.team1Id;
  var sf2Winner = sf2.score1 > sf2.score2 ? sf2.team1Id : sf2.team2Id;
  var sf2Loser = sf2.score1 > sf2.score2 ? sf2.team2Id : sf2.team1Id;

  var thirdPlace = genTeamMatchKO('k_3rd_1', sf1Loser, sf2Loser, strength[sf1Loser], strength[sf2Loser]);
  var final_ = genTeamMatchKO('k_final_1', sf1Winner, sf2Winner, strength[sf1Winner], strength[sf2Winner]);

  window.DEMO_DATA = {
    tournament: {
      name: "2026 春季乒乓球錦標賽",
      date: "2026年3月15日 - 3月20日",
      location: "台北市立體育館",
      rules: "一、賽事簡介\n本錦標賽共有 10 支隊伍參賽，每隊 10 名選手，分為兩階段進行。\n\n二、小組賽（第一階段）\n1. 10 支隊伍分為 A、B 兩組，每組 5 隊。\n2. 採組內單循環賽制，團體賽。\n3. 團體賽採 5 點（場）雙打，每點採五局三勝制。\n4. 每局 11 分，10 平後須連贏 2 分。\n5. 每隊 10 名選手分成 5 組雙打上場。\n6. 積分規則：勝場得 2 分，負場得 1 分。\n7. 若積分相同，依序比較：勝負關係 → 點差 → 局差 → 小分差。\n8. 每組前兩隊晉級淘汰賽。\n\n三、淘汰賽（第二階段）\n1. 團體賽同為 5 點雙打，每點採七局四勝制。\n2. 準決賽交叉對陣：A組第一 vs B組第二、B組第一 vs A組第二。\n3. 準決賽敗者進行季軍戰，勝者進行決賽。\n\n四、獎項\n冠軍、亞軍、季軍各頒發獎盃及獎金。",
      groupFormat: "五局三勝",
      knockoutFormat: "七局四勝"
    },
    teams: teams,
    groups: [
      { name: "A 組", teamIds: groupA, advanceCount: 2 },
      { name: "B 組", teamIds: groupB, advanceCount: 2 }
    ],
    groupMatches: groupMatches,
    knockout: {
      rounds: [
        { name: "準決賽", matches: [sf1, sf2] },
        { name: "季軍戰", matches: [thirdPlace] },
        { name: "決賽", matches: [final_] }
      ]
    }
  };
})();
