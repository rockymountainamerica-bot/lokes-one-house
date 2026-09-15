(function () {
  const LINKS = {
    vanism: "https://vanism.ai",
    me: "https://me.lokes.one",
    youtube: "https://www.youtube.com/@lokes_one",
    app: "https://apps.apple.com/us/app/vanism/id6786479632",
    mail: "mailto:nicholasacord@outlook.com",
  };

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
      say("Commands: help · c3i · desk · whoami · odin · vanism · book · doors · ride · film · press · coin · clear");
      say("I’m the desk greeter. Warm, short, real. Not a fake AGI.");
    },
    c3i() {
      say("Door open. I’m C3i — Nicholas’s desk. Ask whoami, doors, vanism, or book.");
    },
    desk() {
      say("desk: C3i · online. Shop parked. Lab closed. House listening.");
    },
    whoami() {
      say("Nicholas Acord — founder · rider · Hurricane UT.");
      say("House: lokes.one · Product: vanism.ai · Man: me.lokes.one");
    },
    vanism() {
      sayHtml("Vanism — travel OS. Door → " + link(LINKS.vanism, "vanism.ai"));
    },
    book() {
      say("Blood Mutant. The book is real. The buy door isn’t open yet.");
      say("No cart, no invented ASIN. When the door opens, this line changes.");
    },
    doors() {
      sayHtml("Three doors: " + link(LINKS.vanism, "vanism.ai") + " (product) · " +
        link(LINKS.me, "me.lokes.one") + " (man) · lokes.one (this house).");
      sayHtml("Also: " + link(LINKS.youtube, "YouTube") + " · Blood Mutant (door soon).");
      say("Shop: parked. Lab: closed.");
    },
    odin() {
      say("Odin. Pixel on the house. C3i · Odin — in memory.");
      say("Black ears, eye mask, nose blotch, side spots. His face.");
    },
    rabbit() {
      replies.odin();
    },
    ride() {
      say("Rider first. Hurricane, Utah. Splitboard when it snows, van when it doesn’t.");
    },
    van() {
      replies.vanism();
    },
    film() {
      sayHtml("Film lives on YouTube → " + link(LINKS.youtube, "@lokes_one") + ". Real places, no set.");
    },
    press() {
      sayHtml("Mail the house → " + link(LINKS.mail, "nicholasacord@outlook.com") + ". A person answers.");
    },
    mail() {
      replies.press();
    },
    coin() {
      say("Credit accepted. Player 1 — you’re at the desk.");
      say("1970s cabinet, futuristic shell. Type help for the map.");
    },
    insert() {
      replies.coin();
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
  document.getElementById("open-book").addEventListener("click", function (e) {
    e.preventDefault();
    focusDoor();
    run("book");
  });
  document.getElementById("insert-coin").addEventListener("click", function () {
    focusDoor();
    run("coin");
  });

  // Deep-link #c3i
  if (location.hash === "#c3i") {
    setTimeout(focusDoor, 400);
  }
})();
