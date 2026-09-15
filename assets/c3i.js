(function () {
  const LINKS = {
    vanism: "https://vanism.ai",
    me: "https://me.lokes.one",
    book: "https://bloodmutant.com/",
    youtube: "https://www.youtube.com/@lokes_one",
    app: "https://apps.apple.com/us/app/vanism/id6786479632",
  };

  const bootLines = [
    { t: "LOKES BIOS v1.0 — neo-tradition kernel", c: "ok" },
    { t: "mount /doors ................. ok", c: "ok" },
    { t: "desk: C3i .................... online", c: "cyan" },
    { t: "shopd ........................ parked (exit 0)", c: "warn" },
    { t: "art_module ................... dark", c: "warn" },
    { t: "odin ......................... loaded (in memory)", c: "ok" },
    { t: "vanism.link .................. live", c: "ok" },
    { t: "ready. type `c3i` or open the door below.", c: "ok" },
  ];
  const bootEl = document.getElementById("boot");
  let bi = 0;
  function bootTick() {
    if (bi >= bootLines.length) return;
    const row = document.createElement("div");
    row.className = bootLines[bi].c;
    row.textContent = "> " + bootLines[bi].t;
    bootEl.appendChild(row);
    bi++;
    setTimeout(bootTick, 110 + Math.random() * 100);
  }
  bootTick();

  const out = document.getElementById("term-out");
  const input = document.getElementById("term-input");
  const form = document.getElementById("term-form");
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
  function print(html, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  function say(text) {
    print("<span class=\"c3i\">C3i · </span>" + esc(text), "c3i");
  }
  function sayHtml(html) {
    print("<span class=\"c3i\">C3i · </span>" + html, "c3i");
  }

  const replies = {
    help() {
      say("Commands: help · c3i · desk · whoami · odin · vanism · book · doors · clear");
      say("I’m the desk greeter — warm, short, real. Not a fake AGI.");
    },
    c3i() {
      say("Door open. I’m C3i — Nicholas’s desk. Ask whoami, doors, vanism, or book.");
    },
    desk() {
      say("desk: C3i · online. Shop parked. Art dark. House listening.");
    },
    whoami() {
      say("Nicholas Acord — founder · rider · Hurricane UT.");
      say("House: lokes.one · Product: vanism.ai · Man: me.lokes.one");
    },
    vanism() {
      sayHtml("Vanism — travel OS. Door → " + link(LINKS.vanism, "vanism.ai"));
    },
    book() {
      sayHtml("Blood Mutant — door → " + link(LINKS.book, "bloodmutant.com") + " (Buy on Amazon).");
      say("No invented ASIN. Real link only.");
    },
    doors() {
      sayHtml("Three doors: " + link(LINKS.vanism, "vanism.ai") + " (product) · " +
        link(LINKS.me, "me.lokes.one") + " (man) · lokes.one (this house).");
      sayHtml("Also: " + link(LINKS.book, "Blood Mutant") + " · " + link(LINKS.youtube, "YouTube"));
      say("Shop: parked. Art: none.");
    },
    odin() {
      say("Odin. Pixel on the house. C3i · Odin — in memory.");
      say("Black ears, eye mask, nose blotch, side spots. His face.");
    },
    rabbit() {
      replies.odin();
    },
    clear() {
      out.innerHTML = "";
      say("screen cleared. Still here.");
    },
  };

  function greet() {
    print('<span class="sys">— c3i door mounted —</span>', "sys");
    say("Hey. Desk online. Type help to see the map.");
  }
  greet();

  function run(raw) {
    const line = (raw || "").trim();
    if (!line) return;
    print('<span class="me">you&gt;</span> ' + esc(line), "me");
    hist.push(line);
    histIdx = hist.length;
    const key = line.toLowerCase().split(/\s+/)[0];
    if (replies[key]) {
      replies[key]();
      return;
    }
    if (key === "ls" || key === "open") {
      replies.doors();
      return;
    }
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
    document.getElementById("c3i").scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
    say("Door focused. You’re in.");
  }
  document.getElementById("c3i-focus").addEventListener("click", focusDoor);
  document.getElementById("open-c3i").addEventListener("click", function (e) {
    e.preventDefault();
    focusDoor();
    run("c3i");
  });

  // Deep-link #c3i
  if (location.hash === "#c3i") {
    setTimeout(focusDoor, 400);
  }
})();
