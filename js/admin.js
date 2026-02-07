// ===== Admin Page Logic =====
(function () {
  let data = null;

  function init() {
    data = getDataFromURL();
    if (data) {
      saveData(data);
      // Clean URL hash after loading
      history.replaceState(null, '', window.location.pathname);
    } else {
      data = loadData();
    }
    setupNav();
    setupSettings();
    setupTeams();
    setupGroups();
    setupKnockout();
    setupShare();
    renderAll();
  }

  // ===== Navigation =====
  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        const sec = document.getElementById('sec-' + this.dataset.section);
        if (sec) sec.classList.add('active');
        // Refresh the target section
        const section = this.dataset.section;
        if (section === 'groupmatches') renderGroupMatches();
        if (section === 'knockout') renderKnockoutRounds();
        if (section === 'share') updateShareLinks();
      });
    });
  }

  function renderAll() {
    renderSettingsForm();
    renderTeamList();
    renderGroupConfig();
    renderGroupMatches();
    renderKnockoutRounds();
  }

  function persist() {
    saveData(data);
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  }

  // ===== Settings =====
  function setupSettings() {
    document.getElementById('btnSaveSettings').addEventListener('click', () => {
      data.tournament.name = document.getElementById('inputName').value.trim();
      data.tournament.date = document.getElementById('inputDate').value.trim();
      data.tournament.location = document.getElementById('inputLocation').value.trim();
      data.tournament.rules = document.getElementById('inputRules').value;
      data.tournament.groupFormat = document.getElementById('inputGroupFormat').value;
      data.tournament.knockoutFormat = document.getElementById('inputKnockoutFormat').value;
      persist();
      document.getElementById('adminTitle').textContent = (data.tournament.name || '乒乓球錦標賽') + ' - 管理後台';
      showToast('設定已儲存');
    });
  }

  function renderSettingsForm() {
    const t = data.tournament;
    document.getElementById('inputName').value = t.name || '';
    document.getElementById('inputDate').value = t.date || '';
    document.getElementById('inputLocation').value = t.location || '';
    document.getElementById('inputRules').value = t.rules || '';
    document.getElementById('inputGroupFormat').value = t.groupFormat || '五局三勝';
    document.getElementById('inputKnockoutFormat').value = t.knockoutFormat || '七局四勝';
    if (t.name) {
      document.getElementById('adminTitle').textContent = t.name + ' - 管理後台';
    }
  }

  // ===== Teams =====
  function setupTeams() {
    const input = document.getElementById('inputTeamName');
    document.getElementById('btnAddTeam').addEventListener('click', () => addTeam());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTeam(); });
  }

  function addTeam() {
    const input = document.getElementById('inputTeamName');
    const name = input.value.trim();
    if (!name) return;
    if (data.teams.length >= 10) {
      showToast('最多只能新增 10 支隊伍');
      return;
    }
    if (data.teams.some(t => t.name === name)) {
      showToast('隊伍名稱已存在');
      return;
    }
    data.teams.push({ id: nextTeamId(data.teams), name });
    persist();
    input.value = '';
    input.focus();
    renderTeamList();
    showToast('已新增隊伍：' + name);
  }

  function removeTeam(id) {
    if (!confirm('確定要刪除此隊伍？相關的比賽記錄也會受影響。')) return;
    data.teams = data.teams.filter(t => t.id !== id);
    // Remove from groups
    data.groups.forEach(g => {
      g.teamIds = g.teamIds.filter(tid => tid !== id);
    });
    // Remove related matches
    data.groupMatches = data.groupMatches.filter(m => m.team1Id !== id && m.team2Id !== id);
    persist();
    renderTeamList();
    renderGroupConfig();
    showToast('隊伍已刪除');
  }

  function renderTeamList() {
    const container = document.getElementById('teamList');
    document.getElementById('teamCount').textContent = data.teams.length + ' / 10';

    if (data.teams.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚未新增任何隊伍</p></div>';
      return;
    }

    let html = '';
    data.teams.forEach((team, i) => {
      html += '<div class="team-item">';
      html += '<div class="team-info"><span class="team-number">' + (i + 1) + '</span><span>' + escHtml(team.name) + '</span></div>';
      html += '<button class="btn btn-danger btn-sm" data-remove-team="' + team.id + '">刪除</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-remove-team]').forEach(btn => {
      btn.addEventListener('click', () => removeTeam(parseInt(btn.dataset.removeTeam)));
    });
  }

  // ===== Groups =====
  function setupGroups() {
    document.getElementById('btnAutoGroup').addEventListener('click', autoGroup);
    document.getElementById('btnSaveGroups').addEventListener('click', saveGroupsAndGenerateMatches);
  }

  function autoGroup() {
    const groupCount = parseInt(document.getElementById('inputGroupCount').value);
    const advanceCount = parseInt(document.getElementById('inputAdvanceCount').value);
    if (data.teams.length < 2) {
      showToast('請先新增至少 2 支隊伍');
      return;
    }

    // Shuffle teams
    const shuffled = [...data.teams].sort(() => Math.random() - 0.5);
    const groups = [];
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 0; i < groupCount; i++) {
      groups.push({ name: groupNames[i] + ' 組', teamIds: [], advanceCount });
    }

    // Distribute teams evenly
    shuffled.forEach((team, i) => {
      groups[i % groupCount].teamIds.push(team.id);
    });

    data.groups = groups;
    persist();
    renderGroupConfig();
    showToast('已自動分組');
  }

  function renderGroupConfig() {
    const container = document.getElementById('groupConfig');
    if (data.groups.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    data.groups.forEach((group, gi) => {
      html += '<div class="group-card">';
      html += '<div class="group-card-title">' + escHtml(group.name) + ' <span class="badge badge-accent">' + group.teamIds.length + ' 隊</span></div>';

      // Team list in this group
      group.teamIds.forEach(tid => {
        const team = getTeamById(data.teams, tid);
        if (!team) return;
        html += '<div class="group-team-item"><span>' + escHtml(team.name) + '</span>';
        html += '<button class="btn btn-danger btn-sm" data-remove-from-group="' + gi + '_' + tid + '">移除</button></div>';
      });

      // Add team to group dropdown
      const availableTeams = data.teams.filter(t => !group.teamIds.includes(t.id));
      if (availableTeams.length > 0) {
        html += '<div style="margin-top:8px;display:flex;gap:6px;">';
        html += '<select class="form-control" id="addToGroup' + gi + '" style="flex:1;">';
        html += '<option value="">選擇隊伍...</option>';
        availableTeams.forEach(t => {
          html += '<option value="' + t.id + '">' + escHtml(t.name) + '</option>';
        });
        html += '</select>';
        html += '<button class="btn btn-primary btn-sm" data-add-to-group="' + gi + '">加入</button>';
        html += '</div>';
      }

      html += '</div>';
    });
    container.innerHTML = html;

    // Event listeners for remove from group
    container.querySelectorAll('[data-remove-from-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [gi, tid] = btn.dataset.removeFromGroup.split('_').map(Number);
        data.groups[gi].teamIds = data.groups[gi].teamIds.filter(id => id !== tid);
        persist();
        renderGroupConfig();
      });
    });

    // Event listeners for add to group
    container.querySelectorAll('[data-add-to-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gi = parseInt(btn.dataset.addToGroup);
        const select = document.getElementById('addToGroup' + gi);
        const tid = parseInt(select.value);
        if (!tid) return;
        // Remove from other groups first
        data.groups.forEach(g => {
          g.teamIds = g.teamIds.filter(id => id !== tid);
        });
        data.groups[gi].teamIds.push(tid);
        persist();
        renderGroupConfig();
      });
    });
  }

  function saveGroupsAndGenerateMatches() {
    const advanceCount = parseInt(document.getElementById('inputAdvanceCount').value);
    data.groups.forEach(g => g.advanceCount = advanceCount);

    // Check if groups have teams
    const hasTeams = data.groups.some(g => g.teamIds.length >= 2);
    if (!hasTeams) {
      showToast('每組至少需要 2 支隊伍');
      return;
    }

    // Generate round-robin matches for each group
    // Preserve existing completed matches
    const existingCompleted = {};
    data.groupMatches.filter(m => m.completed).forEach(m => {
      existingCompleted[m.id] = m;
    });

    const newMatches = [];
    data.groups.forEach((group, gi) => {
      const matches = generateRoundRobinMatches(gi, group.teamIds);
      matches.forEach(m => {
        if (existingCompleted[m.id]) {
          newMatches.push(existingCompleted[m.id]);
        } else {
          newMatches.push(m);
        }
      });
    });

    data.groupMatches = newMatches;
    persist();
    renderGroupMatches();
    showToast('分組已儲存，賽程已產生');
  }

  // ===== Group Matches =====
  function renderGroupMatches() {
    const container = document.getElementById('groupMatchesContainer');
    if (data.groupMatches.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚無小組賽程，請先完成分組設定</p></div>';
      return;
    }

    let html = '';
    data.groups.forEach((group, gi) => {
      const matches = data.groupMatches.filter(m => m.groupIndex === gi);
      if (matches.length === 0) return;

      html += '<div class="card">';
      html += '<div class="card-title">' + escHtml(group.name) + '</div>';

      matches.forEach(m => {
        const t1 = getTeamName(data.teams, m.team1Id);
        const t2 = getTeamName(data.teams, m.team2Id);
        const statusClass = m.completed ? 'badge-green' : 'badge-yellow';
        const statusText = m.completed ? '已完成' : '未開始';

        html += '<div class="match-edit-item" id="match-' + m.id + '">';
        html += '<div class="match-edit-header">';
        html += '<div class="match-edit-teams"><span>' + escHtml(t1) + '</span><span class="vs">vs</span><span>' + escHtml(t2) + '</span></div>';
        html += '<span class="badge ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';

        // Score inputs
        html += '<div class="score-input-row">';
        html += '<span style="color:var(--text-secondary);font-size:0.85rem;min-width:60px;">' + escHtml(t1) + '</span>';
        html += '<input type="number" class="score-input" min="0" max="4" value="' + m.score1 + '" data-match="' + m.id + '" data-field="score1">';
        html += '<span style="color:var(--text-muted);">:</span>';
        html += '<input type="number" class="score-input" min="0" max="4" value="' + m.score2 + '" data-match="' + m.id + '" data-field="score2">';
        html += '<span style="color:var(--text-secondary);font-size:0.85rem;">' + escHtml(t2) + '</span>';
        html += '</div>';

        // Game-by-game scores
        html += '<div style="margin-top:8px;">';
        html += '<label style="font-size:0.8rem;color:var(--text-muted);">各局比分（選填）：</label>';
        html += '<div class="game-scores" data-games-for="' + m.id + '">';
        const totalGames = (m.score1 || 0) + (m.score2 || 0);
        for (let g = 0; g < Math.max(totalGames, m.games ? m.games.length : 0); g++) {
          const gs = (m.games && m.games[g]) || { s1: '', s2: '' };
          html += '<div class="game-score-pair">';
          html += '<input type="number" class="score-input" style="width:38px;padding:3px;" min="0" max="99" value="' + (gs.s1 !== undefined ? gs.s1 : '') + '" data-match="' + m.id + '" data-game="' + g + '" data-gs="s1">';
          html += '<span style="color:var(--text-muted);">-</span>';
          html += '<input type="number" class="score-input" style="width:38px;padding:3px;" min="0" max="99" value="' + (gs.s2 !== undefined ? gs.s2 : '') + '" data-match="' + m.id + '" data-game="' + g + '" data-gs="s2">';
          html += '</div>';
        }
        html += '</div></div>';

        // Save button for this match
        html += '<div style="margin-top:8px;display:flex;gap:8px;">';
        html += '<button class="btn btn-success btn-sm" data-save-match="' + m.id + '">儲存成績</button>';
        if (m.completed) {
          html += '<button class="btn btn-outline btn-sm" data-reset-match="' + m.id + '">重置</button>';
        }
        html += '</div>';

        html += '</div>';
      });

      html += '</div>';
    });

    container.innerHTML = html;

    // Event listeners for saving match results
    container.querySelectorAll('[data-save-match]').forEach(btn => {
      btn.addEventListener('click', () => saveMatchResult(btn.dataset.saveMatch));
    });

    container.querySelectorAll('[data-reset-match]').forEach(btn => {
      btn.addEventListener('click', () => resetMatch(btn.dataset.resetMatch));
    });
  }

  function saveMatchResult(matchId) {
    const match = data.groupMatches.find(m => m.id === matchId);
    if (!match) return;

    const score1Input = document.querySelector('[data-match="' + matchId + '"][data-field="score1"]');
    const score2Input = document.querySelector('[data-match="' + matchId + '"][data-field="score2"]');
    match.score1 = parseInt(score1Input.value) || 0;
    match.score2 = parseInt(score2Input.value) || 0;

    // Collect game scores
    match.games = [];
    const gameInputs = document.querySelectorAll('[data-match="' + matchId + '"][data-game]');
    const gameMap = {};
    gameInputs.forEach(inp => {
      const g = inp.dataset.game;
      if (!gameMap[g]) gameMap[g] = {};
      gameMap[g][inp.dataset.gs] = parseInt(inp.value) || 0;
    });
    Object.keys(gameMap).sort((a, b) => a - b).forEach(g => {
      match.games.push({ s1: gameMap[g].s1 || 0, s2: gameMap[g].s2 || 0 });
    });

    match.completed = (match.score1 > 0 || match.score2 > 0);
    persist();
    renderGroupMatches();
    showToast('成績已儲存');
  }

  function resetMatch(matchId) {
    const match = data.groupMatches.find(m => m.id === matchId);
    if (!match) return;
    match.score1 = 0;
    match.score2 = 0;
    match.games = [];
    match.completed = false;
    persist();
    renderGroupMatches();
    showToast('成績已重置');
  }

  // ===== Knockout =====
  function setupKnockout() {
    document.getElementById('btnAddRound').addEventListener('click', addKnockoutRound);
    document.getElementById('btnAutoKnockout').addEventListener('click', autoKnockout);
  }

  function addKnockoutRound() {
    const roundNames = ['八強', '四強', '準決賽', '決賽', '季軍戰'];
    const name = prompt('輸入輪次名稱：', roundNames[data.knockout.rounds.length] || '輪次');
    if (!name) return;
    data.knockout.rounds.push({ name, matches: [] });
    persist();
    renderKnockoutRounds();
  }

  function autoKnockout() {
    if (data.groups.length === 0) {
      showToast('請先完成小組賽分組');
      return;
    }

    // Get qualified teams from each group
    const qualifiedTeams = [];
    data.groups.forEach((group, gi) => {
      const standings = calculateStandings(gi, group.teamIds, data.groupMatches);
      const advanceCount = group.advanceCount || 2;
      standings.slice(0, advanceCount).forEach(s => {
        qualifiedTeams.push({ teamId: s.teamId, groupIndex: gi, rank: standings.indexOf(s) });
      });
    });

    if (qualifiedTeams.length < 2) {
      showToast('晉級隊伍不足，無法產生淘汰賽');
      return;
    }

    const numTeams = qualifiedTeams.length;
    const rounds = [];

    if (numTeams <= 2) {
      // Just final
      rounds.push({
        name: '決賽',
        matches: [{
          id: 'k_final_1',
          team1Id: qualifiedTeams[0] ? qualifiedTeams[0].teamId : null,
          team2Id: qualifiedTeams[1] ? qualifiedTeams[1].teamId : null,
          score1: 0, score2: 0, games: [], completed: false
        }]
      });
    } else if (numTeams <= 4) {
      // SF + Final + 3rd
      const sfMatches = [];
      // Cross-group matching: Group A #1 vs Group B #2, Group B #1 vs Group A #2
      if (data.groups.length === 2 && qualifiedTeams.length === 4) {
        const ga = qualifiedTeams.filter(t => t.groupIndex === 0).sort((a, b) => a.rank - b.rank);
        const gb = qualifiedTeams.filter(t => t.groupIndex === 1).sort((a, b) => a.rank - b.rank);
        sfMatches.push({ id: 'k_sf_1', team1Id: ga[0].teamId, team2Id: gb[1].teamId, score1: 0, score2: 0, games: [], completed: false });
        sfMatches.push({ id: 'k_sf_2', team1Id: gb[0].teamId, team2Id: ga[1].teamId, score1: 0, score2: 0, games: [], completed: false });
      } else {
        for (let i = 0; i < numTeams; i += 2) {
          sfMatches.push({
            id: 'k_sf_' + (i / 2 + 1),
            team1Id: qualifiedTeams[i] ? qualifiedTeams[i].teamId : null,
            team2Id: qualifiedTeams[i + 1] ? qualifiedTeams[i + 1].teamId : null,
            score1: 0, score2: 0, games: [], completed: false
          });
        }
      }
      rounds.push({ name: '準決賽', matches: sfMatches });
      rounds.push({ name: '季軍戰', matches: [{ id: 'k_3rd_1', team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false }] });
      rounds.push({ name: '決賽', matches: [{ id: 'k_final_1', team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false }] });
    } else {
      // QF + SF + Final + 3rd
      const qfMatches = [];
      // Cross-group matching for 8 teams
      if (data.groups.length === 2 && numTeams === 8) {
        const ga = qualifiedTeams.filter(t => t.groupIndex === 0).sort((a, b) => a.rank - b.rank);
        const gb = qualifiedTeams.filter(t => t.groupIndex === 1).sort((a, b) => a.rank - b.rank);
        qfMatches.push({ id: 'k_qf_1', team1Id: ga[0].teamId, team2Id: gb[3].teamId, score1: 0, score2: 0, games: [], completed: false });
        qfMatches.push({ id: 'k_qf_2', team1Id: gb[1].teamId, team2Id: ga[2].teamId, score1: 0, score2: 0, games: [], completed: false });
        qfMatches.push({ id: 'k_qf_3', team1Id: ga[1].teamId, team2Id: gb[2].teamId, score1: 0, score2: 0, games: [], completed: false });
        qfMatches.push({ id: 'k_qf_4', team1Id: gb[0].teamId, team2Id: ga[3].teamId, score1: 0, score2: 0, games: [], completed: false });
      } else {
        for (let i = 0; i < numTeams; i += 2) {
          if (i + 1 < numTeams) {
            qfMatches.push({
              id: 'k_qf_' + (i / 2 + 1),
              team1Id: qualifiedTeams[i].teamId,
              team2Id: qualifiedTeams[i + 1].teamId,
              score1: 0, score2: 0, games: [], completed: false
            });
          }
        }
      }
      rounds.push({ name: '八強', matches: qfMatches });
      const sfCount = Math.ceil(qfMatches.length / 2);
      const sfMatches = [];
      for (let i = 0; i < sfCount; i++) {
        sfMatches.push({ id: 'k_sf_' + (i + 1), team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false });
      }
      rounds.push({ name: '準決賽', matches: sfMatches });
      rounds.push({ name: '季軍戰', matches: [{ id: 'k_3rd_1', team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false }] });
      rounds.push({ name: '決賽', matches: [{ id: 'k_final_1', team1Id: null, team2Id: null, score1: 0, score2: 0, games: [], completed: false }] });
    }

    data.knockout.rounds = rounds;
    persist();
    renderKnockoutRounds();
    showToast('淘汰賽已自動產生');
  }

  function renderKnockoutRounds() {
    const container = document.getElementById('knockoutRoundsContainer');
    const rounds = data.knockout.rounds;

    if (rounds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚未設定淘汰賽</p></div>';
      return;
    }

    let html = '';
    rounds.forEach((round, ri) => {
      html += '<div class="knockout-round-card">';
      html += '<div class="knockout-round-header">';
      html += '<h3>' + escHtml(round.name) + '</h3>';
      html += '<div class="btn-group">';
      html += '<button class="btn btn-primary btn-sm" data-add-ko-match="' + ri + '">新增比賽</button>';
      html += '<button class="btn btn-danger btn-sm" data-remove-round="' + ri + '">刪除輪次</button>';
      html += '</div></div>';

      round.matches.forEach((m, mi) => {
        const t1Name = m.team1Id ? getTeamName(data.teams, m.team1Id) : 'TBD';
        const t2Name = m.team2Id ? getTeamName(data.teams, m.team2Id) : 'TBD';
        const statusClass = m.completed ? 'badge-green' : 'badge-yellow';
        const statusText = m.completed ? '已完成' : '未開始';

        html += '<div class="match-edit-item">';
        html += '<div class="match-edit-header">';
        html += '<span class="badge ' + statusClass + '">' + statusText + '</span>';
        html += '<button class="btn btn-danger btn-sm" data-remove-ko-match="' + ri + '_' + mi + '">刪除</button>';
        html += '</div>';

        // Team selection dropdowns
        html += '<div class="score-input-row">';
        html += '<select class="form-control" style="flex:1;" data-ko-team="' + ri + '_' + mi + '_1" value="' + (m.team1Id || '') + '">';
        html += '<option value="">選擇隊伍...</option>';
        data.teams.forEach(t => {
          const sel = t.id === m.team1Id ? ' selected' : '';
          html += '<option value="' + t.id + '"' + sel + '>' + escHtml(t.name) + '</option>';
        });
        html += '</select>';
        html += '<span style="color:var(--text-muted);font-weight:600;">VS</span>';
        html += '<select class="form-control" style="flex:1;" data-ko-team="' + ri + '_' + mi + '_2">';
        html += '<option value="">選擇隊伍...</option>';
        data.teams.forEach(t => {
          const sel = t.id === m.team2Id ? ' selected' : '';
          html += '<option value="' + t.id + '"' + sel + '>' + escHtml(t.name) + '</option>';
        });
        html += '</select></div>';

        // Score inputs
        html += '<div class="score-input-row" style="margin-top:8px;">';
        html += '<span style="color:var(--text-secondary);font-size:0.85rem;">' + escHtml(t1Name) + '</span>';
        html += '<input type="number" class="score-input" min="0" max="4" value="' + m.score1 + '" data-ko-score="' + ri + '_' + mi + '_1">';
        html += '<span style="color:var(--text-muted);">:</span>';
        html += '<input type="number" class="score-input" min="0" max="4" value="' + m.score2 + '" data-ko-score="' + ri + '_' + mi + '_2">';
        html += '<span style="color:var(--text-secondary);font-size:0.85rem;">' + escHtml(t2Name) + '</span>';
        html += '</div>';

        // Game-by-game scores
        html += '<div style="margin-top:8px;">';
        html += '<label style="font-size:0.8rem;color:var(--text-muted);">各局比分（選填）：</label>';
        html += '<div class="game-scores">';
        const totalGames = (m.score1 || 0) + (m.score2 || 0);
        for (let g = 0; g < Math.max(totalGames, m.games ? m.games.length : 0); g++) {
          const gs = (m.games && m.games[g]) || { s1: '', s2: '' };
          html += '<div class="game-score-pair">';
          html += '<input type="number" class="score-input" style="width:38px;padding:3px;" min="0" max="99" value="' + (gs.s1 !== undefined ? gs.s1 : '') + '" data-ko-game="' + ri + '_' + mi + '_' + g + '_s1">';
          html += '<span style="color:var(--text-muted);">-</span>';
          html += '<input type="number" class="score-input" style="width:38px;padding:3px;" min="0" max="99" value="' + (gs.s2 !== undefined ? gs.s2 : '') + '" data-ko-game="' + ri + '_' + mi + '_' + g + '_s2">';
          html += '</div>';
        }
        html += '</div></div>';

        html += '<div style="margin-top:8px;">';
        html += '<button class="btn btn-success btn-sm" data-save-ko="' + ri + '_' + mi + '">儲存成績</button>';
        html += '</div>';

        html += '</div>';
      });

      html += '</div>';
    });

    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('[data-add-ko-match]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ri = parseInt(btn.dataset.addKoMatch);
        const mi = data.knockout.rounds[ri].matches.length;
        data.knockout.rounds[ri].matches.push({
          id: 'k_' + ri + '_' + mi + '_' + Date.now(),
          team1Id: null, team2Id: null,
          score1: 0, score2: 0, games: [], completed: false
        });
        persist();
        renderKnockoutRounds();
      });
    });

    container.querySelectorAll('[data-remove-round]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('確定要刪除此輪次？')) return;
        data.knockout.rounds.splice(parseInt(btn.dataset.removeRound), 1);
        persist();
        renderKnockoutRounds();
      });
    });

    container.querySelectorAll('[data-remove-ko-match]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [ri, mi] = btn.dataset.removeKoMatch.split('_').map(Number);
        data.knockout.rounds[ri].matches.splice(mi, 1);
        persist();
        renderKnockoutRounds();
      });
    });

    container.querySelectorAll('[data-save-ko]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [ri, mi] = btn.dataset.saveKo.split('_').map(Number);
        saveKnockoutMatch(ri, mi);
      });
    });
  }

  function saveKnockoutMatch(ri, mi) {
    const match = data.knockout.rounds[ri].matches[mi];

    // Get team selections
    const t1Select = document.querySelector('[data-ko-team="' + ri + '_' + mi + '_1"]');
    const t2Select = document.querySelector('[data-ko-team="' + ri + '_' + mi + '_2"]');
    match.team1Id = t1Select.value ? parseInt(t1Select.value) : null;
    match.team2Id = t2Select.value ? parseInt(t2Select.value) : null;

    // Get scores
    const s1Input = document.querySelector('[data-ko-score="' + ri + '_' + mi + '_1"]');
    const s2Input = document.querySelector('[data-ko-score="' + ri + '_' + mi + '_2"]');
    match.score1 = parseInt(s1Input.value) || 0;
    match.score2 = parseInt(s2Input.value) || 0;

    // Get game scores
    match.games = [];
    const totalGames = match.score1 + match.score2;
    for (let g = 0; g < totalGames; g++) {
      const gs1 = document.querySelector('[data-ko-game="' + ri + '_' + mi + '_' + g + '_s1"]');
      const gs2 = document.querySelector('[data-ko-game="' + ri + '_' + mi + '_' + g + '_s2"]');
      if (gs1 && gs2) {
        match.games.push({ s1: parseInt(gs1.value) || 0, s2: parseInt(gs2.value) || 0 });
      }
    }

    match.completed = match.team1Id && match.team2Id && (match.score1 > 0 || match.score2 > 0);
    persist();
    renderKnockoutRounds();
    showToast('淘汰賽成績已儲存');
  }

  // ===== Share =====
  function setupShare() {
    document.getElementById('btnCopyView').addEventListener('click', () => {
      const url = document.getElementById('viewUrl').value;
      copyToClipboard(url);
      showToast('觀看連結已複製');
    });

    document.getElementById('btnCopyAdmin').addEventListener('click', () => {
      const url = document.getElementById('adminUrl').value;
      copyToClipboard(url);
      showToast('管理連結已複製');
    });

    document.getElementById('btnExport').addEventListener('click', exportJSON);
    document.getElementById('btnImport').addEventListener('click', () => {
      document.getElementById('fileImport').click();
    });
    document.getElementById('fileImport').addEventListener('change', importJSON);

    document.getElementById('btnReset').addEventListener('click', () => {
      if (!confirm('確定要重置所有資料？此操作無法復原！')) return;
      if (!confirm('真的確定嗎？所有比賽資料都會被清除。')) return;
      data = getDefaultData();
      persist();
      renderAll();
      showToast('所有資料已重置');
    });
  }

  function updateShareLinks() {
    document.getElementById('viewUrl').value = generateViewURL(data);
    document.getElementById('adminUrl').value = generateAdminURL(data);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  function exportJSON() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (data.tournament.name || 'tournament') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('資料已匯出');
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.tournament && imported.teams) {
          data = imported;
          persist();
          renderAll();
          showToast('資料已匯入');
        } else {
          showToast('無效的資料格式');
        }
      } catch (err) {
        showToast('匯入失敗：' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ===== Utilities =====
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
