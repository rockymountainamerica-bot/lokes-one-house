/* Invaders over the house.
   Ambient: a dim formation marches across the hero, 2-frame sprites, stepped motion.
   Play (button, `play` command, or P): Odin becomes the cannon and fires carrots.
   Arrows/A-D or pointer to move, Space/Up or tap to fire, Esc to stop.
   Emits `lokes:game` CustomEvents so the C3i desk can comment. */
(function () {
  var hero = document.getElementById("hero");
  var canvas = document.getElementById("invaders");
  var odin = document.getElementById("odin");
  var playBtn = document.getElementById("play");
  var msgEl = document.getElementById("game-msg");
  var scoreEl = document.getElementById("score");
  var hiEl = document.getElementById("hiscore");
  var livesEl = document.getElementById("lives");
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
  var BOOM = ["X..X..X.", ".X.XX.X.", "..X..X..", "XX....XX", "..X..X..", ".X.XX.X.", "X..X..X."];
  var CARROT = ["G.G", ".G.", "OOO", "OOO", ".O.", ".O.", ".O."];
  var ROWS = [
    { s: SQUID, pts: 30 }, { s: CRAB, pts: 20 }, { s: CRAB, pts: 20 }, { s: OCTO, pts: 10 }, { s: OCTO, pts: 10 }
  ];

  var S = 3;            // canvas px per sprite px
  var CELL_W = 16 * S;  // formation cell
  var CELL_H = 13 * S;
  var COLS = 11;

  var INK = "242,244,241", PINK = "255,79,210", GREEN = "57,255,136", ORANGE = "255,138,61";

  function drawSprite(grid, x, y, color, alpha, scale) {
    scale = scale || S;
    var w = grid[0].length;
    ctx.fillStyle = "rgba(" + color + "," + alpha + ")";
    for (var r = 0; r < grid.length; r++) {
      var row = grid[r];
      var c = 0;
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

  // --- state ------------------------------------------------------------
  var W = 0, H = 0;
  var playing = false, over = false;
  var fleet, fx, fy, dir, frame, stepMs, lastStep = 0, cols;
  var carrots = [], bolts = [], booms = [];
  var score = 0, hi = 0, lives = 3, wave = 1;
  var odinX = 0, odinBaseLeft = 0, odinW = 0, odinTop = 0, odinH = 0, moveDir = 0, lastFire = 0;
  var rafId = null, lastFrame = 0, hitFlashUntil = 0;
  var msgTimer = null;

  try { hi = parseInt(localStorage.getItem("lokes.hi") || "0", 10) || 0; } catch (e) { hi = 0; }
  if (hiEl) hiEl.textContent = pad(hi);

  function pad(n) { n = Math.min(9999, n); return String(n).padStart(4, "0"); }
  function emit(type, extra) {
    var d = Object.assign({ type: type, score: score, lives: lives, wave: wave }, extra || {});
    document.dispatchEvent(new CustomEvent("lokes:game", { detail: d }));
  }
  function showMsg(html, ms) {
    if (!msgEl) return;
    msgEl.innerHTML = html;
    msgEl.classList.add("show");
    clearTimeout(msgTimer);
    if (ms) msgTimer = setTimeout(function () { msgEl.classList.remove("show"); }, ms);
  }
  function hideMsg() { if (msgEl) msgEl.classList.remove("show"); }

  function size() {
    var r = hero.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.floor(r.width));
    H = canvas.height = Math.max(1, Math.floor(r.height));
    cols = Math.max(5, Math.min(COLS, Math.floor((W - 2 * CELL_W) / CELL_W)));
    measureOdin();
    if (!fleet) spawnFleet();
    clampFleet();
  }
  function measureOdin() {
    var saved = odin.style.transform;
    odin.style.transform = "none";
    var hr = hero.getBoundingClientRect(), or = odin.getBoundingClientRect();
    var img = document.getElementById("odin-img");
    var ir = img ? img.getBoundingClientRect() : or;
    odin.style.transform = saved;
    odinBaseLeft = or.left - hr.left;
    odinW = or.width;
    odinTop = ir.top - hr.top;
    odinH = ir.height;
    if (!playing) odinX = odinBaseLeft;
  }
  // ears are fair game; the body is the hit line
  function odinBodyTop() { return odinTop + odinH * 0.42; }
  function spawnFleet() {
    fleet = [];
    var rows = playing ? ROWS.length : 3;   // ambient keeps a light formation in the lane
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) fleet.push({ r: r, c: c, alive: true });
    }
    fx = Math.floor((W - cols * CELL_W) / 2);
    fy = 12;
    dir = 1;
    frame = 0;
    stepMs = playing ? Math.max(120, 520 - wave * 60) : 700;
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
    return { left: fx + minC * CELL_W, right: fx + (maxC + 1) * CELL_W, bottom: fy + (maxR + 1) * CELL_H };
  }

  // --- march --------------------------------------------------------------
  function march(now) {
    if (now - lastStep < stepMs) return;
    lastStep = now;
    frame ^= 1;
    var b = fleetBounds();
    var stepX = 6 * (playing ? 1 : 0.5);
    if ((dir > 0 && b.right + stepX > W - 8) || (dir < 0 && b.left - stepX < 8)) {
      dir = -dir;
      fy += playing ? CELL_H / 2 : CELL_H / 4;
    } else {
      fx += dir * stepX;
    }
    if (!playing) {
      // ambient never reaches Odin — recycle from the top once the formation nears his ears
      if (fleetBounds().bottom > Math.max(CELL_H * 2, odinTop - 8)) { fy = 12; }
    } else if (!over && fleetBounds().bottom >= odinBodyTop()) {
      gameOver("they reached the house");
    }
    // invaders drop a bolt now and then
    if (playing && !over && Math.random() < 0.35 + wave * 0.05) {
      var shooters = {};
      for (var i = 0; i < fleet.length; i++) { var f = fleet[i]; if (f.alive) shooters[f.c] = f; }
      var keys = Object.keys(shooters);
      if (keys.length) {
        var s = shooters[keys[Math.floor(Math.random() * keys.length)]];
        bolts.push({ x: fx + s.c * CELL_W + CELL_W / 2 - S, y: fy + (s.r + 1) * CELL_H, vy: 3 + wave * 0.4 });
      }
    }
  }

  // --- render -------------------------------------------------------------
  function render(now) {
    ctx.clearRect(0, 0, W, H);
    var alpha = playing ? 0.95 : 0.3;
    for (var i = 0; i < fleet.length; i++) {
      var f = fleet[i]; if (!f.alive) continue;
      var spr = ROWS[f.r].s[frame];
      var w = spr[0].length * S;
      var x = fx + f.c * CELL_W + Math.floor((CELL_W - w) / 2);
      var y = fy + f.r * CELL_H;
      var color = (playing && f.r === 0) ? PINK : INK;
      drawSprite(spr, x, y, color, alpha);
    }
    for (i = 0; i < carrots.length; i++) drawCarrot(carrots[i].x, carrots[i].y);
    ctx.fillStyle = "rgb(" + PINK + ")";
    for (i = 0; i < bolts.length; i++) ctx.fillRect(bolts[i].x, bolts[i].y, S, S * 3);
    for (i = 0; i < booms.length; i++) {
      var bm = booms[i];
      drawSprite(BOOM, bm.x, bm.y, bm.color, 1 - bm.t / bm.life);
    }
    if (playing && now < hitFlashUntil) {
      ctx.fillStyle = "rgba(" + PINK + ",0.12)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // --- game update ----------------------------------------------------------
  function update(now) {
    // Odin movement
    if (moveDir) {
      odinX += moveDir * 7;
      odinX = Math.max(0, Math.min(W - odinW, odinX));
      odin.style.transform = "translateX(" + Math.round(odinX - odinBaseLeft) + "px)";
    }
    // carrots
    for (var i = carrots.length - 1; i >= 0; i--) {
      var c = carrots[i];
      c.y -= 9;
      if (c.y < -30) { carrots.splice(i, 1); continue; }
      var hitIdx = -1;
      for (var j = 0; j < fleet.length; j++) {
        var f = fleet[j]; if (!f.alive) continue;
        var spr = ROWS[f.r].s[frame];
        var w = spr[0].length * S, h = spr.length * S;
        var x = fx + f.c * CELL_W + Math.floor((CELL_W - w) / 2);
        var y = fy + f.r * CELL_H;
        if (c.x + 3 * S > x && c.x < x + w && c.y < y + h && c.y + 7 * S > y) { hitIdx = j; break; }
      }
      if (hitIdx >= 0) {
        var k = fleet[hitIdx]; k.alive = false;
        carrots.splice(i, 1);
        booms.push({ x: fx + k.c * CELL_W + 4 * S, y: fy + k.r * CELL_H, t: 0, life: 8, color: k.r === 0 ? PINK : GREEN });
        score += ROWS[k.r].pts;
        if (scoreEl) scoreEl.textContent = pad(score);
        if (score > hi) { hi = score; if (hiEl) hiEl.textContent = pad(hi); try { localStorage.setItem("lokes.hi", String(hi)); } catch (e) {} }
        emit("kill", { pts: ROWS[k.r].pts });
        var left = aliveCount();
        stepMs = Math.max(90, stepMs - 4);
        if (left === 0) waveCleared();
      }
    }
    // bolts
    var orect = { x: odinX + odinW * 0.25, y: odinBodyTop(), w: odinW * 0.5, h: H - odinBodyTop() };
    for (i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      b.y += b.vy;
      if (b.y > H) { bolts.splice(i, 1); continue; }
      if (b.x > orect.x && b.x < orect.x + orect.w && b.y > orect.y && b.y < orect.y + orect.h) {
        bolts.splice(i, 1);
        odinHit();
      }
    }
    for (i = booms.length - 1; i >= 0; i--) { if (++booms[i].t > booms[i].life) booms.splice(i, 1); }
  }

  function fire() {
    var now = performance.now();
    if (!playing || over || now - lastFire < 260) return;
    lastFire = now;
    carrots.push({ x: Math.round(odinX + odinW / 2 - 1.5 * S), y: odinTop + 4 });
    odin.classList.remove("hop"); void odin.offsetWidth; odin.classList.add("hop");
  }
  function odinHit() {
    lives--;
    hitFlashUntil = performance.now() + 220;
    renderLives();
    odin.classList.remove("hop"); void odin.offsetWidth; odin.classList.add("hop");
    emit("hit");
    if (lives <= 0) gameOver("out of lives");
  }
  function renderLives() {
    if (!livesEl) return;
    var hearts = livesEl.querySelectorAll("svg");
    for (var i = 0; i < hearts.length; i++) hearts[i].style.opacity = i < lives ? "1" : "0.18";
  }
  function waveCleared() {
    wave++;
    emit("wave");
    showMsg("wave " + (wave - 1) + " cleared<small>odin holds the house</small>", 1600);
    carrots = []; bolts = [];
    setTimeout(function () { if (playing && !over) spawnFleet(); }, 900);
  }
  function gameOver(why) {
    if (over) return;
    over = true;
    emit("over", { why: why });
    showMsg("game over<small>" + why + " · shop still parked · esc to exit</small>");
    setTimeout(function () { if (playing) stop(); }, 3200);
  }

  // --- loop -------------------------------------------------------------------
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!playing) {
      if (now - lastFrame < 1000 / 12) return;   // ambient at 12 fps
      lastFrame = now;
      march(now);
      render(now);
      return;
    }
    march(now);
    if (!over) update(now);
    render(now);
  }

  // --- start / stop ------------------------------------------------------------
  function start() {
    if (playing) return;
    playing = true; over = false;
    if (rafId === null) rafId = requestAnimationFrame(loop);   // reduced-motion boots without a loop
    score = 0; lives = 3; wave = 1;
    if (scoreEl) scoreEl.textContent = pad(0);
    renderLives();
    hero.classList.add("playing");
    if (playBtn) playBtn.innerHTML = "■ stop<span class=\"blink\">_</span>";
    measureOdin();
    odinX = odinBaseLeft;
    odin.style.transform = "translateX(0)";
    carrots = []; bolts = []; booms = [];
    spawnFleet();
    showMsg("odin vs the invaders<small>← → move · space fire · esc exit</small>", 2200);
    hero.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    emit("start");
  }
  function stop() {
    if (!playing) return;
    playing = false; over = false;
    hero.classList.remove("playing");
    if (playBtn) playBtn.innerHTML = "▶ play<span class=\"blink\">_</span>";
    odin.style.transform = "";
    hideMsg();
    lives = 3; renderLives();
    carrots = []; bolts = []; booms = [];
    spawnFleet();
    if (reduced.matches) { cancelAnimationFrame(rafId); rafId = null; render(0); }
    emit("stop");
  }
  function toggle() { playing ? stop() : start(); }

  // --- input ----------------------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    var typing = tag === "INPUT" || tag === "TEXTAREA";
    if (e.key === "Escape" && playing) { stop(); return; }
    if (!playing) {
      if (!typing && (e.key === "p" || e.key === "P")) { start(); }
      return;
    }
    if (typing) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { moveDir = -1; e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { moveDir = 1; e.preventDefault(); }
    else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") { fire(); e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { if (moveDir < 0) moveDir = 0; }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { if (moveDir > 0) moveDir = 0; }
  });
  hero.addEventListener("pointermove", function (e) {
    if (!playing || over) return;
    var hr = hero.getBoundingClientRect();
    odinX = Math.max(0, Math.min(W - odinW, e.clientX - hr.left - odinW / 2));
    odin.style.transform = "translateX(" + Math.round(odinX - odinBaseLeft) + "px)";
  });
  hero.addEventListener("pointerdown", function (e) {
    if (!playing || over) return;
    if (e.target === playBtn || playBtn.contains(e.target)) return;
    e.preventDefault();
    fire();
  });
  if (playBtn) playBtn.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });

  // public hooks for the desk
  window.LOKES = window.LOKES || {};
  window.LOKES.game = { start: start, stop: stop, toggle: toggle, isPlaying: function () { return playing; } };

  // --- boot ---------------------------------------------------------------------------
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(hero);
  else window.addEventListener("resize", size);
  var img = document.getElementById("odin-img");
  if (img && !img.complete) img.addEventListener("load", size);
  size();
  if (reduced.matches) render(0);                   // one still frame; play still animates on request
  else rafId = requestAnimationFrame(loop);
  if (reduced.addEventListener) reduced.addEventListener("change", function () {
    if (reduced.matches && !playing) { cancelAnimationFrame(rafId); rafId = null; render(0); }
    else if (rafId === null) rafId = requestAnimationFrame(loop);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
    else if (rafId === null && (playing || !reduced.matches)) rafId = requestAnimationFrame(loop);
  });
})();
