/*! c3i-sales.js — emergency restore + packaging go-slow loader */
(function () {
  "use strict";
  if (document.getElementById("c3i-sales-root")) return;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/rockymountainamerica-bot/lokes-one-house@6b62d9f87b1ed0aaec22fbcc0f6a78248e1b385b/engine/c3i-sales.js";
  s.async = true;
  s.onerror = function () {
    console.error("Ask C3i: failed to load restored widget");
  };
  document.head.appendChild(s);
})();
