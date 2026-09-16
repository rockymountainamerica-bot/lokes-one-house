/* C3i — the desk greeter. Warm, short, real. Not a fake AGI.
   Typewriter output at 8-bit cadence, command history, and it comments on Odin and the game. */
(function () {
  const LINKS = {
    vanism: "https://vanism.ai",
    me: "https://me.lokes.one",
    youtube: "https://www.youtube.com/@lokes_one",
    app: "https://apps.apple.com/us/app/vanism/id6786479632",
    mail: "mailto:nicholasacord@outlook.com",
    book: "https://bloodmutant.com/",
  };

  const out = document.getElementById("term-out");
  const input = document.getElementById("term-input");
  const form = document.getElementById("term-form");
  if (!out || !input || !form) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hist = [];
  let histIdx = -1;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }
  function link(href, label) {
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
  }

  // --- typewriter queue -------------------------------------------------------
  const queue = [];
  let busy = false;
  let gen = 0;   // bumped by clear(); an in-flight tick from an older generation stops
  function print(html, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
    return d;
  }
  function typeLine(prefixHtml, html) {
    queue.push({ prefix: prefixHtml, html: html });
    if (!busy) drain();
  }
  function drain() {
    const item = queue.shift();
    if (!item) { busy = false; return; }
    busy = true;
    const g = gen;
    const d = print(item.prefix, "c3i typing");
    if (reduced.matches) {
      d.innerHTML = item.prefix + item.html;
      d.classList.remove("typing");
      drain();
      return;
    }
    // type the text nodes only; links are dropped in whole so hrefs stay intact
    const tmp = document.createElement("span");
    tmp.innerHTML = item.html;
    const parts = Array.from(tmp.childNodes);
    let pi = 0, ci = 0;
    const tick = () => {
      if (g !== gen) return;
      if (pi >= parts.length) {
        d.classList.remove("typing");
        setTimeout(drain, 60);
        return;
      }
      const node = parts[pi];
      if (node.nodeType === 3) {
        const text = node.textContent;
        ci += 2;
        const shown = text.slice(0, ci);
        const prev = parts.slice(0, pi).map(n => n.nodeType === 3 ? esc(n.textContent) : n.outerHTML).join("");
        d.innerHTML = item.prefix + prev + esc(shown);
        if (ci >= text.length) { pi++; ci = 0; }
        setTimeout(tick, 14);
      } else {
        pi++; ci = 0;
        const prev = parts.slice(0, pi).map(n => n.nodeType === 3 ? esc(n.textContent) : n.outerHTML).join("");
        d.innerHTML = item.prefix + prev;
        setTimeout(tick, 14);
      }
      out.scrollTop = out.scrollHeight;
    };
    tick();
  }
  const TAG = '<span class="tag">C3i · </span>';
  function say(text) { typeLine(TAG, esc(text)); }
  function sayHtml(html) { typeLine(TAG, html); }
  function sys(text) { print('<span class="sys">' + esc(text) + "</span>", "sys"); }

  // --- replies ----------------------------------------------------------------------
  const replies = {
    help() {
      say("help · c3i · desk · whoami · odin · hop · play · stop · pilot · scores · sectors · boss · coin · vanism · book · doors · ride · film · press · credits · clear");
    },
    scores() {
      const t = (window.LOKES && window.LOKES.game && window.LOKES.game.table()) || [];
      if (!t.length) { say("Table’s empty. Type play — first run writes the first line."); return; }
      say("House table: " + t.map((r, i) => (i + 1) + ". " + r.i + " " + String(r.s).padStart(4, "0") + " (sector " + String(r.w || 1).padStart(2, "0") + ")").join(" · "));
    },
    hi() { replies.scores(); },
    table() { replies.scores(); },
    sectors() {
      say("Nine sectors, three holdings, on loop: lokes.one (house) → me.lokes.one (man) → vanism.ai (product).");
      say("Every third sector the cart shows up. Odin sends it back. Shop stays parked. Clear 09 and the empire is secured.");
    },
    sector() { replies.sectors(); },
    holdings() { replies.sectors(); },
    boss() {
      say("The cart. Big, slow, wants in. It never gets in. That’s the whole brand, playable.");
    },
    pilot() {
      const g = window.LOKES && window.LOKES.game;
      if (!g) { say("The arcade is offline on this device."); return; }
      const on = g.auto(!g.auto());
      if (on && !g.isPlaying()) g.start();
      say(on ? "Odin drives. Watch. Arrow keys or space hand it back." : "Pilot off. Your hands.");
    },
    c3i() {
      say("Door open. I’m C3i — Nicholas’s desk. Ask whoami, doors, vanism, or book.");
    },
    desk() {
      say("C3i online. Shop parked.");
    },
    whoami() {
      say("Nicholas Acord — founder · rider · Hurricane UT.");
      say("House: lokes.one · Product: vanism.ai · Man: me.lokes.one");
    },
    vanism() {
      sayHtml("Vanism — travel OS. Door → " + link(LINKS.vanism, "vanism.ai"));
    },
    book() {
      sayHtml("Blood Mutant → " + link(LINKS.book, "bloodmutant.com") + ". Buy door soon.");
    },
    doors() {
      sayHtml("Primary: " + link(LINKS.vanism, "vanism.ai") + " · " +
        link(LINKS.me, "me.lokes.one") + " · lokes.one.");
      sayHtml("Satellites: " + link(LINKS.youtube, "YouTube") + " · Blood Mutant (soon) · C3i.");
      say("Shop parked.");
    },
    odin() {
      say("Odin. Pixel on the house. C3i · Odin — in memory.");
      say("Black ears, eye mask, nose blotch, side spots. His face. Tap him.");
    },
    rabbit() { replies.odin(); },
    hop() {
      if (window.LOKES && window.LOKES.odin) window.LOKES.odin.hop();
      say("*hop*");
    },
    play() {
      if (window.LOKES && window.LOKES.game) {
        window.LOKES.game.start();
        say("Sector 01. Odin has carrots. ← → move, space fires, esc quits. Phones get a pad.");
      } else {
        say("The arcade is offline on this device.");
      }
    },
    stop() {
      if (window.LOKES && window.LOKES.game && window.LOKES.game.isPlaying()) window.LOKES.game.stop();
      else say("Nothing to stop. House is calm.");
    },
    ride() {
      say("Rider first. Hurricane, Utah. Splitboard when it snows, van when it doesn’t.");
    },
    van() { replies.vanism(); },
    film() {
      sayHtml("Film lives on YouTube → " + link(LINKS.youtube, "@lokes_one") + ". Real places, no set.");
    },
    press() {
      sayHtml("Mail the house → " + link(LINKS.mail, "nicholasacord@outlook.com") + ". A person answers.");
    },
    mail() { replies.press(); },
    credits() {
      say("LOKES ONE LIMITED CO LLC. Host: GitHub Pages, $0. No Shopify. Insert coin.");
      say("Cast: Nicholas (founder). Odin (rabbit). C3i (desk). Invaders (uninvited).");
    },
    coin() {
      say("Credit accepted. Type play, scores, or help.");
    },
    insert() { replies.coin(); },
    clear() {
      gen++;
      queue.length = 0;
      busy = false;
      out.innerHTML = "";
      say("screen cleared. Still here.");
    },
  };

  function greet() {
    sys("— desk online —");
    say("Hey. Type help. Tap Odin.");
  }
  greet();

  function run(raw) {
    const line = (raw || "").trim();
    if (!line) return;
    print('<span class="me">you&gt;</span> ' + esc(line), "me");
    hist.push(line);
    histIdx = hist.length;
    const key = line.toLowerCase().split(/\s+/)[0];
    if (replies[key]) { replies[key](); return; }
    if (key === "ls" || key === "open") { replies.doors(); return; }
    if (key === "sudo") { say("Nice try. Founder signs spend, send, post. Not you, not me."); return; }
    say("Unknown: `" + key + "`. Try help — I’ll point the doors.");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    run(v);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = hist[histIdx] || ""; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < hist.length - 1) { histIdx++; input.value = hist[histIdx] || ""; }
      else { histIdx = hist.length; input.value = ""; }
    }
  });

  function focusDoor() {
    document.getElementById("c3i").scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
    say("Door focused. You’re in.");
  }
  document.getElementById("c3i-focus").addEventListener("click", focusDoor);
  document.getElementById("open-c3i").addEventListener("click", function (e) {
    e.preventDefault();
    focusDoor();
    run("c3i");
  });
  document.getElementById("open-book").addEventListener("click", function () {
    // the door opens bloodmutant.com in a new tab; the desk explains the buy door is still soon
    run("book");
  });
  const coinBtn = document.getElementById("insert-coin");
  if (coinBtn) coinBtn.addEventListener("click", function () {
    focusDoor();
    run("coin");
  });

  // --- the desk watches Odin and the arcade -------------------------------------------
  const hopLines = ["Odin approves.", "*ears up*", "That’s his good side.", "He’d like a carrot for that.", "Logged: one hop."];
  let hopSaid = 0;
  document.addEventListener("lokes:odin", function (e) {
    const d = e.detail || {};
    if (d.type === "hop") {
      if (d.hops === 1 || d.hops % 4 === 0) { say(hopLines[hopSaid++ % hopLines.length]); }
    } else if (d.type === "konami") {
      say("Konami. 1UP. Odin spins for the old code.");
    }
  });
  const SECTOR_NAMES = ["lokes.one", "me.lokes.one", "vanism.ai"];
  document.addEventListener("lokes:game", function (e) {
    const d = e.detail || {};
    if (d.mode && d.mode !== "play" && d.type !== "stop") return;   // the demo plays quietly
    switch (d.type) {
      case "start": sys("— arcade live · odin vs the invaders —"); break;
      case "hit": say(d.lives > 0 ? "Odin took one. Unbothered. Lives: " + d.lives + "." : "Odin is down."); break;
      case "wave": if (!d.win) say("Sector " + String(d.cleared).padStart(2, "0") + " held. Next: " + SECTOR_NAMES[(d.next - 1) % 3] + ". Score " + d.score + "."); break;
      case "boss": say("The cart wants in. It never gets in."); break;
      case "bosskill": say("Cart rejected. Shop stays parked. That’s the law."); break;
      case "combo": say("Combo ×" + d.mult + ". Odin is on one."); break;
      case "ufo": say("Mystery ship. +" + d.pts + ". Nobody knows who sent it."); break;
      case "win": say("Empire secured. Nine sectors, three holdings, one rabbit. Keep going if you want overtime."); break;
      case "over": say("Game over — " + d.why + ". Score " + d.score + ". Shop still parked."); break;
      case "hiscore": say(d.rank === 1 ? d.initials + " tops the house table." : d.initials + " is on the table at " + d.rank + "."); break;
      case "stop": sys("— arcade back to demo · house calm —"); break;
      case "kill": case "attract": break;
      default: break;
    }
  });

  if (location.hash === "#c3i") setTimeout(focusDoor, 400);
})();
