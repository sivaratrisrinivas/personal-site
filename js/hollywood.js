/*
 * The Hollywood strip skin: a golden-hour palette, palms, a boulevard, sunset hills with an
 * original sign, new building painters (beach house, studio lot, deal offices, premieres, a
 * screening room, a pool party), a convertible for the player and a small original crew.
 * It layers over js/art.js (window.IslandArt) without touching the engine. Browser only.
 */
(function (root) {
    "use strict";
    var A = root.IslandArt;
    if (!A) return;
    var T = A.T, C = A.C, rect = A.rect, dot = A.dot, disc = A.disc, ell = A.ell, line = A.line, hash = A.hash, shadow = A.shadow;

    /* ---------- golden-hour palette (mutated before the land is painted) ---------- */
    var P = {
        water: "#2f7fcf", waterLight: "#ffb36b", waterDeep: "#235fa8", foam: "#fff1dc", foamDim: "#ffd2b0",
        sand: "#f7d9a4", sandDark: "#eabf85", sandWet: "#d9a970",
        grass: "#86c04c", grassB: "#7eb845", grassDark: "#679f38", grassLight: "#b4dc6a",
        garden: "#a9d977", gardenDark: "#92c862",
        dirt: "#4b4660", dirtDark: "#2f2b42", dirtLight: "#615b7a",
        stone: "#f2c9a0", stoneDark: "#d99f78", stoneLight: "#ffe4c6",
        snow: "#fdf1df", snowDark: "#efd8b6"
    };
    Object.keys(P).forEach(function (k) { C[k] = P[k]; });
    C.pool = "#36c9e8"; C.poolDark = "#1e9cc4"; C.poolLight = "#a8f0ff";
    C.sunset = "#ff8a4c"; C.dusk = "#ff5f8f"; C.purple = "#7a4bb8";

    /* ---------- a tiny 3x5 font for signs and marquees ---------- */
    var F = {
        A: "010101111101101", B: "110101110101110", D: "110101101101110", E: "111100110100111", G: "011100101101011",
        I: "111010010010111", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
        P: "110101110100100", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111",
        V: "101101101101010", Z: "111001010100111", C: "011100100100011", K: "101101110101101", Y: "101101010010010",
        H: "101101111101101", W: "101101111111101", " ": "000000000000000", "7": "111001010010010", "'": "010010000000000"
    };
    function word(g, str, x, y, col, s) {
        s = s || 1;
        for (var i = 0; i < str.length; i++) {
            var m = F[str[i]] || F[" "];
            for (var k = 0; k < 15; k++) if (m[k] === "1") rect(g, x + i * 4 * s + (k % 3) * s, y + ((k / 3) | 0) * s, s, s, col);
        }
    }
    function wordW(str, s) { return str.length * 4 * (s || 1) - (s || 1); }

    /* ---------- sprites ---------- */
    function laPalm(v) {
        var h = 50 + (v % 3) * 4;
        return A.makeSprite(34, h + 4, 17, h + 2, function (g) {
            shadow(g, 17, h + 1, 8, 2);
            var lean = v % 2 ? 1 : -1;
            for (var y = 0; y < h - 10; y++) {
                var x = 16 + Math.round(lean * Math.pow(y / (h - 10), 2) * -3);
                rect(g, x, h - y, 3, 1, y % 4 === 0 ? C.woodDark : (y % 4 === 1 ? C.woodLight : C.wood));
            }
            var cx = 16 + lean * -3 + 1, cy = 11;
            var fronds = [[-14, 5], [-11, -3], [-5, -8], [3, -9], [10, -4], [14, 4], [7, 8], [-7, 8]];
            fronds.forEach(function (f, i) {
                var c1 = i % 2 ? "#3f9a4a" : "#2f7d3c";
                line(g, cx, cy, cx + f[0], cy + f[1], c1);
                line(g, cx, cy + 1, cx + f[0], cy + f[1] + 1, "#245f30");
                line(g, cx + f[0], cy + f[1], cx + f[0] + (f[0] > 0 ? 2 : -2), cy + f[1] + 3, "#245f30");
            });
            disc(g, cx, cy, 2, "#245f30");
            dot(g, cx - 1, cy + 3, "#ffb36b"); dot(g, cx + 2, cy + 2, "#ffb36b");
        });
    }
    function umbrella(v) {
        var cols = [["#ff5f8f", "#fff3d6"], ["#36c9e8", "#fff3d6"], ["#ffcb3d", "#ff8a4c"]][v % 3];
        return A.makeSprite(26, 28, 13, 26, function (g) {
            shadow(g, 13, 25, 9, 2);
            rect(g, 12, 8, 2, 18, C.cream);
            for (var r = 0; r < 7; r++) for (var x = -11 + r; x <= 11 - r; x++) {
                if (r === 0 || x === -11 + r || x === 11 - r || true) dot(g, 13 + x, 9 - r, ((x + 12) >> 2) % 2 ? cols[0] : cols[1]);
            }
            rect(g, 2, 9, 23, 1, "rgba(20,18,60,0.25)");
            rect(g, 4, 22, 8, 3, "#fff"); rect(g, 4, 22, 8, 1, cols[0]);
        });
    }
    function phoneBooth() {
        return A.makeSprite(16, 30, 8, 28, function (g) {
            shadow(g, 8, 27, 7, 2);
            rect(g, 2, 6, 12, 21, C.ink);
            rect(g, 3, 7, 10, 19, "#ff5f8f");
            rect(g, 4, 11, 8, 10, "#a8f0ff");
            rect(g, 7, 13, 2, 5, C.ink); rect(g, 6, 13, 4, 1, C.ink);
            rect(g, 2, 3, 12, 4, C.ink); word(g, "AG", 4, 2, "#ffcb3d");
            rect(g, 3, 7, 10, 2, "#ffcb3d");
        });
    }

    /* ---------- building painters ---------- */
    function win(g, x, y, w, h, L, o, glow) { A.windowAt(g, x, y, w, h, true, L, o[0], o[1], glow || "#ffd58a"); }
    function palmLite(g, x, y) {
        rect(g, x, y, 2, 14, C.wood); rect(g, x, y + 3, 2, 1, C.woodDark); rect(g, x, y + 8, 2, 1, C.woodDark);
        [[-6, 2], [-4, -3], [0, -5], [4, -3], [6, 2]].forEach(function (f) { line(g, x + 1, y, x + 1 + f[0], y + f[1], "#2f7d3c"); });
    }
    var P2 = A.PAINTERS;
    P2.beachhouse = function (g, b, L) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        // stilts and sand deck
        for (var s = 0; s < 4; s++) rect(g, o[0] + 4 + s * 13, o[1] + H - 16, 2, 16, C.woodDark);
        rect(g, o[0], o[1] + H - 18, W, 3, C.woodLight);
        for (var r = 0; r < W; r += 4) rect(g, o[0] + r, o[1] + H - 22, 1, 4, "#fff");
        rect(g, o[0], o[1] + H - 22, W, 1, "#fff");
        // lower floor: wide glass
        rect(g, o[0] + 2, o[1] + 34, W - 4, 24, "#fff7ea");
        rect(g, o[0] + 2, o[1] + 56, W - 4, 2, "#e8d5b8");
        win(g, o[0] + 6, o[1] + 38, 36, 14, L, o, "#ffcf8a");
        // upper floor, cantilevered
        rect(g, o[0] - 2, o[1] + 10, W + 4, 22, "#ffffff");
        rect(g, o[0] - 2, o[1] + 30, W + 4, 3, "#e8d5b8");
        win(g, o[0] + 3, o[1] + 14, 18, 12, L, o, "#ffb36b");
        win(g, o[0] + 27, o[1] + 14, 18, 12, L, o, "#ffb36b");
        // flat roof with coral trim
        rect(g, o[0] - 4, o[1] + 4, W + 8, 6, C.coral); rect(g, o[0] - 4, o[1] + 4, W + 8, 1, "#ffb0a8"); rect(g, o[0] - 4, o[1] + 9, W + 8, 1, C.coralDark);
        A.doorAt(g, o[0] + 18, o[1] + H - 15, 10, 15, C.coral);
        rect(g, o[0] + 16, o[1] + H - 15, 1, 15, C.woodDark);
        L.push({ x: o[0] + 24, y: o[1] + 46, r: 40, color: "#ffcf8a", a: 0.9 });
    };
    P2.studio = function (g, b, L) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        rect(g, o[0] + 2, o[1] + 18, W - 4, H - 18, "#efdcbc");
        for (var x = 0; x < W - 4; x += 10) rect(g, o[0] + 2 + x, o[1] + 18, 1, H - 18, "#d9c19a");
        // barrel roof
        for (var y = 0; y < 14; y++) {
            var inset = Math.round(Math.pow((13 - y) / 13, 2) * 10);
            rect(g, o[0] + inset, o[1] + 4 + y, W - inset * 2, 1, y % 3 === 0 ? "#d99f78" : "#f2c9a0");
        }
        rect(g, o[0], o[1] + 17, W, 2, "#b9805a");
        // big stage number
        rect(g, o[0] + 30, o[1] + 22, 20, 18, C.ink); word(g, "7", o[0] + 35, o[1] + 25, "#ffcb3d", 3);
        // water tower (generic)
        rect(g, o[0] + 4, o[1] - 2, 2, 14, C.ink); rect(g, o[0] + 16, o[1] - 2, 2, 14, C.ink);
        rect(g, o[0] + 2, o[1] - 14, 18, 12, "#8fa6c4"); rect(g, o[0] + 2, o[1] - 14, 18, 2, "#c6d4e8"); rect(g, o[0] + 1, o[1] - 17, 20, 3, "#6c7f9e");
        word(g, "LOT", o[0] + 5, o[1] - 11, "#fff");
        A.doorAt(g, o[0] + 8, o[1] + H - 18, 14, 18, "#d99f78");
        win(g, o[0] + 58, o[1] + 26, 14, 9, L, o);
        // striped gate arm
        for (var k = 0; k < 7; k++) rect(g, o[0] + 56 + k * 3, o[1] + H - 10, 3, 2, k % 2 ? "#fff" : C.coral);
        rect(g, o[0] + 55, o[1] + H - 12, 2, 12, C.ink);
        L.push({ x: o[0] + 15, y: o[1] + H - 6, r: 28, color: "#ffd37a", a: 0.8 });
    };
    function office(g, b, L, tall) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        var top = tall ? -14 : 12, body = tall ? "#3d5f9c" : "#ffd9c2", trim = tall ? "#2a4475" : "#e8a98a";
        rect(g, o[0] + (tall ? 14 : 2), o[1] + top, tall ? W - 28 : W - 4, H - top, body);
        if (tall) {
            for (var y = top + 4; y < H - 18; y += 6) for (var x = 18; x < W - 18; x += 6) rect(g, o[0] + x, o[1] + y, 4, 4, (hash(x, y, 4) < 0.55) ? "#ffd58a" : "#8fb8ff");
            rect(g, o[0] + 2, o[1] + 20, W - 4, H - 20, "#e9eef8");
            rect(g, o[0] + 2, o[1] + 20, W - 4, 2, trim);
            word(g, "TOWER", o[0] + W / 2 - 9, o[1] + 24, trim);
        } else {
            rect(g, o[0], o[1] + 8, W, 5, trim); rect(g, o[0], o[1] + 8, W, 1, "#ffe9dc");
            word(g, "DEALS", o[0] + W / 2 - 9, o[1] + 16, "#c2255f");
            palmLite(g, o[0] + 4, o[1] + 22); palmLite(g, o[0] + W - 6, o[1] + 22);
        }
        win(g, o[0] + 8, o[1] + 31, 12, 9, L, o);
        win(g, o[0] + W - 20, o[1] + 31, 12, 9, L, o);
        A.doorAt(g, o[0] + 26, o[1] + H - 16, 12, 16, tall ? "#2a4475" : "#c2255f");
        // gold handset sign over the door
        rect(g, o[0] + 28, o[1] + 22 + (tall ? 8 : 0) - 2, 8, 2, "#ffcb3d"); rect(g, o[0] + 28, o[1] + 22 + (tall ? 8 : 0), 2, 2, "#ffcb3d"); rect(g, o[0] + 34, o[1] + 22 + (tall ? 8 : 0), 2, 2, "#ffcb3d");
        L.push({ x: o[0] + 32, y: o[1] + H - 4, r: 26, color: "#ffd37a", a: 0.8 });
    }
    P2.deal = function (g, b, L) { office(g, b, L, false); };
    P2.deal2 = function (g, b, L) { office(g, b, L, true); };
    function theatre(g, b, L, name, wall) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        rect(g, o[0] + 2, o[1] + 10, W - 4, H - 10, wall);
        rect(g, o[0] + 2, o[1] + 10, W - 4, 2, "#ffffff44");
        // art-deco crown
        rect(g, o[0] + W / 2 - 6, o[1] - 10, 12, 20, wall); rect(g, o[0] + W / 2 - 2, o[1] - 16, 4, 8, wall);
        for (var k = 0; k < 4; k++) rect(g, o[0] + W / 2 - 4 + k * 2, o[1] - 8, 1, 16, "#ffcb3d");
        // marquee
        var mw = wordW(name, 2) + 8;
        var mx = o[0] + Math.round((W - mw) / 2), my = o[1] + 14;
        rect(g, mx - 2, my - 2, mw + 4, 18, C.ink);
        rect(g, mx, my, mw, 14, "#fff3d6");
        word(g, name, mx + 4, my + 2, "#c2255f", 2);
        // red carpet down to the door, velvet ropes
        rect(g, o[0] + W / 2 - 6, o[1] + H - 18, 12, 18, "#c8323c"); rect(g, o[0] + W / 2 - 6, o[1] + H - 18, 12, 1, "#ff6b6b");
        A.doorAt(g, o[0] + W / 2 - 5, o[1] + H - 20, 10, 6, "#2a2150");
        for (var p = 0; p < 2; p++) {
            var px = o[0] + W / 2 + (p ? 9 : -11);
            rect(g, px, o[1] + H - 12, 2, 10, "#ffcb3d"); disc(g, px + 1, o[1] + H - 12, 1, "#ffe58a");
        }
        line(g, o[0] + W / 2 - 10, o[1] + H - 10, o[0] + W / 2 - 7, o[1] + H - 8, "#8a1e2e");
        line(g, o[0] + W / 2 + 7, o[1] + H - 8, o[0] + W / 2 + 10, o[1] + H - 10, "#8a1e2e");
        // posters
        rect(g, o[0] + 5, o[1] + H - 26, 9, 14, C.ink); rect(g, o[0] + 6, o[1] + H - 25, 7, 12, "#ff8a4c"); disc(g, o[0] + 9, o[1] + H - 21, 2, "#ffe58a");
        rect(g, o[0] + W - 14, o[1] + H - 26, 9, 14, C.ink); rect(g, o[0] + W - 13, o[1] + H - 25, 7, 12, "#7a4bb8"); rect(g, o[0] + W - 12, o[1] + H - 18, 5, 4, "#36c9e8");
        L.push({ x: o[0] + W / 2, y: o[1] + 20, r: 46, color: "#ffd35a", a: 0.9 });
    }
    P2.premiere = function (g, b, L) { theatre(g, b, L, "UNMAZE", "#5b3a8c"); };
    P2.marquee = function (g, b, L) { theatre(g, b, L, "BINGO", "#7a1e3d"); };
    P2.screening = function (g, b, L) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        rect(g, o[0] + 2, o[1] + 12, W - 4, H - 12, "#2b2550");
        rect(g, o[0], o[1] + 8, W, 5, "#1c9a8f"); rect(g, o[0], o[1] + 8, W, 1, "#6fe3d6");
        word(g, "SCREENING", o[0] + 6, o[1] + 16, "#6fe3d6");
        // little screen with a book on it
        rect(g, o[0] + 22, o[1] + 24, 36, 16, C.ink); rect(g, o[0] + 23, o[1] + 25, 34, 14, "#fff3d6");
        rect(g, o[0] + 32, o[1] + 28, 7, 9, "#ff5d6c"); rect(g, o[0] + 40, o[1] + 28, 7, 9, "#4d8dff"); rect(g, o[0] + 39, o[1] + 28, 1, 9, C.ink);
        A.doorAt(g, o[0] + 6, o[1] + H - 15, 9, 15, "#1c9a8f");
        L.push({ x: o[0] + 40, y: o[1] + 32, r: 30, color: "#fff3d6", a: 0.7 });
    };
    P2.poolparty = function (g, b, L) {
        var o = [4, 20], W = b.w * T, H = b.h * T;
        // cabana
        rect(g, o[0] + 20, o[1] + 10, W - 22, H - 10, "#fff7ea");
        for (var s = 0; s < W - 20; s += 6) rect(g, o[0] + 18 + s, o[1] + 4, 3, 8, "#ff5f8f");
        rect(g, o[0] + 18, o[1] + 4, W - 18, 1, "#c2255f"); rect(g, o[0] + 18, o[1] + 11, W - 18, 2, "#c2255f");
        word(g, "POOL", o[0] + 30, o[1] + 16, "#c2255f");
        A.doorAt(g, o[0] + 36, o[1] + H - 15, 10, 15, "#ff5f8f");
        // the pool
        rect(g, o[0], o[1] + 20, 20, H - 22, "#fff3d6");
        rect(g, o[0] + 2, o[1] + 22, 16, H - 26, C.pool);
        for (var r = 0; r < 4; r++) rect(g, o[0] + 4 + (r % 2) * 5, o[1] + 26 + r * 5, 4, 1, C.poolLight);
        disc(g, o[0] + 10, o[1] + 34, 3, "#ff8fb8"); disc(g, o[0] + 10, o[1] + 34, 1, C.pool);
        // string lights
        for (var k = 0; k < 10; k++) dot(g, o[0] + 2 + k * 6, o[1] + 2 + (k % 2), ["#ffcb3d", "#ff5f8f", "#36c9e8"][k % 3]);
        L.push({ x: o[0] + 10, y: o[1] + 34, r: 30, color: "#7fe8ff", a: 0.8 });
        L.push({ x: o[0] + 40, y: o[1] + 2, r: 34, color: "#ffcb3d", a: 0.6 });
    };

    /* ---------- the boulevard and the plaza, painted over the land ---------- */
    function dressLand(world, land) {
        var g = land.getContext("2d"), W = world.W, H = world.H, t = world.tiles;
        var at = function (x, y) { return x < 0 || y < 0 || x >= W || y >= H ? 0 : t[y * W + x]; };
        for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
            if (at(x, y) !== 3) continue;
            var px = x * T, py = y * T;
            var hz = at(x - 1, y) === 3 && at(x + 1, y) === 3, vt = at(x, y - 1) === 3 && at(x, y + 1) === 3;
            if (hz && !vt) { rect(g, px + 2, py + 7, 6, 2, "#ffcb3d"); rect(g, px, py, T, 1, "#d9c3a6"); rect(g, px, py + T - 1, T, 1, "#d9c3a6"); }
            else if (vt && !hz) { rect(g, px + 7, py + 2, 2, 6, "#ffcb3d"); rect(g, px, py, 1, T, "#d9c3a6"); rect(g, px + T - 1, py, 1, T, "#d9c3a6"); }
        }
        var pc = world.plaza, cx = pc.tx * T + 8, cy = pc.ty * T + 8;
        // a fountain in the plaza
        disc(g, cx, cy, 14, "#d99f78"); disc(g, cx, cy, 12, "#ffe4c6"); disc(g, cx, cy, 10, C.pool); disc(g, cx, cy, 4, "#ffe4c6");
        rect(g, cx - 1, cy - 6, 2, 6, C.poolLight); dot(g, cx - 3, cy - 4, C.poolLight); dot(g, cx + 3, cy - 4, C.poolLight);
    }

    /* ---------- sunset backdrop: hills with an original sign, a skyline ---------- */
    var backdrop = null;
    function buildBackdrop(w, h, label) {
        var s = A.canvas(w, h), g = s.g;
        for (var y = 0; y < h; y++) {
            var k = y / h;
            var c = k < 0.5 ? mix("#ff7a59", "#ffb36b", k * 2) : mix("#ffb36b", "#ffd99a", (k - 0.5) * 2);
            rect(g, 0, y, w, 1, c);
        }
        disc(g, Math.round(w * 0.72), Math.round(h * 0.62), Math.round(h * 0.22), "#fff1b8");
        // far hills
        for (var x = 0; x < w; x++) {
            var hh = Math.round(h * 0.35 + Math.sin(x / 23) * 6 + Math.sin(x / 9 + 1) * 3);
            rect(g, x, h - hh, 1, hh, "#b0507a");
            var nh = Math.round(h * 0.18 + Math.sin(x / 31 + 2) * 4);
            rect(g, x, h - nh, 1, nh, "#6a3a7a");
        }
        // sign on the hill
        var sx = Math.round(w * 0.12), sy = Math.round(h - h * 0.35 - 2);
        for (var i = 0; i < label.length; i++) {
            var m = F[label[i]];
            for (var q = 0; q < 15; q++) if (m[q] === "1") rect(g, sx + i * 8 + (q % 3) * 2, sy + ((q / 3) | 0) * 2 + (i % 3 === 1 ? 1 : 0), 2, 2, "#fff8ec");
            rect(g, sx + i * 8 + 2, sy + 10, 1, 4, "#5a2f63");
        }
        // skyline
        var bx = Math.round(w * 0.55);
        [[10, 18], [7, 26], [12, 14], [6, 30], [10, 20], [8, 12], [9, 22]].forEach(function (bd) {
            rect(g, bx, h - bd[1], bd[0], bd[1], "#3c2a5a");
            for (var wy = h - bd[1] + 3; wy < h - 2; wy += 4) for (var wx = bx + 2; wx < bx + bd[0] - 1; wx += 3) if (hash(wx, wy, 2) < 0.4) dot(g, wx, wy, "#ffd58a");
            bx += bd[0] + 1;
        });
        // palms in silhouette
        [0.04, 0.46, 0.93].forEach(function (f) {
            var px = Math.round(w * f);
            rect(g, px, h - 26, 1, 26, "#2a1a3a");
            [[-5, 2], [-4, -2], [0, -4], [4, -2], [5, 2]].forEach(function (d) { line(g, px, h - 26, px + d[0], h - 26 + d[1], "#2a1a3a"); });
        });
        return s.c;
    }
    function mix(a, b, k) {
        var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
        var r = Math.round(((x >> 16) & 255) * (1 - k) + ((y >> 16) & 255) * k), gg = Math.round(((x >> 8) & 255) * (1 - k) + ((y >> 8) & 255) * k), bb = Math.round((x & 255) * (1 - k) + (y & 255) * k);
        return "rgb(" + r + "," + gg + "," + bb + ")";
    }
    function drawBackdrop(ctx, world, night) {
        if (!backdrop) backdrop = buildBackdrop(world.W * T, 56, "SRINIVAS");
        ctx.drawImage(backdrop, 0, -30);
        if (night > 0.01) { ctx.fillStyle = "rgba(20,16,70," + (0.55 * night).toFixed(2) + ")"; ctx.fillRect(0, -30, world.W * T, 56); }
    }

    /* golden-hour wash over the whole view in day mode */
    function drawGolden(ctx, vw, vh, strength) {
        if (strength <= 0.01) return;
        var gr = ctx.createLinearGradient(0, 0, 0, vh);
        gr.addColorStop(0, "rgba(255,110,120," + (0.22 * strength).toFixed(3) + ")");
        gr.addColorStop(0.5, "rgba(255,160,90," + (0.14 * strength).toFixed(3) + ")");
        gr.addColorStop(1, "rgba(255,200,110," + (0.08 * strength).toFixed(3) + ")");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, vw, vh);
    }

    /* ---------- ocean with sunset glints ---------- */
    function drawOcean(ctx, camX, camY, vw, vh, world, now, animate) {
        rect(ctx, 0, 0, vw, vh, C.water);
        var x0 = Math.floor(camX / T), y0 = Math.floor(camY / T), x1 = Math.ceil((camX + vw) / T), y1 = Math.ceil((camY + vh) / T);
        var phase = animate ? Math.floor(now / 420) : 0;
        for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
            var inside = x >= 0 && y >= 0 && x < world.W && y < world.H;
            if (inside && world.tiles[y * world.W + x] !== 0) continue;
            var px = x * T - camX, py = y * T - camY;
            for (var k = 0; k < 2; k++) {
                if ((((hash(x, y, k) * 4) | 0) + phase + k) % 4 !== 0) continue;
                var wx = px + 2 + ((hash(x, y, k + 9) * 8) | 0), wy = py + 3 + k * 7 + ((hash(x, y, k + 3) * 3) | 0);
                rect(ctx, wx, wy, 5, 1, k ? "#ff9bb0" : C.waterLight);
                rect(ctx, wx + 1, wy + 1, 3, 1, C.waterDeep);
            }
        }
    }

    /* ---------- the convertible ---------- */
    var CAR = "#ff4d6d", CAR_D = "#c92a4b", CHROME = "#e9eef8";
    function wheel(g, x, y) { rect(g, x, y, 5, 4, "#1d1b3a"); rect(g, x + 1, y + 1, 3, 2, "#8a8fa8"); }
    function head(g, x, y, dir) {
        rect(g, x - 3, y - 6, 6, 6, C.skin); rect(g, x - 4, y - 7, 8, 3, C.hair);
        rect(g, x - 3, y - 4, 6, 1, "#1d1b3a"); // shades
        if (dir === "up") rect(g, x - 4, y - 7, 8, 6, C.hair);
    }
    function drawCar(g, x, y, dir, frame) {
        x = Math.round(x); y = Math.round(y);
        var bob = frame === 1 || frame === 3 ? -1 : 0;
        if (dir === "left" || dir === "right") {
            var f = dir === "left" ? -1 : 1;
            ell(g, x, y, 13, 2, "rgba(20,18,60,0.25)");
            wheel(g, x - 10, y - 4); wheel(g, x + 5, y - 4);
            rect(g, x - 13, y - 9 + bob, 26, 6, CAR); rect(g, x - 13, y - 9 + bob, 26, 1, "#ff8fa3"); rect(g, x - 13, y - 4 + bob, 26, 1, CAR_D);
            rect(g, x - 13, y - 6 + bob, 26, 1, CHROME);
            rect(g, x + f * 11 - 1, y - 8 + bob, 2, 2, "#fff3b0"); rect(g, x - f * 12 - 1, y - 8 + bob, 2, 2, "#ff3b3b");
            head(g, x - f * 1, y - 9 + bob, dir);
            rect(g, x + f * 4, y - 13 + bob, 1, 4, "#a8f0ff"); rect(g, x + f * 5, y - 12 + bob, 1, 3, "#a8f0ff");
            rect(g, x + f * 2 - 1, y - 11 + bob, 3, 1, "#1d1b3a");
        } else {
            ell(g, x, y, 9, 2, "rgba(20,18,60,0.25)");
            rect(g, x - 9, y - 5, 3, 4, "#1d1b3a"); rect(g, x + 6, y - 5, 3, 4, "#1d1b3a");
            rect(g, x - 8, y - 16 + bob, 16, 13, CAR); rect(g, x - 8, y - 16 + bob, 16, 1, "#ff8fa3"); rect(g, x - 8, y - 4 + bob, 16, 1, CAR_D);
            rect(g, x - 9, y - 6 + bob, 18, 2, CHROME);
            if (dir === "down") { rect(g, x - 7, y - 13 + bob, 14, 2, "#a8f0ff"); dot(g, x - 6, y - 6 + bob, "#fff3b0"); dot(g, x + 5, y - 6 + bob, "#fff3b0"); head(g, x, y - 9 + bob, dir); }
            else { head(g, x, y - 9 + bob, dir); dot(g, x - 6, y - 6 + bob, "#ff3b3b"); dot(g, x + 5, y - 6 + bob, "#ff3b3b"); }
        }
    }
    var walkPlayer = A.drawPlayer;
    function drawPlayer(g, x, y, dir, frame, dig) {
        if (dig) { drawCar(g, x - 18, y - 2, "right", 0); walkPlayer(g, x, y, dir, frame, dig); return; }
        drawCar(g, x, y, dir, frame);
    }

    /* ---------- the crew ---------- */
    function drawCrew(g, m, x, y, dir, frame, now, still) {
        x = Math.round(x); y = Math.round(y);
        shadow(g, x, y, 4, 2);
        var step = frame % 2, f = dir === "left" ? -1 : 1;
        rect(g, x - 3, y - 4, 2, 4 - (step ? 1 : 0), "#2b3a8f"); rect(g, x + 1, y - 4, 2, 4 - (step ? 0 : 1), "#2b3a8f");
        rect(g, x - 4, y - 10, 8, 6, m.shirt); rect(g, x - 4, y - 5, 8, 1, m.shirtDark);
        if (m.id === "agent") { rect(g, x - 1, y - 10, 2, 5, "#ffffff"); dot(g, x, y - 9, "#c2255f"); }
        rect(g, x - 5, y - 9, 1, 4, m.shirt); rect(g, x + 4, y - 9 + (m.phone ? -4 : 0), 1, 4, m.shirt);
        rect(g, x - 3, y - 16, 6, 6, m.skin); rect(g, x - 3, y - 17, 6, 2, m.hair);
        if (dir === "up") rect(g, x - 3, y - 17, 6, 5, m.hair);
        else if (dir === "down") { dot(g, x - 2, y - 13, C.ink); dot(g, x + 1, y - 13, C.ink); }
        else dot(g, x + f, y - 13, C.ink);
        if (m.cap) { rect(g, x - 3, y - 18, 6, 2, "#1d1b3a"); rect(g, x + (f > 0 ? 1 : -4), y - 17, 3, 1, "#1d1b3a"); }
        if (m.phone) { rect(g, x + 3, y - 16, 2, 4, "#1d1b3a"); if (!still && Math.floor(now / 500) % 3 === 0) { dot(g, x + 6, y - 18, "#ffcb3d"); dot(g, x + 7, y - 20, "#ffcb3d"); } }
        if (m.id === "brother") rect(g, x - 4, y - 18, 8, 1, "#ffcb3d");
    }

    /* ---------- assembly ---------- */
    var baseCreate = A.create;
    A.create = function (world) {
        var art = baseCreate(world);
        dressLand(world, art.land);
        art.spr.tree = [laPalm(0), laPalm(1), laPalm(2)];
        art.spr.mushroom = [umbrella(0), umbrella(1), umbrella(2)];
        art.spr.bottle = [phoneBooth()];
        return art;
    };
    A.drawOcean = drawOcean;
    A.drawPlayer = drawPlayer;
    A.drawCrew = drawCrew;
    A.drawBackdrop = drawBackdrop;
    A.drawGolden = drawGolden;
    A.buildBackdrop = buildBackdrop;
    A.word = word;
})(typeof window !== "undefined" ? window : this);
