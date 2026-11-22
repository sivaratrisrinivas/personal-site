// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Lore = require("../js/lore.js");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const home = read("index.html");
const play = read("play/index.html");
const changed = ["index.html", "play/index.html", "css/home.css", "js/home.js", "js/lore.js", "js/favourites.js"];

test("home: the title and headline use the role's own words", () => {
    assert.match(home, /<title>Srinivas Sivaratri \| AI engineer \(LLM tools and evals\)<\/title>/);
    assert.match(home, /<p class="role">AI engineer · I build LLM tools and the evals that check them<\/p>/);
    assert.match(home, /I set the pass bar before I see the results, and I publish the misses\./);
    assert.equal((home.match(/<h1[\s>]/g) || []).length, 1, "one h1");
});

test("home: first screen has the ask, Email me and Résumé, and no game", () => {
    const intro = home.slice(home.indexOf('class="intro"'), home.indexOf('id="work"'));
    assert.match(intro, /<strong>Looking for<\/strong>: AI engineer roles at early-stage teams/);
    assert.match(intro, /class="btn btn-primary" href="mailto:srinivassivaratri1122@gmail.com">Email me</);
    assert.match(intro, />Résumé</);
    assert.ok(!home.includes("<canvas"), "no game canvas on home");
    assert.match(home, /href="play\/">Play</);
});

test("home: work comes first, Unmaze leads with its clip and demo link", () => {
    const order = ["id=\"work\"", "id=\"open-source\"", "id=\"about\"", "id=\"library\"", "id=\"contact\""].map((s) => home.indexOf(s));
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    const cards = [...home.matchAll(/<article class="card" id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(cards, ["unmaze", "film-finder", "bingo"]);
    assert.match(home, /<video data-loop muted loop playsinline[^>]*aria-label="The unmaze model starts from noise and sharpens into the one path through an 11x11 maze\."/);
    assert.match(home, /href="https:\/\/sivaratrisrinivas.github.io\/unmaze\/"[^>]*>Watch it solve 30 mazes</);
    for (const f of ["assets/unmaze/unmaze-replay.mp4", "assets/unmaze/unmaze-replay-poster.jpg"]) {
        const size = fs.statSync(path.join(root, f)).size;
        assert.ok(size > 0 && size < 1.5 * 1024 * 1024, `${f} is light`);
    }
});

test("home: Library holds the 2026 shelf from favourites.js", () => {
    assert.match(home, /id="library"/);
    assert.match(home, /data-lib="books"/);
    assert.match(home, /data-lib="films"/);
    assert.ok(home.indexOf("js/favourites.js") < home.indexOf("js/home.js"));
});

test("play: the island moved to /play and still loads everything", () => {
    assert.match(play, /<canvas id="world"/);
    for (const s of ["maze", "lore", "world", "art", "favourites", "favourites-view", "game"]) {
        assert.ok(play.includes(`src="../js/${s}.js"`), s);
    }
    assert.match(play, /href="\.\.\/css\/style.css"/);
    assert.match(play, /class="brand" href="\.\.\/"/);
    assert.deepEqual(Object.keys(Lore.SPOTS).slice(0, 4), ["unmaze", "bingo", "better-auth", "go-ethereum"]);
    assert.match(play, /id="btn-intro-index">See the work</);
});

for (const [name, html] of [["home", home], ["play", play]]) {
    test(`${name}: better-auth credit matches the GitHub record`, () => {
        assert.ok(!html.includes("Maintainers adopted the approach"));
        assert.match(html, /A maintainer closed it in favour of their own fix/);
        assert.match(html, /My PR #5973/);
        assert.match(html, /Maintainer's fix #5998/);
    });
    test(`${name}: contact line and Film Finder wording`, () => {
        assert.match(html, /<a href="mailto:srinivassivaratri1122@gmail.com">Email me<\/a>, I reply within a day\./);
        assert.ok(!html.includes("Say hi"));
        assert.ok(!/live Telegram bot/i.test(html));
        assert.ok(!html.includes("Try the bot"));
        assert.match(html, /Cerebras x Kimi hackathon · Telegram bot</);
        for (const n of ["#7561", "#1475", "#1517", "#10700", "#10702", "#10704"]) assert.ok(html.includes(n), n);
    });
}

test("copy rules across the changed files", () => {
    for (const f of changed) {
        const s = read(f);
        assert.ok(!s.includes("\u2014"), `${f}: no em dashes`);
        assert.ok(!/peft/i.test(s), `${f}: no peft`);
        assert.ok(!/href="[^"]*\/game\b/.test(s), `${f}: no /game route`);
    }
    assert.ok(!fs.existsSync(path.join(root, "game")), "no /game directory");
});
