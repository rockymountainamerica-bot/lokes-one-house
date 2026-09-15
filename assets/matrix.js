/* Binary snow + rare pink laser streaks — atmosphere only, behind the shell.
   Soft phosphor green, low opacity, respects prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById("matrix");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var BG = "#050805";
  var GREEN = "57,255,136";
  var PINK = "255,79,210";
  var FONT = 13;
  var COL_W = 16;
  var FRAME_MS = 80; // slow, calm fall

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var W, H, cols, drops, beams, lastFrame = 0, rafId = null;

  function size() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.max(1, Math.floor(W / COL_W));
    drops = [];
    for (var i = 0; i < cols; i++) drops.push(Math.random() * (H / FONT));
    beams = [];
  }

  function drawBeam(b, alpha) {
    var dx = Math.cos(b.angle), dy = Math.sin(b.angle);
    var len = Math.max(W, H) * 1.6;
    ctx.beginPath();
    ctx.moveTo(b.x - dx * len / 2, b.y - dy * len / 2);
    ctx.lineTo(b.x + dx * len / 2, b.y + dy * len / 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(" + PINK + "," + (alpha * 0.25).toFixed(3) + ")";
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(" + PINK + "," + alpha.toFixed(3) + ")";
    ctx.stroke();
  }

  function staticScene() {
    // reduced motion: one calm frame — sparse digits + two faint static beams
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT + "px monospace";
    var n = Math.floor((W * H) / 9000);
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = "rgba(" + GREEN + ",0.10)";
      ctx.fillText(Math.random() < 0.5 ? "0" : "1", Math.random() * W, Math.random() * H);
    }
    drawBeam({ x: W * 0.22, y: H * 0.3, angle: 1.15 }, 0.10);
    drawBeam({ x: W * 0.8, y: H * 0.62, angle: 1.35 }, 0.08);
  }

  function step(now) {
    rafId = window.requestAnimationFrame(step);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;

    // trail fade
    ctx.fillStyle = "rgba(5,8,5,0.22)";
    ctx.fillRect(0, 0, W, H);

    // falling 0/1 — soft phosphor green, low alpha
    ctx.font = FONT + "px monospace";
    for (var i = 0; i < cols; i++) {
      var glyph = Math.random() < 0.5 ? "0" : "1";
      ctx.fillStyle = Math.random() < 0.04
        ? "rgba(" + GREEN + ",0.32)"
        : "rgba(" + GREEN + ",0.14)";
      ctx.fillText(glyph, i * COL_W, drops[i] * FONT);
      if (drops[i] * FONT > H && Math.random() > 0.976) drops[i] = 0;
      drops[i] += 0.5;
    }

    // rare pink laser streak, lightly synced with the snow cadence
    if (beams.length === 0 && Math.random() < 0.006) {
      beams.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        angle: 1.0 + Math.random() * 0.6, // steep diagonal
        t: 0,
        life: 22 // frames ≈ 1.8s
      });
    }
    for (var b = beams.length - 1; b >= 0; b--) {
      var beam = beams[b];
      var p = beam.t / beam.life;
      var alpha = 0.16 * Math.sin(Math.PI * p); // fade in/out, never harsh
      drawBeam(beam, alpha);
      beam.t++;
      if (beam.t > beam.life) beams.splice(b, 1);
    }
  }

  function start() {
    stop();
    size();
    if (reduced.matches) {
      staticScene();
    } else {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      rafId = window.requestAnimationFrame(step);
    }
  }
  function stop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener("resize", start);
  if (reduced.addEventListener) reduced.addEventListener("change", start);
  start();
})();
