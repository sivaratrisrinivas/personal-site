/*
 * The island: land shape, buildings, roads, a hedge-maze garden, buried details, decor, collision
 * and pathfinding. Deterministic and DOM-free so it runs in the browser (window.IslandWorld) and
 * under `node --test`. All coordinates are tiles unless a name ends in Px.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory(require("./maze.js"), require("./lore.js"));
    else root.IslandWorld = factory(root.HedgeMaze, root.IslandLore);
})(typeof self !== "undefined" ? self : this, function (M, Lore) {
    "use strict";

    var T = 16, W = 48, H = 36, OX = 2, OY = 2;
    var WATER = 0, GRASS = 1, SAND = 2, PATH = 3, PLAZA = 4, PLANK = 5, HEDGE = 6, GARDEN = 7, SNOW = 8;
    var GARDEN_N = 5;

    /* Layout is written on a 44 x 34 base grid and shifted by (OX, OY) so there is an ocean margin. */
    var BUILDINGS = [
        { id: "profile", x: 34, y: 3, w: 3, h: 5, door: 1 },
        { id: "independent", x: 8, y: 5, w: 5, h: 4, door: 2 },
        { id: "accenture", x: 19, y: 2, w: 4, h: 6, door: 2 },
        { id: "library", x: 27, y: 5, w: 4, h: 3, door: 1 },
        { id: "better-auth", x: 4, y: 14, w: 4, h: 3, door: 1 },
        { id: "bingo", x: 36, y: 15, w: 5, h: 4, door: 2 },
        { id: "go-ethereum", x: 8, y: 22, w: 4, h: 3, door: 1 },
        { id: "unmaze", x: 15, y: 22, w: 4, h: 3, door: 1 },
        { id: "school", x: 36, y: 24, w: 5, h: 3, door: 2 }
    ];

    var BLOBS = [
        [22, 17, 19, 11.5], [35, 8, 6.5, 6.5], [21, 5, 8, 5.5], [29, 7, 5, 5], [11, 9, 7.5, 7.5],
        [6, 15, 5.5, 5.5], [11, 24, 7, 7], [26, 26, 13, 6.5], [38, 25, 6.5, 6.5], [38, 17, 6.5, 6.5]
    ];

    var PLAZA_C = [22, 16];
    var GARDEN_AT = [23, 20];
    var PEN = { x0: 12, y0: 10, x1: 16, y1: 14, gate: 14 };
    var DOCK = { x: 20, y1: 33 };

    function idx(x, y) { return y * W + x; }
    function inb(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

    function build() {
        var rng = M.mulberry32(20241006);
        var tiles = new Uint8Array(W * H);
        var solid = new Uint8Array(W * H);
        var taken = new Uint8Array(W * H); // keep-out around buildings, roads, interactables
        var decorTaken = new Uint8Array(W * H);

        function get(x, y) { return inb(x, y) ? tiles[idx(x, y)] : WATER; }
        function isLand(x, y) { var t = get(x, y); return t !== WATER && t !== PLANK; }
        function open(x, y) { return inb(x, y) && !solid[idx(x, y)] && tiles[idx(x, y)] !== WATER; }

        // ---- land from overlapping blobs, then eroded edges ----
        BLOBS.forEach(function (b) {
            for (var y = 0; y < H; y++) {
                for (var x = 0; x < W; x++) {
                    var dx = (x - OX + 0.5 - b[0]) / b[2], dy = (y - OY + 0.5 - b[1]) / b[3];
                    if (dx * dx + dy * dy <= 1) tiles[idx(x, y)] = GRASS;
                }
            }
        });

        var protectedRects = [];
        BUILDINGS.forEach(function (b) { protectedRects.push([b.x - 2, b.y - 2, b.w + 4, b.h + 5]); });
        protectedRects.push([GARDEN_AT[0] - 2, GARDEN_AT[1] - 3, 2 * GARDEN_N + 1 + 4, 2 * GARDEN_N + 1 + 5]);
        protectedRects.push([PLAZA_C[0] - 4, PLAZA_C[1] - 4, 9, 9]);
        protectedRects.push([PEN.x0 - 1, PEN.y0 - 1, PEN.x1 - PEN.x0 + 3, PEN.y1 - PEN.y0 + 4]);
        protectedRects.push([DOCK.x - 3, 26, 8, 9]);
        function isProtected(x, y) {
            var bx = x - OX, by = y - OY;
            return protectedRects.some(function (r) { return bx >= r[0] && by >= r[1] && bx < r[0] + r[2] && by < r[1] + r[3]; });
        }

        var erode = [];
        for (var y = 1; y < H - 1; y++) {
            for (var x = 1; x < W - 1; x++) {
                if (tiles[idx(x, y)] === WATER || isProtected(x, y)) continue;
                var edge = tiles[idx(x + 1, y)] === WATER || tiles[idx(x - 1, y)] === WATER || tiles[idx(x, y + 1)] === WATER || tiles[idx(x, y - 1)] === WATER;
                if (edge && rng() < 0.22) erode.push(idx(x, y));
            }
        }
        erode.forEach(function (i) { tiles[i] = WATER; });

        // keep only the largest landmass, fill one-tile bays
        var comp = new Int32Array(W * H).fill(-1), sizes = [];
        for (var s = 0; s < W * H; s++) {
            if (tiles[s] === WATER || comp[s] !== -1) continue;
            var stack = [s], count = 0;
            comp[s] = sizes.length;
            while (stack.length) {
                var u = stack.pop(), ux = u % W, uy = (u / W) | 0;
                count++;
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                    var vx = ux + d[0], vy = uy + d[1];
                    if (inb(vx, vy) && tiles[idx(vx, vy)] !== WATER && comp[idx(vx, vy)] === -1) {
                        comp[idx(vx, vy)] = sizes.length;
                        stack.push(idx(vx, vy));
                    }
                });
            }
            sizes.push(count);
        }
        var main = sizes.indexOf(Math.max.apply(null, sizes));
        for (var k = 0; k < W * H; k++) if (tiles[k] !== WATER && comp[k] !== main) tiles[k] = WATER;
        for (var y2 = 1; y2 < H - 1; y2++) {
            for (var x2 = 1; x2 < W - 1; x2++) {
                if (tiles[idx(x2, y2)] !== WATER) continue;
                var land4 = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) { return tiles[idx(x2 + d[0], y2 + d[1])] !== WATER; }).length;
                if (land4 >= 3) tiles[idx(x2, y2)] = GRASS;
            }
        }
        // sand along the shore
        var shore = [];
        for (var y3 = 0; y3 < H; y3++) {
            for (var x3 = 0; x3 < W; x3++) {
                if (tiles[idx(x3, y3)] === WATER) continue;
                var wet = false;
                for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) if (get(x3 + ox, y3 + oy) === WATER) wet = true;
                if (wet) shore.push(idx(x3, y3));
            }
        }
        shore.forEach(function (i) { tiles[i] = SAND; });

        // ---- the hedge garden (the unmaze maze, grown with Wilson's algorithm) ----
        var gx0 = GARDEN_AT[0] + OX, gy0 = GARDEN_AT[1] + OY, gsize = 2 * GARDEN_N + 1;
        var gseed = 1, maze;
        for (; gseed < 400; gseed++) {
            maze = M.generate(gseed, GARDEN_N);
            if (maze.entrance < gsize && maze.solution.length >= 24) break; // gap in the top row, a worthwhile walk
        }
        for (var my = -1; my <= gsize; my++) {
            for (var mx = -1; mx <= gsize; mx++) {
                if (inb(gx0 + mx, gy0 + my)) tiles[idx(gx0 + mx, gy0 + my)] = GRASS;
            }
        }
        for (var gy = 0; gy < gsize; gy++) {
            for (var gx = 0; gx < gsize; gx++) {
                var wall = maze.walls[gy * gsize + gx];
                tiles[idx(gx0 + gx, gy0 + gy)] = wall ? HEDGE : GARDEN;
                solid[idx(gx0 + gx, gy0 + gy)] = wall ? 1 : 0;
            }
        }
        var gEntrance = [gx0 + (maze.entrance % gsize), gy0];
        var gHeart = [gx0 + (maze.heart % gsize), gy0 + ((maze.heart / gsize) | 0)];

        // ---- buildings ----
        var buildings = BUILDINGS.map(function (b) {
            var x = b.x + OX, y = b.y + OY;
            for (var yy = y; yy < y + b.h; yy++) {
                for (var xx = x; xx < x + b.w; xx++) {
                    if (tiles[idx(xx, yy)] === WATER) tiles[idx(xx, yy)] = GRASS;
                    solid[idx(xx, yy)] = 1;
                    taken[idx(xx, yy)] = 1;
                }
            }
            var lore = Lore.SPOTS[b.id];
            return {
                id: b.id, kind: lore.kind, roof: lore.roof, x: x, y: y, w: b.w, h: b.h,
                doorX: x + b.door, doorY: y + b.h - 1, frontX: x + b.door, frontY: y + b.h
            };
        });
        var byId = {};
        buildings.forEach(function (b) { byId[b.id] = b; });

        // ---- plaza ----
        var pcx = PLAZA_C[0] + OX, pcy = PLAZA_C[1] + OY;
        for (var py = -2; py <= 2; py++) {
            for (var px = -2; px <= 2; px++) {
                if (Math.abs(px) === 2 && Math.abs(py) === 2) continue;
                tiles[idx(pcx + px, pcy + py)] = PLAZA;
            }
        }

        // ---- the refusal pen: a fenced patch with one button on a pedestal ----
        var fences = [];
        for (var fy = PEN.y0; fy <= PEN.y1; fy++) {
            for (var fx = PEN.x0; fx <= PEN.x1; fx++) {
                var ring = fx === PEN.x0 || fx === PEN.x1 || fy === PEN.y0 || fy === PEN.y1;
                if (!ring || (fy === PEN.y1 && fx === PEN.gate)) continue;
                var tx = fx + OX, ty = fy + OY;
                if (tiles[idx(tx, ty)] === WATER) tiles[idx(tx, ty)] = GRASS;
                solid[idx(tx, ty)] = 1;
                taken[idx(tx, ty)] = 1;
                fences.push({ tx: tx, ty: ty });
            }
        }
        var pedestal = { tx: Math.round((PEN.x0 + PEN.x1) / 2) + OX, ty: Math.round((PEN.y0 + PEN.y1) / 2) + OY };
        solid[idx(pedestal.tx, pedestal.ty)] = 1;
        taken[idx(pedestal.tx, pedestal.ty)] = 1;

        // ---- roads: cheapest route with few turns from every door to the plaza ----
        function carve(sx, sy) {
            var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            var dist = new Float64Array(W * H * 4).fill(Infinity), prev = new Int32Array(W * H * 4).fill(-1);
            var heap = [];
            function push(cost, state) {
                heap.push([cost, state]);
                var i = heap.length - 1;
                while (i > 0) {
                    var p = (i - 1) >> 1;
                    if (heap[p][0] <= heap[i][0]) break;
                    var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp; i = p;
                }
            }
            function pop() {
                var top = heap[0], last = heap.pop();
                if (heap.length) {
                    heap[0] = last;
                    var i = 0;
                    for (;;) {
                        var l = 2 * i + 1, r = l + 1, m = i;
                        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
                        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
                        if (m === i) break;
                        var t2 = heap[m]; heap[m] = heap[i]; heap[i] = t2; i = m;
                    }
                }
                return top;
            }
            for (var d0 = 0; d0 < 4; d0++) { dist[idx(sx, sy) * 4 + d0] = 0; push(0, idx(sx, sy) * 4 + d0); }
            var goal = -1;
            while (heap.length) {
                var cur = pop(), c = cur[0], st = cur[1];
                if (c > dist[st]) continue;
                var cell = (st / 4) | 0, dir = st % 4, cx = cell % W, cy = (cell / W) | 0;
                if (tiles[cell] === PLAZA) { goal = st; break; }
                for (var d = 0; d < 4; d++) {
                    var nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
                    if (!inb(nx, ny)) continue;
                    var nt = tiles[idx(nx, ny)];
                    if (solid[idx(nx, ny)] || nt === WATER || nt === HEDGE || nt === GARDEN || nt === PLANK) continue;
                    var step = nt === PATH ? 1 : nt === PLAZA ? 1 : 3;
                    var nc = c + step + (d === dir ? 0 : 4);
                    var ns = idx(nx, ny) * 4 + d;
                    if (nc < dist[ns]) { dist[ns] = nc; prev[ns] = st; push(nc, ns); }
                }
            }
            var path = [];
            for (var s2 = goal; s2 !== -1; s2 = prev[s2]) path.push((s2 / 4) | 0);
            return path.reverse();
        }
        function paint(path) {
            path.forEach(function (cell, i) {
                var x = cell % W, y = (cell / W) | 0;
                if (tiles[cell] === GRASS || tiles[cell] === SAND) tiles[cell] = PATH;
                var next = path[i + 1];
                if (next === undefined) return;
                var horizontal = ((next / W) | 0) === y;
                var wx = horizontal ? x : x + 1, wy = horizontal ? y + 1 : y;
                if (inb(wx, wy) && !solid[idx(wx, wy)] && (tiles[idx(wx, wy)] === GRASS || tiles[idx(wx, wy)] === SAND)) tiles[idx(wx, wy)] = PATH;
            });
        }
        buildings.forEach(function (b) { paint(carve(b.frontX, b.frontY)); });
        paint(carve(gEntrance[0], gEntrance[1] - 1));

        // ---- dock over the south shore ----
        var dockX = DOCK.x + OX, dockEnd = DOCK.y1 + OY;
        var shoreY = 0;
        for (var sy = 20 + OY; sy < dockEnd; sy++) if (tiles[idx(dockX, sy)] === WATER) { shoreY = sy; break; }
        for (var dy = shoreY - 1; dy <= dockEnd; dy++) {
            [0, 1].forEach(function (o) {
                tiles[idx(dockX + o, dy)] = PLANK;
                solid[idx(dockX + o, dy)] = 0;
                taken[idx(dockX + o, dy)] = 1;
            });
        }
        // join the dock to the roads
        paint(carve(dockX, shoreY - 2));
        byId.dock = { id: "dock", kind: "dock", x: dockX, y: shoreY - 1, w: 2, h: dockEnd - shoreY + 2, frontX: dockX, frontY: dockEnd };

        // ---- snow around the ice house ----
        var ice = byId["go-ethereum"], icx = ice.x + ice.w / 2, icy = ice.y + ice.h / 2;
        for (var ny = ice.y - 4; ny <= ice.y + ice.h + 5; ny++) {
            for (var nx2 = ice.x - 5; nx2 <= ice.x + ice.w + 5; nx2++) {
                var tt = get(nx2, ny);
                var chance = 1.25 - Math.hypot(nx2 + 0.5 - icx, (ny + 0.5 - icy) * 1.3) / 4.6; // solid at the house, ragged at the edge
                if ((tt === GRASS || tt === SAND) && !solid[idx(nx2, ny)] && rng() < chance) tiles[idx(nx2, ny)] = SNOW;
            }
        }

        // ---- interactables ----
        var interactables = [];
        var spawn = { x: pcx, y: pcy + 3 };

        function keepOut(tx, ty, r) {
            for (var yy = ty - r; yy <= ty + r; yy++) for (var xx = tx - r; xx <= tx + r; xx++) if (inb(xx, yy)) taken[idx(xx, yy)] = 1;
        }
        function plain(tx, ty) {
            var t = get(tx, ty);
            return inb(tx, ty) && (t === GRASS || t === SAND || t === SNOW) && !solid[idx(tx, ty)] && !taken[idx(tx, ty)];
        }
        function nearestPlain(tx, ty, maxR) {
            for (var r = 0; r <= maxR; r++) {
                for (var oy = -r; oy <= r; oy++) {
                    for (var ox = -r; ox <= r; ox++) {
                        if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
                        if (plain(tx + ox, ty + oy)) return [tx + ox, ty + oy];
                    }
                }
            }
            return null;
        }
        function nearDigs(tx, ty) {
            return interactables.some(function (i) { return i.kind === "dig" && Math.abs(i.tx - tx) + Math.abs(i.ty - ty) < 4; });
        }

        buildings.forEach(function (b) {
            keepOut(b.frontX, b.frontY, 1);
            interactables.push({ id: b.id, kind: "spot", tx: b.frontX, ty: b.frontY, x: (b.frontX + 0.5) * T, y: (b.frontY + 0.5) * T, reach: 20 });
        });
        interactables.push({ id: "dock", kind: "spot", tx: dockX, ty: dockEnd, x: (dockX + 1) * T, y: (dockEnd + 0.4) * T, reach: 22 });

        // calibrated signposts around the plaza
        var signAt = [[19, 13], [25, 19], [19, 19]];
        Lore.SIGNS.forEach(function (sg, i) {
            var spot = nearestPlain(signAt[i][0] + OX, signAt[i][1] + OY, 3);
            solid[idx(spot[0], spot[1])] = 1;
            keepOut(spot[0], spot[1], 1);
            interactables.push({ id: sg.id, kind: "sign", signIndex: i, tx: spot[0], ty: spot[1], x: (spot[0] + 0.5) * T, y: (spot[1] + 1.2) * T, reach: 20 });
        });

        // the judge owl, on a stump beside the garden entrance
        var owlSpot = nearestPlain(gEntrance[0] - 2, gEntrance[1] - 1, 4);
        solid[idx(owlSpot[0], owlSpot[1])] = 1;
        keepOut(owlSpot[0], owlSpot[1], 1);
        interactables.push({ id: "owl", kind: "owl", tx: owlSpot[0], ty: owlSpot[1], x: (owlSpot[0] + 0.5) * T, y: (owlSpot[1] + 1.2) * T, reach: 22 });

        // the refusal button
        interactables.push({ id: "egg-button", kind: "button", tx: pedestal.tx, ty: pedestal.ty, x: (pedestal.tx + 0.5) * T, y: (pedestal.ty + 1.3) * T, reach: 22 });

        // the chest at the garden's heart
        solid[idx(gHeart[0], gHeart[1])] = 1;
        interactables.push({ id: "egg-chest", kind: "chest", tx: gHeart[0], ty: gHeart[1], x: (gHeart[0] + 0.5) * T, y: (gHeart[1] + 1.2) * T, reach: 22 });

        // buried details
        var digs = [];
        Lore.DETAILS.forEach(function (d) {
            if (d.special) return;
            var anchor;
            if (d.abs) anchor = [d.abs[0] + OX, d.abs[1] + OY];
            else {
                var b = byId[d.near];
                anchor = [b.frontX + d.at[0], b.frontY + d.at[1]];
            }
            var spot = null;
            for (var r = 0; r <= 8 && !spot; r++) {
                for (var oy = -r; oy <= r && !spot; oy++) {
                    for (var ox = -r; ox <= r && !spot; ox++) {
                        if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
                        var tx = anchor[0] + ox, ty = anchor[1] + oy;
                        if (plain(tx, ty) && get(tx, ty) !== SAND && !nearDigs(tx, ty) && !inGardenRect(tx, ty)) spot = [tx, ty];
                    }
                }
            }
            keepOut(spot[0], spot[1], 1);
            var item = { id: d.id, kind: "dig", detail: d.id, tx: spot[0], ty: spot[1], x: (spot[0] + 0.5) * T, y: (spot[1] + 0.9) * T, reach: 15 };
            interactables.push(item);
            digs.push(item);
        });
        function inGardenRect(tx, ty) { return tx >= gx0 - 1 && ty >= gy0 - 1 && tx <= gx0 + gsize && ty <= gy0 + gsize; }

        // ---- decor ----
        var decor = [];
        function addDecor(kind, tx, ty, variant, isSolid) {
            decor.push({ kind: kind, tx: tx, ty: ty, variant: variant || 0 });
            if (isSolid) solid[idx(tx, ty)] = 1;
            decorTaken[idx(tx, ty)] = 1;
        }
        // lamps beside buildings and at the plaza corners
        var lamps = [];
        buildings.forEach(function (b, i) {
            var lx = i % 2 ? b.x - 1 : b.x + b.w, ly = b.y + b.h - 1;
            if (plain(lx, ly)) { addDecor("lamp", lx, ly, 0, true); lamps.push({ tx: lx, ty: ly }); }
        });
        [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(function (o) {
            var lx = pcx + o[0], ly = pcy + o[1];
            if (plain(lx, ly)) { addDecor("lamp", lx, ly, 0, true); lamps.push({ tx: lx, ty: ly }); }
        });
        fences.forEach(function (f) { decor.push({ kind: "fence", tx: f.tx, ty: f.ty, variant: 0 }); });

        function clearOf(tx, ty, r) {
            for (var yy = ty - r; yy <= ty + r; yy++) for (var xx = tx - r; xx <= tx + r; xx++) {
                if (!inb(xx, yy)) continue;
                var t = tiles[idx(xx, yy)];
                if (t === PATH || t === PLAZA || t === PLANK || t === GARDEN || t === HEDGE) return false;
                if (taken[idx(xx, yy)]) return false;
            }
            return true;
        }
        // A tree's canopy rises two tiles above its trunk: keep that patch free of roads and doors,
        // but let trunks stand right beside a road.
        function clearTree(tx, ty) {
            for (var yy = ty - 2; yy <= ty + 1; yy++) for (var xx = tx - 1; xx <= tx + 1; xx++) {
                if (!inb(xx, yy)) continue;
                var t = tiles[idx(xx, yy)];
                var canopy = yy < ty;
                if (taken[idx(xx, yy)]) return false;
                if (canopy && (t === PATH || t === PLAZA || t === PLANK || t === GARDEN || t === HEDGE)) return false;
                if (!canopy && (t === PLANK || t === PLAZA || t === GARDEN || t === HEDGE)) return false;
            }
            return true;
        }
        function scatter(kind, count, wantTypes, radius, gap, variants, makeSolid) {
            var cands = [];
            for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) if (wantTypes.indexOf(tiles[idx(x, y)]) !== -1 && !solid[idx(x, y)] && !decorTaken[idx(x, y)]) cands.push([x, y]);
            for (var i = cands.length - 1; i > 0; i--) { var j = (rng() * (i + 1)) | 0, t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
            var placed = [];
            for (var c = 0; c < cands.length && placed.length < count; c++) {
                var cx = cands[c][0], cy = cands[c][1];
                if (!(kind === "tree" ? clearTree(cx, cy) : clearOf(cx, cy, radius))) continue;
                if (placed.some(function (p) { return Math.abs(p[0] - cx) < gap && Math.abs(p[1] - cy) < gap; })) continue;
                placed.push([cx, cy]);
                addDecor(kind, cx, cy, (rng() * variants) | 0, makeSolid);
            }
        }
        scatter("mushroom", 9, [GRASS], 1, 6, 3, true);
        scatter("barrel", 4, [GRASS], 1, 9, 1, true);
        scatter("tree", 110, [GRASS], 1, 2, 3, true);
        scatter("palm", 18, [SAND], 1, 4, 2, true);
        scatter("rock", 14, [GRASS, SAND, SNOW], 0, 3, 2, true);
        scatter("bush", 30, [GRASS], 0, 2, 2, false);
        var flowers = [];
        for (var fi = 0; fi < 260; fi++) {
            var fx2 = 1 + ((rng() * (W - 2)) | 0), fy2 = 1 + ((rng() * (H - 2)) | 0);
            if (get(fx2, fy2) === GRASS && !solid[idx(fx2, fy2)]) flowers.push({ tx: fx2, ty: fy2, color: (rng() * 4) | 0, ox: (rng() * 10) | 0, oy: (rng() * 10) | 0 });
        }

        var worldObj = {
            T: T, W: W, H: H, OX: OX, OY: OY,
            tiles: tiles, solid: solid, buildings: buildings, byId: byId, interactables: interactables, digs: digs,
            decor: decor, flowers: flowers, lamps: lamps, fences: fences, pedestal: pedestal,
            plaza: { tx: pcx, ty: pcy }, spawn: spawn, dock: { x: dockX, shoreY: shoreY, endY: dockEnd },
            garden: { x: gx0, y: gy0, size: gsize, maze: maze, seed: gseed, entrance: gEntrance, heart: gHeart },
            owl: { tx: owlSpot[0], ty: owlSpot[1] }
        };
        return worldObj;
    }

    function walkable(w, tx, ty) {
        return tx >= 0 && ty >= 0 && tx < w.W && ty < w.H && !w.solid[ty * w.W + tx] && w.tiles[ty * w.W + tx] !== WATER;
    }

    /* Breadth-first walk on tiles; returns the tiles to step through (without the start), or null. */
    function findPath(w, sx, sy, tx, ty) {
        if (!walkable(w, tx, ty)) return null;
        if (sx === tx && sy === ty) return [];
        var prev = new Int32Array(w.W * w.H).fill(-1), q = [sy * w.W + sx];
        prev[sy * w.W + sx] = sy * w.W + sx;
        for (var h = 0; h < q.length; h++) {
            var u = q[h], ux = u % w.W, uy = (u / w.W) | 0;
            if (ux === tx && uy === ty) break;
            var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (var d = 0; d < 4; d++) {
                var vx = ux + dirs[d][0], vy = uy + dirs[d][1];
                if (!walkable(w, vx, vy) || prev[vy * w.W + vx] !== -1) continue;
                prev[vy * w.W + vx] = u;
                q.push(vy * w.W + vx);
            }
        }
        if (prev[ty * w.W + tx] === -1) return null;
        var path = [];
        for (var c = ty * w.W + tx; c !== sy * w.W + sx; c = prev[c]) path.push([c % w.W, (c / w.W) | 0]);
        return path.reverse();
    }

    /* The player's feet box (8 wide, 5 tall, bottom-centred at x, y in pixels) against solid tiles. */
    function collides(w, x, y) {
        var x0 = Math.floor((x - 4) / T), x1 = Math.floor((x + 3.99) / T);
        var y0 = Math.floor((y - 5) / T), y1 = Math.floor((y - 0.01) / T);
        for (var ty = y0; ty <= y1; ty++) {
            for (var tx = x0; tx <= x1; tx++) {
                if (tx < 0 || ty < 0 || tx >= w.W || ty >= w.H) return true;
                var i = ty * w.W + tx;
                if (w.solid[i] || w.tiles[i] === WATER) return true;
            }
        }
        return false;
    }

    /* Debug view for tests and humans: one character per tile. */
    function toAscii(w) {
        var rows = [];
        var spots = {}, digs = {}, signs = {};
        w.interactables.forEach(function (i) {
            if (i.kind === "dig") digs[i.ty * w.W + i.tx] = "x";
            else if (i.kind === "spot") spots[i.ty * w.W + i.tx] = "!";
            else signs[i.ty * w.W + i.tx] = "?";
        });
        var deco = {};
        w.decor.forEach(function (d) { deco[d.ty * w.W + d.tx] = { tree: "T", palm: "P", mushroom: "M", rock: "o", bush: "b", barrel: "B", lamp: "l", fence: "#" }[d.kind]; });
        for (var y = 0; y < w.H; y++) {
            var row = "";
            for (var x = 0; x < w.W; x++) {
                var i = y * w.W + x, t = w.tiles[i], ch = " .,:=-HgS".charAt(t) || "?";
                if (t === WATER) ch = "~";
                else if (t === GRASS) ch = ".";
                else if (t === SAND) ch = ",";
                else if (t === PATH) ch = ":";
                else if (t === PLAZA) ch = "=";
                else if (t === PLANK) ch = "-";
                else if (t === HEDGE) ch = "H";
                else if (t === GARDEN) ch = "g";
                else if (t === SNOW) ch = "*";
                if (w.solid[i] && deco[i] === undefined && t !== HEDGE) ch = "@";
                if (deco[i]) ch = deco[i];
                if (digs[i]) ch = digs[i];
                if (spots[i]) ch = spots[i];
                if (signs[i]) ch = signs[i];
                row += ch;
            }
            rows.push(row);
        }
        return rows.join("\n");
    }

    return {
        T: T, W: W, H: H, OX: OX, OY: OY,
        WATER: WATER, GRASS: GRASS, SAND: SAND, PATH: PATH, PLAZA: PLAZA, PLANK: PLANK, HEDGE: HEDGE, GARDEN: GARDEN, SNOW: SNOW,
        build: build, findPath: findPath, collides: collides, walkable: walkable, toAscii: toAscii
    };
});
