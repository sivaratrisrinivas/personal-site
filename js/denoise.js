/* Denoise + reads-you. Everything observed stays in this tab: no network, no cookies, no storage. */
(function () {
  "use strict";
  var STEPS = 50, doc = document, body = doc.body;
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var stepEl = $("#step"), modeEl = $("#hud-mode"), canvas = $("#noise"), cleanBtn = $("#clean-btn");
  var t0 = performance.now();

  /* ---- favourites facts (existing data, shown to lingerers) ---- */
  var F = window.IslandFavourites;
  function addFacts(ul, list) {
    $$("li", ul).forEach(function (li, i) {
      var d = list[i]; if (!d || !d.facts || !d.facts[0]) return;
      var s = doc.createElement("span"); s.className = "fact";
      s.textContent = d.facts[0].fact + " ";
      var a = doc.createElement("a"); a.href = d.facts[0].source; a.textContent = "source";
      s.appendChild(a); li.appendChild(s);
    });
  }
  if (F) { addFacts($("#fav-books"), F.BOOKS); addFacts($("#fav-films"), F.FILMS); }

  /* ---- denoise targets ---- */
  var targets = [];
  function T(el, opts) { el.setAttribute("data-dn", ""); var t = { el: el, n: 1, q: -1, att: 0, hover: 0, item: opts && opts.item, hero: opts && opts.hero, name: opts && opts.name }; targets.push(t); return t; }
  var hero = T($(".hero"), { hero: true });
  $$(".sec:not(.hero) > h2").forEach(function (h) { T(h); });
  var items = $$(".item").map(function (el) {
    var h = $("h3", el);
    var t = T(el, { item: true, name: h ? h.textContent : el.getAttribute("data-item") });
    if ($(".deep, .fact", el)) el.classList.add("shallow");
    return t;
  });
  $$(".contact > p").forEach(function (p) { T(p); });

  /* scramble: text nodes inside .scr */
  var GLYPH = "░▒▓█#%@*+=-:·";
  var scr = [];
  $$(".scr").forEach(function (el) {
    var owner = targets.filter(function (t) { return t.el.contains(el); }).pop();
    var w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) scr.push({ node: n, txt: n.nodeValue, owner: owner, seed: Math.random() * 1e4 });
  });
  function scramble(s, n, seed) {
    if (n < 0.02) return s.txt;
    var out = "", t = s.txt;
    for (var i = 0; i < t.length; i++) {
      var c = t[i], r = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
      out += (c === " " || c === "\n" || r > n) ? c : GLYPH[(i + (seed | 0)) % GLYPH.length];
    }
    return out;
  }

  /* ---- reading the reader ---- */
  var R = { scrolled: 0, activeMs: 0, lastY: scrollY, lastT: performance.now(), hesitations: 0, mode: "sampling", version: "you", clean: false, changes: [] };
  addEventListener("scroll", function () {
    var now = performance.now(), dy = Math.abs(scrollY - R.lastY), dt = now - R.lastT;
    if (dt < 400) R.activeMs += dt;
    R.scrolled += Math.min(dy, 400); R.lastY = scrollY; R.lastT = now; kick();
  }, { passive: true });
  items.forEach(function (t) {
    var start = 0;
    t.el.addEventListener("pointerenter", function () { start = performance.now(); });
    t.el.addEventListener("pointerleave", function () { if (!start) return; var d = performance.now() - start; t.hover += d; if (d > 700) R.hesitations++; start = 0; });
    t.el.addEventListener("focusin", function () { t.att += 4000; t.focus = true; kick(); });
    t.el.addEventListener("focusout", function () { t.focus = false; });
  });
  function speed() { return R.activeMs > 300 ? R.scrolled / (R.activeMs / 1000) : 0; }
  function infer(now) {
    if (R.mode !== "sampling" && R.mode !== "reader") return;
    var vh = innerHeight, sp = speed(), el = (now - t0) / 1000;
    var dwell = items.reduce(function (a, t) { return a + t.att; }, 0) / 1000;
    if (R.scrolled > vh * 2.2 && sp > 2200 && el < 25) setMode("skimmer");
    else if (dwell > 40 || (el > 30 && sp < 900 && R.scrolled > vh)) setMode("lingerer");
    else if (R.scrolled > vh * 1.5 && R.mode === "sampling") setMode("reader");
  }
  function setMode(m) {
    if (R.mode === m) return; R.mode = m;
    var label = { skimmer: "skimming detected → converging to the terse version", lingerer: "you linger → sampling richer detail", reader: "steady reader → detail follows your attention" }[m];
    modeEl.textContent = label; apply(); if (inferEl.innerHTML) readout();
  }
  function apply() {
    var v = R.version, terse = v === "terse" || (v === "you" && R.mode === "skimmer");
    var full = v === "full" || (v === "you" && R.mode === "lingerer");
    body.classList.toggle("terse", terse);
    items.forEach(function (t) {
      var open = full || (!terse && (t.att + t.hover * 2 > 2600 || t.focus));
      if (t.el.classList.contains("shallow") === open) {
        t.el.classList.toggle("shallow", !open);
        if (open && v === "you" && R.changes.indexOf(t.name) < 0) R.changes.push(t.name);
      }
    });
  }

  /* ---- noise canvas ---- */
  var ctx = canvas.getContext("2d"), img, W = 0, H = 0, G = 1, lastDraw = 0;
  function size() {
    W = Math.max(96, Math.round(innerWidth / 6)); H = Math.max(96, Math.round(innerHeight / 6));
    canvas.width = W; canvas.height = H; img = ctx.createImageData(W, H);
  }
  size(); addEventListener("resize", function () { size(); kick(); });
  function drawNoise(n) {
    var d = img.data, len = d.length;
    for (var i = 0; i < len; i += 4) {
      var v = (Math.random() * 255) | 0, a = Math.random() < 0.012;
      d[i] = a ? 198 : v * 0.9; d[i + 1] = a ? 255 : v * 0.92; d[i + 2] = a ? 61 : v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    canvas.style.opacity = (n * 0.96).toFixed(3);
  }

  /* ---- main loop ---- */
  var raf = 0, idle = 0;
  function kick() { idle = 0; if (!raf && !doc.hidden) raf = requestAnimationFrame(frame); }
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) { R.lastT = performance.now(); kick(); } });

  var lastAtt = performance.now();
  function tickAtt(now) {
    var dt = Math.min(1000, now - lastAtt), vh = innerHeight; lastAtt = now;
    items.forEach(function (t) {
      var r = t.el.getBoundingClientRect(), vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (vis > Math.min(r.height, vh) * 0.5) t.att += dt;
    });
  }
  setInterval(function () { if (doc.hidden || raf) return; var now = performance.now(); tickAtt(now); infer(now); apply(); }, 500);
  var lastNow = performance.now();
  function frame(now) {
    raf = 0;
    var dt = Math.min(100, now - lastNow); lastNow = now;
    var vh = innerHeight, moving = false, centerN = 0, best = 1e9;
    tickAtt(now);
    infer(now);
    var fast = R.mode === "skimmer" ? 1.8 : 1;
    targets.forEach(function (t) {
      var r = t.el.getBoundingClientRect(), goal;
      var vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (R.clean) goal = 0;
      else if (t.hero) goal = Math.max(0, 1 - (now - t0) / 1900);
      else {
        var boost = fast * (1 + Math.min(2.5, (t.att + t.hover * 2) / 2500));
        var p = (vh - r.top) / (vh * 0.62 / boost);
        goal = t.focus ? 0 : Math.max(0, Math.min(1, 1 - p));
      }
      t.n += (goal - t.n) * (t.hero || R.clean ? 1 : Math.min(1, dt / 120));
      if (Math.abs(goal - t.n) > 0.004) moving = true; else t.n = goal;
      var q = Math.round(t.n * STEPS);
      if (q !== t.q) { t.q = q; t.el.style.setProperty("--n", (q / STEPS).toFixed(2)); }
      var c = Math.abs((r.top + r.bottom) / 2 - vh / 2);
      if (vis > 0 && c < best) { best = c; centerN = q / STEPS; }
    });
    scr.forEach(function (s) {
      var q = s.owner ? s.owner.q : 0;
      if (s.q !== q) { s.q = q; s.node.nodeValue = scramble(s, q / STEPS, s.seed + q); }
    });
    if (hero.q > 0) centerN = Math.max(centerN, hero.q / STEPS);
    G = centerN;
    stepEl.textContent = Math.round(G * STEPS);
    if (G > 0.01 && now - lastDraw > 33) { drawNoise(G); lastDraw = now; }
    else if (G <= 0.01) canvas.style.opacity = "0";
    apply();
    if (moving || G > 0.01 || (idle += dt) < 1500) raf = requestAnimationFrame(frame);
  }

  /* ---- readout ---- */
  var inferEl = $("#infer");
  function row(k, v) { return "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function readout() {
    var top = items.slice().sort(function (a, b) { return (b.att + b.hover * 2) - (a.att + a.hover * 2); })[0];
    var secs = Math.round((performance.now() - t0) / 1000);
    var style = R.clean ? (reduced ? "reduced motion: served clean" : "asked for the clean version") : ({ skimmer: "skimmer", lingerer: "lingerer", reader: "steady reader", sampling: "still sampling" }[R.mode]);
    var built = R.mode === "skimmer" ? "terse: details collapsed, favourites hidden" : R.mode === "lingerer" ? "full: every Why, result and fact sampled" : (R.changes.length ? "expanded where you looked: " + R.changes.join(", ") : "the essentials; hover or focus a project to go deeper");
    inferEl.innerHTML = row("Reading style", esc(style)) + row("Scroll speed", Math.round(speed()) + " px/s") +
      row("Time here", secs + " s") + row("Most attention", esc(top ? top.name : "-")) +
      row("Hesitations", R.hesitations + " long hovers") + row("What I built", esc(built));
  }
  var ro = $("#for-you");
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) readout(); }, { threshold: 0.2 }).observe(ro);
  $$(".toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      R.version = b.getAttribute("data-v");
      $$(".toggle button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      apply(); readout(); kick();
    });
  });
  function setClean(on) {
    R.clean = on; body.classList.toggle("clean", on);
    cleanBtn.setAttribute("aria-pressed", on ? "true" : "false");
    cleanBtn.textContent = on ? "Re-noise" : "Skip denoising";
    if (on) modeEl.textContent = reduced ? "reduced motion: clean sample" : "clean sample";
    kick();
  }
  cleanBtn.addEventListener("click", function () { setClean(!R.clean); });
  if (reduced || /[?&]clean\b/.test(location.search)) setClean(true);
  kick();
})();
