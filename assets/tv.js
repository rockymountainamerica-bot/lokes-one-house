/* CRT bay — power for @lokes_one embeds. No downloads. */
(function () {
  var glass = document.getElementById("crt-glass");
  var frame = document.getElementById("crt-frame");
  var power = document.getElementById("crt-power");
  if (!glass || !frame || !power) return;

  var SRC = "https://www.youtube-nocookie.com/embed?listType=user_uploads&list=lokes_one&rel=0";
  var on = true;

  function setPower(next) {
    on = next;
    power.classList.toggle("on", on);
    power.setAttribute("aria-pressed", on ? "true" : "false");
    glass.classList.toggle("off", !on);
    if (!on) {
      frame.removeAttribute("src");
    } else if (!frame.getAttribute("src")) {
      frame.src = SRC;
    }
  }

  power.addEventListener("click", function () {
    setPower(!on);
  });
})();
