// ===== Demo Tournament Data =====
// 當 localStorage 無資料時，自動載入此測試資料
const DEMO_DATA = {
  tournament: {
    name: "2026 春季乒乓球錦標賽",
    date: "2026年3月15日 - 3月20日",
    location: "台北市立體育館",
    rules: "一、賽事簡介\n本錦標賽共有 10 支隊伍參賽，分為兩階段進行。\n\n二、小組賽（第一階段）\n1. 10 支隊伍分為 A、B 兩組，每組 5 隊。\n2. 採組內單循環賽制（每隊與同組所有對手各比一場）。\n3. 小組賽採五局三勝制，每局 11 分，10 平後須連贏 2 分。\n4. 積分規則：勝場得 2 分，負場得 1 分。\n5. 若積分相同，依序比較：勝負關係 → 局分差 → 小分差。\n6. 每組前兩名晉級淘汰賽。\n\n三、淘汰賽（第二階段）\n1. 採七局四勝制。\n2. 準決賽交叉對陣：A組第一 vs B組第二、B組第一 vs A組第二。\n3. 準決賽敗者進行季軍戰，勝者進行決賽。\n\n四、獎項\n冠軍、亞軍、季軍各頒發獎盃及獎金。",
    groupFormat: "五局三勝",
    knockoutFormat: "七局四勝"
  },
  teams: [
    { id: 1, name: "龍騰" },
    { id: 2, name: "鳳翔" },
    { id: 3, name: "虎嘯" },
    { id: 4, name: "熊霸" },
    { id: 5, name: "鷹擊" },
    { id: 6, name: "狼群" },
    { id: 7, name: "豹速" },
    { id: 8, name: "獅吼" },
    { id: 9, name: "蛇行" },
    { id: 10, name: "麒麟" }
  ],
  groups: [
    { name: "A 組", teamIds: [1, 3, 5, 6, 9], advanceCount: 2 },
    { name: "B 組", teamIds: [2, 4, 7, 8, 10], advanceCount: 2 }
  ],
  groupMatches: [
    // ========== A 組 ==========
    // 龍騰(1W) 4勝0負 | 鷹擊(2nd) 3勝1負 | 虎嘯 2勝2負 | 狼群 1勝3負 | 蛇行 0勝4負

    // 龍騰 vs 虎嘯  3:1
    { id: "g0_1_3", groupIndex: 0, team1Id: 1, team2Id: 3,
      score1: 3, score2: 1,
      games: [{s1:11,s2:8},{s1:11,s2:9},{s1:9,s2:11},{s1:11,s2:7}],
      completed: true },
    // 龍騰 vs 鷹擊  3:2 (激戰)
    { id: "g0_1_5", groupIndex: 0, team1Id: 1, team2Id: 5,
      score1: 3, score2: 2,
      games: [{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:7},{s1:9,s2:11},{s1:11,s2:8}],
      completed: true },
    // 龍騰 vs 狼群  3:0
    { id: "g0_1_6", groupIndex: 0, team1Id: 1, team2Id: 6,
      score1: 3, score2: 0,
      games: [{s1:11,s2:5},{s1:11,s2:7},{s1:11,s2:6}],
      completed: true },
    // 龍騰 vs 蛇行  3:0
    { id: "g0_1_9", groupIndex: 0, team1Id: 1, team2Id: 9,
      score1: 3, score2: 0,
      games: [{s1:11,s2:6},{s1:11,s2:4},{s1:11,s2:5}],
      completed: true },
    // 虎嘯 vs 鷹擊  1:3
    { id: "g0_3_5", groupIndex: 0, team1Id: 3, team2Id: 5,
      score1: 1, score2: 3,
      games: [{s1:11,s2:9},{s1:8,s2:11},{s1:9,s2:11},{s1:7,s2:11}],
      completed: true },
    // 虎嘯 vs 狼群  3:1
    { id: "g0_3_6", groupIndex: 0, team1Id: 3, team2Id: 6,
      score1: 3, score2: 1,
      games: [{s1:11,s2:7},{s1:9,s2:11},{s1:11,s2:8},{s1:11,s2:6}],
      completed: true },
    // 虎嘯 vs 蛇行  3:0
    { id: "g0_3_9", groupIndex: 0, team1Id: 3, team2Id: 9,
      score1: 3, score2: 0,
      games: [{s1:11,s2:6},{s1:11,s2:8},{s1:11,s2:7}],
      completed: true },
    // 鷹擊 vs 狼群  3:1
    { id: "g0_5_6", groupIndex: 0, team1Id: 5, team2Id: 6,
      score1: 3, score2: 1,
      games: [{s1:11,s2:9},{s1:11,s2:7},{s1:8,s2:11},{s1:11,s2:6}],
      completed: true },
    // 鷹擊 vs 蛇行  3:0
    { id: "g0_5_9", groupIndex: 0, team1Id: 5, team2Id: 9,
      score1: 3, score2: 0,
      games: [{s1:11,s2:5},{s1:11,s2:8},{s1:11,s2:6}],
      completed: true },
    // 狼群 vs 蛇行  3:2 (五局大戰)
    { id: "g0_6_9", groupIndex: 0, team1Id: 6, team2Id: 9,
      score1: 3, score2: 2,
      games: [{s1:9,s2:11},{s1:11,s2:8},{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:9}],
      completed: true },

    // ========== B 組 ==========
    // 鳳翔(1st) 4勝0負 | 熊霸(2nd) 3勝1負 | 豹速 2勝2負 | 獅吼 1勝3負 | 麒麟 0勝4負

    // 鳳翔 vs 熊霸  3:2 (精彩激戰)
    { id: "g1_2_4", groupIndex: 1, team1Id: 2, team2Id: 4,
      score1: 3, score2: 2,
      games: [{s1:11,s2:8},{s1:9,s2:11},{s1:13,s2:11},{s1:8,s2:11},{s1:11,s2:9}],
      completed: true },
    // 鳳翔 vs 豹速  3:1
    { id: "g1_2_7", groupIndex: 1, team1Id: 2, team2Id: 7,
      score1: 3, score2: 1,
      games: [{s1:11,s2:7},{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:6}],
      completed: true },
    // 鳳翔 vs 獅吼  3:0
    { id: "g1_2_8", groupIndex: 1, team1Id: 2, team2Id: 8,
      score1: 3, score2: 0,
      games: [{s1:11,s2:5},{s1:11,s2:8},{s1:11,s2:7}],
      completed: true },
    // 鳳翔 vs 麒麟  3:0
    { id: "g1_2_10", groupIndex: 1, team1Id: 2, team2Id: 10,
      score1: 3, score2: 0,
      games: [{s1:11,s2:4},{s1:11,s2:6},{s1:11,s2:3}],
      completed: true },
    // 熊霸 vs 豹速  3:1
    { id: "g1_4_7", groupIndex: 1, team1Id: 4, team2Id: 7,
      score1: 3, score2: 1,
      games: [{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:7},{s1:11,s2:8}],
      completed: true },
    // 熊霸 vs 獅吼  3:2
    { id: "g1_4_8", groupIndex: 1, team1Id: 4, team2Id: 8,
      score1: 3, score2: 2,
      games: [{s1:11,s2:9},{s1:9,s2:11},{s1:11,s2:8},{s1:8,s2:11},{s1:11,s2:7}],
      completed: true },
    // 熊霸 vs 麒麟  3:0
    { id: "g1_4_10", groupIndex: 1, team1Id: 4, team2Id: 10,
      score1: 3, score2: 0,
      games: [{s1:11,s2:5},{s1:11,s2:7},{s1:11,s2:4}],
      completed: true },
    // 豹速 vs 獅吼  3:2
    { id: "g1_7_8", groupIndex: 1, team1Id: 7, team2Id: 8,
      score1: 3, score2: 2,
      games: [{s1:9,s2:11},{s1:11,s2:8},{s1:11,s2:9},{s1:7,s2:11},{s1:11,s2:8}],
      completed: true },
    // 豹速 vs 麒麟  3:1
    { id: "g1_7_10", groupIndex: 1, team1Id: 7, team2Id: 10,
      score1: 3, score2: 1,
      games: [{s1:11,s2:7},{s1:9,s2:11},{s1:11,s2:6},{s1:11,s2:8}],
      completed: true },
    // 獅吼 vs 麒麟  3:1
    { id: "g1_8_10", groupIndex: 1, team1Id: 8, team2Id: 10,
      score1: 3, score2: 1,
      games: [{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:7},{s1:11,s2:6}],
      completed: true }
  ],
  knockout: {
    rounds: [
      {
        name: "準決賽",
        matches: [
          // 龍騰(A1) vs 熊霸(B2)  4:2
          { id: "k_sf_1", team1Id: 1, team2Id: 4,
            score1: 4, score2: 2,
            games: [{s1:11,s2:8},{s1:9,s2:11},{s1:11,s2:7},{s1:8,s2:11},{s1:11,s2:9},{s1:11,s2:7}],
            completed: true },
          // 鳳翔(B1) vs 鷹擊(A2)  4:3 (史詩級七局大戰)
          { id: "k_sf_2", team1Id: 2, team2Id: 5,
            score1: 4, score2: 3,
            games: [{s1:11,s2:9},{s1:8,s2:11},{s1:11,s2:7},{s1:9,s2:11},{s1:8,s2:11},{s1:11,s2:9},{s1:11,s2:8}],
            completed: true }
        ]
      },
      {
        name: "季軍戰",
        matches: [
          // 鷹擊 vs 熊霸  4:1
          { id: "k_3rd_1", team1Id: 5, team2Id: 4,
            score1: 4, score2: 1,
            games: [{s1:8,s2:11},{s1:11,s2:8},{s1:11,s2:6},{s1:11,s2:9},{s1:11,s2:7}],
            completed: true }
        ]
      },
      {
        name: "決賽",
        matches: [
          // 龍騰 vs 鳳翔  4:3 (驚天逆轉的冠軍爭奪戰)
          { id: "k_final_1", team1Id: 1, team2Id: 2,
            score1: 4, score2: 3,
            games: [{s1:11,s2:9},{s1:9,s2:11},{s1:11,s2:8},{s1:8,s2:11},{s1:12,s2:10},{s1:9,s2:11},{s1:11,s2:8}],
            completed: true }
        ]
      }
    ]
  }
};
