/* =============================================================
   NEON DROP — drop & merge puzzle. Pure vanilla JS + Canvas.
   No dependencies, no network calls, works offline.
   ============================================================= */
(function () {
  'use strict';

  var COLS = 5, ROWS = 8;
  var grid = [];                 // grid[r][c] = {v, x, y, vy, scale, born} | null
  var score = 0, best = 0, coins = 0;
  var current = null;            // tile waiting to drop {v}
  var nextVal = 2;
  var state = 'menu';            // menu | playing | falling | over
  var dropCol = 2;
  var combo = 0, comboTimer = 0;
  var usedContinue = false;
  var floaters = [];
  var particles = [];
  var shake = 0;
  var dropsSinceAd = 0;

  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, CELL = 0, OX = 0, OY = 0, TOPBAR = 0;

  var PALETTE = {
    2:    ['#1de9b6', '#00bfa5'],
    4:    ['#40c4ff', '#0091ea'],
    8:    ['#7c4dff', '#4527a0'],
    16:   ['#ff4081', '#c51162'],
    32:   ['#ff6e40', '#dd2c00'],
    64:   ['#ffd740', '#ffab00'],
    128:  ['#69f0ae', '#00c853'],
    256:  ['#18ffff', '#00b8d4'],
    512:  ['#b388ff', '#651fff'],
    1024: ['#ff80ab', '#f50057'],
    2048: ['#ffff8d', '#ffd600'],
    4096: ['#ffffff', '#b0bec5']
  };
  function colorsFor(v) { return PALETTE[v] || PALETTE[4096]; }

  /* ---------------------------------------------------------- sizing */
  function resize() {
    var wrap = document.getElementById('wrap');
    var w = wrap.clientWidth, h = wrap.clientHeight;
    cv.width = w * DPR; cv.height = h * DPR;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    W = w; H = h;
    TOPBAR = Math.min(96, h * 0.14);
    var availH = h - TOPBAR - 16;
    CELL = Math.floor(Math.min((w - 24) / COLS, availH / (ROWS + 1.25)));
    OX = Math.floor((w - CELL * COLS) / 2);
    OY = Math.floor(TOPBAR + CELL * 1.25);
  }
  window.addEventListener('resize', resize);

  /* ---------------------------------------------------------- model */
  function newGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) { grid.push(new Array(COLS).fill(null)); }
  }
  function mkTile(v, c, r) {
    return { v: v, x: OX + c * CELL, y: OY + r * CELL, vy: 0, scale: 0.1, pop: 1 };
  }
  function pickValue() {
    var pool = [2, 2, 2, 4, 4];
    var top = highestOnBoard();
    if (top >= 32) pool.push(8);
    if (top >= 128) pool.push(8, 16);
    if (top >= 512) pool.push(16, 32);
    return pool[(Math.random() * pool.length) | 0];
  }
  function highestOnBoard() {
    var m = 2;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++)
      if (grid[r][c] && grid[r][c].v > m) m = grid[r][c].v;
    return m;
  }
  function columnFree(c) { return grid[0][c] === null; }
  function landingRow(c) {
    for (var r = ROWS - 1; r >= 0; r--) if (!grid[r][c]) return r;
    return -1;
  }
  function boardFull() {
    for (var c = 0; c < COLS; c++) if (columnFree(c)) return false;
    return true;
  }

  /* --------------------------------------------------- merge engine */
  function neighborsSame(r, c, v, seen) {
    var stack = [[r, c]], out = [];
    var key = function (a, b) { return a + ',' + b; };
    seen[key(r, c)] = true;
    while (stack.length) {
      var p = stack.pop(); out.push(p);
      var d = [[1,0],[-1,0],[0,1],[0,-1]];
      for (var i = 0; i < 4; i++) {
        var nr = p[0] + d[i][0], nc = p[1] + d[i][1];
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (seen[key(nr, nc)]) continue;
        var t = grid[nr][nc];
        if (t && t.v === v) { seen[key(nr, nc)] = true; stack.push([nr, nc]); }
      }
    }
    return out;
  }

  // Returns true if any merge happened.
  function resolveMerges(focus) {
    var merged = false;
    var order = [];
    for (var r = ROWS - 1; r >= 0; r--) for (var c = 0; c < COLS; c++) if (grid[r][c]) order.push([r, c]);
    if (focus) order.unshift(focus);

    for (var i = 0; i < order.length; i++) {
      var rr = order[i][0], cc = order[i][1];
      var t = grid[rr][cc];
      if (!t) continue;
      var group = neighborsSame(rr, cc, t.v, {});
      if (group.length < 2) continue;

      // collapse into the LOWEST, then left-most cell of the group
      var target = group[0];
      for (var g = 1; g < group.length; g++) {
        if (group[g][0] > target[0] || (group[g][0] === target[0] && group[g][1] < target[1])) target = group[g];
      }
      var newV = t.v * Math.pow(2, group.length - 1);
      for (var g2 = 0; g2 < group.length; g2++) {
        var gr = group[g2][0], gc = group[g2][1];
        if (gr === target[0] && gc === target[1]) continue;
        burst(OX + gc * CELL + CELL / 2, grid[gr][gc].y + CELL / 2, colorsFor(t.v)[0]);
        grid[gr][gc] = null;
      }
      var keep = grid[target[0]][target[1]];
      keep.v = newV; keep.pop = 1.45;
      combo++; comboTimer = 1.1;
      var gain = newV * (1 + combo * 0.25) | 0;
      score += gain;
      coins += Math.max(1, Math.round(newV / 16));
      floaters.push({ x: OX + target[1] * CELL + CELL / 2, y: keep.y, t: 1, txt: '+' + gain, col: colorsFor(newV)[0] });
      shake = Math.min(10, 3 + group.length * 1.5);
      burst(OX + target[1] * CELL + CELL / 2, keep.y + CELL / 2, colorsFor(newV)[0], 18);
      merged = true;
      break; // one merge per pass, then gravity, then re-check (cascades)
    }
    return merged;
  }

  function applyGravity() {
    var moved = false;
    for (var c = 0; c < COLS; c++) {
      var write = ROWS - 1;
      for (var r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c]) {
          if (r !== write) { grid[write][c] = grid[r][c]; grid[r][c] = null; moved = true; }
          write--;
        }
      }
    }
    return moved;
  }

  function settle() {
    var guard = 0;
    var did = true;
    while (did && guard++ < 200) {
      did = false;
      if (applyGravity()) did = true;
      if (resolveMerges(null)) did = true;
    }
  }

  /* ------------------------------------------------------- effects */
  function burst(x, y, col, n) {
    n = n || 10;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 180;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: 1, col: col, r: 2 + Math.random() * 3 });
    }
  }

  /* --------------------------------------------------------- input */
  function colFromX(px) {
    var c = Math.floor((px - OX) / CELL);
    return Math.max(0, Math.min(COLS - 1, c));
  }
  function pointer(e) {
    var rect = cv.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }
  function onMove(e) {
    if (state !== 'playing') return;
    dropCol = colFromX(pointer(e).x);
  }
  function onDown(e) { onMove(e); }
  function onUp(e) {
    if (state !== 'playing') return;
    e.preventDefault();
    doDrop(dropCol);
  }
  cv.addEventListener('mousemove', onMove);
  cv.addEventListener('mousedown', onDown);
  cv.addEventListener('mouseup', onUp);
  cv.addEventListener('touchstart', function (e) { onDown(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', function (e) { onMove(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', onUp, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (state !== 'playing') return;
    if (e.key === 'ArrowLeft')  dropCol = Math.max(0, dropCol - 1);
    if (e.key === 'ArrowRight') dropCol = Math.min(COLS - 1, dropCol + 1);
    if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); doDrop(dropCol); }
  });

  function doDrop(c) {
    if (!columnFree(c)) { shake = 6; return; }
    var r = landingRow(c);
    var t = mkTile(current.v, c, r);
    t.y = OY - CELL;          // start above board, animate down
    t.scale = 1;
    grid[r][c] = t;
    state = 'falling';
    t.target = OY + r * CELL;
    t.falling = true;
    current = null;
    dropsSinceAd++;
  }

  function afterLanding() {
    combo = 0;
    settle();
    // sync tile visual positions after gravity
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = grid[r][c];
      if (t) { t.x = OX + c * CELL; t.targetY = OY + r * CELL; }
    }
    if (score > best) { best = score; save(); }
    if (boardFull() && !anyMergePossible()) { gameOver(); return; }
    spawn();
  }

  function anyMergePossible() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = grid[r][c]; if (!t) continue;
      if (r + 1 < ROWS && grid[r+1][c] && grid[r+1][c].v === t.v) return true;
      if (c + 1 < COLS && grid[r][c+1] && grid[r][c+1].v === t.v) return true;
    }
    return false;
  }

  function spawn() {
    current = { v: nextVal };
    nextVal = pickValue();
    state = 'playing';
  }

  /* ------------------------------------------------------ game flow */
  function startGame() {
    newGrid(); score = 0; combo = 0; usedContinue = false; dropsSinceAd = 0;
    floaters = []; particles = [];
    nextVal = pickValue();
    spawn();
    hideAll();
    if (window.Ads) Ads.gameplayStart();
  }

  function gameOver() {
    state = 'over';
    if (window.Ads) Ads.gameplayStop();
    if (score > best) { best = score; }
    save();
    document.getElementById('finalScore').textContent = score.toLocaleString();
    document.getElementById('finalBest').textContent = best.toLocaleString();
    document.getElementById('finalCoins').textContent = coins.toLocaleString();
    document.getElementById('reviveBtn').style.display = usedContinue ? 'none' : '';
    show('overOverlay');
    // Break ad between sessions (respects cooldown, never blocks)
    if (window.Ads && dropsSinceAd > 6) { dropsSinceAd = 0; Ads.interstitial(); }
  }

  function revive() {
    if (usedContinue || !window.Ads) return;
    var btn = document.getElementById('reviveBtn');
    btn.disabled = true; btn.textContent = 'Loading ad…';
    Ads.rewarded().then(function (ok) {
      btn.disabled = false; btn.innerHTML = '&#9654;&nbsp; Watch ad &amp; continue';
      if (!ok) return;
      usedContinue = true;
      // clear the top 3 rows as the reward
      for (var r = 0; r < 3; r++) for (var c = 0; c < COLS; c++) {
        if (grid[r][c]) { burst(OX + c * CELL + CELL / 2, grid[r][c].y + CELL / 2, '#18ffff'); grid[r][c] = null; }
      }
      settle();
      for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++)
        if (grid[r2][c2]) { grid[r2][c2].x = OX + c2 * CELL; grid[r2][c2].targetY = OY + r2 * CELL; }
      hideAll();
      spawn();
      if (window.Ads) Ads.gameplayStart();
    });
  }

  function doubleCoins() {
    var btn = document.getElementById('dblBtn');
    btn.disabled = true; btn.textContent = 'Loading ad…';
    Ads.rewarded().then(function (ok) {
      btn.disabled = false; btn.innerHTML = '&#10022;&nbsp; Double my coins';
      if (!ok) return;
      coins += Math.max(10, Math.round(score / 20));
      save();
      document.getElementById('finalCoins').textContent = coins.toLocaleString();
      btn.style.display = 'none';
    });
  }

  /* ------------------------------------------------------- storage */
  function save() {
    try {
      localStorage.setItem('neondrop', JSON.stringify({ best: best, coins: coins }));
    } catch (e) {}
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem('neondrop') || '{}');
      best = d.best || 0; coins = d.coins || 0;
    } catch (e) {}
  }

  /* ----------------------------------------------------- overlays */
  function show(id) { document.getElementById(id).classList.add('on'); }
  function hideAll() {
    ['menuOverlay', 'overOverlay', 'pauseOverlay'].forEach(function (id) {
      document.getElementById(id).classList.remove('on');
    });
  }

  /* -------------------------------------------------------- render */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTile(x, y, v, scale) {
    var pad = Math.max(3, CELL * 0.06);
    var s = CELL - pad * 2;
    var cx = x + CELL / 2, cy = y + CELL / 2;
    var cols = colorsFor(v);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.shadowColor = cols[0]; ctx.shadowBlur = CELL * 0.35;
    var g = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
    g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    ctx.fillStyle = g;
    roundRect(x + pad, y + pad, s, s, s * 0.22);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundRect(x + pad, y + pad, s, s * 0.38, s * 0.2);
    ctx.fill();
    var txt = v >= 1024 ? (v / 1024) + 'K' : '' + v;
    ctx.fillStyle = '#04121a';
    ctx.font = '800 ' + Math.floor(s * (txt.length > 3 ? 0.3 : txt.length > 2 ? 0.36 : 0.44)) + 'px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, cy + 1);
    ctx.restore();
  }

  function render(dt) {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (shake > 0.2) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= 0.86; }

    // board backdrop
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    roundRect(OX - 6, OY - 6, CELL * COLS + 12, CELL * ROWS + 12, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,230,255,.18)'; ctx.lineWidth = 1.5;
    ctx.stroke();

    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      ctx.fillStyle = 'rgba(255,255,255,.028)';
      var pad = Math.max(3, CELL * 0.06);
      roundRect(OX + c * CELL + pad, OY + r * CELL + pad, CELL - pad * 2, CELL - pad * 2, (CELL - pad * 2) * 0.22);
      ctx.fill();
    }

    // drop guide
    if (state === 'playing' && current) {
      var lr = landingRow(dropCol);
      ctx.fillStyle = 'rgba(29,233,182,.10)';
      roundRect(OX + dropCol * CELL + 2, OY, CELL - 4, CELL * ROWS, 10);
      ctx.fill();
      if (lr >= 0) {
        ctx.strokeStyle = 'rgba(29,233,182,.55)'; ctx.lineWidth = 2;
        var pad2 = Math.max(3, CELL * 0.06);
        roundRect(OX + dropCol * CELL + pad2, OY + lr * CELL + pad2, CELL - pad2 * 2, CELL - pad2 * 2, (CELL - pad2 * 2) * 0.22);
        ctx.stroke();
      }
      drawTile(OX + dropCol * CELL, OY - CELL * 1.15, current.v, 1);
    }

    // tiles
    for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) {
      var t = grid[r2][c2];
      if (!t) continue;
      drawTile(t.x, t.y, t.v, t.scale * t.pop);
    }

    // particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      ctx.globalAlpha = Math.max(0, p.t);
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // floaters
    for (var j = floaters.length - 1; j >= 0; j--) {
      var f = floaters[j];
      ctx.globalAlpha = Math.max(0, f.t);
      ctx.fillStyle = f.col;
      ctx.font = '800 ' + Math.floor(CELL * 0.32) + 'px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.txt, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // HUD
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(160,220,255,.65)';
    ctx.font = '600 ' + Math.floor(TOPBAR * 0.16) + 'px system-ui,sans-serif';
    ctx.fillText('SCORE', OX, TOPBAR * 0.36);
    ctx.fillStyle = '#eafcff';
    ctx.font = '800 ' + Math.floor(TOPBAR * 0.34) + 'px system-ui,sans-serif';
    ctx.fillText(score.toLocaleString(), OX, TOPBAR * 0.74);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(160,220,255,.65)';
    ctx.font = '600 ' + Math.floor(TOPBAR * 0.16) + 'px system-ui,sans-serif';
    ctx.fillText('BEST', OX + CELL * COLS, TOPBAR * 0.36);
    ctx.fillStyle = '#ffd740';
    ctx.font = '800 ' + Math.floor(TOPBAR * 0.28) + 'px system-ui,sans-serif';
    ctx.fillText(best.toLocaleString(), OX + CELL * COLS, TOPBAR * 0.72);

    if (combo > 1 && comboTimer > 0) {
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, comboTimer);
      ctx.fillStyle = '#ff4081';
      ctx.font = '900 ' + Math.floor(TOPBAR * 0.3) + 'px system-ui,sans-serif';
      ctx.fillText('COMBO x' + combo, W / 2, TOPBAR * 0.62);
      ctx.globalAlpha = 1;
    }

    // NEXT preview
    if (current) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(160,220,255,.5)';
      ctx.font = '600 ' + Math.floor(TOPBAR * 0.15) + 'px system-ui,sans-serif';
      ctx.fillText('NEXT ' + nextVal, W / 2, TOPBAR * 0.9);
    }
  }

  /* ---------------------------------------------------------- loop */
  var last = performance.now(), paused = false;
  /* Backstop against a third-party ad freezing the game forever. An ad is
     supposed to resume us via the SDK's own event (GD: SDK_GAME_START), but a
     blocked or broken SDK fires the pause and never the resume — leaving the
     board frozen with no way out. Generous enough never to interrupt a real
     ad, short enough that the game cannot become unplayable. */
  var pauseGuard = null;
  function resumePlay() {
    clearTimeout(pauseGuard); pauseGuard = null;
    paused = false; last = performance.now();
  }
  window.addEventListener('ads:pause', function () {
    paused = true;
    clearTimeout(pauseGuard);
    pauseGuard = setTimeout(resumePlay, 90000);
  });
  window.addEventListener('ads:resume', resumePlay);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { paused = true; } else { paused = false; last = performance.now(); }
  });

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused) update(dt);
    render(dt);
    requestAnimationFrame(tick);
  }

  function update(dt) {
    if (comboTimer > 0) comboTimer -= dt;

    var anyFalling = false;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = grid[r][c];
      if (!t) continue;
      var ty = (t.targetY !== undefined ? t.targetY : OY + r * CELL);
      if (t.falling || Math.abs(t.y - ty) > 0.5) {
        t.vy += 2600 * dt;
        t.y += t.vy * dt;
        if (t.y >= ty) { t.y = ty; t.vy = 0; if (t.falling) { t.falling = false; t.pop = 1.2; } }
        else anyFalling = true;
      } else { t.y = ty; }
      t.x += (OX + c * CELL - t.x) * Math.min(1, dt * 18);
      t.scale += (1 - t.scale) * Math.min(1, dt * 14);
      t.pop += (1 - t.pop) * Math.min(1, dt * 9);
    }

    if (state === 'falling' && !anyFalling) { afterLanding(); }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt * 1.4;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (var j = floaters.length - 1; j >= 0; j--) {
      var f = floaters[j]; f.y -= 46 * dt; f.t -= dt * 1.1;
      if (f.t <= 0) floaters.splice(j, 1);
    }
  }

  /* --------------------------------------------------- pre-roll on Play */
  /* GameDistribution REQUIRES a pre-roll ad on the Play/Start button
     ("Before you submit, make sure that your game includes a pre-roll"), and
     it is normal practice for every ad-monetised web game. Their mid-roll
     guidance — Game Over / Win screen buttons — is already satisfied by
     gameOver() and the two rewarded buttons.

     FIRE AND FORGET, then start. This is deliberate and it follows GD's own
     reference implementation, which calls showAd() on the button and lets the
     SDK pause the game via SDK_GAME_PAUSE rather than awaiting the promise.

     The first version of this awaited Ads.interstitial() before starting, and
     a live test caught the flaw: when the SDK is present but its promise never
     settles (no HTTPS, no ad server, a blocked script), the Play button stays
     disabled and the player is trapped on the menu. A portal rejects a game
     that can dead-end. Starting immediately and pausing via the event removes
     that failure mode entirely — the game is always reachable.

     Skipped when no network is present, so our own site and the itch.io build
     behave exactly as before. */
  function preRollThenStart() {
    if (window.Ads && Ads.network !== 'none') Ads.interstitial();
    startGame();
  }

  /* ---------------------------------------------------------- boot */
  function boot() {
    load();
    resize();
    newGrid();
    document.getElementById('bestMenu').textContent = best.toLocaleString();
    document.getElementById('playBtn').addEventListener('click', preRollThenStart);
    document.getElementById('againBtn').addEventListener('click', startGame);
    document.getElementById('reviveBtn').addEventListener('click', revive);
    document.getElementById('dblBtn').addEventListener('click', doubleCoins);
    show('menuOverlay');
    requestAnimationFrame(tick);

    var p = (window.Ads ? Ads.init() : Promise.resolve());
    p.then(function () {
      if (window.Ads) { Ads.loadingFinished(); Ads.banner('adTop'); }
      // Developer diagnostic only. Gated on AD_CONFIG.debug — a player on a
      // portal must never see "ad network: none" painted on the board.
      var tag = document.getElementById('netTag');
      if (tag) {
        tag.textContent = (window.Ads && Ads.debug)
          ? ('ad network: ' + Ads.network)
          : '';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
