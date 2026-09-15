/* Pixel starfield — three parallax layers of square stars drifting down at 12 fps,
   plus a rare pink laser streak. Integer positions only so every pixel stays crisp.
   Atmosphere only; sits behind the shell. Respects prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById("stars");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var BG = "#030403";
  var INK = "242,244,241";
  var PINK = "255,79,210";
  var FRAME_MS = 1000 / 12;
  var LAYERS = [
    { size: 1, speed: 1, alpha: 0.22, density: 26000 },
    { size: 2, speed: 2, alpha: 0.32, density: 42000 },
    { size: 3, speed: 3, alpha: 0.5, density: 110000 }
  ];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var W, H, stars, beams, lastFrame = 0, rafId = null;

  function size() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    LAYERS.forEach(function (L, li) {
      var n = Math.max(6, Math.floor((W * H) / L.density));
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H), l: li });
      }
    });
    beams = [];
  }

  function drawStars(move) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], L = LAYERS[s.l];
      if (move) {
        s.y += L.speed;
        if (s.y > H) { s.y = -L.size; s.x = Math.floor(Math.random() * W); }
      }
      ctx.fillStyle = "rgba(" + INK + "," + L.alpha + ")";
      ctx.fillRect(s.x, s.y, L.size, L.size);
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
    drawBeam({ x: W * 0.78, y: H * 0.3, angle: 1.2 }, 0.12);
  }

  function step(now) {
    rafId = window.requestAnimationFrame(step);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawStars(true);

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
