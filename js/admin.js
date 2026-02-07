// ===== Admin Page Logic (團體賽版) =====
(function () {
  let data = null;

  function init() {
    data = getDataFromURL();
    if (data) { saveData(data); history.replaceState(null, '', window.location.pathname); }
    else data = loadData();
    setupNav(); setupSettings(); setupTeams(); setupGroups(); setupKnockout(); setupShare();
    renderAll();
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('sec-' + this.dataset.section)?.classList.add('active');
        const sec = this.dataset.section;
        if (sec === 'groupmatches') renderGroupMatches();
        if (sec === 'knockout') renderKnockoutRounds();
        if (sec === 'share') updateShareLinks();
      });
    });
  }

  function renderAll() { renderSettingsForm(); renderTeamList(); renderGroupConfig(); renderGroupMatches(); renderKnockoutRounds(); }
  function persist() { saveData(data); }
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
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
    if (t.name) document.getElementById('adminTitle').textContent = t.name + ' - 管理後台';
  }

  // ===== Teams (含球員管理) =====
  function setupTeams() {
    document.getElementById('btnAddTeam').addEventListener('click', addTeam);
    document.getElementById('inputTeamName').addEventListener('keydown', e => { if (e.key === 'Enter') addTeam(); });
  }
  function addTeam() {
    const input = document.getElementById('inputTeamName');
    const name = input.value.trim();
    if (!name) return;
    if (data.teams.length >= 10) { showToast('最多 10 支隊伍'); return; }
    if (data.teams.some(t => t.name === name)) { showToast('名稱已存在'); return; }
    data.teams.push({ id: nextTeamId(data.teams), name, players: ['','','','','','','','','',''] });
    persist(); input.value = ''; renderTeamList();
    showToast('已新增隊伍：' + name);
  }
  function removeTeam(id) {
    if (!confirm('確定刪除此隊伍？')) return;
    data.teams = data.teams.filter(t => t.id !== id);
    data.groups.forEach(g => { g.teamIds = g.teamIds.filter(tid => tid !== id); });
    data.groupMatches = data.groupMatches.filter(m => m.team1Id !== id && m.team2Id !== id);
    persist(); renderTeamList(); renderGroupConfig(); showToast('隊伍已刪除');
  }
  function renderTeamList() {
    const container = document.getElementById('teamList');
    document.getElementById('teamCount').textContent = data.teams.length + ' / 10';
    if (data.teams.length === 0) { container.innerHTML = '<div class="empty-state"><p>尚未新增任何隊伍</p></div>'; return; }

    let html = '';
    data.teams.forEach((team, ti) => {
      html += '<div class="card" style="padding:14px;">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
      html += '<div class="team-info"><span class="team-number">' + (ti + 1) + '</span><strong>' + esc(team.name) + '</strong></div>';
      html += '<button class="btn btn-danger btn-sm" data-remove-team="' + team.id + '">刪除隊伍</button>';
      html += '</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;">選手名單（10 人，每 2 人為一組雙打）：</div>';
      html += '<div class="player-grid">';
      for (let p = 0; p < 10; p++) {
        const label = '第' + (Math.floor(p / 2) + 1) + '點 ' + (p % 2 === 0 ? 'A' : 'B');
        html += '<input type="text" class="player-input" placeholder="' + label + '" value="' + esc(team.players[p] || '') + '" data-team="' + team.id + '" data-player="' + p + '">';
      }
      html += '</div>';
      html += '<button class="btn btn-primary btn-sm" style="margin-top:8px;" data-save-players="' + team.id + '">儲存選手</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-remove-team]').forEach(btn => {
      btn.addEventListener('click', () => removeTeam(parseInt(btn.dataset.removeTeam)));
    });
    container.querySelectorAll('[data-save-players]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = parseInt(btn.dataset.savePlayers);
        const team = data.teams.find(t => t.id === tid);
        if (!team) return;
        for (let p = 0; p < 10; p++) {
          const inp = container.querySelector('[data-team="' + tid + '"][data-player="' + p + '"]');
          if (inp) team.players[p] = inp.value.trim();
        }
        persist(); showToast(team.name + ' 選手已儲存');
      });
    });
  }

  // ===== Groups =====
  function setupGroups() {
    document.getElementById('btnAutoGroup').addEventListener('click', autoGroup);
    document.getElementById('btnSaveGroups').addEventListener('click', saveGroupsAndGenerateMatches);
  }
  function autoGroup() {
    const gc = parseInt(document.getElementById('inputGroupCount').value);
    const ac = parseInt(document.getElementById('inputAdvanceCount').value);
    if (data.teams.length < 2) { showToast('至少 2 支隊伍'); return; }
    const shuffled = [...data.teams].sort(() => Math.random() - 0.5);
    const names = ['A','B','C','D','E','F'];
    const groups = [];
    for (let i = 0; i < gc; i++) groups.push({ name: names[i] + ' 組', teamIds: [], advanceCount: ac });
    shuffled.forEach((t, i) => groups[i % gc].teamIds.push(t.id));
    data.groups = groups; persist(); renderGroupConfig(); showToast('已自動分組');
  }
  function renderGroupConfig() {
    const container = document.getElementById('groupConfig');
    if (!data.groups.length) { container.innerHTML = ''; return; }
    let html = '';
    data.groups.forEach((g, gi) => {
      html += '<div class="group-card"><div class="group-card-title">' + esc(g.name) + ' <span class="badge badge-accent">' + g.teamIds.length + ' 隊</span></div>';
      g.teamIds.forEach(tid => {
        const t = getTeamById(data.teams, tid);
        if (!t) return;
        html += '<div class="group-team-item"><span>' + esc(t.name) + '</span><button class="btn btn-danger btn-sm" data-rfg="' + gi + '_' + tid + '">移除</button></div>';
      });
      const avail = data.teams.filter(t => !g.teamIds.includes(t.id));
      if (avail.length) {
        html += '<div style="margin-top:8px;display:flex;gap:6px;"><select class="form-control" id="atg' + gi + '" style="flex:1;"><option value="">選擇隊伍...</option>';
        avail.forEach(t => { html += '<option value="' + t.id + '">' + esc(t.name) + '</option>'; });
        html += '</select><button class="btn btn-primary btn-sm" data-atg="' + gi + '">加入</button></div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-rfg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [gi, tid] = btn.dataset.rfg.split('_').map(Number);
        data.groups[gi].teamIds = data.groups[gi].teamIds.filter(id => id !== tid);
        persist(); renderGroupConfig();
      });
    });
    container.querySelectorAll('[data-atg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gi = parseInt(btn.dataset.atg);
        const tid = parseInt(document.getElementById('atg' + gi).value);
        if (!tid) return;
        data.groups.forEach(g => { g.teamIds = g.teamIds.filter(id => id !== tid); });
        data.groups[gi].teamIds.push(tid);
        persist(); renderGroupConfig();
      });
    });
  }
  function saveGroupsAndGenerateMatches() {
    const ac = parseInt(document.getElementById('inputAdvanceCount').value);
    data.groups.forEach(g => g.advanceCount = ac);
    if (!data.groups.some(g => g.teamIds.length >= 2)) { showToast('每組至少 2 隊'); return; }
    const existing = {};
    data.groupMatches.filter(m => m.completed).forEach(m => { existing[m.id] = m; });
    const newM = [];
    data.groups.forEach((g, gi) => {
      generateRoundRobinMatches(gi, g.teamIds).forEach(m => { newM.push(existing[m.id] || m); });
    });
    data.groupMatches = newM; persist(); renderGroupMatches(); showToast('賽程已產生');
  }

  // ===== Group Matches (含5點雙打編輯) =====
  function renderGroupMatches() {
    const container = document.getElementById('groupMatchesContainer');
    if (!data.groupMatches.length) { container.innerHTML = '<div class="empty-state"><p>請先完成分組設定</p></div>'; return; }
    let html = '';
    data.groups.forEach((group, gi) => {
      const matches = data.groupMatches.filter(m => m.groupIndex === gi);
      if (!matches.length) return;
      html += '<div class="card"><div class="card-title">' + esc(group.name) + '</div>';
      matches.forEach((m, mi) => { html += renderMatchEditor(m, 'gm', gi, mi); });
      html += '</div>';
    });
    container.innerHTML = html;
    bindMatchEditorEvents(container);
  }

  function renderMatchEditor(m, prefix, gi, mi) {
    const team1 = getTeamById(data.teams, m.team1Id);
    const team2 = getTeamById(data.teams, m.team2Id);
    const t1n = team1 ? team1.name : 'TBD', t2n = team2 ? team2.name : 'TBD';
    const uid = prefix + '_' + gi + '_' + mi;
    const statusCls = m.completed ? 'badge-green' : 'badge-yellow';
    const statusTxt = m.completed ? '已完成 (' + m.score1 + ':' + m.score2 + ')' : '未開始';

    let html = '<div class="match-edit-item">';
    html += '<div class="match-edit-header"><div class="match-edit-teams"><span>' + esc(t1n) + '</span><span class="vs">vs</span><span>' + esc(t2n) + '</span></div>';
    html += '<span class="badge ' + statusCls + '">' + statusTxt + '</span></div>';

    // 5 點雙打
    if (!m.doubles || m.doubles.length < 5) m.doubles = createEmptyDoubles();
    m.doubles.forEach((d, di) => {
      html += '<div class="doubles-edit-item">';
      html += '<div class="doubles-edit-label">第 ' + (di + 1) + ' 點雙打</div>';
      // 球員選擇
      html += '<div class="doubles-edit-row">';
      html += playerSelect(uid + '_d' + di + '_t1p0', team1, d.t1p[0]) + ' / ' + playerSelect(uid + '_d' + di + '_t1p1', team1, d.t1p[1]);
      html += '<span style="color:var(--text-muted);font-weight:600;margin:0 4px;">VS</span>';
      html += playerSelect(uid + '_d' + di + '_t2p0', team2, d.t2p[0]) + ' / ' + playerSelect(uid + '_d' + di + '_t2p1', team2, d.t2p[1]);
      html += '</div>';
      // 各局比分
      html += '<div class="game-scores">';
      const maxGames = 5; // 五局三勝最多5局
      for (let g = 0; g < maxGames; g++) {
        const gs = (d.games && d.games[g]) || { s1: '', s2: '' };
        const s1v = gs.s1 !== '' && gs.s1 !== undefined ? gs.s1 : '';
        const s2v = gs.s2 !== '' && gs.s2 !== undefined ? gs.s2 : '';
        html += '<div class="game-score-pair">';
        html += '<input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99" value="' + s1v + '" data-uid="' + uid + '_d' + di + '_g' + g + '_s1">';
        html += '<span style="color:var(--text-muted);">-</span>';
        html += '<input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99" value="' + s2v + '" data-uid="' + uid + '_d' + di + '_g' + g + '_s2">';
        html += '</div>';
      }
      html += '</div></div>';
    });
    html += '<div style="margin-top:8px;display:flex;gap:8px;">';
    html += '<button class="btn btn-success btn-sm" data-save-tm="' + m.id + '">儲存整場成績</button>';
    if (m.completed) html += '<button class="btn btn-outline btn-sm" data-reset-tm="' + m.id + '">重置</button>';
    html += '</div></div>';
    return html;
  }

  function playerSelect(uid, team, selectedIdx) {
    let html = '<select data-uid="' + uid + '" class="form-control" style="flex:1;min-width:70px;padding:4px 6px;font-size:0.82rem;">';
    html += '<option value="">--</option>';
    if (team && team.players) {
      team.players.forEach((p, i) => {
        const sel = i === selectedIdx ? ' selected' : '';
        const label = p || ('選手' + (i + 1));
        html += '<option value="' + i + '"' + sel + '>' + esc(label) + '</option>';
      });
    }
    html += '</select>';
    return html;
  }

  function bindMatchEditorEvents(container) {
    container.querySelectorAll('[data-save-tm]').forEach(btn => {
      btn.addEventListener('click', () => saveTeamMatch(btn.dataset.saveTm));
    });
    container.querySelectorAll('[data-reset-tm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = findMatch(btn.dataset.resetTm);
        if (!m) return;
        m.score1 = 0; m.score2 = 0; m.completed = false;
        m.doubles = createEmptyDoubles();
        persist(); renderGroupMatches(); showToast('已重置');
      });
    });
  }

  function findMatch(id) {
    let m = data.groupMatches.find(x => x.id === id);
    if (m) return m;
    for (const r of data.knockout.rounds) {
      m = r.matches.find(x => x.id === id);
      if (m) return m;
    }
    return null;
  }

  function saveTeamMatch(matchId) {
    const m = findMatch(matchId);
    if (!m) return;
    // 找出此 match 在 DOM 中的 uid prefix
    // 讀取每點雙打的球員選擇和比分
    m.doubles.forEach((d, di) => {
      // 找球員 selects - 用 uid 模式搜尋
      const selects = document.querySelectorAll('[data-uid*="_d' + di + '_t"]');
      // 更精確搜尋：遍歷所有可能的 uid
      document.querySelectorAll('select[data-uid]').forEach(sel => {
        const u = sel.dataset.uid;
        if (!u.includes('_d' + di + '_')) return;
        // 判斷是否屬於此 match
        if (u.includes('_t1p0')) {
          const parent = sel.closest('.match-edit-item');
          if (parent && parent.querySelector('[data-save-tm="' + matchId + '"]')) {
            d.t1p[0] = sel.value !== '' ? parseInt(sel.value) : null;
          }
        }
        if (u.includes('_t1p1')) {
          const parent = sel.closest('.match-edit-item');
          if (parent && parent.querySelector('[data-save-tm="' + matchId + '"]')) {
            d.t1p[1] = sel.value !== '' ? parseInt(sel.value) : null;
          }
        }
        if (u.includes('_t2p0')) {
          const parent = sel.closest('.match-edit-item');
          if (parent && parent.querySelector('[data-save-tm="' + matchId + '"]')) {
            d.t2p[0] = sel.value !== '' ? parseInt(sel.value) : null;
          }
        }
        if (u.includes('_t2p1')) {
          const parent = sel.closest('.match-edit-item');
          if (parent && parent.querySelector('[data-save-tm="' + matchId + '"]')) {
            d.t2p[1] = sel.value !== '' ? parseInt(sel.value) : null;
          }
        }
      });

      // 讀取各局比分
      d.games = [];
      d.score1 = 0; d.score2 = 0;
      const matchItem = document.querySelector('[data-save-tm="' + matchId + '"]')?.closest('.match-edit-item');
      if (!matchItem) return;

      for (let g = 0; g < 5; g++) {
        const inp1 = matchItem.querySelector('[data-uid*="_d' + di + '_g' + g + '_s1"]');
        const inp2 = matchItem.querySelector('[data-uid*="_d' + di + '_g' + g + '_s2"]');
        if (inp1 && inp2 && (inp1.value !== '' || inp2.value !== '')) {
          const s1 = parseInt(inp1.value) || 0;
          const s2 = parseInt(inp2.value) || 0;
          if (s1 > 0 || s2 > 0) {
            d.games.push({ s1, s2 });
            if (s1 > s2) d.score1++;
            else if (s2 > s1) d.score2++;
          }
        }
      }
      d.completed = d.games.length > 0 && (d.score1 >= 3 || d.score2 >= 3);
    });
    recalcTeamScore(m);
    persist(); renderGroupMatches(); renderKnockoutRounds(); showToast('成績已儲存');
  }

  // ===== Knockout =====
  function setupKnockout() {
    document.getElementById('btnAddRound').addEventListener('click', () => {
      const name = prompt('輸入輪次名稱：', ['八強','準決賽','季軍戰','決賽'][data.knockout.rounds.length] || '輪次');
      if (!name) return;
      data.knockout.rounds.push({ name, matches: [] }); persist(); renderKnockoutRounds();
    });
    document.getElementById('btnAutoKnockout').addEventListener('click', autoKnockout);
  }

  function autoKnockout() {
    if (!data.groups.length) { showToast('請先分組'); return; }
    const qualified = [];
    data.groups.forEach((g, gi) => {
      const st = calculateStandings(gi, g.teamIds, data.groupMatches);
      st.slice(0, g.advanceCount || 2).forEach((s, rank) => {
        qualified.push({ teamId: s.teamId, gi, rank });
      });
    });
    if (qualified.length < 2) { showToast('晉級隊伍不足'); return; }
    const n = qualified.length;
    const rounds = [];
    const emptyD = () => createEmptyDoubles();

    if (n <= 2) {
      rounds.push({ name: '決賽', matches: [{ id: 'k_f_1', team1Id: qualified[0]?.teamId || null, team2Id: qualified[1]?.teamId || null, score1: 0, score2: 0, doubles: emptyD(), completed: false }] });
    } else if (n <= 4) {
      const ga = qualified.filter(t => t.gi === 0), gb = qualified.filter(t => t.gi === 1);
      const sf = [];
      if (ga.length >= 2 && gb.length >= 2) {
        sf.push({ id: 'k_sf_1', team1Id: ga[0].teamId, team2Id: gb[1].teamId, score1: 0, score2: 0, doubles: emptyD(), completed: false });
        sf.push({ id: 'k_sf_2', team1Id: gb[0].teamId, team2Id: ga[1].teamId, score1: 0, score2: 0, doubles: emptyD(), completed: false });
      }
      rounds.push({ name: '準決賽', matches: sf });
      rounds.push({ name: '季軍戰', matches: [{ id: 'k_3rd_1', team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: emptyD(), completed: false }] });
      rounds.push({ name: '決賽', matches: [{ id: 'k_f_1', team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: emptyD(), completed: false }] });
    } else {
      const qf = [];
      for (let i = 0; i < n; i += 2) {
        if (i + 1 < n) qf.push({ id: 'k_qf_' + (i / 2 + 1), team1Id: qualified[i].teamId, team2Id: qualified[i + 1].teamId, score1: 0, score2: 0, doubles: emptyD(), completed: false });
      }
      rounds.push({ name: '八強', matches: qf });
      const sfc = Math.ceil(qf.length / 2);
      const sfm = [];
      for (let i = 0; i < sfc; i++) sfm.push({ id: 'k_sf_' + (i + 1), team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: emptyD(), completed: false });
      rounds.push({ name: '準決賽', matches: sfm });
      rounds.push({ name: '季軍戰', matches: [{ id: 'k_3rd_1', team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: emptyD(), completed: false }] });
      rounds.push({ name: '決賽', matches: [{ id: 'k_f_1', team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: emptyD(), completed: false }] });
    }
    data.knockout.rounds = rounds; persist(); renderKnockoutRounds(); showToast('淘汰賽已產生');
  }

  function renderKnockoutRounds() {
    const container = document.getElementById('knockoutRoundsContainer');
    const rounds = data.knockout.rounds;
    if (!rounds.length) { container.innerHTML = '<div class="empty-state"><p>尚未設定淘汰賽</p></div>'; return; }
    let html = '';
    rounds.forEach((round, ri) => {
      html += '<div class="knockout-round-card"><div class="knockout-round-header"><h3>' + esc(round.name) + '</h3>';
      html += '<div class="btn-group"><button class="btn btn-primary btn-sm" data-add-ko="' + ri + '">新增比賽</button>';
      html += '<button class="btn btn-danger btn-sm" data-del-round="' + ri + '">刪除輪次</button></div></div>';

      round.matches.forEach((m, mi) => {
        if (!m.doubles || m.doubles.length < 5) m.doubles = createEmptyDoubles();
        const t1n = m.team1Id ? getTeamName(data.teams, m.team1Id) : 'TBD';
        const t2n = m.team2Id ? getTeamName(data.teams, m.team2Id) : 'TBD';
        const sc = m.completed ? 'badge-green' : 'badge-yellow';
        const st = m.completed ? m.score1 + ':' + m.score2 : '未開始';

        html += '<div class="match-edit-item">';
        html += '<div class="match-edit-header"><span class="badge ' + sc + '">' + st + '</span>';
        html += '<button class="btn btn-danger btn-sm" data-del-ko="' + ri + '_' + mi + '">刪除</button></div>';
        // 隊伍選擇
        html += '<div class="score-input-row">';
        html += '<select class="form-control" style="flex:1;" data-ko-team="' + ri + '_' + mi + '_1"><option value="">選擇隊伍</option>';
        data.teams.forEach(t => { html += '<option value="' + t.id + '"' + (t.id === m.team1Id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; });
        html += '</select><span style="color:var(--text-muted);font-weight:600;">VS</span>';
        html += '<select class="form-control" style="flex:1;" data-ko-team="' + ri + '_' + mi + '_2"><option value="">選擇隊伍</option>';
        data.teams.forEach(t => { html += '<option value="' + t.id + '"' + (t.id === m.team2Id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; });
        html += '</select></div>';
        // 5點雙打
        const team1 = getTeamById(data.teams, m.team1Id);
        const team2 = getTeamById(data.teams, m.team2Id);
        const kouid = 'ko_' + ri + '_' + mi;
        m.doubles.forEach((d, di) => {
          const maxG = 7; // 淘汰賽七局四勝
          html += '<div class="doubles-edit-item"><div class="doubles-edit-label">第 ' + (di + 1) + ' 點</div>';
          html += '<div class="doubles-edit-row">';
          html += playerSelect(kouid + '_d' + di + '_t1p0', team1, d.t1p[0]) + ' / ' + playerSelect(kouid + '_d' + di + '_t1p1', team1, d.t1p[1]);
          html += '<span style="color:var(--text-muted);font-weight:600;margin:0 4px;">VS</span>';
          html += playerSelect(kouid + '_d' + di + '_t2p0', team2, d.t2p[0]) + ' / ' + playerSelect(kouid + '_d' + di + '_t2p1', team2, d.t2p[1]);
          html += '</div><div class="game-scores">';
          for (let g = 0; g < maxG; g++) {
            const gs = (d.games && d.games[g]) || {};
            html += '<div class="game-score-pair"><input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99" value="' + (gs.s1 != null ? gs.s1 : '') + '" data-uid="' + kouid + '_d' + di + '_g' + g + '_s1">';
            html += '<span style="color:var(--text-muted);">-</span><input type="number" class="score-input" style="width:36px;padding:3px;" min="0" max="99" value="' + (gs.s2 != null ? gs.s2 : '') + '" data-uid="' + kouid + '_d' + di + '_g' + g + '_s2"></div>';
          }
          html += '</div></div>';
        });
        html += '<button class="btn btn-success btn-sm" style="margin-top:8px;" data-save-ko="' + ri + '_' + mi + '">儲存成績</button>';
        html += '</div>';
      });
      html += '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-add-ko]').forEach(b => b.addEventListener('click', () => {
      const ri = parseInt(b.dataset.addKo);
      data.knockout.rounds[ri].matches.push({ id: 'k_' + ri + '_' + Date.now(), team1Id: null, team2Id: null, score1: 0, score2: 0, doubles: createEmptyDoubles(), completed: false });
      persist(); renderKnockoutRounds();
    }));
    container.querySelectorAll('[data-del-round]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('刪除此輪次？')) return;
      data.knockout.rounds.splice(parseInt(b.dataset.delRound), 1); persist(); renderKnockoutRounds();
    }));
    container.querySelectorAll('[data-del-ko]').forEach(b => b.addEventListener('click', () => {
      const [ri, mi] = b.dataset.delKo.split('_').map(Number);
      data.knockout.rounds[ri].matches.splice(mi, 1); persist(); renderKnockoutRounds();
    }));
    container.querySelectorAll('[data-save-ko]').forEach(b => b.addEventListener('click', () => {
      const [ri, mi] = b.dataset.saveKo.split('_').map(Number);
      saveKOMatch(ri, mi);
    }));
  }

  function saveKOMatch(ri, mi) {
    const m = data.knockout.rounds[ri].matches[mi];
    const t1s = document.querySelector('[data-ko-team="' + ri + '_' + mi + '_1"]');
    const t2s = document.querySelector('[data-ko-team="' + ri + '_' + mi + '_2"]');
    m.team1Id = t1s.value ? parseInt(t1s.value) : null;
    m.team2Id = t2s.value ? parseInt(t2s.value) : null;
    const kouid = 'ko_' + ri + '_' + mi;
    const matchItem = document.querySelector('[data-save-ko="' + ri + '_' + mi + '"]')?.closest('.match-edit-item');
    if (!matchItem) return;

    m.doubles.forEach((d, di) => {
      // 球員
      ['t1p0','t1p1','t2p0','t2p1'].forEach(key => {
        const sel = matchItem.querySelector('[data-uid="' + kouid + '_d' + di + '_' + key + '"]');
        if (!sel) return;
        const val = sel.value !== '' ? parseInt(sel.value) : null;
        if (key === 't1p0') d.t1p[0] = val;
        if (key === 't1p1') d.t1p[1] = val;
        if (key === 't2p0') d.t2p[0] = val;
        if (key === 't2p1') d.t2p[1] = val;
      });
      // 各局
      d.games = []; d.score1 = 0; d.score2 = 0;
      for (let g = 0; g < 7; g++) {
        const i1 = matchItem.querySelector('[data-uid="' + kouid + '_d' + di + '_g' + g + '_s1"]');
        const i2 = matchItem.querySelector('[data-uid="' + kouid + '_d' + di + '_g' + g + '_s2"]');
        if (i1 && i2 && (i1.value !== '' || i2.value !== '')) {
          const s1 = parseInt(i1.value) || 0, s2 = parseInt(i2.value) || 0;
          if (s1 > 0 || s2 > 0) {
            d.games.push({ s1, s2 });
            if (s1 > s2) d.score1++; else if (s2 > s1) d.score2++;
          }
        }
      }
      d.completed = d.games.length > 0 && (d.score1 >= 4 || d.score2 >= 4);
    });
    recalcTeamScore(m);
    persist(); renderKnockoutRounds(); showToast('淘汰賽成績已儲存');
  }

  // ===== Share =====
  function setupShare() {
    document.getElementById('btnCopyView').addEventListener('click', () => { copy(document.getElementById('viewUrl').value); showToast('觀看連結已複製'); });
    document.getElementById('btnCopyAdmin').addEventListener('click', () => { copy(document.getElementById('adminUrl').value); showToast('管理連結已複製'); });
    document.getElementById('btnExport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (data.tournament.name || 'tournament') + '.json'; a.click(); showToast('已匯出');
    });
    document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileImport').click());
    document.getElementById('fileImport').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        try { const d = JSON.parse(ev.target.result); if (d.tournament && d.teams) { data = d; persist(); renderAll(); showToast('已匯入'); } else showToast('格式錯誤'); }
        catch (err) { showToast('匯入失敗'); }
      };
      r.readAsText(f); e.target.value = '';
    });
    document.getElementById('btnReset').addEventListener('click', () => {
      if (!confirm('確定重置？')) return; if (!confirm('真的確定？')) return;
      data = getDefaultData(); persist(); renderAll(); showToast('已重置');
    });
    document.getElementById('btnLoadDemo').addEventListener('click', () => {
      if (typeof DEMO_DATA === 'undefined') { showToast('測試資料未載入'); return; }
      if (data.teams.length > 0 && !confirm('將覆蓋目前的資料，確定載入測試資料？')) return;
      data = JSON.parse(JSON.stringify(DEMO_DATA));
      persist(); renderAll(); showToast('已載入 10 隊測試資料');
    });
  }
  function updateShareLinks() {
    document.getElementById('viewUrl').value = generateViewURL(data);
    document.getElementById('adminUrl').value = generateAdminURL(data);
  }
  function copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => fbCopy(text));
    else fbCopy(text);
  }
  function fbCopy(text) {
    const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
  }

  function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
