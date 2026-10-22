"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const F = require("../js/favourites.js");
const L = require("../js/lore.js");
const IW = require("../js/world.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "island.html"), "utf8");
const isUrl = (u) => /^https:\/\/[^\s]+$/.test(u);

test("books carry title, author, progress in [0,1], label and sourced facts", () => {
    assert.strictEqual(F.BOOKS.length, 3);
    F.BOOKS.forEach((b) => {
        assert.ok(b.title && b.author && b.label, b.id);
        assert.ok(b.progress >= 0 && b.progress <= 1, b.id);
        assert.ok(b.facts.length >= 1 && b.facts.length <= 2, b.id);
        b.facts.forEach((f) => { assert.ok(f.fact.length > 10); assert.ok(isUrl(f.source), f.source); });
        if (b.cover) assert.match(b.cover.url, /^https:\/\/covers\.openlibrary\.org\//);
    });
});

test("films carry a year, sourced facts and an outbound link; no poster images", () => {
    assert.strictEqual(F.FILMS.length, 4);
    F.FILMS.forEach((f) => {
        assert.strictEqual(f.year, 2026);
        assert.ok(isUrl(f.link));
        assert.ok(f.facts.length >= 1 && f.facts.length <= 2);
        f.facts.forEach((x) => assert.ok(isUrl(x.source)));
        assert.ok(!("poster" in f) && !("image" in f), f.id + " must not ship a poster");
    });
});

test("stored images exist on disk with a licence and attribution", () => {
    F.BOOKS.filter((b) => b.image).forEach((b) => {
        assert.ok(fs.existsSync(path.join(root, b.image.src)), b.image.src);
        assert.ok(b.image.license && b.image.credit && isUrl(b.image.source));
    });
    const dir = path.join(root, "assets/favourites");
    const listed = new Set(F.BOOKS.filter((b) => b.image).map((b) => path.basename(b.image.src)));
    fs.readdirSync(dir).forEach((f) => assert.ok(listed.has(f), "unlisted asset " + f));
});

test("Reading Room and Picture House are places with buildings, codex hosts and reachable doors", () => {
    ["reading", "pictures"].forEach((id) => {
        assert.ok(L.SPOTS[id], id);
        assert.ok(html.includes('data-spot="' + id + '"'), "codex section " + id);
        assert.ok(html.includes('data-fav-host="' + id + '"'), "render host " + id);
    });
    const w = IW.build();
    assert.ok(w.buildings.find((b) => b.id === "reading" && b.kind === "readingroom"));
    assert.ok(w.buildings.find((b) => b.id === "pictures" && b.kind === "picturehouse"));
    assert.ok(html.includes('id="index-favourites"'));
    assert.ok(html.indexOf("js/favourites-view.js") < html.indexOf("js/game.js"), "view loads before game");
    assert.ok(html.includes("0/" + Object.keys(L.SPOTS).length), "places chip total");
});

test("progress text marks approximate values", () => {
    assert.strictEqual(F.progressText(F.BOOKS[0]), "50% · Halfway");
    assert.match(F.progressText(F.BOOKS[2]), /^about 20%/);
});
