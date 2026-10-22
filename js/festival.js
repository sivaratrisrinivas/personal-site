/* Renders Audience picks + Reading list from js/favourites.js (single source of truth). */
(function () {
  "use strict";
  var F = window.IslandFavourites; if (!F) return;
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function facts(list) {
    var ul = el("ul", "facts");
    list.forEach(function (f) { var li = el("li", null, f.fact + " "); var a = el("a", null, "Source"); a.href = f.source; li.appendChild(a); ul.appendChild(li); });
    return ul;
  }
  var films = document.getElementById("films"); films.textContent = "";
  F.FILMS.forEach(function (f, i) {
    var t = el("article", "ticket"); t.style.setProperty("--stub", f.stub);
    var main = el("div", "ticket-main");
    main.appendChild(el("p", "kicker", "Audience pick No. " + (i + 1)));
    main.appendChild(el("h3", null, f.title));
    main.appendChild(el("p", "meta", f.year + " · " + f.credit));
    main.appendChild(facts(f.facts));
    var a = el("a", null, f.linkLabel + " →"); a.href = f.link; main.appendChild(a);
    var stub = el("div", "ticket-stub"); stub.setAttribute("aria-hidden", "true");
    stub.appendChild(el("span", null, "ADMIT")); stub.appendChild(el("b", null, String(i + 1).padStart(2, "0")));
    t.appendChild(main); t.appendChild(stub); films.appendChild(t);
  });
  var books = document.getElementById("books"); books.textContent = "";
  F.BOOKS.forEach(function (b) {
    var card = el("article", "book");
    var fig = el("div", "cover-img"); fig.style.setProperty("--spine", b.spine);
    if (b.cover) {
      var img = new Image(); img.src = b.cover.url; img.alt = "Cover of " + b.title + " (Open Library)"; img.width = 120; img.height = 180;
      img.onerror = function () { img.remove(); fig.appendChild(el("span", "spine", b.title)); };
      fig.appendChild(img);
    } else fig.appendChild(el("span", "spine", b.title));
    var body = el("div");
    body.appendChild(el("h3", null, b.title));
    body.appendChild(el("p", "meta", b.author));
    var bar = el("div", "bar"); bar.setAttribute("role", "img"); bar.setAttribute("aria-label", "Reading progress: " + F.progressText(b));
    var fill = el("span"); fill.style.width = F.percent(b.progress) + "%"; bar.appendChild(fill);
    body.appendChild(bar); body.appendChild(el("p", "meta", "Bookmark: " + F.progressText(b)));
    body.appendChild(facts(b.facts));
    if (b.cover && b.cover.page) { var a = el("a", null, "Open Library →"); a.href = b.cover.page; body.appendChild(a); }
    card.appendChild(fig); card.appendChild(body); books.appendChild(card);
  });
})();
