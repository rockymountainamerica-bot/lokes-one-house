/* Control Room unlock — keeps working even if an old webpack chunk is cached. */
(function () {
  var KEY = "exxo_ctl_demo";
  var HASH = "a943c51c73eb452971b88973ed7da6ddb8b14e9964e56fd09ffb77ce007d2c59"; // ExxoPrivate

  function hex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  async function ok(pw) {
    if (!window.crypto || !crypto.subtle) return false;
    var h = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(pw || "").trim())));
    return h === HASH;
  }

  function wire(form) {
    if (!form || form.getAttribute("data-exxo-unlock") === "1") return;
    form.setAttribute("data-exxo-unlock", "1");
    form.addEventListener(
      "submit",
      function (e) {
        var input = form.querySelector('input[type="password"]');
        var pw = input ? input.value : "";
        e.preventDefault();
        e.stopPropagation();
        ok(pw).then(function (pass) {
          if (!pass) {
            var err = form.querySelector("[data-exxo-err]");
            if (!err) {
              err = document.createElement("div");
              err.setAttribute("data-exxo-err", "1");
              err.style.cssText = "color:#ffb4a2;font-size:13px";
              form.appendChild(err);
            }
            err.textContent = "Wrong password.";
            return;
          }
          try {
            sessionStorage.setItem(KEY, "1");
          } catch (x) {}
          location.reload();
        });
      },
      true
    );
  }

  function scan() {
    document.querySelectorAll('form[data-testid="control-login"]').forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
  setInterval(scan, 500);
})();
