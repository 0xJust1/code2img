// Progressive enhancement: [data-reveal] elements run their entrance once, when they enter.
// A plain inline script rather than a client component, so the marketing pages ship no hydration
// work for it — the CSS default is the visible state, so nothing is lost without JS.
export const REVEAL_JS = `(() => {
  var els = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target, group = el.closest("[data-reveal-group]");
      var index = group ? Array.prototype.indexOf.call(group.querySelectorAll("[data-reveal]"), el) : 0;
      el.style.setProperty("--rd", Math.min(index, 6) * 70 + "ms");
      el.classList.add("in");
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();`;