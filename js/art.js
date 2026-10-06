/*
 * Procedural pixel art for the island: ground, trees, buildings, characters, lighting.
 * Everything is drawn with integer rectangles on small canvases at one logical pixel per art
 * pixel; the game scales the result up without smoothing. Browser only (window.IslandArt).
 */
(function (root) {
    "use strict";

    var T = 16;

    var C = {
        ink: "#1d1b3a",
        water: "#3a86e8", waterLight: "#6fb2ff", waterDeep: "#2a62c4", foam: "#e4f6ff", foamDim: "#b9e2fb",
        sand: "#f6dfa8", sandDark: "#e7c887", sandWet: "#d9b676",
        grass: "#5ec24c", grassB: "#56b846", grassDark: "#46a23c", grassLight: "#86d95c",
        garden: "#a6e27f", gardenDark: "#8fd36a",
        dirt: "#dba869", dirtDark: "#c68f52", dirtLight: "#ebc38b",
        stone: "#cfd6ea", stoneDark: "#a3acc9", stoneLight: "#eef1fb",
        wood: "#8c5b34", woodDark: "#66411f", woodLight: "#b97d43",
        hedge: "#2b8a43", hedgeDark: "#1f6b34", hedgeLight: "#3fb35a",
        snow: "#f4fbff", snowDark: "#cfe8f7",
        leaf: "#35ad57", leafDark: "#237a3f", leafLight: "#69d87a",
        teal: "#2dc4b6", tealDark: "#1c9a8f",
        coral: "#ff5d6c", coralDark: "#d63c55",
        yellow: "#ffcb3d", yellowDark: "#e0a01f",
        violet: "#8e63ff", violetDark: "#6a45d1",
        pink: "#ff7ac8", pinkDark: "#d9519f",
        blue: "#4d8dff", blueDark: "#3269d6",
        green: "#3ec27a", greenDark: "#27965c",
        brick: "#c8553d", brickDark: "#a23f2e", brickLight: "#e0735a",
        cream: "#fff3d6", creamDark: "#e8d5a8",
        glass: "#9fd9ff", glassDark: "#6cb4e8", lit: "#ffe27a",
        skin: "#ffd0a6", hair: "#2a1a4a", hoodie: "#ff4d8d", hoodieDark: "#d9306f", pants: "#2b3a8f",
        gold: "#ffd23f", goldDark: "#e0a81c"
    };

    var ROOFS = {
        coral: [C.coral, C.coralDark, "#ff8c95"], teal: [C.teal, C.tealDark, "#6fe3d6"], blue: [C.blue, C.blueDark, "#8fb8ff"],
        pink: [C.pink, C.pinkDark, "#ffb0dd"], ice: ["#eaf6ff", "#bfe0f5", "#ffffff"], violet: [C.violet, C.violetDark, "#b99cff"],
        yellow: [C.yellow, C.yellowDark, "#ffe58a"], brick: [C.brick, C.brickDark, C.brickLight], green: [C.green, C.greenDark, "#7fe0a8"]
    };

    var GLYPHS = {
        B: ["1110", "1001", "1110", "1001", "1110"],
        I: ["1110", "0100", "0100", "0100", "1110"],
        N: ["1001", "1101", "1011", "1001", "1001"],
        G: ["0111", "1000", "1011", "1001", "0111"],
        O: ["0110", "1001", "1001", "1001", "0110"]
    };

    /* ---------- tiny drawing kit ---------- */

    function canvas(w, h) {
        var c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        var g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        return { c: c, g: g };
    }

    function rect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
    function dot(g, x, y, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); }

    function disc(g, cx, cy, r, col) {
        g.fillStyle = col;
        for (var y = -r; y <= r; y++) {
            var w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
            g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
        }
    }

    function ell(g, cx, cy, rx, ry, col) {
        g.fillStyle = col;
        for (var y = -ry; y <= ry; y++) {
            var k = 1 - (y * y) / ((ry + 0.5) * (ry + 0.5));
            var w = Math.floor(rx * Math.sqrt(Math.max(0, k)));
            g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
        }
    }

    function line(g, x0, y0, x1, y1, col) {
        g.fillStyle = col;
        var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
        for (;;) {
            g.fillRect(x0, y0, 1, 1);
            if (x0 === x1 && y0 === y1) break;
            var e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    function hash(x, y, s) {
        var h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    function shadow(g, cx, cy, rx, ry) { ell(g, cx, cy, rx, ry, "rgba(20,18,60,0.2)"); }

    function text(g, str, x, y, col, scale) {
        var cx = x;
        for (var i = 0; i < str.length; i++) {
            var gl = GLYPHS[str[i]];
            for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) if (gl[r][c] === "1") rect(g, cx + c * scale, y + r * scale, scale, scale, col);
            cx += 5 * scale;
        }
    }

    /* ---------- ground ---------- */

    function paintLand(world) {
        var W = world.W, H = world.H, t = world.tiles;
        var L = canvas(W * T, H * T), g = L.g;
        var at = function (x, y) { return x < 0 || y < 0 || x >= W || y >= H ? 0 : t[y * W + x]; };
        var isLand = function (x, y) { var v = at(x, y); return v !== 0 && v !== 5; };
        var roadish = function (v) { return v === 3 || v === 4 || v === 5; };

        for (var y = 0; y < H; y++) {
            for (var x = 0; x < W; x++) {
                var v = t[y * W + x], px = x * T, py = y * T;
                if (v === 0) continue;
                if (v === 1 || v === 3 || v === 7 || v === 2 || v === 8) {
                    var base = v === 2 ? C.sand : v === 3 ? C.dirt : v === 7 ? C.garden : v === 8 ? C.snow : ((x + y) & 1 ? C.grassB : C.grass);
                    rect(g, px, py, T, T, base);
                    var spec = v === 2 ? C.sandDark : v === 3 ? C.dirtDark : v === 7 ? C.gardenDark : v === 8 ? C.snowDark : C.grassDark;
                    var spec2 = v === 2 ? C.cream : v === 3 ? C.dirtLight : v === 7 ? "#c4efa6" : v === 8 ? "#ffffff" : C.grassLight;
                    for (var k = 0; k < 7; k++) {
                        var sx = (hash(x, y, k) * 14) | 0, sy = (hash(x, y, k + 40) * 14) | 0;
                        if (v === 1 || v === 7) {
                            if (k < 4) { dot(g, px + sx, py + sy, spec); dot(g, px + sx + 1, py + sy - 1, spec); }
                            else dot(g, px + sx, py + sy, spec2);
                        } else if (k < 5) dot(g, px + sx, py + sy, k % 2 ? spec : spec2);
                    }
                    if (v === 1 && hash(x, y, 99) < 0.1) {
                        var tx = px + 3 + ((hash(x, y, 7) * 8) | 0), ty = py + 6 + ((hash(x, y, 8) * 6) | 0);
                        rect(g, tx, ty, 1, 3, C.grassDark); rect(g, tx - 1, ty + 1, 1, 2, C.grassDark); rect(g, tx + 1, ty + 1, 1, 2, C.grassDark);
                    }
                    if (v === 3) {
                        if (!roadish(at(x, y - 1))) rect(g, px, py, T, 1, C.dirtDark);
                        if (!roadish(at(x, y + 1))) rect(g, px, py + T - 1, T, 1, C.dirtDark);
                        if (!roadish(at(x - 1, y))) rect(g, px, py, 1, T, C.dirtDark);
                        if (!roadish(at(x + 1, y))) rect(g, px + T - 1, py, 1, T, C.dirtDark);
                    }
                    if (v === 7 && hash(x, y, 5) < 0.14) { dot(g, px + 5, py + 6, C.pink); dot(g, px + 4, py + 6, "#fff"); dot(g, px + 6, py + 6, "#fff"); dot(g, px + 5, py + 5, "#fff"); dot(g, px + 5, py + 7, "#fff"); }
                } else if (v === 4) {
                    rect(g, px, py, T, T, C.stone);
                    rect(g, px, py + 7, T, 1, C.stoneDark);
                    rect(g, px, py + 15, T, 1, C.stoneDark);
                    rect(g, px + ((y & 1) ? 3 : 11), py, 1, 8, C.stoneDark);
                    rect(g, px + ((y & 1) ? 11 : 3), py + 8, 1, 8, C.stoneDark);
                    rect(g, px, py, T, 1, C.stoneLight);
                } else if (v === 5) {
                    rect(g, px, py, T, T, C.woodLight);
                    for (var pl = 0; pl < 4; pl++) rect(g, px, py + pl * 4 + 3, T, 1, C.wood);
                    rect(g, px, py, 1, T, C.woodDark);
                    rect(g, px + T - 1, py, 1, T, C.woodDark);
                    for (var nl = 0; nl < 4; nl++) { dot(g, px + 2, py + nl * 4 + 1, C.woodDark); dot(g, px + 13, py + nl * 4 + 1, C.woodDark); }
                } else if (v === 6) {
                    rect(g, px, py, T, T, C.hedge);
                    for (var hk = 0; hk < 11; hk++) {
                        var hx = (hash(x, y, hk) * 14) | 0, hy = (hash(x, y, hk + 20) * 14) | 0;
                        rect(g, px + hx, py + hy, 2, 2, hk % 3 === 0 ? C.hedgeLight : C.hedgeDark);
                    }
                    if (at(x, y - 1) !== 6) rect(g, px, py, T, 3, C.hedgeLight);
                    if (at(x, y + 1) !== 6) rect(g, px, py + T - 4, T, 4, C.hedgeDark);
                    if (at(x - 1, y) !== 6) rect(g, px, py, 1, T, C.hedgeDark);
                    if (at(x + 1, y) !== 6) rect(g, px + T - 1, py, 1, T, C.hedgeDark);
                }
            }
        }

        // foam on the water beside land (drawn onto water tiles so the animated sea shows around it)
        for (var wy = 0; wy < H; wy++) {
            for (var wx = 0; wx < W; wx++) {
                if (at(wx, wy) !== 0) continue;
                var wxp = wx * T, wyp = wy * T;
                var n = isLand(wx, wy - 1), s = isLand(wx, wy + 1), w2 = isLand(wx - 1, wy), e = isLand(wx + 1, wy);
                for (var i = 0; i < T; i += 2) {
                    var wob = hash(wx * 16 + i, wy, 3) < 0.5 ? 3 : 2;
                    if (n) rect(g, wxp + i, wyp + T - wob, 2, wob, i % 4 ? C.foam : C.foamDim);
                    if (s) rect(g, wxp + i, wyp, 2, wob, i % 4 ? C.foam : C.foamDim);
                    if (w2) rect(g, wxp + T - wob, wyp + i, wob, 2, i % 4 ? C.foam : C.foamDim);
                    if (e) rect(g, wxp, wyp + i, wob, 2, i % 4 ? C.foam : C.foamDim);
                }
                if (!n && !s && !w2 && !e) {
                    if (isLand(wx - 1, wy - 1)) rect(g, wxp + T - 3, wyp + T - 3, 3, 3, C.foam);
                    if (isLand(wx + 1, wy - 1)) rect(g, wxp, wyp + T - 3, 3, 3, C.foam);
                    if (isLand(wx - 1, wy + 1)) rect(g, wxp + T - 3, wyp, 3, 3, C.foam);
                    if (isLand(wx + 1, wy + 1)) rect(g, wxp, wyp, 3, 3, C.foam);
                }
            }
        }

        // plaza compass
        var pc = world.plaza, cx = pc.tx * T + 8, cy = pc.ty * T + 8;
        disc(g, cx, cy, 14, C.stoneDark);
        disc(g, cx, cy, 12, C.stoneLight);
        disc(g, cx, cy, 8, C.stone);
        for (var d = 0; d < 4; d++) {
            var dx = [0, 1, 0, -1][d], dy = [-1, 0, 1, 0][d];
            for (var r = 0; r < 12; r++) rect(g, cx + dx * r - (dy ? 1 : 0), cy + dy * r - (dx ? 1 : 0), dy ? 3 : 1, dx ? 3 : 1, d === 0 ? C.coral : C.blue);
        }
        disc(g, cx, cy, 3, C.gold);
        disc(g, cx, cy, 1, C.goldDark);

        // flowers
        var petals = [C.pink, C.yellow, "#ffffff", "#9f8bff"];
        world.flowers.forEach(function (f) {
            var fx = f.tx * T + 2 + f.ox % 10, fy = f.ty * T + 2 + f.oy % 10, col = petals[f.color];
            dot(g, fx, fy - 1, col); dot(g, fx - 1, fy, col); dot(g, fx + 1, fy, col); dot(g, fx, fy + 1, col);
            dot(g, fx, fy, C.yellow);
            dot(g, fx, fy + 2, C.grassDark);
        });
        return L.c;
    }

    function drawOcean(ctx, camX, camY, vw, vh, world, now, animate) {
        rect(ctx, 0, 0, vw, vh, C.water);
        var x0 = Math.floor(camX / T), y0 = Math.floor(camY / T), x1 = Math.ceil((camX + vw) / T), y1 = Math.ceil((camY + vh) / T);
        var phase = animate ? Math.floor(now / 420) : 0;
        for (var y = y0; y <= y1; y++) {
            for (var x = x0; x <= x1; x++) {
                var inside = x >= 0 && y >= 0 && x < world.W && y < world.H;
                if (inside && world.tiles[y * world.W + x] !== 0) continue;
                var px = x * T - camX, py = y * T - camY;
                for (var k = 0; k < 2; k++) {
                    if ((((hash(x, y, k) * 4) | 0) + phase + k) % 4 !== 0) continue;
                    var wx = px + 2 + ((hash(x, y, k + 9) * 8) | 0), wy = py + 3 + k * 7 + ((hash(x, y, k + 3) * 3) | 0);
                    rect(ctx, wx, wy, 5, 1, C.waterLight);
                    rect(ctx, wx + 1, wy + 1, 3, 1, C.waterDeep);
                }
            }
        }
    }

    /* ---------- cached sprites: nature and props ---------- */

    function makeSprite(w, h, ax, ay, draw) {
        var s = canvas(w, h);
        draw(s.g);
        return { c: s.c, ax: ax, ay: ay };
    }

    var TREE_SETS = [
        [C.leafDark, C.leaf, C.leafLight],
        ["#1d7d5f", "#2fb37d", "#6fe6b0"],
        ["#d9519f", "#ff7ac8", "#ffc2e6"]
    ];

    function treeSprite(v) {
        var set = TREE_SETS[v % 3];
        return makeSprite(32, 42, 16, 40, function (g) {
            shadow(g, 16, 39, 11, 3);
            rect(g, 14, 27, 4, 12, C.wood);
            rect(g, 14, 27, 1, 12, C.woodDark);
            rect(g, 12, 37, 8, 2, C.woodDark);
            disc(g, 16, 17, 13, set[0]);
            disc(g, 16, 16, 12, set[1]);
            disc(g, 11, 11, 6, set[2]);
            disc(g, 22, 14, 3, set[2]);
            for (var k = 0; k < 14; k++) dot(g, 5 + ((hash(v, k, 1) * 22) | 0), 6 + ((hash(v, k, 2) * 20) | 0), set[0]);
            if (v === 0) [[9, 19], [20, 21], [24, 12], [14, 24]].forEach(function (p) { rect(g, p[0], p[1], 2, 2, C.coral); });
        });
    }

    function palmSprite(v) {
        return makeSprite(36, 44, 18, 42, function (g) {
            shadow(g, 18, 41, 9, 3);
            var pts = [[18, 41], [18, 37], [17, 33], [17, 29], [16, 25], [15, 21], [14, 17]];
            pts.forEach(function (p, i) { rect(g, p[0] - 1, p[1] - 1, 3, 5, i % 2 ? C.woodLight : C.wood); });
            var cx = 14, cy = 15;
            [[-12, 4], [-9, -4], [-3, -8], [4, -8], [10, -3], [13, 5], [6, 8], [-5, 9]].forEach(function (f, i) {
                line(g, cx, cy, cx + f[0], cy + f[1], i % 2 ? C.leaf : C.leafDark);
                line(g, cx, cy + 1, cx + f[0], cy + f[1] + 1, C.leafDark);
                if (f[1] > 3) line(g, cx + f[0], cy + f[1], cx + f[0] + (f[0] > 0 ? 2 : -2), cy + f[1] + 3, C.leafDark);
            });
            disc(g, cx, cy, 2, C.leafDark);
            dot(g, cx - 2, cy + 3, C.woodDark); dot(g, cx + 2, cy + 3, C.woodDark);
        });
    }

    function bushSprite(v) {
        var col = v ? [C.leafDark, C.leaf, C.leafLight] : [C.leafDark, C.leaf, C.leafLight];
        return makeSprite(18, 14, 9, 13, function (g) {
            shadow(g, 9, 12, 7, 2);
            disc(g, 5, 8, 4, col[0]); disc(g, 12, 8, 5, col[0]); disc(g, 9, 6, 5, col[0]);
            disc(g, 5, 7, 3, col[1]); disc(g, 12, 7, 4, col[1]); disc(g, 9, 5, 4, col[1]);
            dot(g, 8, 3, col[2]); dot(g, 9, 3, col[2]); dot(g, 4, 6, col[2]);
            if (v) { dot(g, 6, 8, C.pink); dot(g, 11, 9, C.pink); dot(g, 13, 6, C.pink); }
        });
    }

    var CAPS = [["#ff5d6c", "#d63c55", "#ffffff"], ["#37d6e8", "#1ca3b8", "#ffffff"], ["#a77bff", "#7a4de0", "#ffe27a"]];
    function mushroomSprite(v) {
        var cap = CAPS[v % 3];
        return makeSprite(30, 32, 15, 30, function (g) {
            shadow(g, 15, 28, 10, 3);
            rect(g, 12, 16, 7, 12, "#fff3d6");
            rect(g, 12, 16, 2, 12, "#e8d5a8");
            ell(g, 15, 14, 13, 8, cap[1]);
            ell(g, 15, 13, 13, 7, cap[0]);
            rect(g, 7, 9, 5, 1, "#ffffff55");
            disc(g, 9, 11, 2, cap[2]); disc(g, 19, 9, 2, cap[2]); disc(g, 23, 14, 1, cap[2]); disc(g, 14, 15, 1, cap[2]);
            dot(g, 13, 24, C.ink); dot(g, 17, 24, C.ink);
        });
    }

    function rockSprite(v) {
        return makeSprite(18, 13, 9, 12, function (g) {
            shadow(g, 9, 11, 7, 2);
            ell(g, 9, 7, 7, 5, "#8d96b3");
            ell(g, 8, 6, 6, 4, "#b9c0d8");
            rect(g, 5, 3, 4, 1, "#e5e9f5");
            dot(g, 12, 8, "#8d96b3");
            if (v) disc(g, 14, 9, 2, "#a3acc9");
        });
    }

    function barrelSprite() {
        return makeSprite(14, 16, 7, 15, function (g) {
            shadow(g, 7, 14, 6, 2);
            rect(g, 2, 3, 10, 11, C.woodLight);
            rect(g, 1, 5, 12, 7, C.woodLight);
            rect(g, 2, 3, 10, 1, C.woodDark); rect(g, 1, 6, 12, 1, C.ink); rect(g, 1, 10, 12, 1, C.ink);
            rect(g, 4, 3, 1, 11, C.wood); rect(g, 9, 3, 1, 11, C.wood);
            ell(g, 7, 3, 5, 2, C.wood);
        });
    }

    function lampSprite() {
        return makeSprite(12, 32, 6, 31, function (g) {
            shadow(g, 6, 30, 4, 2);
            rect(g, 5, 10, 2, 20, C.ink);
            rect(g, 3, 28, 6, 2, C.ink);
            rect(g, 2, 3, 8, 8, C.ink);
            rect(g, 3, 4, 6, 6, C.lit);
            rect(g, 4, 5, 2, 2, "#ffffff");
            rect(g, 1, 1, 10, 3, C.ink);
            rect(g, 4, 0, 4, 1, C.ink);
        });
    }

    function fenceSprite() {
        return makeSprite(16, 16, 0, 16, function (g) {
            rect(g, 0, 7, 16, 2, C.woodLight);
            rect(g, 0, 11, 16, 2, C.woodLight);
            rect(g, 0, 8, 16, 1, C.wood);
            rect(g, 0, 12, 16, 1, C.wood);
            rect(g, 6, 4, 4, 11, C.woodLight);
            rect(g, 6, 4, 1, 11, C.wood);
            rect(g, 7, 3, 2, 1, C.woodLight);
        });
    }

    function pedestalSprite(pressed) {
        return makeSprite(18, 26, 9, 25, function (g) {
            shadow(g, 9, 23, 8, 3);
            rect(g, 3, 14, 12, 10, C.stoneDark);
            rect(g, 4, 14, 10, 9, C.stone);
            rect(g, 3, 12, 12, 3, C.stoneLight);
            ell(g, 9, 11, 6, 3, C.ink);
            ell(g, 9, 10 + (pressed ? 1 : 0), 5, 3, pressed ? "#a82638" : C.coral);
            rect(g, 6, 8 + (pressed ? 1 : 0), 4, 1, "#ff9aa4");
            if (!pressed) rect(g, 4, 11, 10, 1, C.coralDark);
        });
    }

    function signSprite(dir) {
        return makeSprite(18, 26, 9, 25, function (g) {
            shadow(g, 9, 24, 5, 2);
            rect(g, 8, 8, 3, 17, C.wood);
            rect(g, 8, 8, 1, 17, C.woodDark);
            rect(g, 2, 3, 14, 9, C.woodLight);
            rect(g, 2, 3, 14, 1, C.woodDark); rect(g, 2, 11, 14, 1, C.woodDark);
            rect(g, 2, 3, 1, 9, C.woodDark); rect(g, 15, 3, 1, 9, C.woodDark);
            var cy = 7;
            if (dir === 0) { rect(g, 5, cy, 8, 1, "#fff"); line(g, 9, cy - 2, 12, cy, "#fff"); line(g, 9, cy + 2, 12, cy, "#fff"); }
            else if (dir === 1) { rect(g, 5, cy, 8, 1, "#fff"); line(g, 9, cy - 2, 6, cy, "#fff"); line(g, 9, cy + 2, 6, cy, "#fff"); }
            else { dot(g, 9, 5, "#fff"); dot(g, 10, 5, "#fff"); dot(g, 10, 7, "#fff"); dot(g, 9, 8, "#fff"); dot(g, 9, 10, "#fff"); }
        });
    }

    function owlSprite(blink) {
        return makeSprite(20, 30, 10, 29, function (g) {
            shadow(g, 10, 27, 8, 2);
            rect(g, 3, 20, 14, 8, C.wood);
            ell(g, 10, 20, 7, 2, C.woodLight);
            ell(g, 10, 20, 4, 1, C.wood);
            rect(g, 3, 20, 1, 8, C.woodDark);
            ell(g, 10, 13, 6, 8, "#9a6a3a");
            ell(g, 10, 15, 4, 5, C.cream);
            rect(g, 4, 3, 3, 3, "#9a6a3a"); rect(g, 13, 3, 3, 3, "#9a6a3a");
            disc(g, 7, 9, 3, "#fff"); disc(g, 13, 9, 3, "#fff");
            if (blink) { rect(g, 5, 9, 5, 1, C.ink); rect(g, 11, 9, 5, 1, C.ink); }
            else { rect(g, 7, 8, 2, 3, C.ink); rect(g, 13, 8, 2, 3, C.ink); }
            rect(g, 9, 11, 2, 2, C.gold);
            rect(g, 11, 6, 6, 1, C.gold); rect(g, 11, 12, 6, 1, C.gold); rect(g, 11, 6, 1, 7, C.gold); rect(g, 16, 6, 1, 7, C.gold);
            rect(g, 8, 25, 2, 2, C.gold); rect(g, 12, 25, 2, 2, C.gold);
        });
    }

    function chestSprite(open) {
        return makeSprite(20, 18, 10, 17, function (g) {
            shadow(g, 10, 16, 8, 2);
            rect(g, 2, 8, 16, 8, C.wood);
            rect(g, 2, 8, 16, 2, C.woodLight);
            rect(g, 2, 12, 16, 1, C.woodDark);
            rect(g, 2, 8, 2, 8, C.gold); rect(g, 16, 8, 2, 8, C.gold);
            if (open) {
                rect(g, 3, 2, 14, 5, C.woodLight); rect(g, 3, 2, 14, 1, C.woodDark); rect(g, 3, 2, 2, 5, C.gold);
                rect(g, 3, 8, 14, 2, C.lit);
                dot(g, 6, 7, "#fff"); dot(g, 12, 6, "#fff"); dot(g, 9, 5, C.lit);
            } else {
                rect(g, 2, 4, 16, 5, C.woodLight); rect(g, 2, 4, 16, 1, C.woodDark); rect(g, 2, 4, 2, 5, C.gold); rect(g, 16, 4, 2, 5, C.gold);
                rect(g, 9, 8, 3, 4, C.gold); dot(g, 10, 10, C.ink);
            }
        });
    }

    function digSprite(state) {
        return makeSprite(16, 16, 0, 0, function (g) {
            if (state === 0) {
                ell(g, 8, 10, 6, 3, C.dirtDark);
                ell(g, 8, 9, 5, 3, C.dirt);
                rect(g, 6, 7, 2, 1, C.dirtLight);
                line(g, 6, 7, 10, 11, "#6b431d"); line(g, 10, 7, 6, 11, "#6b431d");
                line(g, 7, 7, 11, 11, "#6b431d");
            } else {
                ell(g, 8, 10, 6, 3, C.dirtDark);
                ell(g, 8, 10, 4, 2, "#4a2f1b");
                ell(g, 8, 10, 2, 1, "#2b1a10");
                rect(g, 11, 6, 1, 4, C.grassDark);
                dot(g, 10, 5, C.pink); dot(g, 12, 5, C.pink); dot(g, 11, 4, C.pink); dot(g, 11, 6, C.pink); dot(g, 11, 5, C.yellow);
            }
        });
    }

    function boatSprite() {
        return makeSprite(34, 18, 17, 16, function (g) {
            shadow(g, 17, 15, 14, 2);
            rect(g, 4, 9, 26, 4, C.coralDark);
            rect(g, 2, 7, 30, 3, C.coral);
            rect(g, 4, 12, 26, 2, C.woodDark);
            rect(g, 6, 7, 22, 1, "#ff9aa4");
            rect(g, 16, 0, 1, 8, C.woodDark);
            rect(g, 17, 1, 7, 5, "#fff");
            rect(g, 17, 1, 7, 1, C.blue);
            dot(g, 3, 6, C.gold);
        });
    }

    function bottleSprite() {
        return makeSprite(12, 16, 6, 15, function (g) {
            rect(g, 4, 4, 5, 10, "#7fe0c8"); rect(g, 5, 2, 3, 3, "#7fe0c8");
            rect(g, 5, 1, 3, 2, C.woodLight);
            rect(g, 5, 7, 3, 5, "#fff3d6");
            rect(g, 4, 4, 1, 10, "#b6f3e3");
            dot(g, 6, 9, C.coral);
        });
    }

    /* ---------- buildings ---------- */

    function roof(g, x, y, w, h, key) {
        var c = ROOFS[key] || ROOFS.coral;
        rect(g, x, y, w, h, c[0]);
        for (var r = 0; r < h; r += 4) {
            rect(g, x, y + r + 3, w, 1, c[1]);
            for (var s = (r / 4) % 2 ? 4 : 0; s < w; s += 8) rect(g, x + s, y + r, 1, 3, c[1]);
        }
        rect(g, x, y, w, 2, c[2]);
        rect(g, x - 2, y + h - 1, w + 4, 3, c[1]);
        rect(g, x - 2, y + h + 2, w + 4, 1, "rgba(20,18,60,0.25)");
    }

    function windowAt(g, x, y, w, h, lit, lights, ox, oy, glow) {
        rect(g, x - 1, y - 1, w + 2, h + 2, C.ink);
        rect(g, x, y, w, h, lit ? (glow || C.lit) : C.glass);
        if (!lit) { rect(g, x + 1, y + 1, 2, 1, "#ffffffaa"); rect(g, x, y + h - 1, w, 1, C.glassDark); }
        rect(g, x + (w >> 1), y, 1, h, C.ink);
        rect(g, x, y + (h >> 1), w, 1, C.ink);
        if (lights) lights.push({ x: ox + x + w / 2, y: oy + y + h / 2, r: 26, color: glow || "#ffd37a", a: 0.85 });
    }

    function doorAt(g, x, y, w, h, col) {
        rect(g, x - 1, y - 1, w + 2, h + 1, C.ink);
        rect(g, x, y, w, h, col || C.woodLight);
        rect(g, x + (w >> 1), y, 1, h, C.woodDark);
        rect(g, x + 1, y + 1, 2, 2, "#ffffff55");
        dot(g, x + w - 2, y + (h >> 1), C.gold);
    }

    // Each painter draws on a (w*T + 8) x (h*T + 20) canvas; the footprint's top-left is at (4, 20).
    var PAINTERS = {
        lighthouse: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + H - 10, W - 4, 10, "#8d96b3");
            for (var k = 0; k < 14; k++) dot(g, o[0] + 3 + ((hash(k, 1, 1) * (W - 8)) | 0), o[1] + H - 9 + ((hash(k, 2, 1) * 8) | 0), k % 2 ? "#b9c0d8" : "#6c7596");
            for (var y = 0; y < H - 8; y++) {
                var t = y / (H - 8), half = 10 + 4 * t, stripe = ((y / 12) | 0) % 2;
                var x0 = o[0] + 24 - Math.round(half), w = Math.round(half * 2);
                rect(g, x0, o[1] + 10 + y, w, 1, stripe ? C.coral : "#ffffff");
                rect(g, x0 + w - 4, o[1] + 10 + y, 4, 1, stripe ? C.coralDark : "#d9e2f5");
            }
            rect(g, o[0] + 8, o[1] + 6, 32, 5, C.ink);
            for (var rp = 0; rp < 32; rp += 4) rect(g, o[0] + 8 + rp, o[1] + 2, 1, 4, C.ink);
            rect(g, o[0] + 8, o[1] + 2, 32, 1, C.ink);
            rect(g, o[0] + 16, o[1] - 8, 16, 10, C.glass);
            rect(g, o[0] + 16, o[1] - 8, 16, 10, "#ffe27a");
            rect(g, o[0] + 22, o[1] - 6, 4, 6, "#ffffff");
            rect(g, o[0] + 15, o[1] - 9, 18, 1, C.ink); rect(g, o[0] + 15, o[1] - 9, 1, 11, C.ink); rect(g, o[0] + 32, o[1] - 9, 1, 11, C.ink);
            for (var cr = 0; cr < 8; cr++) rect(g, o[0] + 24 - 11 + cr, o[1] - 16 + cr, 22 - cr * 2, 1, cr % 2 ? C.coralDark : C.coral);
            rect(g, o[0] + 23, o[1] - 20, 2, 5, C.ink);
            doorAt(g, o[0] + 20, o[1] + H - 18, 8, 14, C.woodLight);
            windowAt(g, o[0] + 20, o[1] + 30, 8, 8, false);
            L.push({ x: o[0] + 24, y: o[1] - 3, r: 70, color: "#ffe9a0", a: 1, beam: true });
        },
        workshop: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 4, o[1] + 20, W - 8, H - 20, C.woodLight);
            for (var y = 0; y < H - 20; y += 6) rect(g, o[0] + 4, o[1] + 20 + y + 5, W - 8, 1, C.wood);
            rect(g, o[0] + 4, o[1] + 20, 2, H - 20, C.woodDark); rect(g, o[0] + W - 6, o[1] + 20, 2, H - 20, C.woodDark);
            rect(g, o[0] + 52, o[1] - 6, 8, 16, C.brickDark); rect(g, o[0] + 51, o[1] - 8, 10, 3, C.brick);
            roof(g, o[0], o[1] + 2, W, 22, "teal");
            doorAt(g, o[0] + 34, o[1] + H - 17, 12, 17, C.tealDark);
            windowAt(g, o[0] + 10, o[1] + 34, 12, 11, true, L, o[0], o[1]);
            windowAt(g, o[0] + 56, o[1] + 34, 12, 11, true, L, o[0], o[1]);
            // gear sign
            disc(g, o[0] + 40, o[1] + 29, 5, C.yellowDark); disc(g, o[0] + 40, o[1] + 29, 3, C.yellow); disc(g, o[0] + 40, o[1] + 29, 1, C.ink);
            for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; rect(g, o[0] + 40 + Math.round(Math.cos(an) * 6) - 1, o[1] + 29 + Math.round(Math.sin(an) * 6) - 1, 2, 2, C.yellowDark); }
            L.push({ x: o[0] + 40, y: o[1] + H - 4, r: 24, color: "#ffd37a", a: 0.8 });
        },
        tower: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 3, o[1] + 12, W - 6, H - 12, "#6f8fb8");
            rect(g, o[0] + 3, o[1] + 12, 3, H - 12, "#8fb0d6"); rect(g, o[0] + W - 6, o[1] + 12, 3, H - 12, "#56759c");
            rect(g, o[0], o[1] + 8, W, 6, "#3d5a80"); rect(g, o[0], o[1] + 8, W, 2, "#5b7ba3");
            rect(g, o[0] + 30, o[1] - 14, 2, 22, C.ink);
            rect(g, o[0] + 29, o[1] - 17, 4, 3, C.coral);
            rect(g, o[0] + 6, o[1] + 2, 10, 7, "#8d96b3"); rect(g, o[0] + 8, o[1] + 4, 6, 1, "#5b6285");
            for (var r = 0; r < 6; r++) {
                for (var c = 0; c < 4; c++) {
                    var wx = o[0] + 8 + c * 13, wy = o[1] + 18 + r * 11;
                    if (wy > o[1] + H - 24) continue;
                    var lit = hash(c, r, 5) < 0.4;
                    rect(g, wx - 1, wy - 1, 11, 9, "#3d5a80");
                    rect(g, wx, wy, 9, 7, lit ? C.lit : "#bfe3ff");
                    if (!lit) rect(g, wx, wy + 5, 9, 2, "#8fc7ee");
                    rect(g, wx + 4, wy, 1, 7, "#3d5a80");
                    if (lit) L.push({ x: wx + 4, y: wy + 3, r: 14, color: "#ffd37a", a: 0.6 });
                }
            }
            for (var s = 0; s < 28; s += 4) { rect(g, o[0] + 18 + s, o[1] + H - 24, 4, 5, s % 8 ? "#ffffff" : C.blue); }
            rect(g, o[0] + 18, o[1] + H - 19, 28, 1, "rgba(20,18,60,0.3)");
            doorAt(g, o[0] + 33, o[1] + H - 15, 12, 15, "#bfe3ff");
            rect(g, o[0] + 39, o[1] + H - 15, 1, 15, C.ink);
        },
        post: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 16, W - 4, H - 16, C.cream);
            rect(g, o[0] + 2, o[1] + H - 4, W - 4, 4, C.creamDark);
            rect(g, o[0] + W - 6, o[1] + 16, 4, H - 16, C.creamDark);
            roof(g, o[0], o[1], W, 20, "pink");
            rect(g, o[0] + 25, o[1] + 22, 14, 9, "#ffffff"); rect(g, o[0] + 25, o[1] + 22, 14, 1, C.ink); rect(g, o[0] + 25, o[1] + 30, 14, 1, C.ink);
            rect(g, o[0] + 25, o[1] + 22, 1, 9, C.ink); rect(g, o[0] + 38, o[1] + 22, 1, 9, C.ink);
            line(g, o[0] + 26, o[1] + 23, o[0] + 31, o[1] + 27, C.coral); line(g, o[0] + 37, o[1] + 23, o[0] + 32, o[1] + 27, C.coral);
            doorAt(g, o[0] + 20, o[1] + H - 15, 9, 15, C.coral);
            windowAt(g, o[0] + 6, o[1] + 28, 9, 8, true, L, o[0], o[1]);
            rect(g, o[0] + 52, o[1] + H - 14, 8, 11, C.blue); rect(g, o[0] + 52, o[1] + H - 14, 8, 2, C.blueDark);
            rect(g, o[0] + 54, o[1] + H - 10, 4, 1, C.ink); rect(g, o[0] + 59, o[1] + H - 18, 1, 6, C.ink); rect(g, o[0] + 59, o[1] + H - 18, 3, 2, C.coral);
        },
        ice: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 14, W - 4, H - 14, "#bfe3f7");
            for (var y = 0; y < H - 14; y += 8) {
                rect(g, o[0] + 2, o[1] + 14 + y + 7, W - 4, 1, "#8fc4e6");
                for (var x = (y / 8) % 2 ? 6 : 14; x < W - 4; x += 16) rect(g, o[0] + 2 + x, o[1] + 14 + y, 1, 8, "#8fc4e6");
            }
            rect(g, o[0] + 3, o[1] + 15, 12, 2, "#ffffff88");
            roof(g, o[0], o[1], W, 18, "ice");
            for (var s = 0; s < W; s += 5) rect(g, o[0] + s, o[1] + 18, 2, 3 + ((hash(s, 1, 2) * 4) | 0), "#ffffff");
            doorAt(g, o[0] + 20, o[1] + H - 15, 9, 15, "#3269d6");
            // snowflake sign
            var fx = o[0] + 42, fy = o[1] + 32;
            for (var a = 0; a < 6; a++) { var an = a * Math.PI / 3; line(g, fx, fy, fx + Math.round(Math.cos(an) * 5), fy + Math.round(Math.sin(an) * 5), "#ffffff"); }
            disc(g, fx, fy, 1, "#ffffff");
            windowAt(g, o[0] + 6, o[1] + 28, 9, 8, true, L, o[0], o[1], "#9ff2ff");
            rect(g, o[0] + 2, o[1] + H - 3, 18, 3, C.snow); rect(g, o[0] + 40, o[1] + H - 4, 20, 4, C.snow);
        },
        lab: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 16, W - 4, H - 16, C.cream);
            rect(g, o[0] + 2, o[1] + H - 4, W - 4, 4, C.creamDark);
            rect(g, o[0] + 2, o[1] + 16, W - 4, 2, C.violetDark);
            roof(g, o[0], o[1], W, 20, "violet");
            rect(g, o[0] + 46, o[1] - 6, 6, 8, C.violetDark); rect(g, o[0] + 45, o[1] - 8, 8, 3, C.violet);
            doorAt(g, o[0] + 20, o[1] + H - 15, 9, 15, C.violet);
            rect(g, o[0] + 36, o[1] + 22, 22, 17, C.ink);
            rect(g, o[0] + 37, o[1] + 23, 20, 15, "#10122e");
            disc(g, o[0] + 8, o[1] + H - 6, 4, C.hedge); disc(g, o[0] + 8, o[1] + H - 7, 3, C.hedgeLight); rect(g, o[0] + 7, o[1] + H - 3, 2, 3, C.woodDark);
            disc(g, o[0] + 58, o[1] + H - 6, 4, C.hedge); disc(g, o[0] + 58, o[1] + H - 7, 3, C.hedgeLight); rect(g, o[0] + 57, o[1] + H - 3, 2, 3, C.woodDark);
            L.push({ x: o[0] + 47, y: o[1] + 30, r: 28, color: "#ff9ad8", a: 0.8 });
            L.push({ x: o[0] + 24, y: o[1] + H - 4, r: 20, color: "#ffd37a", a: 0.6 });
        },
        cinema: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 22, W - 4, H - 22, "#7a1e3d");
            rect(g, o[0] + 2, o[1] + 22, W - 4, 2, "#a63358");
            rect(g, o[0], o[1] + 4, W, 20, "#2a2150");
            for (var s = 0; s < W; s += 8) { rect(g, o[0] + s + 2, o[1] + 8, 3, 3, C.gold); rect(g, o[0] + s + 3, o[1] + 14, 1, 1, "#ffffff"); }
            rect(g, o[0] + 2, o[1] + 22, W - 4, 3, C.ink);
            rect(g, o[0] + 6, o[1] + 26, W - 12, 15, C.yellow);
            rect(g, o[0] + 6, o[1] + 26, W - 12, 2, "#fff3b0");
            rect(g, o[0] + 6, o[1] + 39, W - 12, 2, C.yellowDark);
            rect(g, o[0] + 8, o[1] + 29, W - 16, 9, C.ink);
            text(g, "BINGO", o[0] + 15, o[1] + 29, C.coral, 2);
            for (var p = 0; p < 2; p++) {
                var px = o[0] + (p ? W - 20 : 8);
                rect(g, px, o[1] + H - 24, 12, 16, C.ink);
                rect(g, px + 1, o[1] + H - 23, 10, 14, p ? "#37d6e8" : "#ff7ac8");
                rect(g, px + 1, o[1] + H - 17, 10, 8, p ? "#4d8dff" : "#8e63ff");
                disc(g, px + 6, o[1] + H - 19, 2, C.gold);
            }
            doorAt(g, o[0] + 34, o[1] + H - 18, 12, 18, "#2a2150");
            rect(g, o[0] + 39, o[1] + H - 18, 1, 18, C.gold);
            L.push({ x: o[0] + 40, y: o[1] + 33, r: 44, color: "#ffd35a", a: 0.9 });
        },
        school: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 14, W - 4, H - 14, C.brick);
            for (var y = 0; y < H - 14; y += 4) {
                rect(g, o[0] + 2, o[1] + 14 + y + 3, W - 4, 1, C.brickDark);
                for (var x = (y / 4) % 2 ? 4 : 0; x < W - 4; x += 8) rect(g, o[0] + 2 + x, o[1] + 14 + y, 1, 3, C.brickDark);
            }
            rect(g, o[0] + 2, o[1] + 14, W - 4, 2, C.brickLight);
            rect(g, o[0], o[1] + 12, W, 4, "#4a3b78");
            rect(g, o[0] + 30, o[1] - 2, 20, 16, C.cream); rect(g, o[0] + 30, o[1] - 2, 20, 2, C.creamDark);
            rect(g, o[0] + 36, o[1] + 2, 8, 10, C.ink); disc(g, o[0] + 40, o[1] + 8, 3, C.gold);
            for (var r = 0; r < 8; r++) rect(g, o[0] + 28 + r, o[1] - 10 + r, 24 - r * 2, 1, r % 2 ? C.coralDark : C.coral);
            rect(g, o[0] + 66, o[1] - 10, 1, 24, C.ink); rect(g, o[0] + 67, o[1] - 10, 8, 5, C.blue); rect(g, o[0] + 67, o[1] - 10, 8, 1, "#8fb8ff");
            for (var w2 = 0; w2 < 4; w2++) {
                var wx = o[0] + [8, 20, 52, 64][w2];
                windowAt(g, wx, o[1] + 22, 8, 12, w2 % 2 === 0, L, o[0], o[1]);
            }
            doorAt(g, o[0] + 34, o[1] + H - 14, 12, 14, C.woodLight);
            rect(g, o[0] + 33, o[1] + H - 18, 14, 3, C.ink); rect(g, o[0] + 36, o[1] + H - 21, 8, 3, C.ink); line(g, o[0] + 44, o[1] + H - 20, o[0] + 46, o[1] + H - 16, C.gold);
        },
        library: function (g, b, L) {
            var o = [4, 20], W = b.w * T, H = b.h * T;
            rect(g, o[0] + 2, o[1] + 16, W - 4, H - 16, "#d8cba8");
            rect(g, o[0] + 2, o[1] + H - 4, W - 4, 4, "#bfae85");
            roof(g, o[0], o[1], W, 20, "green");
            doorAt(g, o[0] + 20, o[1] + H - 15, 9, 15, C.greenDark);
            rect(g, o[0] + 34, o[1] + 22, 24, 17, C.ink);
            rect(g, o[0] + 35, o[1] + 23, 22, 15, "#3b2a1a");
            var colors = [C.coral, C.blue, C.yellow, C.green, C.violet, C.pink, C.teal];
            for (var sh = 0; sh < 2; sh++) {
                rect(g, o[0] + 35, o[1] + 30 + sh * 0 + (sh ? 0 : -7), 22, 1, C.wood);
                for (var bk = 0; bk < 10; bk++) rect(g, o[0] + 36 + bk * 2, o[1] + (sh ? 31 : 24), 2, 6, colors[(bk + sh * 3) % colors.length]);
            }
            rect(g, o[0] + 8, o[1] + 24, 8, 8, C.ink); rect(g, o[0] + 9, o[1] + 25, 6, 6, "#fff"); rect(g, o[0] + 11, o[1] + 25, 1, 6, C.ink);
            rect(g, o[0] + 34, o[1] + 38, 24, 3, C.wood); dot(g, o[0] + 38, o[1] + 37, C.pink); dot(g, o[0] + 48, o[1] + 37, C.yellow); dot(g, o[0] + 52, o[1] + 37, C.pink);
            L.push({ x: o[0] + 46, y: o[1] + 30, r: 26, color: "#ffd37a", a: 0.7 });
        }
    };

    function buildingSprite(b) {
        var W = b.w * T + 8, H = b.h * T + 24;
        var s = canvas(W, H), lights = [];
        shadow(s.g, W / 2 + 2, H - 2, b.w * T / 2 - 1, 3);
        PAINTERS[b.kind](s.g, b, lights);
        return { c: s.c, ax: 4, ay: 20, lights: lights };
    }

    /* ---------- characters (drawn live) ---------- */

    function drawPlayer(g, x, y, dir, frame, dig) {
        x = Math.round(x); y = Math.round(y);
        shadow(g, x, y, 5, 2);
        var step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
        var side = dir === "left" || dir === "right";
        var f = dir === "left" ? -1 : 1;
        // legs
        rect(g, x - 4, y - 4 + (step === 1 ? -1 : 0), 3, 4 + (step === 1 ? 1 : 0), C.pants);
        rect(g, x + 1, y - 4 + (step === -1 ? -1 : 0), 3, 4 + (step === -1 ? 1 : 0), C.pants);
        rect(g, x - 4, y - 1 + (step === 1 ? -1 : 0), 3, 1, "#fff"); rect(g, x + 1, y - 1 + (step === -1 ? -1 : 0), 3, 1, "#fff");
        if (side) {
            rect(g, x - 3, y - 4, 6, 4, C.pants);
            rect(g, x - 3 + (step ? step * 1 : 0), y - 1, 3, 1, "#fff"); rect(g, x + (step ? -step : 0), y - 1, 3, 1, "#fff");
        }
        // backpack
        if (dir === "up") rect(g, x - 4, y - 11, 8, 6, C.gold);
        if (side) rect(g, f > 0 ? x - 7 : x + 4, y - 11, 3, 6, C.gold);
        // body
        rect(g, x - 5, y - 11, 10, 7, C.hoodie);
        rect(g, x - 5, y - 6, 10, 2, C.hoodieDark);
        if (dir === "down") rect(g, x - 1, y - 11, 2, 4, "#ff8fb8");
        // arms
        var armSwing = step;
        rect(g, x - 7, y - 10 + (armSwing === 1 ? 1 : 0), 2, 5, C.hoodie); rect(g, x + 5, y - 10 + (armSwing === -1 ? 1 : 0), 2, 5, C.hoodie);
        rect(g, x - 7, y - 6 + (armSwing === 1 ? 1 : 0), 2, 1, C.skin); rect(g, x + 5, y - 6 + (armSwing === -1 ? 1 : 0), 2, 1, C.skin);
        // head
        rect(g, x - 5, y - 18, 10, 8, C.skin);
        rect(g, x - 6, y - 19, 12, 4, C.hair);
        rect(g, x - 6, y - 16, 2, 3, C.hair); rect(g, x + 4, y - 16, 2, 3, C.hair);
        rect(g, x + (side ? -f * 1 : 2), y - 21, 3, 2, C.hair);
        if (dir === "up") rect(g, x - 6, y - 19, 12, 9, C.hair);
        else if (dir === "down") {
            rect(g, x - 3, y - 14, 2, 2, C.ink); rect(g, x + 1, y - 14, 2, 2, C.ink);
            dot(g, x - 4, y - 12, "#ff9ab0"); dot(g, x + 3, y - 12, "#ff9ab0");
        } else {
            rect(g, x + (f > 0 ? 1 : -3), y - 14, 2, 2, C.ink);
            rect(g, f > 0 ? x - 6 : x + 1, y - 17, 5, 6, C.hair);
        }
        if (dig) {
            // shovel
            var sx = x + 7, bob = Math.round(dig * 4);
            rect(g, sx, y - 12 + bob, 1, 12, C.woodLight);
            rect(g, sx - 2, y - 14 + bob, 5, 2, C.woodDark);
            rect(g, sx - 2, y - 1 + bob, 5, 4, "#b9c0d8"); rect(g, sx - 2, y - 1 + bob, 5, 1, "#e5e9f5");
        }
    }

    function drawCat(g, x, y, dir, frame, sit, now) {
        x = Math.round(x); y = Math.round(y);
        shadow(g, x, y, 6, 2);
        var f = dir === "left" ? -1 : 1;
        var orange = "#ff9f43", dark = "#e07a1f", cream = "#fff3d6";
        if (sit) {
            rect(g, x - 4, y - 8, 8, 8, orange); rect(g, x - 2, y - 6, 4, 6, cream);
            rect(g, x - 4, y - 14, 8, 6, orange); rect(g, x - 4, y - 16, 2, 3, orange); rect(g, x + 2, y - 16, 2, 3, orange);
            rect(g, x - 3, y - 12, 2, 2, C.ink); rect(g, x + 1, y - 12, 2, 2, C.ink); dot(g, x, y - 10, C.pink);
            var wag = Math.round(Math.sin(now / 400) * 2);
            rect(g, x + 4, y - 3, 4, 2, dark); rect(g, x + 7 + wag, y - 6, 2, 4, dark);
            rect(g, x - 4, y - 8, 8, 1, dark);
        } else {
            var step = frame % 2;
            rect(g, x - 6, y - 7, 12, 5, orange);
            rect(g, x - 6, y - 7, 12, 1, dark); rect(g, x - 2, y - 7, 1, 5, dark); rect(g, x + 2, y - 7, 1, 5, dark);
            rect(g, x - 5, y - 2 + step, 2, 2, orange); rect(g, x + 3, y - 2 + (1 - step), 2, 2, orange);
            rect(g, x - 3, y - 2 + (1 - step), 2, 2, dark); rect(g, x + 1, y - 2 + step, 2, 2, dark);
            var hx = x + f * 6;
            rect(g, hx - 3, y - 11, 6, 6, orange); rect(g, hx - 3, y - 13, 2, 3, orange); rect(g, hx + 1, y - 13, 2, 3, orange);
            dot(g, hx + f, y - 9, C.ink); dot(g, hx + f * 2 - (f > 0 ? 0 : 1), y - 9, C.ink);
            rect(g, x - f * 7, y - 10, 2, 4, dark); rect(g, x - f * 7, y - 11, 2, 2, orange);
        }
    }

    function drawButterfly(g, x, y, now, seed) {
        var flap = ((now / 120 + seed) | 0) % 2;
        var col = [C.pink, C.yellow, "#9f8bff", "#7fe0c8"][seed % 4];
        x = Math.round(x); y = Math.round(y);
        rect(g, x, y, 1, 2, C.ink);
        if (flap) { rect(g, x - 2, y - 1, 2, 2, col); rect(g, x + 1, y - 1, 2, 2, col); }
        else { rect(g, x - 1, y, 1, 2, col); rect(g, x + 1, y, 1, 2, col); }
    }

    /* ---------- night lighting ---------- */

    function drawNight(ctx, dk, vw, vh, lights, camX, camY, now, strength, beamAngle) {
        var g = dk.g;
        g.globalCompositeOperation = "source-over";
        var k = strength;
        var r = Math.round(255 - (255 - 70) * k), gg = Math.round(255 - (255 - 80) * k), b = Math.round(255 - (255 - 150) * k);
        g.fillStyle = "rgb(" + r + "," + gg + "," + b + ")";
        g.fillRect(0, 0, vw, vh);
        g.globalCompositeOperation = "lighter";
        lights.forEach(function (l) {
            var x = l.x - camX, y = l.y - camY, rad = l.r * (l.flicker ? 1 + 0.04 * Math.sin(now / 90 + x) : 1);
            if (x < -rad - 60 || y < -rad - 60 || x > vw + rad + 60 || y > vh + rad + 60) return;
            var gr = g.createRadialGradient(x, y, 0, x, y, rad);
            var col = l.color || "#ffd89a";
            gr.addColorStop(0, hexA(col, Math.min(1, (l.a || 1) * k + (1 - k) * 0)));
            gr.addColorStop(1, hexA(col, 0));
            g.fillStyle = gr;
            g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
            if (l.beam) {
                for (var s = 0; s < 2; s++) {
                    var a = beamAngle + s * Math.PI;
                    var bx = x + Math.cos(a) * 150, by = y + Math.sin(a) * 150;
                    var gr2 = g.createLinearGradient(x, y, bx, by);
                    gr2.addColorStop(0, hexA("#ffe9a0", 0.9 * k));
                    gr2.addColorStop(1, hexA("#ffe9a0", 0));
                    g.fillStyle = gr2;
                    g.beginPath();
                    g.moveTo(x, y);
                    g.lineTo(x + Math.cos(a - 0.12) * 150, y + Math.sin(a - 0.12) * 150);
                    g.lineTo(x + Math.cos(a + 0.12) * 150, y + Math.sin(a + 0.12) * 150);
                    g.closePath();
                    g.fill();
                }
            }
        });
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(dk.c, 0, 0);
        ctx.globalCompositeOperation = "source-over";
    }

    function hexA(hex, a) {
        var n = parseInt(hex.slice(1), 16);
        return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + Math.max(0, Math.min(1, a)) + ")";
    }

    /* ---------- assembly ---------- */

    function create(world) {
        var art = { T: T, C: C, land: paintLand(world), spr: {}, buildingSprites: {}, lights: [] };
        art.spr.tree = [treeSprite(0), treeSprite(1), treeSprite(2)];
        art.spr.palm = [palmSprite(0), palmSprite(1)];
        art.spr.bush = [bushSprite(0), bushSprite(1)];
        art.spr.mushroom = [mushroomSprite(0), mushroomSprite(1), mushroomSprite(2)];
        art.spr.rock = [rockSprite(0), rockSprite(1)];
        art.spr.barrel = [barrelSprite()];
        art.spr.lamp = [lampSprite()];
        art.spr.fence = [fenceSprite()];
        art.spr.pedestal = [pedestalSprite(false), pedestalSprite(true)];
        art.spr.sign = [signSprite(0), signSprite(1), signSprite(2)];
        art.spr.owl = [owlSprite(false), owlSprite(true)];
        art.spr.chest = [chestSprite(false), chestSprite(true)];
        art.spr.dig = [digSprite(0), digSprite(1)];
        art.spr.boat = [boatSprite()];
        art.spr.bottle = [bottleSprite()];
        world.buildings.forEach(function (b) {
            var s = buildingSprite(b);
            art.buildingSprites[b.id] = s;
            s.lights.forEach(function (l) { art.lights.push({ x: b.x * T - 4 + l.x, y: b.y * T - 20 + l.y, r: l.r, color: l.color, a: l.a, beam: l.beam }); });
        });
        world.lamps.forEach(function (l) { art.lights.push({ x: (l.tx + 0.5) * T, y: (l.ty + 1) * T - 24, r: 38, color: "#ffd89a", a: 0.95, flicker: true }); });
        return art;
    }

    root.IslandArt = {
        T: T, C: C, create: create, drawOcean: drawOcean, drawPlayer: drawPlayer, drawCat: drawCat, drawButterfly: drawButterfly,
        drawNight: drawNight, canvas: canvas, rect: rect, dot: dot, disc: disc, ell: ell, line: line, hash: hash, hexA: hexA, shadow: shadow
    };
})(typeof window !== "undefined" ? window : this);
