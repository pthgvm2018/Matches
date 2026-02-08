// ===== 16強雙打淘汰賽 - 管理後台 =====
(function () {
  var data = null;

  function init() {
    data = getDataFromURL();
    if (data) { saveData(data); history.replaceState(null, '', window.location.pathname); }
    else data = loadData();
    setupNav();
    setupSettings();
    setupTeams();
    setupBracket();
    setupShare();
    renderAll();
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-link').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
        this.classList.add('active');
        var sec = document.getElementById('sec-' + this.dataset.section);
        if (sec) sec.classList.add('active');
        if (this.dataset.section === 'matches') renderMatches();
        if (this.dataset.section === 'bracket') renderSeeding();
        if (this.dataset.section === 'share') updateShareLinks();
      });
    });
  }

  function renderAll() {
    renderSettingsForm();
    renderTeamList();
    renderSeeding();
    renderMatches();
  }

  function persist() { saveData(data); }
  function showToast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  // ===== 賽事設定 =====
  function setupSettings() {
    document.getElementById('btnSaveSettings').addEventListener('click', function () {
      data.tournament.name = document.getElementById('inputName').value.trim();
      data.tournament.date = document.getElementById('inputDate').value.trim();
      data.tournament.location = document.getElementById('inputLocation').value.trim();
      data.tournament.rules = document.getElementById('inputRules').value;
      data.tournament.format = document.getElementById('inputFormat').value;
      persist();
      document.getElementById('adminTitle').textContent = (data.tournament.name || '16強雙打淘汰賽') + ' - 管理後台';
      showToast('設定已儲存');
    });
  }

  function renderSettingsForm() {
    var t = data.tournament;
    document.getElementById('inputName').value = t.name || '';
    document.getElementById('inputDate').value = t.date || '';
    document.getElementById('inputLocation').value = t.location || '';
    document.getElementById('inputRules').value = t.rules || '';
    document.getElementById('inputFormat').value = t.format || '五局三勝';
    if (t.name) document.getElementById('adminTitle').textContent = t.name + ' - 管理後台';
  }

  // ===== 隊伍管理 =====
  function setupTeams() {
    document.getElementById('btnAddTeam').addEventListener('click', addTeam);
    document.getElementById('inputTeamName').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTeam(); });
  }

  function addTeam() {
    var input = document.getElementById('inputTeamName');
    var name = input.value.trim();
    if (!name) return;
    if (data.teams.length >= 16) { showToast('最多 16 組'); return; }
    if (data.teams.some(function (t) { return t.name === name; })) { showToast('名稱已存在'); return; }
    data.teams.push({ id: nextTeamId(data.teams), name: name, players: ['', ''] });
    persist(); input.value = ''; renderTeamList();
    showToast('已新增：' + name);
  }

  function renderTeamList() {
    var container = document.getElementById('teamList');
    document.getElementById('teamCount').textContent = data.teams.length + ' / 16';
    if (data.teams.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚未新增任何隊伍</p></div>';
      return;
    }

    var html = '';
    data.teams.forEach(function (team, ti) {
      html += '<div class="card" style="padding:12px;margin-top:8px;">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;"><span class="team-number">' + (ti + 1) + '</span>';
      html += '<input type="text" class="form-control" style="width:120px;font-weight:700;padding:2px 8px;" value="' + esc(team.name) + '" data-team-name="' + team.id + '">';
      html += '</div>';
      html += '<div style="display:flex;gap:6px;"><button class="btn btn-primary btn-sm" data-save-team="' + team.id + '">儲存</button>';
      html += '<button class="btn btn-danger btn-sm" data-remove-team="' + team.id + '">刪除</button></div>';
      html += '</div>';
      html += '<div style="display:flex;gap:8px;">';
      html += '<input type="text" class="form-control" style="flex:1;padding:4px 8px;font-size:0.85rem;" placeholder="選手 A" value="' + esc(team.players[0] || '') + '" data-player="' + team.id + '_0">';
      html += '<input type="text" class="form-control" style="flex:1;padding:4px 8px;font-size:0.85rem;" placeholder="選手 B" value="' + esc(team.players[1] || '') + '" data-player="' + team.id + '_1">';
      html += '</div></div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-save-team]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tid = parseInt(btn.dataset.saveTeam);
        var team = data.teams.find(function (t) { return t.id === tid; });
        if (!team) return;
        var nameInp = container.querySelector('[data-team-name="' + tid + '"]');
        var newName = nameInp ? nameInp.value.trim() : '';
        if (!newName) { showToast('名稱不能為空'); return; }
        if (data.teams.some(function (t) { return t.id !== tid && t.name === newName; })) { showToast('名稱已存在'); return; }
        team.name = newName;
        var p0 = container.querySelector('[data-player="' + tid + '_0"]');
        var p1 = container.querySelector('[data-player="' + tid + '_1"]');
        if (p0) team.players[0] = p0.value.trim();
        if (p1) team.players[1] = p1.value.trim();
        persist(); showToast(team.name + ' 已儲存');
      });
    });

    container.querySelectorAll('[data-remove-team]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('確定刪除？')) return;
        var tid = parseInt(btn.dataset.removeTeam);
        data.teams = data.teams.filter(function (t) { return t.id !== tid; });
        // 清除對戰表中的參照
        data.rounds.forEach(function (round) {
          round.matches.forEach(function (m) {
            if (m.team1Id === tid) { m.team1Id = null; m.completed = false; m.games = []; m.score1 = 0; m.score2 = 0; }
            if (m.team2Id === tid) { m.team2Id = null; m.completed = false; m.games = []; m.score1 = 0; m.score2 = 0; }
          });
        });
        if (data.thirdPlace) {
          if (data.thirdPlace.team1Id === tid) data.thirdPlace.team1Id = null;
          if (data.thirdPlace.team2Id === tid) data.thirdPlace.team2Id = null;
        }
        persist(); renderTeamList(); showToast('已刪除');
      });
    });
  }

  // ===== 對戰排序 =====
  function setupBracket() {
    document.getElementById('btnRandomSeed').addEventListener('click', function () {
      if (data.teams.length < 2) { showToast('至少需要 2 組'); return; }
      var shuffled = data.teams.slice().sort(function () { return Math.random() - 0.5; });
      // 只更新 UI 下拉選單，不修改 data、不儲存
      var selects = document.querySelectorAll('[data-seed-pos]');
      selects.forEach(function (sel) { sel.value = ''; });
      for (var i = 0; i < Math.min(shuffled.length, 16); i++) {
        var mi = Math.floor(i / 2);
        var slot = i % 2;
        var sel = document.querySelector('[data-seed-pos="' + mi + '_' + slot + '"]');
        if (sel) sel.value = String(shuffled[i].id);
      }
      showToast('已隨機排列，請按「儲存對戰表」確認');
    });

    document.getElementById('btnSaveBracket').addEventListener('click', function () {
      // 從下拉式選單讀取
      var selects = document.querySelectorAll('[data-seed-pos]');
      var used = {};
      var valid = true;
      var newSeeding = [];
      selects.forEach(function (sel) {
        var pos = sel.dataset.seedPos.split('_');
        var mi = parseInt(pos[0]), slot = parseInt(pos[1]);
        var val = sel.value ? parseInt(sel.value) : null;
        if (val && used[val]) { valid = false; }
        if (val) used[val] = true;
        newSeeding.push({ mi: mi, slot: slot, val: val });
      });
      if (!valid) { showToast('同一隊不能出現兩次'); return; }

      // 檢查是否有已完成的比賽
      var hasResults = data.rounds && data.rounds.some(function (round) {
        return round.matches.some(function (m) { return m.completed; });
      });
      if (data.thirdPlace && data.thirdPlace.completed) hasResults = true;

      // 檢查十六強配對是否有變動
      var changed = false;
      if (data.rounds && data.rounds.length >= 1) {
        newSeeding.forEach(function (s) {
          var m = data.rounds[0].matches[s.mi];
          if (!m) { changed = true; return; }
          var old = s.slot === 0 ? m.team1Id : m.team2Id;
          if (old !== s.val) changed = true;
        });
      } else {
        changed = true;
      }

      if (hasResults && changed) {
        if (!confirm('變更對戰排序將清除所有已完成的比賽成績，確定？')) return;
      }

      // 確保 rounds 結構存在
      if (!data.rounds || data.rounds.length < 4) data.rounds = createEmptyRounds();

      // 如果配對有變動，清除後續輪次
      if (changed) {
        data.rounds.forEach(function (round, ri) {
          round.matches.forEach(function (m) {
            if (ri > 0) { m.team1Id = null; m.team2Id = null; }
            m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false;
          });
        });
        data.thirdPlace = null;
      }

      // 寫入十六強配對
      newSeeding.forEach(function (s) {
        if (s.slot === 0) data.rounds[0].matches[s.mi].team1Id = s.val;
        else data.rounds[0].matches[s.mi].team2Id = s.val;
      });

      persist(); showToast('對戰表已儲存');
    });
  }

  function renderSeeding() {
    var container = document.getElementById('seedingContainer');
    if (!data.rounds || data.rounds.length === 0) {
      data.rounds = createEmptyRounds();
    }

    var html = '';
    data.rounds[0].matches.forEach(function (m, mi) {
      html += '<div class="card" style="padding:10px;margin-bottom:6px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;font-size:0.9rem;">';
      html += '<span style="color:var(--text-muted);font-weight:600;min-width:50px;">第 ' + (mi + 1) + ' 場</span>';
      html += teamSelect('seed_' + mi + '_0', m.team1Id);
      html += '<span style="color:var(--text-muted);font-weight:700;">VS</span>';
      html += teamSelect('seed_' + mi + '_1', m.team2Id);
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  function teamSelect(uid, selectedId) {
    var html = '<select class="form-control" style="flex:1;padding:4px 6px;font-size:0.85rem;" data-seed-pos="' + uid.replace('seed_', '') + '">';
    html += '<option value="">-- 選擇 --</option>';
    data.teams.forEach(function (t) {
      var sel = t.id === selectedId ? ' selected' : '';
      html += '<option value="' + t.id + '"' + sel + '>' + esc(t.name) + '</option>';
    });
    html += '</select>';
    return html;
  }

  // ===== 比賽成績 =====
  function renderMatches() {
    var container = document.getElementById('matchesContainer');
    if (!data.rounds || data.rounds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚未設定對戰表</p></div>';
      return;
    }

    var maxGames = 5; // 五局三勝
    var fmt = data.tournament.format || '五局三勝';
    if (fmt === '三局兩勝') maxGames = 3;
    else if (fmt === '七局四勝') maxGames = 7;

    var html = '';

    // 所有輪次
    var allRounds = data.rounds.slice();
    if (data.thirdPlace) {
      allRounds.push({ name: '季軍戰', matches: [data.thirdPlace], isThirdPlace: true });
    }

    allRounds.forEach(function (round, ri) {
      html += '<div class="card" style="margin-bottom:12px;"><div class="card-title">' + esc(round.name) + '</div>';
      round.matches.forEach(function (m, mi) {
        var t1n = getTeamName(data.teams, m.team1Id);
        var t2n = getTeamName(data.teams, m.team2Id);
        var statusCls = m.completed ? 'badge-green' : 'badge-yellow';
        var statusTxt = m.completed ? m.score1 + ':' + m.score2 : '未開始';
        var uid = (round.isThirdPlace ? 'third' : 'r' + ri) + '_m' + mi;

        html += '<div class="match-edit-item" style="margin-bottom:10px;">';
        html += '<div class="match-edit-header"><div class="match-edit-teams"><span>' + esc(t1n) + '</span><span class="vs">vs</span><span>' + esc(t2n) + '</span></div>';
        html += '<span class="badge ' + statusCls + '">' + statusTxt + '</span></div>';

        if (m.team1Id && m.team2Id) {
          // 選手顯示
          var p1 = getPlayersDisplay(data.teams, m.team1Id);
          var p2 = getPlayersDisplay(data.teams, m.team2Id);
          html += '<div style="font-size:0.82rem;color:var(--text-secondary);text-align:center;margin:6px 0;">' + esc(p1) + ' <span style="color:var(--text-muted);">vs</span> ' + esc(p2) + '</div>';

          // 各局比分輸入
          html += '<div class="game-scores" style="justify-content:center;">';
          for (var g = 0; g < maxGames; g++) {
            var gs = (m.games && m.games[g]) || {};
            var s1v = gs.s1 != null ? gs.s1 : '';
            var s2v = gs.s2 != null ? gs.s2 : '';
            html += '<div class="game-score-pair">';
            html += '<input type="number" class="score-input" style="width:40px;padding:4px;" min="0" max="99" value="' + s1v + '" data-uid="' + uid + '_g' + g + '_s1">';
            html += '<span style="color:var(--text-muted);">-</span>';
            html += '<input type="number" class="score-input" style="width:40px;padding:4px;" min="0" max="99" value="' + s2v + '" data-uid="' + uid + '_g' + g + '_s2">';
            html += '</div>';
          }
          html += '</div>';
          html += '<div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">';
          html += '<button class="btn btn-success btn-sm" data-save-match="' + uid + '">儲存成績</button>';
          if (m.completed) html += '<button class="btn btn-outline btn-sm" data-reset-match="' + uid + '">重置</button>';
          html += '</div>';
        } else {
          html += '<div class="empty-state" style="padding:8px;"><p style="font-size:0.85rem;">等待對手確定</p></div>';
        }
        html += '</div>';
      });
      html += '</div>';
    });

    container.innerHTML = html;

    // 綁定儲存
    container.querySelectorAll('[data-save-match]').forEach(function (btn) {
      btn.addEventListener('click', function () { saveMatch(btn.dataset.saveMatch); });
    });
    container.querySelectorAll('[data-reset-match]').forEach(function (btn) {
      btn.addEventListener('click', function () { resetMatch(btn.dataset.resetMatch); });
    });
  }

  function findMatch(uid) {
    if (uid === 'third_m0' && data.thirdPlace) return data.thirdPlace;
    var parts = uid.match(/^r(\d+)_m(\d+)$/);
    if (!parts) return null;
    var ri = parseInt(parts[1]), mi = parseInt(parts[2]);
    if (data.rounds[ri] && data.rounds[ri].matches[mi]) return data.rounds[ri].matches[mi];
    return null;
  }

  function findRoundIndex(uid) {
    if (uid.startsWith('third')) return -1;
    var parts = uid.match(/^r(\d+)_m(\d+)$/);
    return parts ? parseInt(parts[1]) : -1;
  }

  function findMatchIndex(uid) {
    if (uid === 'third_m0') return 0;
    var parts = uid.match(/^r(\d+)_m(\d+)$/);
    return parts ? parseInt(parts[2]) : -1;
  }

  function saveMatch(uid) {
    var m = findMatch(uid);
    if (!m) return;

    var maxGames = 5;
    var fmt = data.tournament.format || '五局三勝';
    if (fmt === '三局兩勝') maxGames = 3;
    else if (fmt === '七局四勝') maxGames = 7;
    var winGames = Math.ceil(maxGames / 2);

    m.games = [];
    m.score1 = 0;
    m.score2 = 0;
    for (var g = 0; g < maxGames; g++) {
      var i1 = document.querySelector('[data-uid="' + uid + '_g' + g + '_s1"]');
      var i2 = document.querySelector('[data-uid="' + uid + '_g' + g + '_s2"]');
      if (i1 && i2 && (i1.value !== '' || i2.value !== '')) {
        var s1 = parseInt(i1.value) || 0, s2 = parseInt(i2.value) || 0;
        if (s1 > 0 || s2 > 0) {
          m.games.push({ s1: s1, s2: s2 });
          if (s1 > s2) m.score1++;
          else if (s2 > s1) m.score2++;
        }
      }
    }
    m.completed = m.games.length > 0 && (m.score1 >= winGames || m.score2 >= winGames);

    // 自動晉級
    if (m.completed) {
      var ri = findRoundIndex(uid);
      var mi = findMatchIndex(uid);
      var winnerId = m.score1 > m.score2 ? m.team1Id : m.team2Id;
      var loserId = m.score1 > m.score2 ? m.team2Id : m.team1Id;

      if (ri >= 0 && ri < 3) {
        // 晉級下一輪
        var nextMi = Math.floor(mi / 2);
        var nextSlot = mi % 2;
        if (data.rounds[ri + 1] && data.rounds[ri + 1].matches[nextMi]) {
          var nextMatch = data.rounds[ri + 1].matches[nextMi];
          if (nextSlot === 0) nextMatch.team1Id = winnerId;
          else nextMatch.team2Id = winnerId;
        }
      }

      // 準決賽敗者進入季軍戰
      if (ri === 2) {
        if (!data.thirdPlace) {
          data.thirdPlace = createEmptyMatch('third');
        }
        if (mi === 0) data.thirdPlace.team1Id = loserId;
        if (mi === 1) data.thirdPlace.team2Id = loserId;
      }
    }

    persist(); renderMatches(); showToast('成績已儲存');
  }

  function resetMatch(uid) {
    var m = findMatch(uid);
    if (!m) return;
    m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false;

    // 清除後續輪次的晉級
    var ri = findRoundIndex(uid);
    var mi = findMatchIndex(uid);
    if (ri >= 0 && ri < 3) {
      clearAdvance(ri + 1, Math.floor(mi / 2), mi % 2);
    }

    persist(); renderMatches(); showToast('已重置');
  }

  function clearAdvance(ri, mi, slot) {
    if (ri >= data.rounds.length || !data.rounds[ri].matches[mi]) return;
    var m = data.rounds[ri].matches[mi];
    if (slot === 0) m.team1Id = null;
    else m.team2Id = null;
    m.score1 = 0; m.score2 = 0; m.games = []; m.completed = false;
    // 遞迴清除
    if (ri < 3) clearAdvance(ri + 1, Math.floor(mi / 2), mi % 2);
  }

  // ===== 分享 =====
  function setupShare() {
    document.getElementById('btnCopyView').addEventListener('click', function () { copy(document.getElementById('viewUrl').value); showToast('觀看連結已複製'); });
    document.getElementById('btnCopyAdmin').addEventListener('click', function () { copy(document.getElementById('adminUrl').value); showToast('管理連結已複製'); });
    document.getElementById('btnExport').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = (data.tournament.name || 'ko16') + '.json'; a.click(); showToast('已匯出');
    });
    document.getElementById('btnImport').addEventListener('click', function () { document.getElementById('fileImport').click(); });
    document.getElementById('fileImport').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function (ev) {
        try {
          var d = JSON.parse(ev.target.result);
          if (d.tournament && d.teams) { data = d; persist(); renderAll(); showToast('已匯入'); }
          else showToast('格式錯誤');
        } catch (err) { showToast('匯入失敗'); }
      };
      r.readAsText(f); e.target.value = '';
    });
    document.getElementById('btnReset').addEventListener('click', function () {
      if (!confirm('確定重置？')) return;
      if (!confirm('真的確定？')) return;
      data = getDefaultData(); persist(); renderAll(); showToast('已重置');
    });
    document.getElementById('btnLoadDemo').addEventListener('click', function () {
      if (typeof DEMO_DATA === 'undefined') { showToast('測試資料未載入'); return; }
      if (data.teams.length > 0 && !confirm('將覆蓋目前資料，確定？')) return;
      data = JSON.parse(JSON.stringify(DEMO_DATA));
      persist(); renderAll(); showToast('已載入 16 組測試資料');
    });
  }

  function updateShareLinks() {
    document.getElementById('viewUrl').value = generateViewURL(data);
    document.getElementById('adminUrl').value = generateAdminURL(data);
  }

  function copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () { fbCopy(text); });
    else fbCopy(text);
  }
  function fbCopy(text) {
    var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
  }

  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
