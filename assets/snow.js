/* binary snow — soft phosphor 0/1 fall behind the shell.
   Subtle by design; static scatter when prefers-reduced-motion. */
(function () {
  const canvas = document.getElementById("binary-snow");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const FONT = 14;
  const STEP_MS = 80; // slow fall — subtle over neon spam
  let W = 0, H = 0, cols = [], raf = 0, last = 0;

  function bit() { return Math.random() < 0.5 ? "0" : "1"; }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const n = Math.max(8, Math.floor(W / (FONT * 1.7)));
    cols = [];
    for (let i = 0; i < n; i++) {
      cols.push({
        x: i * FONT * 1.7 + 3,
        y: Math.random() * H,
        skip: Math.random() < 0.4 ? 2 : 1, // some columns fall slower
        tick: 0,
      });
    }
    ctx.font = FONT + 'px "IBM Plex Mono","Share Tech Mono",monospace';
    if (reduced.matches) drawStatic();
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (const c of cols) {
      let y = Math.random() * FONT * 4;
      while (y < H) {
        ctx.fillStyle = "rgba(57,255,136," + (0.04 + Math.random() * 0.07).toFixed(3) + ")";
        ctx.fillText(bit(), c.x, y);
        y += FONT * (3 + Math.random() * 9);
      }
    }
  }

  function step(ts) {
    raf = requestAnimationFrame(step);
    if (ts - last < STEP_MS) return;
    last = ts;
    // fade toward the page background so trails decay softly
    ctx.fillStyle = "rgba(5,8,5,0.16)";
    ctx.fillRect(0, 0, W, H);
    for (const c of cols) {
      c.tick++;
      if (c.tick % c.skip) continue;
      ctx.fillStyle = Math.random() < 0.05
        ? "rgba(120,255,180,0.4)"
        : "rgba(57,255,136,0.2)";
      ctx.fillText(bit(), c.x, c.y);
      c.y += FONT;
      if (c.y > H + FONT && Math.random() > 0.972) c.y = 0;
    }
  }

  function start() {
    stop();
    if (reduced.matches) { drawStatic(); return; }
    ctx.clearRect(0, 0, W, H);
    raf = requestAnimationFrame(step);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });
  if (reduced.addEventListener) reduced.addEventListener("change", start);

  resize();
  start();
})();
