// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Lore = require("../js/lore.js");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("the title and headline use the role's own words", () => {
    assert.match(html, /<title>Srinivas Sivaratri \| AI engineer \(LLM tools and evals\)<\/title>/);
    assert.match(html, /<p class="role-line">AI engineer · I build LLM tools and the evals that check them<\/p>/);
});

test("the work comes first: Index order and the intro's primary button", () => {
    assert.deepEqual(Object.keys(Lore.SPOTS).slice(0, 4), ["unmaze", "bingo", "better-auth", "go-ethereum"]);
    assert.match(html, /class="btn btn-lemon btn-big" id="btn-intro-index">See the work</);
    assert.ok(html.indexOf('id="projects"') < html.indexOf('id="profile"'));
});

test("the unmaze demo is linked from the intro and the Lab, with a clip on disk", () => {
    assert.ok(html.includes('href="https://sivaratrisrinivas.github.io/unmaze/"'));
    assert.match(html, /Watch it solve 30 mazes/);
    for (const f of ["assets/unmaze/unmaze-replay.mp4", "assets/unmaze/unmaze-replay-poster.jpg"]) {
        const size = fs.statSync(path.join(__dirname, "..", f)).size;
        assert.ok(size > 0 && size < 1.5 * 1024 * 1024, `${f} is light`);
    }
});

test("better-auth credit matches the GitHub record", () => {
    assert.ok(!html.includes("Maintainers adopted the approach"));
    assert.ok(!html.includes(">better-auth #5998<"));
    assert.match(html, /A maintainer closed it in favour of their own fix/);
});

test("contact line and copy rules", () => {
    assert.match(html, /<a href="mailto:srinivassivaratri1122@gmail.com">Email me<\/a>, I reply within a day\./);
    assert.ok(!html.includes("Say hi"));
    assert.ok(!html.includes("\u2014"), "no em dashes");
    assert.ok(!/href="[^"]*\/game\b/.test(html), "no /game route");
    assert.ok(!/peft/i.test(html), "no peft");
});
