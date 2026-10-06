/*
 * Words and facts for the island. Everything here is true to the portfolio content in index.html;
 * the full cards (roles, projects, pull requests) live in the page itself and are cloned into dialogs.
 * Plain data, no DOM, so it loads in the browser (window.IslandLore) and under `node --test`.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.IslandLore = factory();
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    /* The ten places. `kind` picks the building painter; `roof` is the colour family. */
    var SPOTS = {
        profile: { building: "Lighthouse", title: "Profile", kicker: "The lighthouse", kind: "lighthouse", roof: "coral", teaser: "the short version" },
        independent: { building: "Workshop", title: "Independent engineering", kicker: "The workshop", kind: "workshop", roof: "teal", teaser: "two upstream pull requests, two very different endings" },
        accenture: { building: "Tower", title: "Accenture", kicker: "The tower", kind: "tower", roof: "blue", teaser: "an ETL script and 50 hours a month" },
        "better-auth": { building: "Post Office", title: "better-auth", kicker: "The post office", kind: "post", roof: "pink", teaser: "a sign-in error that gave away who has an account" },
        "go-ethereum": { building: "Ice House", title: "go-ethereum", kicker: "The ice house", kind: "ice", roof: "ice", teaser: "binary-searching the merge block" },
        unmaze: { building: "Lab", title: "unmaze", kicker: "The lab", kind: "lab", roof: "violet", teaser: "noise in, path out" },
        bingo: { building: "Cinema", title: "Bingo", kicker: "The cinema", kind: "cinema", roof: "yellow", teaser: "5,000 films, four ways to search them" },
        school: { building: "School", title: "Education", kicker: "The school", kind: "school", roof: "brick", teaser: "two computer science degrees" },
        library: { building: "Library", title: "Résumés & links", kicker: "The library", kind: "library", roof: "green", teaser: "four PDFs and the usual profiles" },
        dock: { building: "Dock", title: "Contact", kicker: "The dock", kind: "dock", roof: "wood", teaser: "say hello" }
    };

    /* Buried details: small true facts, found by digging near the place they belong to. */
    var DETAILS = [
        { id: "unmaze-score", near: "unmaze", at: [-3, 1], title: "4,990 of 5,000", text: "Fresh 11×11 mazes the model had never seen, judged strictly with no repair step: 99.8% solved." },
        { id: "unmaze-weak", near: "unmaze", at: [4, 3], title: "Where it breaks", text: "On depth-first-search mazes it never trained on, it solves 66%. All 10 failures in the 5,000 were in the longest quarter of routes." },
        { id: "unmaze-cpu", near: "unmaze", at: [-1, 4], title: "A plain CPU", text: "2.7M parameters, 6,000 steps, about 50 minutes on 3 CPU threads." },
        { id: "bingo-fusion", near: "bingo", at: [-4, 2], title: "Fusion lost to BM25", text: "Plain hybrid fusion scored below BM25 alone. Only reranking beat it." },
        { id: "bingo-latency", near: "bingo", at: [3, 3], title: "3.4 s to 5 ms", text: "BM25 p95 latency, after rewriting it to score from precomputed term statistics." },
        { id: "bingo-eval", near: "bingo", at: [-2, 4], title: "Leaky queries dropped", text: "The 834-query eval drops any query that leaks the movie's title." },
        { id: "auth-cause", near: "better-auth", at: [3, 3], title: "The hash that threw", text: "The Have I Been Pwned plugin threw during the dummy-password hash, so an unregistered email with a compromised password got PASSWORD_COMPROMISED instead of the generic error." },
        { id: "geth-memory", near: "go-ethereum", at: [-3, 2], title: "About 15 GB", text: "Review pushed the command to batch-process instead of holding roughly 15 GB in memory on mainnet." },
        { id: "geth-reviewers", near: "go-ethereum", at: [4, 3], title: "Three review rounds", text: "Core maintainers s1na, jwasinger and MariusVanDerWijden reviewed it. The core team later built its own version." },
        { id: "accenture-etl", near: "accenture", at: [4, 1], title: "50 hours a month", text: "The Python ETL script automated data-processing workflows and reduced processing errors." },
        { id: "profile-stack", near: "profile", at: [-4, 2], title: "Three languages", text: "Python, Go, and TypeScript." },
        { id: "school-degrees", near: "school", at: [-3, 2], title: "Two CS degrees", text: "BS at BV Raju Institute of Technology (2017–21), MS at the University of Alabama at Birmingham (2023–25)." },
        { id: "library-four", near: "library", at: [3, 2], title: "Four résumés", text: "General, backend, full-stack, and product engineer. Take the one closest to the job." },
        { id: "dock-hours", near: "dock", at: [-4, -2], title: "Remote, in IST", text: "Open to remote full-time or contract work, on UTC+5:30." },
        { id: "egg-wilson", near: "unmaze", abs: [40, 10], title: "Wilson built this hedge", text: "The maze next to the lab is generated with Wilson's algorithm, the same one unmaze uses. Every visit grows the same hedge." },
        { id: "egg-chest", near: null, title: "The maze's heart", text: "", special: "chest" },
        { id: "egg-button", near: null, title: "The refusal button", text: "I measure whether a model is actually right, and refuse to act when it is not.", special: "button" }
    ];

    /* Calibrated signposts: they say how sure they are, and refuse to point when they are not. */
    var SIGNS = [
        { id: "sign-north", speaker: "Signpost", text: "North: the lighthouse, the workshop, the tower and the library. Confidence: 94%." },
        { id: "sign-south", speaker: "Signpost", text: "South: the lab, a suspiciously large hedge, and the cinema. Confidence: 88%." },
        { id: "sign-dock", speaker: "Signpost", text: "The dock is somewhere south. Confidence: 41%. I refuse to point." }
    ];

    var CAT_LINES = [
        "mrrp. (Confidence: 100%.)",
        "The cat is not a model. The cat is always right.",
        "The cat knows where the details are buried. The cat will not say.",
        "The cat has measured the sun spot by the plaza. It is warm. Accuracy: excellent.",
        "…"
    ];

    var OWL_LINES = [
        "I am the judge. One simple path, or nothing. I run no repair step.",
        "The hedge maze to the east has a heart. Walk to it, and I will grade your trail.",
        "Dead ends are stray blobs. I count them. I do not forgive them."
    ];

    var BUTTON_LINES = [
        "Nothing happens. The button's confidence is 31%, below its threshold, so it refuses to act.",
        "Still refusing. The button would like better evidence.",
        "The button considers its position."
    ];

    var INTRO = {
        title: "Srinivas Sivaratri",
        tagline: "I measure whether a model is actually right, and refuse to act when it is not.",
        steps: [
            "Walk around the island. Arrow keys or WASD, or the d-pad on a phone.",
            "Press E, Space or the A button to open buildings, talk to things, and dig.",
            "Sparkling dirt hides a detail. Buildings hold the full story."
        ]
    };

    return { SPOTS: SPOTS, DETAILS: DETAILS, SIGNS: SIGNS, CAT_LINES: CAT_LINES, OWL_LINES: OWL_LINES, BUTTON_LINES: BUTTON_LINES, INTRO: INTRO };
});
