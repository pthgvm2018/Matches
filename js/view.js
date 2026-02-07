// ===== View Page Logic =====
(function () {
  let data = null;

  function init() {
    // Try loading from URL hash first, then localStorage
    data = getDataFromURL();
    if (!data) {
      data = loadData();
    }
    renderAll();
    setupNav();
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        const sec = document.getElementById('sec-' + this.dataset.section);
        if (sec) sec.classList.add('active');
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
    if (t.date) dateEl.textContent = t.date;
    else dateEl.style.display = 'none';
    if (t.location) locEl.textContent = t.location;
    else locEl.style.display = 'none';
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
      html += '<div style="margin-bottom: 16px;">';
      if (t.groupFormat) html += '<span class="badge badge-accent" style="margin-right:8px;">小組賽：' + escHtml(t.groupFormat) + '</span>';
      if (t.knockoutFormat) html += '<span class="badge badge-accent">淘汰賽：' + escHtml(t.knockoutFormat) + '</span>';
      html += '</div>';
    }
    if (t.rules) {
      html += '<div style="white-space:pre-wrap;">' + escHtml(t.rules) + '</div>';
    }
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
      const groupMatches = data.groupMatches.filter(m => m.groupIndex === gi);
      const advanceCount = group.advanceCount || 2;

      html += '<div class="card">';
      html += '<div class="card-title">' + escHtml(group.name) + '</div>';

      // Standings table
      html += '<table class="standings-table">';
      html += '<thead><tr><th>#</th><th>隊伍</th><th>賽</th><th>勝</th><th>負</th><th>局勝</th><th>局負</th><th>局差</th><th>積分</th></tr></thead>';
      html += '<tbody>';
      standings.forEach((s, i) => {
        const team = getTeamById(data.teams, s.teamId);
        const name = team ? team.name : 'Unknown';
        const qualified = i < advanceCount ? ' qualified' : '';
        const gd = s.gamesFor - s.gamesAgainst;
        const gdStr = gd > 0 ? '+' + gd : '' + gd;
        html += '<tr class="' + qualified + '">';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td class="team-name">' + escHtml(name) + '</td>';
        html += '<td>' + s.played + '</td>';
        html += '<td>' + s.wins + '</td>';
        html += '<td>' + s.losses + '</td>';
        html += '<td>' + s.gamesFor + '</td>';
        html += '<td>' + s.gamesAgainst + '</td>';
        html += '<td>' + gdStr + '</td>';
        html += '<td><strong>' + s.points + '</strong></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';

      // Match results
      if (groupMatches.length > 0) {
        html += '<div style="margin-top:16px;">';
        html += '<h4 style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:10px;">比賽結果</h4>';
        html += '<div class="match-list">';
        groupMatches.forEach(m => {
          html += renderMatchItem(m);
        });
        html += '</div></div>';
      }

      html += '</div>';
    });

    container.innerHTML = html;
  }

  function renderMatchItem(match) {
    const t1 = getTeamName(data.teams, match.team1Id);
    const t2 = getTeamName(data.teams, match.team2Id);

    if (!match.completed) {
      return '<div class="match-item match-pending">' +
        '<span class="team left">' + escHtml(t1) + '</span>' +
        '<span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>' +
        '<span class="team right">' + escHtml(t2) + '</span>' +
        '</div>';
    }

    const w1 = match.score1 > match.score2;
    const c1 = w1 ? 'winner' : 'loser';
    const c2 = w1 ? 'loser' : 'winner';

    let html = '<div class="match-item-wrapper">';
    html += '<div class="match-item">';
    html += '<span class="team left ' + c1 + '">' + escHtml(t1) + '</span>';
    html += '<span class="score-box"><span class="s ' + c1 + '">' + match.score1 + '</span><span class="divider">:</span><span class="s ' + c2 + '">' + match.score2 + '</span></span>';
    html += '<span class="team right ' + c2 + '">' + escHtml(t2) + '</span>';
    html += '</div>';

    if (match.games && match.games.length > 0) {
      const gamesStr = match.games.map(g => g.s1 + '-' + g.s2).join(', ');
      html += '<div class="match-item"><div class="games-detail">(' + gamesStr + ')</div></div>';
    }
    html += '</div>';
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

    // Bracket view
    html += '<div class="bracket-container"><div class="bracket">';
    rounds.forEach((round, ri) => {
      html += '<div class="bracket-round">';
      html += '<div class="bracket-round-title">' + escHtml(round.name) + '</div>';
      html += '<div class="bracket-matches">';
      round.matches.forEach(match => {
        html += renderBracketMatch(match);
      });
      html += '</div></div>';
      // Connector between rounds (except last)
      if (ri < rounds.length - 1) {
        html += '<div class="bracket-connector"></div>';
      }
    });
    html += '</div></div>';

    // Detailed match results below bracket
    html += '<div style="margin-top:24px;">';
    rounds.forEach(round => {
      html += '<div class="card">';
      html += '<div class="card-title">' + escHtml(round.name) + '</div>';
      html += '<div class="match-list">';
      round.matches.forEach(m => {
        html += renderMatchItem(m);
      });
      html += '</div></div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function renderBracketMatch(match) {
    const t1 = getTeamName(data.teams, match.team1Id);
    const t2 = getTeamName(data.teams, match.team2Id);

    let html = '<div class="bracket-match">';
    if (match.completed) {
      const w1 = match.score1 > match.score2;
      html += '<div class="bracket-team ' + (w1 ? 'winner' : 'loser') + '"><span class="team-name">' + escHtml(t1) + '</span><span class="team-score">' + match.score1 + '</span></div>';
      html += '<div class="bracket-team ' + (!w1 ? 'winner' : 'loser') + '"><span class="team-name">' + escHtml(t2) + '</span><span class="team-score">' + match.score2 + '</span></div>';
    } else {
      html += '<div class="bracket-team"><span class="team-name">' + escHtml(t1) + '</span><span class="team-score">-</span></div>';
      html += '<div class="bracket-team"><span class="team-name">' + escHtml(t2) + '</span><span class="team-score">-</span></div>';
    }
    html += '</div>';
    return html;
  }

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
