/* Binary snow — mid-ground 0/1 glyphs on an 8px grid.
   Transparent canvas over stars.js. 12 fps, integer pixels, no blur.
   Off when prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById("snow");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = false;

  var INK = "242,244,241";
  var CYAN = "93,255,239";
  var FRAME_MS = 1000 / 12;
  var GRID = 8;
  var GLYPH = {
    "0": ["XXX", "X.X", "X.X", "X.X", "XXX"],
    "1": [".X.", "XX.", ".X.", ".X.", "XXX"]
  };
  /* px = glyph pixel size. every = move one GRID step every N frames. */
  var LAYERS = [
    { px: 2, every: 3, alpha: 0.22, density: 8000, cyan: 0 },
    { px: 2, every: 2, alpha: 0.36, density: 11000, cyan: 0.16 },
    { px: 4, every: 1, alpha: 0.5, density: 18000, cyan: 0.3 }
  ];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var W, H, flakes, lastFrame = 0, rafId = null, tick = 0;

  function snap(n) { return Math.floor(n / GRID) * GRID; }

  function drawGlyph(ch, x, y, px) {
    var g = GLYPH[ch];
    for (var r = 0; r < 5; r++) {
      var row = g[r], c = 0;
      while (c < 3) {
        if (row[c] === "X") {
          var start = c;
          while (c < 3 && row[c] === "X") c++;
          ctx.fillRect(x + start * px, y + r * px, (c - start) * px, px);
        } else c++;
      }
    }
  }

  function hide() {
    stop();
    canvas.style.display = "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function size() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    flakes = [];
    LAYERS.forEach(function (L, li) {
      var n = Math.max(10, Math.floor((W * H) / L.density));
      for (var i = 0; i < n; i++) {
        flakes.push({
          x: snap(Math.random() * W),
          y: snap(Math.random() * H),
          l: li,
          ch: Math.random() < 0.5 ? "0" : "1",
          cyan: Math.random() < L.cyan,
          drift: Math.random() < 0.5 ? -GRID : GRID,
          t: Math.floor(Math.random() * 16)
        });
      }
    });
  }

  function draw(move) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i], L = LAYERS[f.l];
      if (move && tick % L.every === 0) {
        f.y += GRID;
        if (++f.t % 16 === 0) {
          f.x = snap(f.x + f.drift);
          f.drift = -f.drift;
        }
        if (f.y > H) {
          f.y = -GRID * 3;
          f.x = snap(Math.random() * W);
          f.ch = Math.random() < 0.5 ? "0" : "1";
          f.cyan = Math.random() < L.cyan;
        }
      }
      ctx.fillStyle = "rgba(" + (f.cyan ? CYAN : INK) + "," + L.alpha + ")";
      drawGlyph(f.ch, f.x, f.y, L.px);
    }
  }

  function step(now) {
    rafId = window.requestAnimationFrame(step);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    tick++;
    draw(true);
  }

  function start() {
    stop();
    if (reduced.matches) { hide(); return; }
    canvas.style.display = "";
    size();
    draw(false);
    rafId = window.requestAnimationFrame(step);
  }
  function stop() {
    if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  window.addEventListener("resize", start);
  if (reduced.addEventListener) reduced.addEventListener("change", start);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  start();
})();
