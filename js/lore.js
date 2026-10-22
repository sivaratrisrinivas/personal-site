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

    /* The nine places. `kind` picks the building painter; `roof` is the colour family. */
    var SPOTS = {
        profile: { building: "Lighthouse", title: "Profile", kicker: "The lighthouse", kind: "lighthouse", roof: "coral", teaser: "the short version, and education" },
        experience: { building: "Workshop", title: "Experience", kicker: "The workshop", kind: "workshop", roof: "teal", teaser: "independent engineering and Accenture" },
        "better-auth": { building: "Post Office", title: "better-auth", kicker: "The post office", kind: "post", roof: "pink", teaser: "a sign-in error that gave away who has an account" },
        "go-ethereum": { building: "Ice House", title: "go-ethereum", kicker: "The ice house", kind: "ice", roof: "ice", teaser: "binary-searching the merge block" },
        unmaze: { building: "Lab", title: "unmaze", kicker: "The lab", kind: "lab", roof: "violet", teaser: "noise in, path out" },
        bingo: { building: "Cinema", title: "Bingo", kicker: "The cinema", kind: "cinema", roof: "yellow", teaser: "5,000 films, four ways to search them" },
        reading: { building: "Reading Room", title: "Reading Room", kicker: "Favourites, 2026 · books", kind: "readingroom", roof: "teal", teaser: "three books" },
        pictures: { building: "Picture House", title: "Picture House", kicker: "Favourites, 2026 · films", kind: "picturehouse", roof: "coral", teaser: "four films" },
        dock: { building: "Dock", title: "Contact", kicker: "The dock", kind: "dock", roof: "wood", teaser: "email and profiles" }
    };

    /* Three hidden details: one buried, one in the maze, one behind a fence. */
    var DETAILS = [
        { id: "egg-wilson", near: null, abs: [40, 10], title: "Wilson built this hedge", text: "The maze next to the lab is generated with Wilson's algorithm, the same one unmaze uses. Every visit grows the same hedge." },
        { id: "egg-chest", near: null, title: "The maze's heart", text: "", special: "chest" },
        { id: "egg-button", near: null, title: "The refusal button", text: "Three presses, and it still did not act: its confidence never cleared the threshold.", special: "button" }
    ];

    /* Signposts: plain directions. */
    var SIGNS = [
        { id: "sign-north", speaker: "Signpost", text: "North: the Lighthouse (Profile), the Workshop (Experience), the Reading Room and the Picture House." },
        { id: "sign-east", speaker: "Signpost", text: "East: the Cinema (Bingo). South: the hedge maze." },
        { id: "sign-dock", speaker: "Signpost", text: "South: the Dock (Contact). West: the Lab (unmaze), the Ice House (go-ethereum) and the Post Office (better-auth)." }
    ];

    var OWL_LINES = [
        "I am the judge. One simple path, or nothing. I run no repair step.",
        "The hedge maze has a heart. Walk to it, and I will grade your trail."
    ];

    /* The one joke on the island. */
    var BUTTON_LINES = [
        "Nothing happens. The button's confidence is 31%, below its threshold, so it refuses to act.",
        "Still refusing. The button would like better evidence.",
        "The button considers its position."
    ];

    var INTRO = {
        steps: [
            "Walk around the island. Arrow keys or WASD, or the d-pad on a phone.",
            "Press E, Space or the A button to open buildings, talk to things, and dig.",
            "Sparkling dirt hides a detail. Buildings hold the full story."
        ]
    };

    return { SPOTS: SPOTS, DETAILS: DETAILS, SIGNS: SIGNS, OWL_LINES: OWL_LINES, BUTTON_LINES: BUTTON_LINES, INTRO: INTRO };
});
