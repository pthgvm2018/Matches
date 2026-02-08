// ===== View Page Logic (團體賽版) =====
(function () {
  let data = null;

  function init() {
    data = getDataFromURL();
    if (!data) data = loadData();
    renderAll();
    setupNav();
    // Firestore 即時同步：其他裝置更新時自動刷新畫面
    window.addEventListener('firestore-update', function () {
      data = loadData();
      renderAll();
    });
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('sec-' + this.dataset.section)?.classList.add('active');
      });
    });
  }

  function renderAll() {
    renderHeader();
    renderRules();
    renderGroups();
    renderKnockout();
  }

  function renderHeader() {
    const t = data.tournament;
    if (t.name) {
      document.getElementById('tournamentTitle').textContent = t.name;
      document.title = t.name;
    }
    const dateEl = document.getElementById('tournamentDate');
    const locEl = document.getElementById('tournamentLocation');
    if (t.date) dateEl.textContent = t.date; else dateEl.style.display = 'none';
    if (t.location) locEl.textContent = t.location; else locEl.style.display = 'none';
  }

  function renderRules() {
    const el = document.getElementById('rulesContent');
    const t = data.tournament;
    if (!t.rules && !t.groupFormat && !t.knockoutFormat) {
      el.innerHTML = '<p class="empty-state">尚未設定比賽規則</p>';
      return;
    }
    let html = '';
    if (t.groupFormat || t.knockoutFormat) {
      html += '<div style="margin-bottom:16px;">';
      if (t.groupFormat) html += '<span class="badge badge-accent" style="margin-right:8px;">小組賽每點：' + esc(t.groupFormat) + '</span>';
      if (t.knockoutFormat) html += '<span class="badge badge-accent">淘汰賽每點：' + esc(t.knockoutFormat) + '</span>';
      html += '</div>';
    }
    if (t.rules) html += '<div style="white-space:pre-wrap;">' + esc(t.rules) + '</div>';
    el.innerHTML = html;
  }

  function renderGroups() {
    const container = document.getElementById('groupsContainer');
    if (!data.groups || data.groups.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚無小組賽資料</p></div>';
      return;
    }
    let html = '';
    data.groups.forEach((group, gi) => {
      const standings = calculateStandings(gi, group.teamIds, data.groupMatches);
      const matches = data.groupMatches.filter(m => m.groupIndex === gi);
      const adv = group.advanceCount || 2;

      html += '<div class="card"><div class="card-title">' + esc(group.name) + '</div>';
      // 積分榜
      html += '<div class="table-responsive"><table class="standings-table">';
      html += '<thead><tr><th>#</th><th>隊伍</th><th>賽</th><th>勝</th><th>負</th><th>點勝</th><th>點負</th><th>點差</th><th>局勝</th><th>局負</th><th>積分</th></tr></thead><tbody>';
      standings.forEach((s, i) => {
        const name = getTeamName(data.teams, s.teamId);
        const q = i < adv ? ' qualified' : '';
        const dd = s.doublesFor - s.doublesAgainst;
        const ddStr = dd > 0 ? '+' + dd : '' + dd;
        html += '<tr class="' + q + '"><td>' + (i + 1) + '</td><td class="team-name">' + esc(name) + '</td>';
        html += '<td>' + s.played + '</td><td>' + s.wins + '</td><td>' + s.losses + '</td>';
        html += '<td>' + s.doublesFor + '</td><td>' + s.doublesAgainst + '</td><td>' + ddStr + '</td>';
        html += '<td>' + s.gamesFor + '</td><td>' + s.gamesAgainst + '</td>';
        html += '<td><strong>' + s.matchPoints + '</strong></td></tr>';
      });
      html += '</tbody></table></div>';

      // 比賽結果
      if (matches.length > 0) {
        html += '<div style="margin-top:16px;"><h4 style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:10px;">比賽結果</h4>';
        html += '<div class="match-list">';
        matches.forEach((m, mi) => { html += renderTeamMatch(m, 'gm_' + gi + '_' + mi); });
        html += '</div></div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
    bindToggle();
  }

  function renderTeamMatch(match, uid) {
    const t1 = getTeamName(data.teams, match.team1Id);
    const t2 = getTeamName(data.teams, match.team2Id);

    if (!match.completed) {
      return '<div class="match-item match-pending"><span class="team left">' + esc(t1) +
        '</span><span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>' +
        '<span class="team right">' + esc(t2) + '</span></div>';
    }

    const w1 = match.score1 > match.score2;
    const c1 = w1 ? 'winner' : 'loser', c2 = w1 ? 'loser' : 'winner';

    let html = '<div class="team-match-wrapper">';
    // 主行 - 可展開
    html += '<div class="match-item team-match-header" data-toggle="' + uid + '">';
    html += '<span class="team left ' + c1 + '">' + esc(t1) + '</span>';
    html += '<span class="score-box"><span class="s ' + c1 + '">' + match.score1 + '</span><span class="divider">:</span><span class="s ' + c2 + '">' + match.score2 + '</span></span>';
    html += '<span class="team right ' + c2 + '">' + esc(t2) + '</span>';
    html += '<span class="toggle-arrow">&#9660;</span>';
    html += '</div>';

    // 展開區域 - 5點雙打詳情
    html += '<div class="doubles-detail" id="' + uid + '" style="display:none;">';
    const team1 = getTeamById(data.teams, match.team1Id);
    const team2 = getTeamById(data.teams, match.team2Id);

    if (match.doubles) {
      match.doubles.forEach((d, di) => {
        const p1 = getDoublesDisplay(team1, d.t1p);
        const p2 = getDoublesDisplay(team2, d.t2p);
        const dw1 = d.score1 > d.score2;
        const dc1 = dw1 ? 'winner' : 'loser', dc2 = dw1 ? 'loser' : 'winner';
        const gamesStr = d.games ? d.games.map(g => g.s1 + '-' + g.s2).join(', ') : '';

        html += '<div class="doubles-item">';
        html += '<div class="doubles-label">第 ' + (di + 1) + ' 點</div>';
        html += '<div class="doubles-row">';
        html += '<span class="doubles-player ' + dc1 + '">' + esc(p1) + '</span>';
        html += '<span class="doubles-score"><span class="' + dc1 + '">' + d.score1 + '</span> : <span class="' + dc2 + '">' + d.score2 + '</span></span>';
        html += '<span class="doubles-player ' + dc2 + '">' + esc(p2) + '</span>';
        html += '</div>';
        if (gamesStr) html += '<div class="doubles-games">(' + gamesStr + ')</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
    return html;
  }

  function renderKnockout() {
    const container = document.getElementById('knockoutContainer');
    const rounds = data.knockout && data.knockout.rounds;
    if (!rounds || rounds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚無淘汰賽資料</p></div>';
      return;
    }
    let html = '';
    // Bracket
    html += '<div class="bracket-container"><div class="bracket">';
    rounds.forEach((round, ri) => {
      html += '<div class="bracket-round"><div class="bracket-round-title">' + esc(round.name) + '</div>';
      html += '<div class="bracket-matches">';
      round.matches.forEach(m => { html += renderBracketMatch(m); });
      html += '</div></div>';
      if (ri < rounds.length - 1) html += '<div class="bracket-connector"></div>';
    });
    html += '</div></div>';
    // Detail cards
    html += '<div style="margin-top:24px;">';
    rounds.forEach((round, ri) => {
      html += '<div class="card"><div class="card-title">' + esc(round.name) + '</div><div class="match-list">';
      round.matches.forEach((m, mi) => { html += renderTeamMatch(m, 'ko_' + ri + '_' + mi); });
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
    bindToggle();
  }

  function renderBracketMatch(match) {
    const t1 = getTeamName(data.teams, match.team1Id);
    const t2 = getTeamName(data.teams, match.team2Id);
    let html = '<div class="bracket-match">';
    if (match.completed) {
      const w1 = match.score1 > match.score2;
      html += '<div class="bracket-team ' + (w1 ? 'winner' : 'loser') + '"><span class="team-name">' + esc(t1) + '</span><span class="team-score">' + match.score1 + '</span></div>';
      html += '<div class="bracket-team ' + (!w1 ? 'winner' : 'loser') + '"><span class="team-name">' + esc(t2) + '</span><span class="team-score">' + match.score2 + '</span></div>';
    } else {
      html += '<div class="bracket-team"><span class="team-name">' + esc(t1) + '</span><span class="team-score">-</span></div>';
      html += '<div class="bracket-team"><span class="team-name">' + esc(t2) + '</span><span class="team-score">-</span></div>';
    }
    html += '</div>';
    return html;
  }

  function bindToggle() {
    document.querySelectorAll('[data-toggle]').forEach(el => {
      if (el._bound) return;
      el._bound = true;
      el.addEventListener('click', function () {
        const target = document.getElementById(this.dataset.toggle);
        if (!target) return;
        const open = target.style.display !== 'none';
        target.style.display = open ? 'none' : 'block';
        this.querySelector('.toggle-arrow').innerHTML = open ? '&#9660;' : '&#9650;';
      });
    });
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function startApp() {
    if (window._firestoreReady) { window._firestoreReady.then(init); }
    else { init(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startApp);
  else startApp();
})();
