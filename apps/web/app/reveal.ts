// Progressive enhancement: .reveal elements run their entrance once, when they enter the
// viewport. A plain inline script rather than a client component, so the marketing pages ship
// no hydration work for it. The .js class (set in <head> by doc()) gates the hidden state, so
// without JS the CSS default is the visible state: nothing is lost.
//
// Animation, not transition: `animation-fill-mode: backwards` with a --d delay frees transform
// for the hover-lift on cards (a transition-based reveal would impose its own duration on hover).
export const REVEAL_JS = `(() => {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var kids = group.querySelectorAll(":scope > .reveal");
    Array.prototype.forEach.call(kids, function (el, i) {
      el.style.setProperty("--d", (i * 0.1).toFixed(2) + "s");
    });
  });
  requestAnimationFrame(function () { root.classList.add("hero-go"); });
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduce) {
    els.forEach(function (el) { el.classList.add("in"); }); return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (el) { io.observe(el); });
})();`;