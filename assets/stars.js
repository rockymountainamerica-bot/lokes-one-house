/* Binary snow — three depth layers of falling 0/1 pixel glyphs over a thin starfield,
   stepped at 12 fps, integer positions only so every pixel stays crisp. A rare pink laser streaks through.
   Atmosphere only; sits behind the shell. Respects prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById("stars");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var BG = "#030403";
  var INK = "242,244,241";
  var PINK = "255,79,210";
  var FRAME_MS = 1000 / 12;
  // 3×5 pixel digits, drawn at scale 1 / 2 / 3 for depth
  var GLYPH = { "0": ["XXX", "X.X", "X.X", "X.X", "XXX"], "1": [".X.", "XX.", ".X.", ".X.", "XXX"] };
  var SNOW = [
    { scale: 1, speed: 1, alpha: 0.12, density: 13000 },   // far: small, slow, faint
    { scale: 2, speed: 2, alpha: 0.2, density: 24000 },
    { scale: 3, speed: 3, alpha: 0.34, density: 64000 }    // near: big, quick, brighter
  ];
  var STARS = { size: 1, speed: 1, alpha: 0.2, density: 40000 };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var W, H, flakes, stars, beams, lastFrame = 0, rafId = null;

  function drawGlyph(ch, x, y, scale) {
    var g = GLYPH[ch];
    for (var r = 0; r < 5; r++) {
      var row = g[r], c = 0;
      while (c < 3) {
        if (row[c] === "X") {
          var start = c;
          while (c < 3 && row[c] === "X") c++;
          ctx.fillRect(x + start * scale, y + r * scale, (c - start) * scale, scale);
        } else c++;
      }
    }
  }

  function size() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    flakes = [];
    SNOW.forEach(function (L, li) {
      var n = Math.max(8, Math.floor((W * H) / L.density));
      for (var i = 0; i < n; i++) {
        flakes.push({
          x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H), l: li,
          ch: Math.random() < 0.5 ? "0" : "1",
          drift: Math.random() < 0.5 ? -1 : 1, t: Math.floor(Math.random() * 24)
        });
      }
    });
    stars = [];
    var ns = Math.max(6, Math.floor((W * H) / STARS.density));
    for (var s = 0; s < ns; s++) stars.push({ x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) });
    beams = [];
  }

  function drawStars(move) {
    ctx.fillStyle = "rgba(" + INK + "," + STARS.alpha + ")";
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (move) {
        s.y += STARS.speed;
        if (s.y > H) { s.y = -1; s.x = Math.floor(Math.random() * W); }
      }
      ctx.fillRect(s.x, s.y, STARS.size, STARS.size);
    }
  }

  function drawSnow(move) {
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i], L = SNOW[f.l];
      if (move) {
        f.y += L.speed;
        // a lazy one-pixel sway every couple of seconds, so it snows instead of raining
        if (++f.t % 24 === 0) { f.x += f.drift * L.scale; f.drift = -f.drift; }
        if (f.y > H) { f.y = -5 * L.scale; f.x = Math.floor(Math.random() * W); f.ch = Math.random() < 0.5 ? "0" : "1"; }
      }
      ctx.fillStyle = "rgba(" + INK + "," + L.alpha + ")";
      drawGlyph(f.ch, f.x, f.y, L.scale);
    }
  }

  function drawBeam(b, alpha) {
    // stepped diagonal: a laser made of pixels, not an anti-aliased line
    var len = Math.max(W, H) * 1.4;
    var dx = Math.cos(b.angle), dy = Math.sin(b.angle);
    ctx.fillStyle = "rgba(" + PINK + "," + alpha.toFixed(3) + ")";
    for (var t = -len / 2; t < len / 2; t += 3) {
      ctx.fillRect(Math.floor(b.x + dx * t), Math.floor(b.y + dy * t), 2, 2);
    }
  }

  function staticScene() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawStars(false);
    drawSnow(false);
    drawBeam({ x: W * 0.78, y: H * 0.3, angle: 1.2 }, 0.12);
  }

  function step(now) {
    rafId = window.requestAnimationFrame(step);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawStars(true);
    drawSnow(true);

    if (beams.length === 0 && Math.random() < 0.004) {
      beams.push({ x: Math.random() * W, y: Math.random() * H * 0.7, angle: 1.0 + Math.random() * 0.6, t: 0, life: 14 });
    }
    for (var b = beams.length - 1; b >= 0; b--) {
      var beam = beams[b];
      var p = beam.t / beam.life;
      drawBeam(beam, 0.35 * Math.sin(Math.PI * p));
      beam.t++;
      if (beam.t > beam.life) beams.splice(b, 1);
    }
  }

  function start() {
    stop();
    size();
    if (reduced.matches) staticScene();
    else rafId = window.requestAnimationFrame(step);
  }
  function stop() {
    if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  window.addEventListener("resize", start);
  if (reduced.addEventListener) reduced.addEventListener("change", start);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  start();
})();
