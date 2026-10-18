/* Anduril-leaning sales polish — inject cinematic proof rail after unlock */
(function () {
  var BASE = "/engine/exxovantage/";
  if (document.querySelector('link[data-exxo-polish]')) return;

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = BASE + "anduril-polish.css";
  link.setAttribute("data-exxo-polish", "1");
  document.documentElement.appendChild(link);

  function mountProof() {
    if (document.getElementById("exxo-proof")) return;
    var host = document.querySelector(".relative.z-10") || document.body;
    if (!host) return;

    var shots = [
      {
        src: BASE + "img/lift-cutout.png",
        caption: "ExxoLift™ — product",
        cls: "span2 cut",
      },
      { src: BASE + "img/gallery-1.jpg", caption: "Field ops" },
      { src: BASE + "img/gallery-2.jpg", caption: "Workforce" },
      { src: BASE + "img/gallery-3.jpg", caption: "Industrial" },
      { src: BASE + "img/gallery-4.jpg", caption: "Deployed" },
      {
        src: BASE + "img/exxolift-hero.webp",
        caption: "Augmented biomechanics",
        cls: "span2",
      },
    ];

    var sec = document.createElement("section");
    sec.id = "exxo-proof";
    sec.setAttribute("aria-label", "ExxoLift in the field");
    sec.innerHTML =
      '<div class="rail-head"><div><div class="kicker">Product proof</div>' +
      '<div class="line">Built for the floor — not the brochure.</div></div></div>' +
      '<div class="rail"></div>';

    var rail = sec.querySelector(".rail");
    shots.forEach(function (s) {
      var fig = document.createElement("figure");
      if (s.cls) fig.className = s.cls;
      var img = document.createElement("img");
      img.src = s.src;
      img.alt = s.caption;
      img.loading = "lazy";
      if (s.cls && s.cls.indexOf("cut") >= 0) img.className = "cut";
      var cap = document.createElement("figcaption");
      cap.textContent = s.caption;
      fig.appendChild(img);
      fig.appendChild(cap);
      rail.appendChild(fig);
    });

    var footer = host.querySelector(".fixed.inset-x-0.bottom-0");
    if (footer && footer.parentNode === host) {
      host.insertBefore(sec, footer);
    } else {
      host.appendChild(sec);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountProof);
  } else {
    mountProof();
  }
  // Next hydration can rebuild the tree — remount once
  setTimeout(mountProof, 800);
  setTimeout(mountProof, 2000);
})();
