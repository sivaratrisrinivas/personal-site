/*
 * Home page: theme toggle (shared "theme" key with /play), the Unmaze loop (skipped under reduced
 * motion, so the poster frame shows), and the Library list built from js/favourites.js.
 * Everything here is an enhancement: the page reads fine without it.
 */
(function () {
    "use strict";
    var root = document.documentElement;

    /* ---- theme ---- */
    var toggle = document.getElementById("theme-toggle");
    function paint(theme) {
        root.setAttribute("data-theme", theme);
        if (!toggle) return;
        var dark = theme === "dark";
        toggle.textContent = dark ? "Light" : "Dark";
        toggle.setAttribute("aria-pressed", String(dark));
        toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
    paint(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
    if (toggle) toggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
        paint(next);
    });
    var sys = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (sys && sys.addEventListener) sys.addEventListener("change", function (e) {
        var stored = null; try { stored = localStorage.getItem("theme"); } catch (er) { /* ignore */ }
        if (!stored) paint(e.matches ? "dark" : "light");
    });

    /* ---- loops: play only when motion is welcome ---- */
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) document.querySelectorAll("video[data-loop]").forEach(function (v) {
        v.autoplay = true;
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
    });

    /* ---- Library ---- */
    var F = window.IslandFavourites;
    if (!F) return;
    function h(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function out(href, text) { var a = h("a", null, text); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; return a; }
    function fact(f) {
        var p = h("p", "lib-fact", f.fact + " ");
        p.append(out(f.source, "Source"));
        return p;
    }
    var books = document.querySelector('[data-lib="books"]');
    if (books) {
        var ul = h("ul", "lib-list");
        F.BOOKS.forEach(function (b) {
            var li = h("li", "lib-item");
            var cover = h("span", "lib-cover");
            cover.style.setProperty("--spine", b.spine);
            if (b.cover) {
                var img = h("img"); img.src = b.cover.url; img.alt = ""; img.width = 40; img.height = 60;
                img.loading = "lazy"; img.referrerPolicy = "no-referrer";
                img.addEventListener("error", function () { img.remove(); });
                cover.append(img);
            }
            cover.setAttribute("aria-hidden", "true");
            var body = h("div", "lib-body");
            body.append(h("p", "lib-title", b.title), h("p", "lib-meta", b.author + " · " + F.progressText(b)));
            if (b.facts[0]) body.append(fact(b.facts[0]));
            li.append(cover, body);
            ul.append(li);
        });
        books.replaceChildren(ul);
    }
    var films = document.querySelector('[data-lib="films"]');
    if (films) {
        var fl = h("ul", "lib-list");
        F.FILMS.forEach(function (f) {
            var li = h("li", "lib-item lib-film");
            var body = h("div", "lib-body");
            var t = h("p", "lib-title"); t.append(out(f.link, f.title + " (" + f.year + ")"));
            body.append(t, h("p", "lib-meta", f.credit));
            if (f.facts[0]) body.append(fact(f.facts[0]));
            li.append(body);
            fl.append(li);
        });
        films.replaceChildren(fl);
    }
})();
