/* Anduril-leaning sales polish: market-separated proof rails */
(function () {
  var path = (location.pathname || "").toLowerCase();
  if (path.indexOf("/x/") < 0) return; /* merged front door, checkout and control stay clean: packet pages only */
  var BASE = "/engine/exxovantage/";
  if (document.querySelector('link[data-exxo-polish]')) return;

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = BASE + "anduril-polish.css";
  link.setAttribute("data-exxo-polish", "1");
  document.documentElement.appendChild(link);

  var NAMES = { astronautics: "Astronautics", aerospace: "Aerospace", aviation: "Aviation", defense: "Defense", homeland: "Homeland Security", mining: "Mining", manufacturing: "Manufacturing", healthcare: "Healthcare", construction: "Construction", warehouse: "Logistics", retail: "Retail", primary: "Primary Industries", horticulture: "Horticulture" };
  function marketFromPath() {
    var m = path.match(/\/x\/([a-z]+)/);
    return m && NAMES[m[1]] ? m[1] : "home";
  }

  var PRODUCT = {
    src: BASE + "img/lift-cutout.png",
    caption: "ExxoLift™: product",
    cls: "span2 cut",
  };
  var HERO = {
    src: BASE + "img/exxolift-hero.webp",
    caption: "Augmented biomechanics",
    cls: "span2",
  };

  var RAILS = {
    aerospace: {
      kicker: "Aerospace proof",
      line: "Hangar floors. Component lifts. No construction stock.",
      shots: [
        PRODUCT,
        {
          src: BASE + "img/markets/aerospace/hangar-panel.jpg",
          caption: "Hangar: panel handling",
          cls: "span2",
        },
        {
          src: BASE + "img/markets/aerospace/engine-fixture.jpg",
          caption: "MRO: tooling & fixtures",
        },
        {
          src: BASE + "img/markets/aerospace/fuselage-walk.jpg",
          caption: "Line side: fuselage ops",
        },
        {
          src: BASE + "img/markets/aerospace/sat-bay.jpg",
          caption: "Assembly bay: large structures",
        },
        HERO,
      ],
    },
    defense: {
      kicker: "Defense proof",
      line: "Depot and sustainment: public imagery only.",
      shots: [
        PRODUCT,
        {
          src: BASE + "img/markets/defense/flightline.jpg",
          caption: "Flight line: crates & kits",
          cls: "span2",
        },
        {
          src: BASE + "img/markets/defense/sustainment.jpg",
          caption: "Sustainment hangar",
          cls: "span2",
        },
        HERO,
      ],
    },
    warehouse: {
      kicker: "Warehouse proof",
      line: "Picks, docks, and volume shifts.",
      shots: [
        PRODUCT,
        {
          src: BASE + "img/markets/warehouse/dock-load.jpg",
          caption: "Dock: truck loading",
          cls: "span2",
        },
        {
          src: BASE + "img/markets/warehouse/pick-aisle.jpg",
          caption: "Aisle: cases & totes",
          cls: "span2",
        },
        HERO,
      ],
    },
    home: {
      kicker: "Product proof",
      line: "Market packets keep their own floors. This rail stays product-only.",
      shots: [PRODUCT, HERO],
    },
  };

  function mountProof() {
    if (document.getElementById("exxo-proof")) return;
    var host = document.querySelector(".relative.z-10") || document.body;
    if (!host) return;

    var m = marketFromPath();
    var railCfg = RAILS[m] || (NAMES[m] ? { kicker: NAMES[m] + ": product", line: "Market photography from Exxovantage to come [SPEC]. Product imagery only, no other market's media.", shots: [PRODUCT, HERO] } : RAILS.home);
    var shots = railCfg.shots;

    var sec = document.createElement("section");
    sec.id = "exxo-proof";
    sec.setAttribute("data-market", m);
    sec.setAttribute("aria-label", "ExxoLift proof: " + m);
    sec.innerHTML =
      '<div class="rail-head"><div><div class="kicker">' +
      railCfg.kicker +
      "</div>" +
      '<div class="line">' +
      railCfg.line +
      "</div></div></div>" +
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

  /* mount only after React hydration finishes, so the injected rail never causes a hydration mismatch */
  function later() { setTimeout(mountProof, 1200); }
  if (document.readyState === "complete") later(); else window.addEventListener("load", later);
  setTimeout(mountProof, 4000);
})();
