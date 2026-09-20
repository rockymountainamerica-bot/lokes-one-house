(function () {
  "use strict";

  var TIPS = [
    {
      id: "T1",
      sel: '[data-tip="T1"]',
      label: "Operating Desk",
      title: "What's an Operating Desk?",
      body: "You're worn thin being the whole office. Your site stays a simple front door; behind it a desk answers and drafts — like front-office help that never books a job or spends money until you say yes.",
    },
    {
      id: "T2",
      sel: '[data-tip="T2"]',
      label: "You approve",
      title: "Nothing sends until you stamp",
      body: "The desk can draft texts, emails, and next steps. It does not send them or spend money on its own. You tap approve — like signing a work order before it goes out.",
    },
    {
      id: "T3",
      sel: '[data-tip="T3"]',
      label: "Audit",
      title: "We look at what's live",
      body: "We read your public website as a customer would — pages, offers, how someone books — so the desk is grounded in your real business, not a generic script.",
    },
    {
      id: "T4",
      sel: '[data-tip="T4"]',
      label: "Prove",
      title: "See it on your URL",
      body: "We stand up a live desk against your public site so you can try real questions before anything is wired deep. Often you can see this on a live link in minutes.",
    },
    {
      id: "T5",
      sel: '[data-tip="T5"]',
      label: "Door",
      title: "A door on your site — you keep the keys",
      body: "When you're ready, a simple door on your site opens the desk for visitors. Deeper hooks (mail, calendar, CRM) wait for your OK.",
    },
    {
      id: "T6",
      sel: '[data-tip="T6"]',
      label: "Operating Desk",
      title: "Why owners care",
      body: "Auto-send and auto-spend stay off. Outbound stays draft until you approve. Connectors stay human-approved. You're still the boss of money and messages.",
    },
    {
      id: "T7",
      sel: '[data-tip="T7"]',
      label: "Ask",
      title: "Why it says Ask",
      body: "We don't put a public price list on this page. First step is paid discovery on your site and one named problem — written scope, hard end — then terms that match that scope.",
    },
  ];

  var HEADINGS = { H1: true, H2: true };
  var openId = null;
  var lastBtn = null;

  function storageKey(id) {
    return "c3i-tip-dismissed-" + id;
  }

  function markDismissed(id) {
    try {
      sessionStorage.setItem(storageKey(id), "1");
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function closeAll(opts) {
    opts = opts || {};
    document.querySelectorAll(".c3i-tip-panel").forEach(function (p) {
      p.hidden = true;
    });
    document.querySelectorAll(".c3i-tip-btn").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
    });
    openId = null;
    if (opts.returnFocus && lastBtn) {
      try {
        lastBtn.focus();
      } catch (e) {
        /* ignore */
      }
    }
  }

  function placePanel(btn, panel) {
    panel.classList.remove("is-above");
    var rect = btn.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 180 && rect.top > spaceBelow) {
      panel.classList.add("is-above");
    }
  }

  function mount(tip) {
    var el = document.querySelector(tip.sel);
    if (!el) return;
    if (HEADINGS[el.tagName]) return;

    var wrap = document.createElement("span");
    wrap.className = "c3i-tip-wrap";
    wrap.dataset.tipId = tip.id;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "c3i-tip-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "c3i-tip-panel-" + tip.id);
    btn.setAttribute("aria-label", "Explain: " + tip.label);
    btn.textContent = "?";

    var panel = document.createElement("div");
    panel.id = "c3i-tip-panel-" + tip.id;
    panel.className = "c3i-tip-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", tip.title);
    panel.hidden = true;

    var x = document.createElement("button");
    x.type = "button";
    x.className = "c3i-tip-panel__x";
    x.setAttribute("aria-label", "Close");
    x.innerHTML = "&times;";

    var title = document.createElement("p");
    title.className = "c3i-tip-panel__title";
    title.textContent = tip.title;

    var body = document.createElement("p");
    body.className = "c3i-tip-panel__body";
    body.id = "c3i-tip-desc-" + tip.id;
    body.textContent = tip.body;

    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "c3i-tip-panel__ok";
    ok.textContent = "Got it";

    panel.setAttribute("aria-describedby", body.id);
    panel.appendChild(x);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(ok);

    function open() {
      closeAll();
      lastBtn = btn;
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      openId = tip.id;
      placePanel(btn, panel);
    }

    function dismiss() {
      markDismissed(tip.id);
      closeAll({ returnFocus: true });
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (openId === tip.id) {
        closeAll({ returnFocus: true });
        return;
      }
      open();
    });
    x.addEventListener("click", function (e) {
      e.stopPropagation();
      dismiss();
    });
    ok.addEventListener("click", function (e) {
      e.stopPropagation();
      dismiss();
    });
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    wrap.appendChild(btn);
    wrap.appendChild(panel);

    var row = document.createElement("div");
    row.className = "c3i-tip-row";
    el.parentNode.insertBefore(row, el);
    row.appendChild(el);
    row.appendChild(wrap);
  }

  TIPS.forEach(mount);

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".c3i-tip-wrap") && openId) {
      closeAll({ returnFocus: true });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openId) {
      closeAll({ returnFocus: true });
    }
  });

  window.addEventListener(
    "resize",
    function () {
      if (!openId) return;
      var panel = document.getElementById("c3i-tip-panel-" + openId);
      var btn = document.querySelector(
        '.c3i-tip-wrap[data-tip-id="' + openId + '"] .c3i-tip-btn'
      );
      if (panel && btn && !panel.hidden) placePanel(btn, panel);
    },
    { passive: true }
  );
})();
