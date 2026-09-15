/* Odin — comic relief. Tap to hop (hearts pop), Konami code to spin and earn a 1UP chip.
   Emits `lokes:odin` events so the desk can react. */
(function () {
  var odin = document.getElementById("odin");
  var hearts = document.getElementById("hearts");
  var chips = document.getElementById("chips");
  var hint = document.getElementById("odin-hint");
  if (!odin) return;

  var HEART_HREF = "assets/sprite.svg#i-heart";
  var hops = 0;

  function emit(type, extra) {
    document.dispatchEvent(new CustomEvent("lokes:odin", { detail: Object.assign({ type: type, hops: hops }, extra || {}) }));
  }

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function popHearts(n) {
    if (!hearts) return;
    for (var i = 0; i < n; i++) {
      var h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      h.setAttribute("viewBox", "0 0 7 6");
      h.setAttribute("class", "heart");
      var u = document.createElementNS("http://www.w3.org/2000/svg", "use");
      u.setAttribute("href", HEART_HREF);
      h.appendChild(u);
      h.style.left = (35 + Math.random() * 30) + "%";
      h.style.top = (18 + Math.random() * 20) + "%";
      h.style.setProperty("--dx", Math.round(-40 + Math.random() * 80) + "px");
      h.style.animationDelay = (i * 90) + "ms";
      hearts.appendChild(h);
      h.addEventListener("animationend", function () { this.remove(); });
    }
  }

  function hop() {
    var game = window.LOKES && window.LOKES.game;
    if (game && game.isPlaying()) return;   // during play, taps fire carrots instead
    hops++;
    restart(odin, "hop");
    popHearts(1 + Math.floor(Math.random() * 3));
    if (hint) hint.textContent = hops === 1 ? "again" : hops < 5 ? "hop " + hops : "he likes you";
    emit("hop");
  }

  odin.addEventListener("click", hop);
  odin.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hop(); }
  });

  // Konami: ↑ ↑ ↓ ↓ ← → ← → B A
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var buf = [];
  var oneUp = false;
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    buf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (buf.length > KONAMI.length) buf.shift();
    if (buf.join(",") === KONAMI.join(",")) {
      buf = [];
      spin();
    }
  });

  function spin(reason) {
    restart(odin, "spin");
    popHearts(6);
    if (!oneUp && chips) {
      oneUp = true;
      var c = document.createElement("span");
      c.className = "chip oneup";
      c.textContent = "1UP · odin";
      chips.appendChild(c);
    }
    emit(reason === "win" ? "spin" : "konami");
  }

  // the arcade makes him happy: hearts when a sector falls, a big burst when the cart is sent back
  document.addEventListener("lokes:game", function (e) {
    var d = e.detail || {};
    if (d.type === "wave") popHearts(d.mode === "play" ? 3 : 1);
    else if (d.type === "bosskill") popHearts(5);
  });

  window.LOKES = window.LOKES || {};
  window.LOKES.odin = { hop: hop, spin: spin, hearts: popHearts };
})();
