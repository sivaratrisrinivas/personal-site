/*
 * Favourites, 2026: the single source of truth for the Reading Room (books) and the Picture House
 * (films). Every `fact` is paired with the `source` URL it was checked against; nothing is invented.
 * Plain data, no DOM: loads in the browser (window.IslandFavourites) and under `node --test`.
 *
 * Images: book covers are hotlinked from the Open Library Covers API (falls back to a drawn spine);
 * one public-domain Commons scan is stored locally with its licence. Film posters are NOT stored or
 * hotlinked (they are non-free); films are drawn as ticket stubs that link to an official/info page.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.IslandFavourites = factory();
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var YEAR = 2026;

    var BOOKS = [
        {
            id: "crime-and-punishment", title: "Crime and Punishment", author: "Fyodor Dostoevsky",
            progress: 0.5, approximate: false, label: "Halfway", spine: "#c8553d",
            cover: { kind: "openlibrary", url: "https://covers.openlibrary.org/b/id/15183762-M.jpg", page: "https://openlibrary.org/works/OL45018229W" },
            image: {
                src: "assets/favourites/crime-and-punishment-1867.jpg",
                alt: "Title page of the 1867 first separate edition of Crime and Punishment",
                credit: "First separate edition, St Petersburg, 1867 (publishers A. Bazunov, E. Prats, Ya. Veidenshtraukh)",
                license: "Public domain",
                source: "https://commons.wikimedia.org/wiki/File:Cover_of_the_first_edition_of_Crime_and_Punishment.jpg"
            },
            facts: [
                { fact: "It first ran as a serial: twelve monthly instalments in the journal The Russian Messenger during 1866, before the one-volume edition of 1867.", source: "https://en.wikipedia.org/wiki/Crime_and_Punishment" },
                { fact: "The Russian word for \u201ccrime\u201d in the title, prestupleniye, literally means \u201ca stepping across\u201d.", source: "https://en.wikipedia.org/wiki/Crime_and_Punishment" }
            ]
        },
        {
            id: "outsmart-everyone", title: "Outsmart Everyone", author: "Andrew Bustamante",
            progress: 0.05, approximate: true, label: "Just started", spine: "#3269d6",
            cover: null, // not in Open Library yet (checked ISBN 9780316572170): drawn spine only
            facts: [
                { fact: "Published 8 September 2026 by Little, Brown Spark (272 pages).", source: "https://www.hbgacademic.com/titles/andrew-bustamante/outsmart-everyone/9780316572170/" },
                { fact: "The author spent seven years undercover in the CIA's National Clandestine Service, after an Air Force career in nuclear ICBM operations.", source: "https://www.hbgacademic.com/titles/andrew-bustamante/outsmart-everyone/9780316572170/" }
            ]
        },
        {
            id: "creative-confidence", title: "Creative Confidence", author: "Tom Kelley & David Kelley",
            progress: 0.2, approximate: true, label: "Chapter 3", spine: "#e0a01f",
            cover: { kind: "openlibrary", url: "https://covers.openlibrary.org/b/id/10534005-M.jpg", page: "https://openlibrary.org/works/OL16814100W" },
            facts: [
                { fact: "The authors are brothers. David Kelley founded IDEO, whose work includes the first mouse for Apple, and led the creation of Stanford's d.school.", source: "https://www.creativeconfidence.com/authors/" },
                { fact: "Tom Kelley helped IDEO grow from 15 designers to more than 600 people.", source: "https://www.creativeconfidence.com/authors/" }
            ]
        }
    ];

    var FILMS = [
        {
            id: "dorothy", title: "Dorothy", year: 2026, credit: "Karthik Subbaraj · Tamil", stub: "#ff7ac8",
            identified: "Dorothy (2026), the Tamil crime drama by Karthik Subbaraj with Keerthy Suresh.",
            ambiguity: "Title only was given; chosen as the 2026 release with that exact title. No other notable 2026 film called Dorothy was found.",
            link: "https://en.wikipedia.org/wiki/Dorothy_(film)", linkLabel: "About the film",
            facts: [
                { fact: "It premiered at TIFF 2026 in the Centrepiece section, the first Tamil feature to premiere there in a decade.", source: "https://www.thehindu.com/entertainment/movies/dorothy-karthik-subbarajs-film-gets-standing-ovation-during-world-premiere-at-tiff/article71459235.ece" },
                { fact: "Ilaiyaraaja's score is described as his 1,540th film composition.", source: "https://www.filmibeat.com/tamil/movies/dorothy/story.html" }
            ]
        },
        {
            id: "dhurandhar-the-revenge", title: "Dhurandhar: The Revenge", year: 2026, credit: "Aditya Dhar · Hindi", stub: "#ffcb3d",
            identified: "Dhurandhar: The Revenge (2026), Aditya Dhar's sequel to Dhurandhar (2025), released 19 March 2026.",
            ambiguity: null,
            link: "https://en.wikipedia.org/wiki/Dhurandhar:_The_Revenge", linkLabel: "About the film",
            facts: [
                { fact: "The censor-certified runtime was locked at three hours, forty-nine minutes and six seconds.", source: "https://www.indiatoday.in/movies/bollywood/story/dhurandhar-the-revenge-gets-a-certificate-run-time-revealed-2883335-2026-03-17" },
                { fact: "It was developed as the second and final instalment of the Dhurandhar duology.", source: "https://en.wikipedia.org/wiki/Dhurandhar:_The_Revenge" }
            ]
        },
        {
            id: "obsession", title: "Obsession", year: 2026, credit: "Curry Barker · Horror", stub: "#8e63ff",
            identified: "Obsession, Curry Barker's supernatural horror (Focus Features), released in cinemas 15 May 2026 (India 29 May).",
            ambiguity: "Festival premiere was in 2025 (Fantastic Fest, TIFF), so some databases list it as a 2025 film. Several older films share the title.",
            link: "https://www.focusfeatures.com/obsession", linkLabel: "Official page",
            facts: [
                { fact: "It was shot in Los Angeles in October 2024 on a $750,000 budget.", source: "https://en.wikipedia.org/wiki/Obsession_(2025_film)" },
                { fact: "Box Office Mojo lists a worldwide gross of about $523 million.", source: "https://www.boxofficemojo.com/title/tt37287335/" }
            ]
        },
        {
            id: "the-odyssey", title: "The Odyssey", year: 2026, credit: "Christopher Nolan · Epic", stub: "#2dc4b6",
            identified: "The Odyssey (2026), Christopher Nolan's adaptation of Homer, released 17 July 2026.",
            ambiguity: "Given as \u201cOdyssey\u201d; read as Nolan's The Odyssey, the 2026 film by far the most likely meant.",
            link: "https://www.universalpictures.com/movies/the-odyssey", linkLabel: "Official page",
            facts: [
                { fact: "It is the first feature film shot entirely on IMAX film cameras.", source: "https://en.wikipedia.org/wiki/The_Odyssey_(2026_film)" },
                { fact: "More than 2 million feet of IMAX 70 mm film was shot.", source: "https://en.wikipedia.org/wiki/The_Odyssey_(2026_film)" }
            ]
        }
    ];

    function percent(p) { return Math.round(Math.max(0, Math.min(1, p)) * 100); }
    function progressText(b) { return (b.approximate ? "about " : "") + percent(b.progress) + "% · " + b.label; }

    return { YEAR: YEAR, BOOKS: BOOKS, FILMS: FILMS, percent: percent, progressText: progressText };
});
