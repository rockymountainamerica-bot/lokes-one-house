/* Invaders over the house — the arcade is the centerpiece.
   Modes: idle (reduced motion: one still frame) · attract (the cabinet plays itself on load)
          · play (a real run: sectors, combos, the cart boss, a mystery ship, initials, a table).
   Sectors are the three doors: lokes.one → me.lokes.one → vanism.ai, boss every third. Sector 09 clear = EMPIRE SECURED.
   Controls: ←/→ or A/D or pointer to move · Space/↑/W or tap to fire (hold to autofire) · Esc exits · on-screen pad on phones.
   Everything drawn is integer-positioned pixels; banners/pops are DOM so the pixel font stays crisp.
   Emits `lokes:game` CustomEvents so the C3i desk and Odin can react. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var hero = $("hero"), canvas = $("invaders"), odin = $("odin"), playBtn = $("play"), msgEl = $("game-msg");
  var scoreEl = $("score"), hiEl = $("hiscore"), hiIniEl = $("hiscore-ini"), livesEl = $("lives");
  var sectorEl = $("sector"), sectorNameEl = $("sector-name"), comboEl = $("combo"), scoreline = $("scoreline");
  var stageMode = $("stage-mode"), popsEl = $("pops");
  var screen = $("screen"), screenTitle = $("screen-title"), screenSub = $("screen-sub"), screenStats = $("screen-stats");
  var iniForm = $("initials"), slotsEl = $("slots"), tableEl = $("hi-table"), replayBtn = $("screen-replay"), exitBtn = $("screen-exit");
  var padEl = $("pad"), padL = $("pad-left"), padR = $("pad-right"), padF = $("pad-fire"), padQ = $("pad-quit");
  if (!hero || !canvas || !canvas.getContext || !odin) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- sprites (two frames each) ---------------------------------------
  var SQUID = [[
    "...XX...", "..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", "..X..X..", ".X.XX.X.", "X.X..X.X"
  ], [
    "...XX...", "..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", ".X.XX.X.", "X......X", ".X....X."
  ]];
  var CRAB = [[
    "..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."
  ], [
    "..X.....X..", "X..X...X..X", "X.XXXXXXX.X", "XXX.XXX.XXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..X.....X..", ".X.......X."
  ]];
  var OCTO = [[
    "....XXXX....", ".XXXXXXXXXX.", "XXXXXXXXXXXX", "XXX..XX..XXX", "XXXXXXXXXXXX", "...XX..XX...", "..XX.XX.XX..", "XX........XX"
  ], [
    "....XXXX....", ".XXXXXXXXXX.", "XXXXXXXXXXXX", "XXX..XX..XXX", "XXXXXXXXXXXX", "..XXX..XXX..", ".XX..XX..XX.", "..XX....XX.."
  ]];
  var UFO = [[
    ".....XXXXXX.....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", ".XX.XX.XX.XX.XX.", "XXXXXXXXXXXXXXXX", "..XXX..XX..XXX..", "...X........X..."
  ], [
    ".....XXXXXX.....", "...XXXXXXXXXX...", "..XXXXXXXXXXXX..", ".XXX.XX.XX.XX.X.", "XXXXXXXXXXXXXXXX", "..XXX..XX..XXX..", "....X......X...."
  ]];
  // the boss: a shopping cart. The one thing the house law says never gets built. Odin sends it back.
  var CART = [
    "............XXX.", "............X...", "...........XX...", ".XXXXXXXXXXX....", ".X.X.X.X.X.X....", ".X.X.X.X.X.X....",
    ".XXXXXXXXXXX....", "..X.X.X.X.X.....", "..XXXXXXXXX.....", "...X.....X......", "..XXX...XXX.....", "..XXX...XXX....."
  ];
  var BOOM = ["X..X..X.", ".X.XX.X.", "..X..X..", "XX....XX", "..X..X..", ".X.XX.X.", "X..X..X."];
  var CARROT = ["G.G", ".G.", "OOO", "OOO", ".O.", ".O.", ".O."];
  var DIGIT = { "0": ["XXX", "X.X", "X.X", "X.X", "XXX"], "1": [".X.", "XX.", ".X.", ".X.", "XXX"] };
  var ROWS = [
    { s: SQUID, pts: 30 }, { s: CRAB, pts: 20 }, { s: CRAB, pts: 20 }, { s: OCTO, pts: 10 }, { s: OCTO, pts: 10 }
  ];
  var SECTORS = [
    { name: "lokes.one", tag: "the house" }, { name: "me.lokes.one", tag: "the man" }, { name: "vanism.ai", tag: "the product" }
  ];
  var WIN_WAVE = 9;
  var COLS = 11;
  var INK = "242,244,241", PINK = "255,79,210", GREEN = "57,255,136", ORANGE = "255,138,61", LINE = "58,68,61";

  var S = 3, CELL_W = 48, CELL_H = 39;
  function setScale() {
    S = W < 600 ? 2 : 3;
    CELL_W = 16 * S; CELL_H = 13 * S;
  }

  // --- drawing ---------------------------------------------------------------
  function drawSprite(grid, x, y, color, alpha, scale) {
    scale = scale || S;
    var w = grid[0].length;
    ctx.fillStyle = "rgba(" + color + "," + alpha + ")";
    for (var r = 0; r < grid.length; r++) {
      var row = grid[r], c = 0;
      while (c < w) {
        if (row[c] === "X") {
          var start = c;
          while (c < w && row[c] === "X") c++;
          ctx.fillRect(x + start * scale, y + r * scale, (c - start) * scale, scale);
        } else c++;
      }
    }
  }
  function drawCarrot(x, y) {
    for (var r = 0; r < CARROT.length; r++) {
      for (var c = 0; c < 3; c++) {
        var ch = CARROT[r][c];
        if (ch === ".") continue;
        ctx.fillStyle = ch === "G" ? "rgb(" + GREEN + ")" : "rgb(" + ORANGE + ")";
        ctx.fillRect(x + c * S, y + r * S, S, S);
      }
    }
  }
  // a laser made of pixels: pink beam, dim tail above, one hot ink column down the middle
  function drawBeam(x, y) {
    ctx.fillStyle = "rgba(" + PINK + ",0.35)";
    ctx.fillRect(x, y - 3 * S, S, 3 * S);
    ctx.fillStyle = "rgb(" + PINK + ")";
    ctx.fillRect(x, y, S, 4 * S);
    ctx.fillStyle = "rgba(" + INK + ",0.9)";
    ctx.fillRect(x + Math.floor(S / 2), y, 1, 2 * S);
  }

  // --- state ------------------------------------------------------------
  var W = 0, H = 0;
  var mode = "idle", over = false;
  var fleet, fx, fy, dir, frame, stepMs, lastStep = 0, cols;
  var carrots = [], bolts = [], booms = [], shards = [];
  var ufo = null, boss = null;
  var score = 0, lives = 3, wave = 1, kills = 0, shots = 0, combo = 0, comboUntil = 0, comboTold = false;
  var odinX = 0, odinBaseLeft = 0, odinW = 0, odinTop = 0, odinH = 0, moveDir = 0, firing = false, lastFire = 0, facing = 1;
  var rafId = null, lastFrame = 0, hitFlashUntil = 0, invUntil = 0;
  var msgTimer = null, attractTimer = null, spawnTimer = null;
  var ai = { tx: 0, hold: 0 };
  var lastStepX = 6;
  var table = loadTable();
  var initialsOpen = false;

  function pad(n) { n = Math.min(9999, Math.max(0, n)); return String(n).padStart(4, "0"); }
  function pad2(n) { return String(Math.min(99, n)).padStart(2, "0"); }
  function sectorOf(w) { return SECTORS[(w - 1) % SECTORS.length]; }
  function isBossWave(w) { return w % 3 === 0; }
  function emit(type, extra) {
    var d = Object.assign({ type: type, mode: mode, score: score, lives: lives, wave: wave }, extra || {});
    document.dispatchEvent(new CustomEvent("lokes:game", { detail: d }));
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function odinReact(cls) { if (!reduced.matches) restart(odin, cls); }
  function shake() { if (!reduced.matches) restart(hero, "shake"); }
  function flash() {
    if (reduced.matches) return;
    restart(hero, "flash");
    setTimeout(function () { hero.classList.remove("flash"); }, 260);
  }

  // --- messages, pops, readouts ----------------------------------------------
  function showMsg(html, tone, ms) {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.className = "game-msg show" + (tone ? " " + tone : "");
    clearTimeout(msgTimer);
    if (ms) msgTimer = setTimeout(hideMsg, ms);
  }
  var PRESS_START = "▶ press start<small>odin vs the invaders · tap · enter · p</small>";
  function hideMsg() {
    if (!msgEl) return;
    msgEl.className = "game-msg";
    if (mode === "attract" && !over) showMsg(PRESS_START, "pulse");
  }
  function addPop(x, y, text, cls) {
    if (!popsEl) return;
    while (popsEl.children.length > 9) popsEl.removeChild(popsEl.firstChild);
    var p = document.createElement("span");
    p.className = "pop" + (cls ? " " + cls : "");
    p.textContent = text;
    p.style.left = Math.max(0, Math.min(W - 80, Math.round(x))) + "px";
    p.style.top = Math.max(0, Math.round(y)) + "px";
    popsEl.appendChild(p);
    var kill = function () { if (p.parentNode) p.parentNode.removeChild(p); };
    p.addEventListener("animationend", kill);
    setTimeout(kill, 1000);
  }
  function renderScore() { if (scoreEl) scoreEl.textContent = pad(score); }
  function renderLives() {
    if (!livesEl) return;
    var hearts = livesEl.querySelectorAll("svg");
    for (var i = 0; i < hearts.length; i++) hearts[i].style.opacity = i < lives ? "1" : "0.18";
  }
  function renderSector() {
    if (sectorEl) sectorEl.textContent = pad2(wave);
    if (sectorNameEl) sectorNameEl.textContent = sectorOf(wave).name + (isBossWave(wave) ? " · boss" : "");
  }
  function renderCombo(mult) {
    if (!comboEl) return;
    if (mult > 1) { comboEl.querySelector(".v").textContent = "×" + mult; if (!comboEl.classList.contains("on")) restart(comboEl, "on"); }
    else comboEl.classList.remove("on");
  }
  function renderHi() {
    var top = table[0];
    if (hiEl) hiEl.textContent = pad(top ? top.s : 0);
    if (hiIniEl) hiIniEl.textContent = top ? top.i : "";
  }
  function setMode(m) {
    mode = m;
    hero.classList.toggle("playing", m === "play");
    hero.classList.toggle("attract", m === "attract");
    document.body.classList.toggle("playing", m === "play");
    if (scoreline) scoreline.classList.toggle("demo", m !== "play");
    if (stageMode) stageMode.textContent = m === "play" ? "live" : m === "attract" ? "demo" : "idle";
    if (playBtn) playBtn.innerHTML = m === "play" ? "■ stop<span class=\"blink\">_</span>" : "▶ start<span class=\"blink\">_</span>";
  }

  // --- high-score table (localStorage) ------------------------------------------
  function loadTable() {
    var t = [];
    try { t = JSON.parse(localStorage.getItem("lokes.hi.table") || "[]"); } catch (e) { t = []; }
    if (!Array.isArray(t)) t = [];
    t = t.filter(function (r) { return r && typeof r.s === "number"; });
    try {
      var legacy = parseInt(localStorage.getItem("lokes.hi") || "0", 10) || 0;
      if (legacy > 0 && !t.length) t.push({ i: "ODN", s: legacy, w: 1 });
    } catch (e) {}
    t.sort(function (a, b) { return b.s - a.s; });
    return t.slice(0, 5);
  }
  function saveTable() {
    try {
      localStorage.setItem("lokes.hi.table", JSON.stringify(table));
      if (table[0]) localStorage.setItem("lokes.hi", String(table[0].s));
    } catch (e) {}
  }
  function qualifies(s) { return s > 0 && (table.length < 5 || s > table[table.length - 1].s); }
  function renderTable(youIdx) {
    if (!tableEl) return;
    tableEl.innerHTML = "";
    for (var i = 0; i < table.length; i++) {
      var li = document.createElement("li");
      if (i === youIdx) li.className = "you";
      li.innerHTML = '<span class="n">' + pad2(i + 1) + '</span><span class="i">' + esc(table[i].i) + '</span><span class="s">' + pad(table[i].s) + '</span><span class="w">sector ' + pad2(table[i].w || 1) + "</span>";
      tableEl.appendChild(li);
    }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // --- initials entry: three slots, arcade style ------------------------------------
  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var ini = ["A", "A", "A"], cur = 0, slotEls = [];
  try { var saved = localStorage.getItem("lokes.ini"); if (saved && /^[A-Z]{3}$/.test(saved)) ini = saved.split(""); } catch (e) {}
  function buildSlots() {
    if (!slotsEl) return;
    slotsEl.innerHTML = "";
    slotEls = [];
    for (var i = 0; i < 3; i++) (function (i) {
      var slot = document.createElement("div"); slot.className = "slot";
      var up = document.createElement("button"); up.type = "button"; up.textContent = "▲"; up.setAttribute("aria-label", "letter up");
      var ch = document.createElement("div"); ch.className = "ch"; ch.setAttribute("role", "button"); ch.tabIndex = 0; ch.textContent = ini[i];
      var dn = document.createElement("button"); dn.type = "button"; dn.textContent = "▼"; dn.setAttribute("aria-label", "letter down");
      up.addEventListener("click", function () { cur = i; cycle(1); });
      dn.addEventListener("click", function () { cur = i; cycle(-1); });
      ch.addEventListener("click", function () { cur = i; renderSlots(); });
      slot.appendChild(up); slot.appendChild(ch); slot.appendChild(dn);
      slotsEl.appendChild(slot);
      slotEls.push(slot);
    })(i);
    renderSlots();
  }
  function renderSlots() {
    for (var i = 0; i < slotEls.length; i++) {
      slotEls[i].classList.toggle("cur", i === cur);
      slotEls[i].querySelector(".ch").textContent = ini[i];
    }
  }
  function cycle(d) {
    var idx = (ALPHA.indexOf(ini[cur]) + d + 26) % 26;
    ini[cur] = ALPHA[idx];
    renderSlots();
  }
  function initialsKey(e) {
    if (e.key === "ArrowUp") { cycle(1); }
    else if (e.key === "ArrowDown") { cycle(-1); }
    else if (e.key === "ArrowLeft") { cur = (cur + 2) % 3; renderSlots(); }
    else if (e.key === "ArrowRight") { cur = (cur + 1) % 3; renderSlots(); }
    else if (e.key === "Backspace") { cur = (cur + 2) % 3; renderSlots(); }
    else if (e.key === "Enter") { submitInitials(); }
    else if (e.key.length === 1 && /[a-z]/i.test(e.key)) { ini[cur] = e.key.toUpperCase(); cur = Math.min(2, cur + 1); renderSlots(); }
    else return;
    e.preventDefault();
  }
  function submitInitials() {
    if (!initialsOpen) return;
    initialsOpen = false;
    var name = ini.join("");
    try { localStorage.setItem("lokes.ini", name); } catch (e) {}
    var row = { i: name, s: score, w: wave };
    table.push(row);
    table.sort(function (a, b) { return b.s - a.s; });
    table = table.slice(0, 5);
    saveTable();
    renderHi();
    if (iniForm) iniForm.hidden = true;
    renderTable(table.indexOf(row));
    if (screenSub) screenSub.textContent = table.indexOf(row) === 0 ? name + " · top of the house" : name + " · on the table";
    if (replayBtn) replayBtn.focus({ preventScroll: true });
    emit("hiscore", { initials: name, rank: table.indexOf(row) + 1 });
  }
  if (iniForm) iniForm.addEventListener("submit", function (e) { e.preventDefault(); submitInitials(); });

  // --- screens: over / win ---------------------------------------------------------------
  function stat(k, v) { return "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>"; }
  function showScreen(kind, why) {
    if (!screen) return;
    var acc = shots ? Math.round(100 * kills / shots) : 0;
    screen.className = "screen frame " + kind;
    screenTitle.textContent = kind === "win" ? "empire secured" : "game over";
    screenSub.textContent = kind === "win" ? "nine sectors held · shop still parked" : why + " · shop still parked";
    screenStats.innerHTML = stat("score", pad(score)) + stat("sector", pad2(wave)) + stat("kills", kills) + stat("aim", acc + "%");
    if (kind === "win") { replayBtn.textContent = "▶ keep going"; } else { replayBtn.textContent = "▶ play again"; }
    var q = qualifies(score);
    initialsOpen = q;
    if (iniForm) iniForm.hidden = !q;
    if (q) { buildSlots(); renderTable(-1); } else renderTable(-1);
    screen.hidden = false;
    document.body.classList.add("screen-open");   // the pad steps aside while the screen is up
    var target = q ? slotEls[cur] && slotEls[cur].querySelector(".ch") : replayBtn;
    if (target) target.focus({ preventScroll: true });
  }
  function hideScreen() {
    if (screen) screen.hidden = true;
    document.body.classList.remove("screen-open");
    initialsOpen = false;
    if (iniForm) iniForm.hidden = true;
  }

  // --- geometry ------------------------------------------------------------------------
  function size() {
    var r = hero.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.floor(r.width));
    H = canvas.height = Math.max(1, Math.floor(r.height));
    setScale();
    cols = Math.max(5, Math.min(COLS, Math.floor((W - 2 * CELL_W) / CELL_W)));
    measureOdin();
    if (!fleet) spawnFleet();
    clampFleet();
  }
  function measureOdin() {
    var saved = odin.style.transform;
    odin.style.transform = "none";
    var hr = hero.getBoundingClientRect(), or = odin.getBoundingClientRect();
    var img = $("odin-img");
    var ir = img ? img.getBoundingClientRect() : or;
    odin.style.transform = saved;
    // measure the rabbit, not his column: on phones the column is the whole stage
    odinBaseLeft = ir.left - hr.left;
    odinW = ir.width;
    odinTop = ir.top - hr.top;
    odinH = ir.height;
    if (mode === "idle") odinX = odinBaseLeft;
    else placeOdin(Math.max(0, Math.min(W - odinW, odinX)));
  }
  function placeOdin(x) {
    odinX = x;
    odin.style.transform = "translateX(" + Math.round(odinX - odinBaseLeft) + "px)";
  }
  function face(d) {
    if (d === facing || !d) return;
    facing = d;
    odin.classList.toggle("face-left", d < 0);
  }
  function odinBodyTop() { return odinTop + odinH * 0.42; }   // ears are fair game; the body is the hit line
  function odinRect() {
    var y = odinBodyTop();
    return { x: odinX + odinW * 0.41, y: y, w: odinW * 0.18, h: odinTop + odinH * 0.88 - y };
  }
  function odinCenter() { return odinX + odinW / 2; }

  // --- fleet -----------------------------------------------------------------------------
  function bossScale() { return S * 2; }
  // the sky: room for the mystery ship, and on phones room for the start button
  function skyTop() { return W < 600 ? 52 : 4; }
  function laneTop() { return skyTop() + 9 * S; }
  function spawnFleet() {
    fleet = [];
    var live = mode !== "idle";
    var bossWave = live && isBossWave(wave);
    var rows = !live ? 3 : bossWave ? 2 : ROWS.length;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) fleet.push({ r: r, c: c, alive: true });
    fx = Math.floor((W - cols * CELL_W) / 2);
    fy = bossWave ? laneTop() + CART.length * bossScale() + 3 * S : laneTop();
    dir = 1;
    frame = 0;
    stepMs = live ? Math.max(110, 400 - wave * 30) : 700;
    boss = null; ufo = null;
    if (bossWave) spawnBoss();
  }
  function spawnBoss() {
    var sc = bossScale();
    boss = {
      x: 8, y: skyTop() + 4, dir: 1, w: CART[0].length * sc, h: CART.length * sc,
      hp: 8 + wave, maxHp: 8 + wave, lastShot: performance.now() + 1200, flashUntil: 0
    };
    emit("boss", { hp: boss.hp });
  }
  function clampFleet() {
    var maxX = W - cols * CELL_W - 8;
    if (fx > maxX) fx = Math.max(8, maxX);
  }
  function aliveCount() { var n = 0; for (var i = 0; i < fleet.length; i++) if (fleet[i].alive) n++; return n; }
  function fleetBounds() {
    var minC = cols, maxC = -1, maxR = -1;
    for (var i = 0; i < fleet.length; i++) {
      var f = fleet[i]; if (!f.alive) continue;
      if (f.c < minC) minC = f.c; if (f.c > maxC) maxC = f.c; if (f.r > maxR) maxR = f.r;
    }
    return { left: fx + minC * CELL_W, right: fx + (maxC + 1) * CELL_W, bottom: fy + (maxR + 1) * CELL_H, height: (maxR + 1) * CELL_H };
  }
  function invaderRect(f) {
    var spr = ROWS[f.r].s[frame];
    var w = spr[0].length * S, h = spr.length * S;
    return { x: fx + f.c * CELL_W + Math.floor((CELL_W - w) / 2), y: fy + f.r * CELL_H, w: w, h: h, spr: spr };
  }
  function hits(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // --- march -----------------------------------------------------------------------------
  function march(now) {
    if (now - lastStep < stepMs) return;
    lastStep = now;
    frame ^= 1;
    if (!aliveCount()) return;
    var b = fleetBounds();
    var live = mode !== "idle";
    // a traverse takes ~24 steps whatever the stage width, so wide screens still feel the descent
    var stepX = live ? Math.max(2 * S, Math.round((W - 16 - (b.right - b.left)) / 24)) : S;
    lastStepX = stepX;
    if ((dir > 0 && b.right + stepX > W - 8) || (dir < 0 && b.left - stepX < 8)) {
      dir = -dir;
      var drop = live ? Math.floor(CELL_H / 2) : Math.floor(CELL_H / 4);
      // ambient never touches Odin: recycle from the top before a drop would reach his ears
      if (!live && fy + drop + b.height > odinTop - 8) fy = laneTop();
      else fy += drop;
    } else {
      fx += dir * stepX;
    }
    if (live && !over && fleetBounds().bottom >= odinBodyTop()) { gameOver("they reached the house"); return; }
    // invaders drop a laser now and then, from the lowest one in a column
    if (live && !over && bolts.length < 3 + Math.floor(wave / 2) && Math.random() < Math.min(0.6, 0.15 + wave * 0.04)) {
      var shooters = {};
      for (var i = 0; i < fleet.length; i++) { var f = fleet[i]; if (f.alive) shooters[f.c] = f; }
      var keys = Object.keys(shooters);
      if (keys.length) {
        var s = shooters[keys[Math.floor(Math.random() * keys.length)]];
        bolts.push({ x: fx + s.c * CELL_W + Math.floor(CELL_W / 2) - Math.floor(S / 2), y: fy + (s.r + 1) * CELL_H, vx: 0, vy: 2.4 + wave * 0.25 });
      }
    }
  }

  // --- render ------------------------------------------------------------------------------
  function render(now) {
    ctx.clearRect(0, 0, W, H);
    var live = mode !== "idle";
    var alpha = mode === "play" ? 0.95 : mode === "attract" ? 0.55 : 0.3;
    for (var i = 0; i < fleet.length; i++) {
      var f = fleet[i]; if (!f.alive) continue;
      var r = invaderRect(f);
      drawSprite(r.spr, r.x, r.y, (live && f.r === 0) ? PINK : INK, alpha);
    }
    if (ufo) drawSprite(UFO[frame], Math.floor(ufo.x), ufo.y, INK, alpha);
    if (boss) {
      var sc = bossScale();
      drawSprite(CART, Math.floor(boss.x), boss.y, now < boss.flashUntil ? PINK : INK, alpha, sc);
      // hp bar: pixel blocks under the cart
      var bw = boss.w, by = boss.y + boss.h + S;
      ctx.fillStyle = "rgb(" + LINE + ")";
      ctx.fillRect(Math.floor(boss.x), by, bw, S);
      ctx.fillStyle = "rgb(" + PINK + ")";
      ctx.fillRect(Math.floor(boss.x), by, Math.floor(bw * boss.hp / boss.maxHp), S);
    }
    for (i = 0; i < carrots.length; i++) drawCarrot(carrots[i].x, Math.floor(carrots[i].y));
    for (i = 0; i < bolts.length; i++) drawBeam(Math.floor(bolts[i].x), Math.floor(bolts[i].y));
    for (i = 0; i < booms.length; i++) {
      var bm = booms[i];
      drawSprite(BOOM, bm.x, bm.y, bm.color, 1 - bm.t / bm.life, bm.scale || S);
    }
    var gs = Math.max(2, S - 1);
    for (i = 0; i < shards.length; i++) {
      var sh = shards[i];
      drawSprite(DIGIT[sh.ch], Math.floor(sh.x), Math.floor(sh.y), sh.color, 1 - sh.t / sh.life, gs);
    }
    if (mode === "play" && now < hitFlashUntil) {
      ctx.fillStyle = "rgba(" + PINK + ",0.12)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // --- feedback ------------------------------------------------------------------------------
  function burst(x, y, color, n, big) {
    booms.push({ x: x, y: y, t: 0, life: big ? 14 : 8, color: color, scale: big ? S * 2 : S });
    for (var i = 0; i < n; i++) {
      shards.push({
        x: x + Math.random() * 8 * S, y: y + Math.random() * 4 * S,
        vx: (Math.random() * 6 - 3), vy: -(1 + Math.random() * 3.5),
        ch: Math.random() < 0.5 ? "0" : "1", color: color, t: 0, life: 16 + Math.floor(Math.random() * 10)
      });
    }
  }
  function award(pts, x, y, label, cls) {
    var now = performance.now();
    if (now < comboUntil) combo++; else { combo = 1; comboTold = false; }
    comboUntil = now + 1400;
    var mult = combo >= 3 ? Math.min(combo - 1, 5) : 1;
    var got = pts * mult;
    score += got;
    renderScore();
    renderCombo(mult);
    if (mult >= 3 && !comboTold && mode === "play") { comboTold = true; emit("combo", { mult: mult }); }
    addPop(x - 8, y - 8, "+" + got + (mult > 1 ? " ×" + mult : "") + (label ? " · " + label : ""), cls || (mult > 1 ? "pink" : ""));
    return got;
  }

  // --- game update --------------------------------------------------------------------------------
  var auto = false;   // the demo pilot can also drive a real run (desk command: pilot)
  function update(now) {
    if (mode === "attract" || auto) think(now);
    if (moveDir) {
      face(moveDir);
      placeOdin(Math.max(0, Math.min(W - odinW, odinX + moveDir * ((mode === "attract" || auto) ? 6 : 7))));
    }
    if (firing) fire();
    if (now > comboUntil && combo) { combo = 0; renderCombo(1); }

    // mystery ship: from sector 2, and in the demo
    if (!ufo && !boss && (wave >= 2 || mode === "attract") && Math.random() < 0.0025) {
      var d = Math.random() < 0.5 ? 1 : -1;
      ufo = { x: d > 0 ? -16 * S : W, dir: d, y: skyTop(), w: 16 * S, h: 7 * S, pts: [50, 100, 150][Math.floor(Math.random() * 3)] };
    }
    if (ufo) {
      ufo.x += ufo.dir * 2;
      if (ufo.x < -ufo.w - 4 || ufo.x > W + 4) ufo = null;
    }
    // the cart drifts and fires spreads
    if (boss) {
      boss.x += boss.dir * 1.5;
      if (boss.x < 8) { boss.x = 8; boss.dir = 1; }
      if (boss.x + boss.w > W - 8) { boss.x = W - 8 - boss.w; boss.dir = -1; }
      if (!over && now - boss.lastShot > Math.max(900, 1700 - wave * 60)) {
        boss.lastShot = now;
        var bx = Math.floor(boss.x + boss.w / 2), by = boss.y + boss.h + 2 * S;
        bolts.push({ x: bx, y: by, vx: -1.4, vy: 2.8 });
        bolts.push({ x: bx, y: by, vx: 0, vy: 3.2 });
        bolts.push({ x: bx, y: by, vx: 1.4, vy: 2.8 });
      }
    }
    // carrots
    for (var i = carrots.length - 1; i >= 0; i--) {
      var c = carrots[i];
      c.y -= 9;
      if (c.y < -30) { carrots.splice(i, 1); continue; }
      var cr = { x: c.x, y: c.y, w: 3 * S, h: 7 * S };
      var hitIdx = -1;
      for (var j = 0; j < fleet.length; j++) {
        var f = fleet[j]; if (!f.alive) continue;
        if (hits(cr, invaderRect(f))) { hitIdx = j; break; }
      }
      if (hitIdx >= 0) {
        var k = fleet[hitIdx]; k.alive = false; kills++;
        carrots.splice(i, 1);
        var kr = invaderRect(k);
        var color = k.r === 0 ? PINK : GREEN;
        burst(kr.x, kr.y, color, 5, false);
        award(ROWS[k.r].pts, kr.x, kr.y);
        emit("kill", { pts: ROWS[k.r].pts });
        stepMs = Math.max(90, stepMs - 4);
        checkClear();
        if (!carrots.length) break;   // a cleared sector empties the carrot list under us
        continue;
      }
      if (ufo && hits(cr, ufo)) {
        carrots.splice(i, 1);
        burst(Math.floor(ufo.x), ufo.y, INK, 10, false);
        award(ufo.pts, ufo.x, ufo.y + 24, "mystery", "green");
        kills++;
        emit("ufo", { pts: ufo.pts });
        ufo = null;
        continue;
      }
      if (boss && hits(cr, boss)) {
        carrots.splice(i, 1);
        boss.hp--;
        boss.flashUntil = now + 90;
        if (boss.hp <= 0) {
          kills++;
          burst(Math.floor(boss.x), boss.y, PINK, 18, true);
          burst(Math.floor(boss.x + boss.w / 2), boss.y + boss.h / 2, GREEN, 8, false);
          award(300 * Math.ceil(wave / 3), boss.x + boss.w / 2 - 40, boss.y + boss.h, "cart rejected", "pink big");
          shake(); flash();
          emit("bosskill");
          boss = null;
          checkClear();
          if (!carrots.length) break;
        } else {
          burst(c.x - S, c.y, PINK, 2, false);
          award(20, c.x, c.y, null, "");
        }
        continue;
      }
    }
    // lasers
    var orect = odinRect();
    for (i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      b.y += b.vy; b.x += b.vx || 0;
      if (b.y > H || b.x < -8 || b.x > W + 8) { bolts.splice(i, 1); continue; }
      if (!over && now >= invUntil && hits({ x: b.x, y: b.y, w: S, h: 4 * S }, orect)) {
        bolts.splice(i, 1);
        odinHit();
      }
    }
    for (i = booms.length - 1; i >= 0; i--) { if (++booms[i].t > booms[i].life) booms.splice(i, 1); }
    for (i = shards.length - 1; i >= 0; i--) {
      var sh = shards[i];
      sh.x += sh.vx; sh.y += sh.vy; sh.vy += 0.3;
      if (++sh.t > sh.life || sh.y > H) shards.splice(i, 1);
    }
  }
  function checkClear() {
    if (!over && aliveCount() === 0 && !boss) waveCleared();
  }

  // demo pilot: chase the lowest invader, dodge lasers, fire when lined up
  function danger(cx) {
    // how bad is it to stand at cx: lasers that will cross the body line soon and land near cx
    var body = odinBodyTop(), half = odinW * 0.09 + 2 * S, d = 0;
    for (var i = 0; i < bolts.length; i++) {
      var b = bolts[i];
      // a laser already past the body line is still inside the hit box until it leaves the stage
      var frames = b.y >= body ? 0 : (body - b.y) / b.vy;
      if (frames > 80) continue;
      var xAt = b.x + (b.vx || 0) * frames;
      if (Math.abs(xAt - cx) < half + 12) d += 1 + (80 - frames) / 80;
    }
    return d;
  }
  function blocked(fromX, toX) {
    // a laser already down at body level between here and there
    var body = odinBodyTop(), half = odinW * 0.09 + 2 * S;
    var a = Math.min(fromX, toX) - half, z = Math.max(fromX, toX) + half;
    for (var i = 0; i < bolts.length; i++) {
      var b = bolts[i];
      if (b.y > body - 40 && b.y < odinTop + odinH && b.x > a && b.x < z) return true;
    }
    return false;
  }
  function think(now) {
    var cx = odinCenter();
    var here = danger(cx);
    if (here > 0) {
      // pick the safest reachable spot, nearest first
      var lo = odinW / 2, hi = W - odinW / 2, best = cx, bestD = here;
      var offs = [-40, 40, -80, 80, -130, 130, -190, 190, -260, 260, -340, 340, -430, 430];
      for (var i = 0; i < offs.length; i++) {
        var cand = Math.max(lo, Math.min(hi, cx + offs[i]));
        if (blocked(cx, cand)) continue;   // never run through a laser to reach safety
        var d = danger(cand);
        if (d < bestD - 0.01) { bestD = d; best = cand; if (d === 0) break; }
      }
      if (best !== cx) { moveDir = best > cx ? 1 : -1; firing = false; return; }
    }
    if (now > ai.hold) {
      ai.hold = now + 240 + Math.random() * 400;
      var best = null, bestScore = -1;
      for (i = 0; i < fleet.length; i++) {
        var f = fleet[i]; if (!f.alive) continue;
        var r = invaderRect(f);
        var s = f.r * 100 - Math.abs(r.x + r.w / 2 - cx) * 0.2;
        if (s > bestScore) { bestScore = s; best = r.x + r.w / 2; }
      }
      if (boss && Math.random() < 0.5) best = boss.x + boss.w / 2;
      if (ufo && Math.random() < 0.35) best = ufo.x + ufo.w / 2;
      ai.tx = best === null ? W / 2 : best + dir * lastStepX * 0.5;
    }
    var dx = ai.tx - cx;
    moveDir = Math.abs(dx) < 4 ? 0 : dx > 0 ? 1 : -1;
    if (moveDir && blocked(cx, cx + moveDir * 36)) moveDir = 0;   // wait for the laser to pass
    firing = Math.abs(dx) < 10 && Math.random() < 0.8;
  }

  function fire() {
    var now = performance.now();
    if (mode === "idle" || over || now - lastFire < 240 || carrots.length >= 3) return;
    lastFire = now;
    shots++;
    // from the face, just above the body line: anything above that line is hittable, anything below is game over anyway
    carrots.push({ x: Math.round(odinCenter() - 1.5 * S), y: Math.round(odinBodyTop() - 7 * S) });
    odinReact("recoil");
  }
  function odinHit() {
    lives--;
    var now = performance.now();
    hitFlashUntil = now + 220;
    invUntil = now + 1400;   // grace frames: Odin blinks, lasers pass through
    odin.classList.add("iframes");
    setTimeout(function () { odin.classList.remove("iframes"); }, 1400);
    setTimeout(function () { odin.classList.remove("ouch"); }, 450);   // the pink shadow leaves with the flinch
    renderLives();
    odinReact("ouch");
    shake();
    combo = 0; renderCombo(1);
    if (mode === "play") addPop(odinCenter() - 20, odinTop - 16, lives > 0 ? "ouch" : "down", "pink");
    emit("hit");
    if (lives <= 0) gameOver("out of lives");
  }
  function waveCleared() {
    var done = wave;
    wave++;
    emit("wave", { cleared: done });
    odinReact("cheer");
    carrots = []; bolts = [];
    if (done === WIN_WAVE && mode === "play") { win(); return; }
    renderSector();
    var next = sectorOf(wave);
    showMsg("sector " + pad2(done) + " cleared<small>" + sectorOf(done).tag + " holds</small>", "green", 1300);
    clearTimeout(spawnTimer);
    spawnTimer = setTimeout(function () {
      if (mode === "idle" || over) return;
      showMsg("sector " + pad2(wave) + " · " + next.name + "<small>" + (isBossWave(wave) ? "boss · the cart wants in" : next.tag) + "</small>", isBossWave(wave) ? "pink" : "", 1500);
      spawnFleet();
    }, 1300);
  }
  function gameOver(why) {
    if (over) return;
    over = true;
    firing = false; moveDir = 0;
    shake();
    emit("over", { why: why });
    if (mode === "attract") {
      showMsg("game over<small>demo · press start to play for real</small>", "pink", 1800);
      clearTimeout(attractTimer);
      attractTimer = setTimeout(function () { if (mode === "attract") startAttract(); }, 2400);
      return;
    }
    showMsg("game over<small>" + why + "</small>", "pink", 1100);
    setTimeout(function () { if (mode === "play" && over) { hideMsg(); showScreen("over", why); } }, 1000);
  }
  function win() {
    over = true;
    firing = false; moveDir = 0;
    renderSector();
    emit("win");
    flash();
    if (window.LOKES && window.LOKES.odin && !reduced.matches) window.LOKES.odin.spin("win");
    showMsg("empire secured<small>nine sectors · odin holds the house</small>", "green", 1400);
    setTimeout(function () { if (mode === "play" && over) { hideMsg(); showScreen("win"); } }, 1300);
  }
  function resume() {
    // after a win: same run, faster sectors
    hideScreen();
    over = false;
    renderSector();
    showMsg("sector " + pad2(wave) + " · " + sectorOf(wave).name + "<small>overtime</small>", "", 1400);
    spawnFleet();
  }

  // --- loop -------------------------------------------------------------------------------------------
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (mode === "idle") {
      if (now - lastFrame < 1000 / 12) return;   // ambient at 12 fps
      lastFrame = now;
      march(now);
      render(now);
      return;
    }
    march(now);
    if (!over) update(now);
    else {
      for (var i = booms.length - 1; i >= 0; i--) { if (++booms[i].t > booms[i].life) booms.splice(i, 1); }
      for (i = shards.length - 1; i >= 0; i--) { shards[i].x += shards[i].vx; shards[i].y += shards[i].vy; shards[i].vy += 0.3; if (++shards[i].t > shards[i].life) shards.splice(i, 1); }
    }
    render(now);
  }
  function ensureLoop() { if (rafId === null) rafId = requestAnimationFrame(loop); }

  // --- runs -----------------------------------------------------------------------------------------------
  function resetRun() {
    over = false;
    score = 0; lives = 3; wave = 1; kills = 0; shots = 0; combo = 0; comboUntil = 0;
    carrots = []; bolts = []; booms = []; shards = []; ufo = null; boss = null;
    moveDir = 0; firing = false; invUntil = 0; odin.classList.remove("iframes");
    clearTimeout(spawnTimer); clearTimeout(attractTimer);
    renderScore(); renderLives(); renderSector(); renderCombo(1);
    hideScreen();
    if (popsEl) popsEl.innerHTML = "";
  }
  function startAttract() {
    if (mode === "play") return;
    if (reduced.matches) { idle(); return; }
    setMode("attract");
    resetRun();
    measureOdin();
    placeOdin(Math.max(0, Math.min(W - odinW, odinBaseLeft)));
    spawnFleet();
    showMsg(PRESS_START, "pulse");
    ensureLoop();
    emit("attract");
  }
  function idle() {
    setMode("idle");
    resetRun();
    odin.style.transform = "";
    odin.classList.remove("face-left"); facing = 1;
    spawnFleet();
    hideMsg();
    if (reduced.matches) { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } render(0); showMsg("▶ press start<small>odin vs the invaders</small>", ""); }
    else ensureLoop();
  }
  function start() {
    if (mode === "play") return;
    var was = mode;
    setMode("play");
    resetRun();
    measureOdin();
    placeOdin(Math.max(0, Math.min(W - odinW, was === "attract" ? odinX : odinBaseLeft)));
    spawnFleet();
    showMsg("sector " + pad2(wave) + " · " + sectorOf(wave).name + "<small>← → move · space fire · esc exit</small>", "green", 2200);
    var r = hero.getBoundingClientRect();
    if (r.top < -24 || r.top > window.innerHeight * 0.5) hero.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    ensureLoop();
    emit("start");
  }
  function stop() {
    if (mode !== "play") return;
    auto = false;
    setMode("idle");
    resetRun();
    hideMsg();
    emit("stop");
    if (reduced.matches) idle();
    else startAttract();
  }
  function toggle() { mode === "play" ? stop() : start(); }
  function isPlaying() { return mode === "play"; }
  function replay() {
    auto = false;
    if (screenTitle && screenTitle.textContent === "empire secured" && over) { resume(); return; }
    if (mode === "play") setMode("idle");
    start();
  }

  // --- input ------------------------------------------------------------------------------------------------
  function inInput(e) { var t = (e.target && e.target.tagName) || ""; return t === "INPUT" || t === "TEXTAREA"; }
  function heroInView() {
    var r = hero.getBoundingClientRect();
    return r.bottom > window.innerHeight * 0.3 && r.top < window.innerHeight * 0.7;
  }
  document.addEventListener("keydown", function (e) {
    if (inInput(e)) return;
    var tag = (e.target && e.target.tagName) || "";
    var onControl = tag === "BUTTON" || tag === "A" || odin.contains(e.target);   // let buttons, links and Odin keep Enter/Space
    var activate = e.key === "Enter" || e.key === " ";
    if (screen && !screen.hidden && mode === "play") {
      if (initialsOpen) { if (activate && tag === "BUTTON") return; initialsKey(e); return; }
      if (e.key === "Escape") { stop(); e.preventDefault(); return; }
      if (activate && !onControl) { e.preventDefault(); replay(); }
      return;
    }
    if (e.key === "Escape" && mode === "play") { stop(); return; }
    if (mode !== "play") {
      if (e.key === "p" || e.key === "P") { start(); e.preventDefault(); }
      else if (activate && !onControl && heroInView() && (e.key === "Enter" || mode === "attract")) { start(); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { auto = false; moveDir = -1; e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { auto = false; moveDir = 1; e.preventDefault(); }
    else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") { auto = false; firing = true; fire(); e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (mode !== "play") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { if (moveDir < 0) moveDir = 0; }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { if (moveDir > 0) moveDir = 0; }
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") firing = false;
  });
  hero.addEventListener("pointermove", function (e) {
    if (mode !== "play" || over || e.pointerType === "touch" && e.buttons === 0) return;
    if (screen && !screen.hidden) return;
    var hr = hero.getBoundingClientRect();
    var nx = Math.max(0, Math.min(W - odinW, e.clientX - hr.left - odinW / 2));
    if (Math.abs(nx - odinX) > 1) face(nx > odinX ? 1 : -1);
    placeOdin(nx);
  });
  hero.addEventListener("pointerdown", function (e) {
    if (playBtn && (e.target === playBtn || playBtn.contains(e.target))) return;
    if (screen && screen.contains(e.target)) return;
    if (mode === "attract") {
      if (odin.contains(e.target)) return;   // tapping Odin hops, as always
      e.preventDefault();
      start();
      return;
    }
    if (mode !== "play" || over) return;
    e.preventDefault();
    fire();
  });
  if (playBtn) playBtn.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
  if (replayBtn) replayBtn.addEventListener("click", replay);
  if (exitBtn) exitBtn.addEventListener("click", function () { stop(); });

  // on-screen pad
  function hold(btn, down, up) {
    if (!btn) return;
    var release = function (e) { btn.classList.remove("down"); up(e); };
    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); btn.classList.add("down"); btn.setPointerCapture && btn.setPointerCapture(e.pointerId); down(e); });
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("lostpointercapture", release);
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  hold(padL, function () { moveDir = -1; }, function () { if (moveDir < 0) moveDir = 0; });
  hold(padR, function () { moveDir = 1; }, function () { if (moveDir > 0) moveDir = 0; });
  hold(padF, function () { firing = true; fire(); }, function () { firing = false; });
  if (padQ) padQ.addEventListener("click", function () { stop(); });
  if (padEl) padEl.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });

  // public hooks for the desk
  window.LOKES = window.LOKES || {};
  window.LOKES.game = {
    start: start, stop: stop, toggle: toggle, isPlaying: isPlaying,
    mode: function () { return mode; },
    auto: function (v) { if (v !== undefined) { auto = !!v; if (!auto) { moveDir = 0; firing = false; } } return auto; },
    table: function () { return table.slice(); },
    state: function () { return { score: score, lives: lives, wave: wave, kills: kills, shots: shots, boss: !!boss, over: over }; }
  };

  // --- boot -----------------------------------------------------------------------------------------------------
  renderHi();
  renderSector();
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(hero);
  else window.addEventListener("resize", size);
  var img = $("odin-img");
  if (img && !img.complete) img.addEventListener("load", size);
  size();
  idle();
  if (!reduced.matches) attractTimer = setTimeout(startAttract, 700);
  if (reduced.addEventListener) reduced.addEventListener("change", function () {
    if (mode === "play") return;
    if (reduced.matches) idle(); else startAttract();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
    else if (mode === "play" || !reduced.matches) { lastStep = performance.now(); ensureLoop(); }
  });
})();
