/*
 * Renders js/favourites.js into the codex (sections "reading" and "pictures", which the game clones
 * into the Reading Room / Picture House dialogs) and into the Index dialog's "Favourites, 2026" list.
 * Pure DOM building, no innerHTML. Must load before js/game.js so the codex is filled before cloning.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory;
    else factory(root.IslandFavourites, root.document);
})(typeof self !== "undefined" ? self : this, function (F, doc) {
    "use strict";
    if (!F || !doc) return;

    function h(tag, cls, text) {
        var n = doc.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function link(href, text, cls) {
        var a = h("a", cls, text);
        a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
        return a;
    }
    function host(name) { return doc.querySelector('[data-fav-host="' + name + '"]'); }

    function factList(facts) {
        var ul = h("ul", "fav-facts");
        facts.forEach(function (f) {
            var li = h("li", null, f.fact + " ");
            li.append(link(f.source, "source", "fav-src"));
            ul.append(li);
        });
        return ul;
    }

    function bookCard(b) {
        var li = h("li", "fav-book");
        li.style.setProperty("--spine", b.spine);
        var art = h("div", "fav-cover" + (b.cover ? "" : " no-cover"));
        var spine = h("span", "fav-spine", b.title);
        spine.setAttribute("aria-hidden", "true");
        art.append(spine);
        if (b.cover) {
            var img = h("img", "fav-cover-img");
            img.src = b.cover.url; img.alt = "Cover of " + b.title; img.loading = "lazy";
            img.width = 60; img.height = 90; img.referrerPolicy = "no-referrer";
            art.append(img);
        }
        var body = h("div", "fav-book-body");
        body.append(h("h3", null, b.title), h("p", "fav-author", b.author));
        var bar = h("div", "fav-bar");
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", String(F.percent(b.progress)));
        bar.setAttribute("aria-label", "Reading progress for " + b.title);
        var fill = h("span", "fav-bar-fill");
        fill.style.width = F.percent(b.progress) + "%";
        bar.append(fill);
        body.append(bar, h("p", "fav-label", F.progressText(b)), factList(b.facts));
        if (b.image) {
            var fig = h("figure", "fav-pd");
            var im = h("img"); im.src = b.image.src; im.alt = b.image.alt; im.width = 40; im.loading = "lazy";
            var cap = h("figcaption", null, b.image.credit + ". " + b.image.license + ", ");
            cap.append(link(b.image.source, "Wikimedia Commons"));
            fig.append(im, cap);
            body.append(fig);
        }
        var credit = h("p", "fav-credit");
        if (b.cover) { credit.append("Cover: "); credit.append(link(b.cover.page, "Open Library")); }
        else credit.textContent = "No free cover found; spine drawn.";
        body.append(credit);
        li.append(art, body);
        return li;
    }

    function filmStub(f) {
        var li = h("li", "fav-stub");
        li.style.setProperty("--stub", f.stub);
        var top = h("div", "fav-stub-top");
        top.append(h("span", "fav-admit", "Admit one · " + f.year), h("h3", null, f.title), h("p", "fav-credit-line", f.credit));
        var tear = h("div", "fav-stub-tear");
        tear.setAttribute("aria-hidden", "true");
        var body = h("div", "fav-stub-body");
        body.append(factList(f.facts));
        if (f.ambiguity) body.append(h("p", "fav-note", "Note: " + f.ambiguity));
        body.append(link(f.link, f.linkLabel + " \u2192", "fav-official"));
        li.append(top, tear, body);
        return li;
    }

    function render() {
        var r = host("reading"), p = host("pictures"), ix = doc.getElementById("index-favourites");
        if (r) {
            var shelf = h("ul", "fav-shelf");
            shelf.setAttribute("aria-label", "Books on the shelf");
            F.BOOKS.forEach(function (b) { shelf.append(bookCard(b)); });
            r.replaceChildren(shelf);
        }
        if (p) {
            var wall = h("ul", "fav-wall");
            wall.setAttribute("aria-label", "Film ticket stubs");
            F.FILMS.forEach(function (f) { wall.append(filmStub(f)); });
            p.replaceChildren(wall);
        }
        if (ix) {
            ix.replaceChildren();
            F.BOOKS.forEach(function (b) {
                var li = h("li", "fav-ix");
                li.append(h("span", "fav-ix-kind", "Book"), h("b", null, b.title), h("small", null, b.author + " · " + F.progressText(b)));
                ix.append(li);
            });
            F.FILMS.forEach(function (f) {
                var li = h("li", "fav-ix");
                li.append(h("span", "fav-ix-kind", "Film"), h("b", null, f.title + " (" + f.year + ")"), h("small", null, f.credit));
                ix.append(li);
            });
        }
    }

    // A cover that fails to load (offline, 404) falls back to the drawn spine. Capture-phase on the
    // document so it also covers the copies the game clones into dialogs.
    doc.addEventListener("error", function (e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains("fav-cover-img")) {
            if (t.parentNode) t.parentNode.classList.add("no-cover");
            t.remove();
        }
    }, true);

    render(); // the codex and Index markup sit above the scripts, so they already exist
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", render);
    return { render: render };
});
