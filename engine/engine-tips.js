/*!
 * engine-tips.js — loader shim (2026-09-21)
 * Ask Odin tip UI removed. Loads Ask C3i sales widget instead.
 */
(function () {
  "use strict";
  if (window.__C3I_TIPS_SHIM__) return;
  window.__C3I_TIPS_SHIM__ = true;
  var v = "20260921c3i";
  var base = "";
  try {
    var cur = document.currentScript && document.currentScript.src;
    if (cur) base = cur.replace(/[^/]+$/, "");
  } catch (e) {}
  function load(src, attrs, next) {
    var s = document.createElement("script");
    s.src = (base || "") + src;
    s.async = false;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    s.onload = function () { if (next) next(); };
    s.onerror = function () { if (next) next(); };
    (document.head || document.documentElement).appendChild(s);
  }
  load("c3i-sales-config.js?v=" + v, null, function () {
    load("c3i-sales.js?v=" + v, { "data-face": "b2b", defer: "true" });
  });
})();
