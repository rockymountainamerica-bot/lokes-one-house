/* Exxovantage private demo gate — client-side only (GitHub Pages). */
(function () {
  var KEY = "exxo.demo.ok";
  var HASH = "a943c51c73eb452971b88973ed7da6ddb8b14e9964e56fd09ffb77ce007d2c59";
  var ROOT = "/engine/exxovantage/";

  function unlocked() {
    try { return sessionStorage.getItem(KEY) === HASH; } catch (e) { return false; }
  }

  function lockPaint() {
    var s = document.createElement("style");
    s.id = "exxo-gate-style";
    s.textContent = "html.exxo-locked,html.exxo-locked body{background:#0A0200!important}" +
      "html.exxo-locked body>*{display:none!important}" +
      "#exxo-gate{display:flex!important;position:fixed;inset:0;z-index:2147483647;" +
      "align-items:center;justify-content:center;background:#0A0200;color:#e6e1de;" +
      "font:15px/1.5 system-ui,sans-serif;padding:24px}" +
      "#exxo-gate .box{width:min(360px,92vw);border:1px solid #3a302b;padding:28px 24px;" +
      "background:#140f0c}" +
      "#exxo-gate h1{margin:0 0 8px;font-size:18px;color:#F7C029;letter-spacing:.04em}" +
      "#exxo-gate p{margin:0 0 18px;color:#AAAAAA;font-size:13px}" +
      "#exxo-gate input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #3a302b;" +
      "background:#0A0200;color:#fff;font-size:15px;outline:none}" +
      "#exxo-gate input:focus{border-color:#F7C029}" +
      "#exxo-gate button{margin-top:12px;width:100%;padding:12px;border:0;background:#F7C029;" +
      "color:#0A0200;font-weight:600;cursor:pointer;font-size:14px;letter-spacing:.06em;text-transform:uppercase}" +
      "#exxo-gate .err{color:#ff6b6b;font-size:12px;margin-top:10px;min-height:1.2em}";
    document.documentElement.appendChild(s);
    document.documentElement.classList.add("exxo-locked");
  }

  function showGate() {
    if (document.getElementById("exxo-gate")) return;
    var el = document.createElement("div");
    el.id = "exxo-gate";
    el.innerHTML = '<div class="box"><h1>Exxovantage</h1><p>Private demo — enter the access password.</p>' +
      '<form id="exxo-gate-form"><input type="password" id="exxo-gate-pw" autocomplete="current-password" ' +
      'placeholder="Password" aria-label="Demo password" autofocus/>' +
      '<button type="submit">Enter</button><div class="err" id="exxo-gate-err"></div></form></div>';
    (document.body || document.documentElement).appendChild(el);
    var form = document.getElementById("exxo-gate-form");
    var input = document.getElementById("exxo-gate-pw");
    var err = document.getElementById("exxo-gate-err");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      verify(input.value).then(function (ok) {
        if (!ok) { err.textContent = "Wrong password."; input.select(); return; }
        try { sessionStorage.setItem(KEY, HASH); } catch (x) {}
        location.reload();
      });
    });
    setTimeout(function () { try { input.focus(); } catch (x) {} }, 50);
  }

  function hex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function verify(pw) {
    if (!window.crypto || !crypto.subtle) {
      return Promise.resolve(false);
    }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw || "")).then(function (buf) {
      return hex(buf) === HASH;
    });
  }

  if (unlocked()) return;

  lockPaint();
  if (document.body) showGate();
  else document.addEventListener("DOMContentLoaded", showGate);
})();
