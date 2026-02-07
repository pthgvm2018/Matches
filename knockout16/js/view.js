// ===== 16強雙打淘汰賽 - 觀看頁面 =====
(function () {
  var data = null;

  function init() {
    data = getDataFromURL();
    if (!data) data = loadData();
    renderAll();
    setupNav();
  }

  function setupNav() {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
        document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
        this.classList.add('active');
        var sec = document.getElementById('sec-' + this.dataset.section);
        if (sec) sec.classList.add('active');
      });
    });
  }

  function renderAll() {
    renderHeader();
    renderRules();
    renderBracket();
    renderDetail();
  }

  function renderHeader() {
    var t = data.tournament;
    if (t.name) {
      document.getElementById('tournamentTitle').textContent = t.name;
      document.title = t.name;
    }
    var dateEl = document.getElementById('tournamentDate');
    var locEl = document.getElementById('tournamentLocation');
    if (t.date) dateEl.textContent = t.date; else dateEl.style.display = 'none';
    if (t.location) locEl.textContent = t.location; else locEl.style.display = 'none';
  }

  function renderRules() {
    var el = document.getElementById('rulesContent');
    var t = data.tournament;
    if (!t.rules && !t.format) {
      el.innerHTML = '<p class="empty-state">尚未設定比賽規則</p>';
      return;
    }
    var html = '';
    if (t.format) html += '<div style="margin-bottom:16px;"><span class="badge badge-accent">賽制：' + esc(t.format) + '</span></div>';
    if (t.rules) html += '<div style="white-space:pre-wrap;">' + esc(t.rules) + '</div>';
    el.innerHTML = html;
  }

  // ===== 樹狀對戰圖 (Pure Flexbox Bracket) =====
  // 原理：每個 round 為一欄，靠 border-bottom(game-top)、border-right(game-spacer)、
  //       border-top(game-bottom) 三條線自然形成 ┐└ 型連接線。
  //       各欄緊鄰排列，flexbox justify-content:center + flex-grow spacer
  //       自動讓下一輪的比賽對齊在上一輪兩場比賽的中間。
  function renderBracket() {
    var container = document.getElementById('bracketContainer');
    if (!data.rounds || data.rounds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚無對戰資料</p></div>';
      return;
    }

    var html = '<div class="bracket-wrap"><div class="bracket">';

    data.rounds.forEach(function (round) {
      html += '<ul class="round">';
      round.matches.forEach(function (m) {
        html += '<li class="spacer">&nbsp;</li>';
        html += gameLi(m, true);
        html += '<li class="game-spacer">&nbsp;</li>';
        html += gameLi(m, false);
      });
      html += '<li class="spacer">&nbsp;</li>';
      html += '</ul>';
    });

    // 冠軍
    var fm = data.rounds[data.rounds.length - 1].matches[0];
    if (fm && fm.completed) {
      var cid = fm.score1 > fm.score2 ? fm.team1Id : fm.team2Id;
      html += '<ul class="round-champion"><li class="spacer">&nbsp;</li>';
      html += '<li class="champion-name">' + esc(getTeamName(data.teams, cid)) + '</li>';
      html += '<li class="spacer">&nbsp;</li></ul>';
    }

    html += '</div>';

    // 季軍戰
    if (data.thirdPlace) {
      var tp = data.thirdPlace;
      var w1 = tp.completed && tp.score1 > tp.score2;
      var w2 = tp.completed && tp.score2 > tp.score1;
      html += '<div class="third-place-section"><div class="tp-title">季軍戰</div>';
      html += '<div class="tp-row' + (w1 ? ' winner' : '') + '"><span class="tname">' + esc(getTeamName(data.teams, tp.team1Id)) + '</span><span class="tscore">' + (tp.completed ? tp.score1 : '-') + '</span></div>';
      html += '<div class="tp-row' + (w2 ? ' winner' : '') + '"><span class="tname">' + esc(getTeamName(data.teams, tp.team2Id)) + '</span><span class="tscore">' + (tp.completed ? tp.score2 : '-') + '</span></div>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function gameLi(m, isTop) {
    var tid = isTop ? m.team1Id : m.team2Id;
    var sc = isTop ? m.score1 : m.score2;
    var osc = isTop ? m.score2 : m.score1;
    var w = m.completed && sc > osc;
    var s = m.completed ? sc : (tid ? '-' : '');
    var cls = 'game ' + (isTop ? 'game-top' : 'game-bottom') + (w ? ' winner' : '');
    return '<li class="' + cls + '"><span class="tname">' + esc(getTeamName(data.teams, tid)) + '</span><span class="tscore">' + s + '</span></li>';
  }

  // ===== 比賽詳情（可展開各局比分） =====
  function renderDetail() {
    var container = document.getElementById('detailContainer');
    if (!data.rounds || data.rounds.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>尚無比賽資料</p></div>';
      return;
    }

    var html = '';
    // 所有輪次
    var allRounds = data.rounds.slice();
    if (data.thirdPlace) {
      allRounds.push({ name: '季軍戰', matches: [data.thirdPlace] });
    }

    allRounds.forEach(function (round) {
      html += '<div class="card detail-card"><div class="card-title">' + esc(round.name) + '</div>';
      round.matches.forEach(function (m, mi) {
        html += renderMatchRow(m, round.name + '_' + mi);
      });
      html += '</div>';
    });

    container.innerHTML = html;
    bindToggle();
  }

  function renderMatchRow(m, uid) {
    var t1 = getTeamName(data.teams, m.team1Id);
    var t2 = getTeamName(data.teams, m.team2Id);

    if (!m.completed && !m.team1Id && !m.team2Id) return '';

    if (!m.completed) {
      var html = '<div class="match-row"><div class="match-row-header">';
      html += '<span class="team left">' + esc(t1) + '</span>';
      html += '<span class="score-box"><span class="s">-</span><span class="divider">:</span><span class="s">-</span></span>';
      html += '<span class="team right">' + esc(t2) + '</span>';
      html += '</div></div>';
      return html;
    }

    var w1 = m.score1 > m.score2;
    var c1 = w1 ? 'winner' : 'loser', c2 = w1 ? 'loser' : 'winner';
    var p1 = getPlayersDisplay(data.teams, m.team1Id);
    var p2 = getPlayersDisplay(data.teams, m.team2Id);

    var html = '<div class="match-row">';
    html += '<div class="match-row-header" data-toggle="d_' + uid + '">';
    html += '<span class="team left ' + c1 + '">' + esc(t1) + '</span>';
    html += '<span class="score-box"><span class="s ' + c1 + '">' + m.score1 + '</span><span class="divider">:</span><span class="s ' + c2 + '">' + m.score2 + '</span></span>';
    html += '<span class="team right ' + c2 + '">' + esc(t2) + '</span>';
    html += '<span class="toggle-arrow">&#9660;</span>';
    html += '</div>';

    html += '<div class="match-row-body" id="d_' + uid + '" style="display:none;">';
    html += '<div class="players"><span class="' + c1 + '">' + esc(p1) + '</span><span style="color:var(--text-muted);">vs</span><span class="' + c2 + '">' + esc(p2) + '</span></div>';
    html += '<div class="games-list">';
    if (m.games) {
      m.games.forEach(function (g, gi) {
        var gw1 = g.s1 > g.s2;
        html += '<div class="game-badge"><span class="' + (gw1 ? 'gw' : 'gl') + '">' + g.s1 + '</span> - <span class="' + (!gw1 ? 'gw' : 'gl') + '">' + g.s2 + '</span></div>';
      });
    }
    html += '</div></div></div>';
    return html;
  }

  function bindToggle() {
    document.querySelectorAll('[data-toggle]').forEach(function (el) {
      if (el._bound) return;
      el._bound = true;
      el.addEventListener('click', function () {
        var target = document.getElementById(this.dataset.toggle);
        if (!target) return;
        var open = target.style.display !== 'none';
        target.style.display = open ? 'none' : 'block';
        var arrow = this.querySelector('.toggle-arrow');
        if (arrow) arrow.innerHTML = open ? '&#9660;' : '&#9650;';
      });
    });
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
