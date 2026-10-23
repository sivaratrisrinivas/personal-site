/*
 * Words and facts for the strip. Everything here is true to the portfolio content in index.html;
 * the full cards (roles, projects, pull requests) live in the page itself and are cloned into dialogs.
 * Plain data, no DOM, so it loads in the browser (window.IslandLore) and under `node --test`.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.IslandLore = factory();
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    /* The nine places, dressed as a sunset strip. `kind` picks the building painter; `roof` is the colour family. */
    var SPOTS = {
        profile: { building: "Beach House", title: "Profile", kicker: "The Malibu beach house", kind: "beachhouse", roof: "coral", teaser: "the short version, and education" },
        experience: { building: "Studio Lot", title: "Experience", kicker: "The studio lot", kind: "studio", roof: "yellow", teaser: "independent engineering and Accenture" },
        "better-auth": { building: "Deal Office", title: "better-auth", kicker: "A deal office · open source", kind: "deal", roof: "pink", teaser: "a sign-in error that gave away who has an account" },
        "go-ethereum": { building: "Tower Office", title: "go-ethereum", kicker: "A deal office · open source", kind: "deal2", roof: "blue", teaser: "binary-searching the merge block" },
        unmaze: { building: "Palm Theatre", title: "unmaze", kicker: "Premiere · the Palm Theatre", kind: "premiere", roof: "violet", teaser: "noise in, path out" },
        bingo: { building: "Grand Marquee", title: "Bingo", kicker: "Premiere · the Grand Marquee", kind: "marquee", roof: "yellow", teaser: "5,000 films, four ways to search them" },
        reading: { building: "Screening Room", title: "Reading Room", kicker: "Favourites, 2026 · books · the screening room", kind: "screening", roof: "teal", teaser: "three books" },
        pictures: { building: "Pool Party", title: "Picture House", kicker: "Favourites, 2026 · films · poolside", kind: "poolparty", roof: "coral", teaser: "four films" },
        dock: { building: "Agent's Office", title: "Contact", kicker: "The agent's office, end of the pier", kind: "dock", roof: "wood", teaser: "email and profiles" }
    };

    /* Three hidden details: one buried, one in the maze, one behind a fence. */
    var DETAILS = [
        { id: "egg-wilson", near: null, abs: [40, 10], title: "Wilson built this hedge", text: "The hedge maze by the Palm Theatre is generated with Wilson's algorithm, the same one unmaze uses. Every visit grows the same hedge." },
        { id: "egg-chest", near: null, title: "The maze's heart", text: "", special: "chest" },
        { id: "egg-button", near: null, title: "The refusal button", text: "Three presses, and it still did not act: its confidence never cleared the threshold.", special: "button" }
    ];

    /* Street signs: plain directions. */
    var SIGNS = [
        { id: "sign-north", speaker: "Street sign", text: "North: the Beach House (Profile), the Studio Lot (Experience), the Screening Room (books) and the Pool Party (films)." },
        { id: "sign-east", speaker: "Street sign", text: "East: the Grand Marquee premiere (Bingo). South: the hedge maze." },
        { id: "sign-dock", speaker: "Street sign", text: "South: the pier and the Agent's Office (Contact). West: the Palm Theatre premiere (unmaze) and the deal offices (go-ethereum, better-auth)." }
    ];

    var OWL_LINES = [
        "I am the critic. One simple path, or nothing. I run no repair step.",
        "The hedge maze has a heart. Walk to it, and I will review your trail."
    ];

    /* The one joke on the strip. */
    var BUTTON_LINES = [
        "Nothing happens. The button's confidence is 31%, below its threshold, so it refuses to act.",
        "Still refusing. The button would like better evidence.",
        "The button considers its position."
    ];

    var INTRO = {
        steps: [
            "Cruise the strip. Arrow keys or WASD, or the d-pad on a phone. Your crew rides along.",
            "Press E, Space or the A button to open places, talk to things, and dig.",
            "Sparkling dirt hides a detail. Every place holds the real story."
        ]
    };

    /* The crew: original characters who tag along. Pure flavour; lines only repeat facts from the page. */
    var CREW = [
        { id: "manager", name: "Kiran", role: "the manager", shirt: "#2dc4b6", shirtDark: "#1c9a8f", hair: "#2a1a4a", skin: "#c98b5e" },
        { id: "brother", name: "Raju", role: "the big brother", shirt: "#ff9f43", shirtDark: "#e07a1f", hair: "#1d1b3a", skin: "#b9784d" },
        { id: "driver", name: "Benny", role: "the driver", shirt: "#4d8dff", shirtDark: "#3269d6", hair: "#5a3a1a", skin: "#e8b48a", cap: true },
        { id: "agent", name: "Goldie", role: "the agent, always on the phone", shirt: "#1d1b3a", shirtDark: "#0b0a26", hair: "#8a8fa8", skin: "#f0c8a0", phone: true }
    ];

    var CREW_LINES = {
        profile: [["manager", "Ocean view, MS in Computer Science from UAB on the wall. We're doing fine."], ["brother", "Remote, full-time or contract. Tell them IST is a feature."]],
        experience: [["driver", "Studio lot. Accenture 2021 to 2022, independent since May 2025."], ["agent", "One Python ETL script, 50 labor hours a month saved. Put that on the poster."]],
        "better-auth": [["agent", "They adopted the approach and shipped it in #5998. That's a signed deal."], ["manager", "The proposal was #5973. Always read the fine print."]],
        "go-ethereum": [["agent", "Three rounds of notes from core maintainers. That's a real meeting."], ["brother", "They built their own version in the end. Still counts as a meeting."]],
        unmaze: [["brother", "4,990 of 5,000 unseen mazes. Roll the carpet."], ["manager", "And 66% on maze styles it never trained on. We say that part too."]],
        bingo: [["driver", "834 test queries. Reranked, the target is in the top ten 0.916 of the time."], ["agent", "BM25 p95 from 3.4 seconds to 5 milliseconds. Book it."]],
        reading: [["manager", "Three books tonight. Quiet screening, phones off."]],
        pictures: [["brother", "Four films and a pool. Best party on the strip."]],
        dock: [["agent", "Want a meeting? Email is the fastest line in."]]
    };

    /* Headlines in "the trades": every word restates a fact from the codex. */
    var TRADES = {
        "better-auth": "SIGN-IN FIX CLOSES: better-auth maintainers adopt Sivaratri's approach, ship it in #5998",
        "go-ethereum": "ARCHIVE-NODE PITCH GOES THREE ROUNDS: geth core reviews truncate-freezer, builds its own version",
        unmaze: "UNMAZE OPENS: 4,990 of 5,000 unseen mazes solved (99.8%), 2.7M-parameter U-Net, trained on a CPU",
        bingo: "BINGO RERANKED: 0.916 top-10 on 834 known-item queries, BM25 p95 down from 3.4 s to 5 ms"
    };

    return { SPOTS: SPOTS, DETAILS: DETAILS, SIGNS: SIGNS, OWL_LINES: OWL_LINES, BUTTON_LINES: BUTTON_LINES, INTRO: INTRO, CREW: CREW, CREW_LINES: CREW_LINES, TRADES: TRADES };
});
