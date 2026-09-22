/*! c3i-sales.js — Ask C3i floating sales Q&A (products/services only). Brand: C3i cube. ART OFF. Soft sell. FAQ fallback if bay unreachable. Face: data-face or /engine/gov/ => gov. */
(function () {
  "use strict";
  if (document.getElementById("c3i-sales-root")) return;
  var cfg = window.C3I_SALES || {};
  var apiBase = (cfg.apiBase || "").replace(/\/$/, "");
  var version = cfg.version || "20260921c3i";
  function detectFace() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var f = scripts[i].getAttribute("data-face");
      if (f === "gov" || f === "b2b") return f;
    }
    var path = (location.pathname || "").toLowerCase();
    if (path.indexOf("/engine/gov") === 0) return "gov";
    return "b2b";
  }
  var face = detectFace();
  var isGov = face === "gov";
  var markSrc = isGov ? "../c3i-mark.svg?v=" + version : "c3i-mark.svg?v=" + version;
  var history = [];
  var busy = false;
  var FAQ = isGov
    ? {
        "what is this": "Control Room for agencies — Watch, Desk, and Command packages around an Operating Desk on citizen-facing sites. Publish, notify, spend, and outbound stay human-approved. Not FedRAMP-authorized. No invented customers.",
        "how it works": "Three live proof doors: B2B https://lokes.one/engine/ (Operating Desk), B2C https://vanism.ai (Trip OS pattern), B2G https://lokes.one/engine/gov/ (Control Room — Watch / Desk / Command). Path: named public URL + named problem → discovery → Desk Eval Report → install after your security process allows.",
        pricing: "No public price list. Dollars stay UNKNOWN until scoped. Use Request install or Request paid discovery on this page (locked mailto subjects).",
        "human gates": "Publish, notify, spend, outbound, and go-live stay human-approved. Auto-send and auto-spend stay off. Agency security review is yours.",
        "get started": "Bring a named site and a named problem. Use Request install or Request paid discovery on this page. We confirm scope before any clock."
      }
    : {
        "what is this": "Operating Desk for your business — an AI floor behind a thin website door. You keep the wheel on money and outbound. Not another chatbot widget.",
        "how it works": "Audit what's live on your public site, prove a desk against real behavior, then open a thin door after you approve. Three proof faces: https://lokes.one/engine/ (B2B), https://vanism.ai (Trip OS pattern), https://lokes.one/engine/gov/ (agency Control Room).",
        pricing: "No public price list. Start with paid discovery on a named site and named problem, or Request install. Scope before any clock.",
        "human gates": "Spend, outbound send, go-live, and OAuth consent stay human-approved. Auto-send and auto-spend stay off by default.",
        "get started": "Request install or Request paid discovery from the buttons on this page. Bring a named site and a named problem."
      };
  function faqReply(q) {
    var s = (q || "").toLowerCase();
    if (/price|cost|\$|arr|dollar/.test(s)) return FAQ.pricing;
    if (/how (it|this) work|proof|door|watch|command/.test(s)) return FAQ["how it works"];
    if (/gate|stamp|human|approve|send|spend/.test(s)) return FAQ["human gates"];
    if (/start|install|discovery|mailto|contact|talk/.test(s)) return FAQ["get started"];
    if (/what is|what'?s this|control room|operating desk|product/.test(s)) return FAQ["what is this"];
    return FAQ["what is this"] + " Ask about how it works, pricing (ask/scoped), human gates, or get started — or use the mailto buttons on the page.";
  }
  var STYLE = [
    "#c3i-sales-root{all:initial;font-family:Inter,IBM Plex Sans,system-ui,sans-serif;position:fixed;z-index:99990;right:1rem;bottom:1rem;color:#121416}",
    "#c3i-sales-root *{box-sizing:border-box}",
    "#c3i-sales-fab{display:inline-flex;align-items:center;gap:.45rem;min-height:48px;padding:.55rem .9rem .55rem .55rem;border:1px solid rgba(28,31,34,.18);border-radius:999px;background:#FFFcf7;color:#121416;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 28px rgba(18,20,22,.16)}",
    "#c3i-sales-fab:focus-visible{outline:2px solid #B5512C;outline-offset:2px}",
    "#c3i-sales-fab img{width:32px;height:32px;border-radius:8px;display:block;background:#fff;border:1px solid rgba(28,31,34,.1)}",
    "#c3i-sales-panel{position:absolute;right:0;bottom:calc(100% + .65rem);width:min(380px,calc(100vw - 1.5rem));max-height:min(70vh,560px);display:flex;flex-direction:column;border:1px solid #D9D0C4;border-radius:14px;background:#FFFcf7;box-shadow:0 12px 40px rgba(18,20,22,.2);overflow:hidden}",
    "#c3i-sales-panel[hidden]{display:none!important}",
    "#c3i-sales-head{display:flex;align-items:center;gap:.55rem;padding:.75rem .85rem;background:#1C1F22;color:#F7F3EC}",
    "#c3i-sales-head img{width:28px;height:28px;border-radius:6px;background:#fff}",
    "#c3i-sales-head strong{font:600 14px/1.2 Inter,system-ui,sans-serif}",
    "#c3i-sales-head span{display:block;font:400 11px/1.3 Inter,system-ui,sans-serif;opacity:.78;margin-top:.15rem}",
    "#c3i-sales-x{margin-left:auto;width:44px;height:44px;border:0;background:transparent;color:#F7F3EC;font-size:1.4rem;cursor:pointer}",
    "#c3i-sales-msgs{flex:1;overflow:auto;padding:.85rem;display:flex;flex-direction:column;gap:.55rem;background:#F7F3EC}",
    ".c3i-sales-msg{max-width:95%;padding:.65rem .75rem;border-radius:10px;font:400 14px/1.45 Inter,system-ui,sans-serif;white-space:pre-wrap}",
    ".c3i-sales-msg--bot{align-self:flex-start;background:#FFFcf7;border:1px solid #D9D0C4;color:#121416}",
    ".c3i-sales-msg--user{align-self:flex-end;background:#1C1F22;color:#F7F3EC}",
    ".c3i-sales-msg--meta{align-self:center;font-size:11px;opacity:.7;background:transparent;border:0;padding:.2rem}",
    "#c3i-sales-chips{display:flex;flex-wrap:wrap;gap:.35rem;padding:.35rem .75rem .55rem;background:#F7F3EC;border-top:1px solid #D9D0C4}",
    "#c3i-sales-chips button{border:1px solid #D9D0C4;border-radius:999px;background:#FFFcf7;color:#121416;font:500 12px/1 Inter,system-ui,sans-serif;padding:.4rem .65rem;min-height:36px;cursor:pointer}",
    "#c3i-sales-chips button:hover{border-color:#B5512C;color:#B5512C}",
    "#c3i-sales-form{display:flex;gap:.4rem;padding:.65rem .75rem .8rem;background:#FFFcf7;border-top:1px solid #D9D0C4}",
    "#c3i-sales-form input{flex:1;min-height:44px;border:1px solid #D9D0C4;border-radius:10px;padding:.55rem .7rem;font:400 14px/1.3 Inter,system-ui,sans-serif;background:#fff;color:#121416}",
    "#c3i-sales-form button{min-height:44px;min-width:4.5rem;border:0;border-radius:10px;padding:.55rem .85rem;background:#B5512C;color:#F7F3EC;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer}",
    "#c3i-sales-form button:disabled{opacity:.55;cursor:wait}",
    "@media (max-width:480px){#c3i-sales-root{right:.5rem;bottom:.5rem;left:.5rem}#c3i-sales-panel{width:100%;right:0;left:0}}"
  ].join("");
  var style = document.createElement("style");
  style.id = "c3i-sales-css";
  style.textContent = STYLE;
  document.head.appendChild(style);
  var root = document.createElement("div");
  root.id = "c3i-sales-root";
  root.setAttribute("data-face", face);
  var fab = document.createElement("button");
  fab.type = "button";
  fab.id = "c3i-sales-fab";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "c3i-sales-panel");
  fab.innerHTML = '<img src="' + markSrc + '" width="32" height="32" alt="" /><span>Ask C3i</span>';
  var panel = document.createElement("div");
  panel.id = "c3i-sales-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Ask C3i about our products");
  panel.hidden = true;
  var headTitle = isGov ? "Talk to C3i" : "Ask C3i";
  var headSub = isGov ? "Control Room · products & services" : "Operating Desk · products & services";
  panel.innerHTML =
    '<div id="c3i-sales-head"><img src="' + markSrc + '" width="28" height="28" alt="" /><div><strong>' +
    headTitle + '</strong><span>' + headSub + '</span></div><button type="button" id="c3i-sales-x" aria-label="Close">&times;</button></div>' +
    '<div id="c3i-sales-msgs" aria-live="polite"></div><div id="c3i-sales-chips"></div>' +
    '<form id="c3i-sales-form" autocomplete="off"><input type="text" name="q" maxlength="2000" placeholder="Ask about our products…" aria-label="Message" /><button type="submit">Send</button></form>';
  root.appendChild(panel);
  root.appendChild(fab);
  document.body.appendChild(root);
  var msgs = panel.querySelector("#c3i-sales-msgs");
  var chips = panel.querySelector("#c3i-sales-chips");
  var form = panel.querySelector("#c3i-sales-form");
  var input = form.querySelector("input");
  var sendBtn = form.querySelector("button");
  var closeBtn = panel.querySelector("#c3i-sales-x");
  function addMsg(role, text, meta) {
    var el = document.createElement("div");
    el.className = "c3i-sales-msg " + (meta ? "c3i-sales-msg--meta" : role === "user" ? "c3i-sales-msg--user" : "c3i-sales-msg--bot");
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }
  addMsg("bot", isGov
    ? "Ask C3i about Control Room products and services. Honest answers only — no invented compliance or prices."
    : "Ask C3i about Operating Desk products and services. Honest answers only — no invented prices or customers.");
  ["What is this?", "How it works", "Pricing", "Human gates", "Get started"].forEach(function (label) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", function () { ask(label); });
    chips.appendChild(b);
  });
  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) { try { input.focus(); } catch (e) {} }
  }
  fab.addEventListener("click", function () { setOpen(panel.hidden); });
  closeBtn.addEventListener("click", function () { setOpen(false); fab.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
  async function liveAsk(text) {
    if (!apiBase) throw new Error("no api");
    var payload = { face: face, messages: history.concat([{ role: "user", content: text }]).slice(-20) };
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, 50000) : null;
    var res = await fetch(apiBase + "/api/sales-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined,
      mode: "cors",
      credentials: "omit"
    });
    if (t) clearTimeout(t);
    if (!res.ok) {
      var err = "http " + res.status;
      try { var j = await res.json(); if (j && j.detail) err = typeof j.detail === "string" ? j.detail : err; } catch (e) {}
      throw new Error(err);
    }
    var data = await res.json();
    if (!data || typeof data.reply !== "string" || !data.reply.trim()) throw new Error("empty");
    return data.reply.trim();
  }
  async function ask(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    addMsg("user", text);
    history.push({ role: "user", content: text });
    addMsg("bot", "…", true);
    var thinking = msgs.lastChild;
    try {
      var reply;
      try { reply = await liveAsk(text); }
      catch (e) {
        reply = faqReply(text);
        if (thinking && thinking.parentNode) thinking.remove();
        addMsg("bot", reply);
        addMsg("bot", "(Offline FAQ — bay unreachable. Mailto CTAs on the page still work.)", true);
        history.push({ role: "assistant", content: reply });
        return;
      }
      if (thinking && thinking.parentNode) thinking.remove();
      addMsg("bot", reply);
      history.push({ role: "assistant", content: reply });
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value;
    input.value = "";
    ask(q);
  });
})();
