/*
 * The island game: loop, input, camera, interaction, digging, dialogs, progress.
 * World geometry is in world.js, words in lore.js, pixel art in art.js. Every word of real content
 * lives once in the page's codex and is cloned into a dialog when you open its building.
 */
(function () {
    "use strict";

    var IW = window.IslandWorld, A = window.IslandArt, L = window.IslandLore, M = window.HedgeMaze;
    var root = document.documentElement;
    var canvas = document.getElementById("world");
    if (!IW || !A || !L || !M || !canvas || !canvas.getContext) {
        root.classList.remove("js"); // fall back to the plain codex
        return;
    }

    var T = IW.T;
    var SPEED = 62;
    var STORE = "island-v1";
    var DEBUG = /(^|[?&])debug(=|&|$)/.test(location.search);
    var HUES = {
        coral: "#ff5d6c", teal: "#2dc4b6", blue: "#6a9bff", pink: "#ff7ac8", ice: "#9fdcf5", violet: "#a98bff",
        yellow: "#ffcb3d", brick: "#f08a6e", green: "#4fd18a", wood: "#e2b274"
    };
    var HINTS = {
        "egg-wilson": "a quiet corner east of the lighthouse",
        "egg-chest": "the heart of the hedge maze",
        "egg-button": "a red button inside the fence"
    };

    var $ = function (id) { return document.getElementById(id); };
    var ctx = canvas.getContext("2d");
    var el = {
        stage: $("stage"), prompt: $("prompt"), bubble: $("bubble"), act: $("btn-act"),
        chipPlaces: $("chip-places"), chipDetails: $("chip-details"), theme: $("btn-theme"),
        intro: $("dlg-intro"), spot: $("dlg-spot"), detail: $("dlg-detail"), index: $("dlg-index")
    };

    var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
    var reducedQ = mq("(prefers-reduced-motion: reduce)");
    var reduced = reducedQ.matches;
    if (reducedQ.addEventListener) reducedQ.addEventListener("change", function (e) { reduced = e.matches; });
    var coarse = mq("(pointer: coarse)").matches;

    var world = IW.build();
    var art = A.create(world);
    var TOTAL_DETAILS = L.DETAILS.length;
    var TOTAL_PLACES = Object.keys(L.SPOTS).length;

    /* ---------- progress ---------- */

    var found = new Set(), places = new Set(), pressed = 0;
    try {
        var saved = JSON.parse(localStorage.getItem(STORE));
        if (saved) {
            (saved.found || []).forEach(function (id) { if (L.DETAILS.some(function (d) { return d.id === id; })) found.add(id); });
            (saved.places || []).forEach(function (id) { if (L.SPOTS[id]) places.add(id); });
            pressed = saved.pressed | 0;
        }
    } catch (e) { /* private mode or bad data */ }

    function save() {
        try { localStorage.setItem(STORE, JSON.stringify({ found: Array.from(found), places: Array.from(places), pressed: pressed })); } catch (e) { /* ignore */ }
    }

    function updateHud() {
        el.chipPlaces.querySelector("b").textContent = places.size + "/" + TOTAL_PLACES;
        el.chipDetails.querySelector("b").textContent = found.size + "/" + TOTAL_DETAILS;
        el.chipPlaces.classList.toggle("is-done", places.size === TOTAL_PLACES);
        el.chipDetails.classList.toggle("is-done", found.size === TOTAL_DETAILS);
    }

    /* ---------- state ---------- */

    var player = { x: (world.spawn.x + 0.5) * T, y: (world.spawn.y + 0.5) * T + 3, dir: "down", ft: 0, moving: false };
    var cam = { x: 0, y: 0 };
    var view = { w: 320, h: 180, scale: 3, dpr: 1, cssW: 0, cssH: 0 };
    var dk = A.canvas(320, 180);
    var keys = [];
    var pad = {};
    var path = null, dest = null, digging = null;
    var near = null;
    var particles = [];
    var night = root.getAttribute("data-theme") === "dark" ? 1 : 0, nightTarget = night;
    var pressAnim = 0, catLine = 0, owlLine = 0, bubbleTimer = 0;
    var trail = new Set();
    var running = false, last = 0;

    var cat = { x: (world.plaza.tx + 3.5) * T, y: (world.plaza.ty + 3.8) * T, dir: "right", ft: 0, sit: true, timer: 2000, path: null };
    var butterflies = [];
    for (var b = 0; b < 7; b++) {
        var fl = world.flowers[(b * 37) % world.flowers.length] || { tx: 20, ty: 20 };
        butterflies.push({ x: (fl.tx + 0.5) * T, y: (fl.ty + 0.5) * T, a: b * 1.7, seed: b, home: [(fl.tx + 0.5) * T, (fl.ty + 0.5) * T] });
    }
    var fireflies = [];
    for (var f = 0; f < 36; f++) {
        var tr = world.decor.filter(function (d) { return d.kind === "tree"; });
        var base = tr.length ? tr[(f * 7) % tr.length] : { tx: 20, ty: 20 };
        fireflies.push({ x: (base.tx + 0.5) * T, y: base.ty * T, a: f * 2.3, r: 10 + (f % 5) * 4, home: [(base.tx + 0.5) * T, base.ty * T] });
    }

    function tileOf(x, y) { return [Math.floor(x / T), Math.floor((y - 1) / T)]; }
    function dialogOpen() { return !!document.querySelector("dialog[open]"); }
    function interactableById(id) { return world.interactables.find(function (i) { return i.id === id; }); }
    var chestSpot = interactableById("egg-chest");

    /* ---------- drawing list ---------- */

    var statics = [];
    function put(g, spr, bx, by) { g.drawImage(spr.c, Math.round(bx - spr.ax), Math.round(by - spr.ay)); }

    world.decor.forEach(function (d) {
        var set = art.spr[d.kind];
        var spr = set[d.variant % set.length];
        var bx = d.kind === "fence" ? d.tx * T : (d.tx + 0.5) * T, by = (d.ty + 1) * T;
        statics.push({ by: by, x0: bx - spr.ax, x1: bx - spr.ax + spr.c.width, y0: by - spr.ay, draw: function (g) { put(g, spr, bx, by); } });
    });
    world.buildings.forEach(function (b) {
        var s = art.buildingSprites[b.id];
        var x0 = b.x * T - s.ax, y0 = b.y * T - s.ay;
        statics.push({ by: (b.y + b.h) * T, x0: x0, x1: x0 + s.c.width, y0: y0, draw: function (g, now) { g.drawImage(s.c, x0, y0); buildingFX(g, b, now); } });
    });
    world.interactables.forEach(function (i) {
        var bx = (i.tx + 0.5) * T, by = (i.ty + 1) * T;
        if (i.kind === "sign") statics.push({ by: by, x0: bx - 12, x1: bx + 12, y0: by - 28, draw: function (g) { put(g, art.spr.sign[i.signIndex], bx, by); } });
        if (i.kind === "owl") statics.push({ by: by, x0: bx - 12, x1: bx + 12, y0: by - 32, draw: function (g, now) { put(g, art.spr.owl[Math.floor(now / 200) % 17 === 0 && !reduced ? 1 : 0], bx, by); } });
        if (i.kind === "chest") statics.push({ by: by, x0: bx - 12, x1: bx + 12, y0: by - 20, draw: function (g) { put(g, art.spr.chest[found.has("egg-chest") ? 1 : 0], bx, by); } });
        if (i.kind === "button") statics.push({ by: by, x0: bx - 12, x1: bx + 12, y0: by - 28, draw: function (g) { put(g, art.spr.pedestal[pressAnim > 0 ? 1 : 0], bx, by); } });
    });
    var dockX = world.dock.x, dockEnd = world.dock.endY;
    statics.push({
        by: dockEnd * T + 4, x0: dockX * T - 4, x1: (dockX + 5) * T, y0: (dockEnd - 3) * T,
        draw: function (g, now) {
            var bob = reduced ? 0 : Math.round(Math.sin(now / 600));
            put(g, art.spr.boat[0], (dockX + 3.4) * T, (dockEnd - 1) * T + 6 + bob);
            put(g, art.spr.bottle[0], (dockX + 1) * T, (dockEnd + 0.8) * T + bob);
            if (places.has("dock")) star(g, (dockX + 1) * T, (dockEnd - 0.4) * T, now);
        }
    });
    statics.sort(function (a, b) { return a.by - b.by; });

    function star(g, x, y, now) {
        var bob = reduced ? 0 : Math.round(Math.sin(now / 300));
        x = Math.round(x); y = Math.round(y) + bob;
        A.rect(g, x - 1, y - 3, 3, 7, A.C.ink); A.rect(g, x - 3, y - 1, 7, 3, A.C.ink);
        A.rect(g, x, y - 2, 1, 5, A.C.gold); A.rect(g, x - 2, y, 5, 1, A.C.gold);
        A.dot(g, x, y, "#fff");
    }

    function buildingFX(g, b, now) {
        var bx = b.x * T, by = b.y * T;
        var t = reduced ? 0 : now;
        if (places.has(b.id) && b.id !== "dock") star(g, bx + b.w * T / 2, by - (b.kind === "lighthouse" ? 26 : b.kind === "tower" ? 24 : 10), now);
        if (b.kind === "workshop") {
            for (var i = 0; i < 3; i++) {
                var p = ((t / 1400) + i / 3) % 1;
                A.disc(g, Math.round(bx + 56 + Math.sin(p * 6 + i) * 3), Math.round(by - 10 - p * 22), 1 + Math.round(p * 3), "rgba(240,240,250," + (0.85 * (1 - p)).toFixed(2) + ")");
            }
        } else if (b.kind === "post") {
            for (var e = 0; e < 2; e++) {
                var q = ((t / 2600) + e / 2) % 1;
                var ex = Math.round(bx + 8 - q * 18), ey = Math.round(by + 26 - q * 26);
                g.globalAlpha = 1 - q;
                A.rect(g, ex, ey, 6, 4, "#ffffff"); A.rect(g, ex, ey, 6, 1, A.C.ink); A.rect(g, ex, ey + 3, 6, 1, A.C.ink);
                A.dot(g, ex + 2, ey + 1, A.C.coral); A.dot(g, ex + 3, ey + 1, A.C.coral);
                g.globalAlpha = 1;
            }
        } else if (b.kind === "ice") {
            for (var m = 0; m < 3; m++) {
                var r = ((t / 2200) + m / 3) % 1;
                A.disc(g, Math.round(bx + 24 + Math.sin(r * 5 + m * 2) * 5), Math.round(by + b.h * T - 6 - r * 20), 2 + Math.round(r * 2), "rgba(220,245,255," + (0.7 * (1 - r)).toFixed(2) + ")");
            }
        } else if (b.kind === "lab") {
            labScreen(g, bx + 37, by + 23, now);
        } else if (b.kind === "cinema") {
            var phase = reduced ? 0 : Math.floor(now / 240) % 2;
            for (var k = 0; k < 12; k++) {
                var col = (k + phase) % 2 ? "#ffffff" : A.C.coral;
                A.rect(g, bx + 8 + k * 5, by + 24, 2, 2, col);
                A.rect(g, bx + 8 + k * 5, by + 39, 2, 2, (k + phase + 1) % 2 ? "#ffffff" : A.C.coral);
            }
        } else if (b.kind === "school") {
            for (var c = 0; c < 8; c++) {
                var wave = reduced ? 0 : Math.round(Math.sin(now / 220 + c * 0.7));
                A.rect(g, bx + 63 + c, by - 10 + wave, 1, 5, c % 3 === 0 ? A.C.blueDark : A.C.blue);
            }
        } else if (b.kind === "tower") {
            if (reduced || Math.floor(now / 700) % 2 === 0) A.rect(g, bx + 25, by - 17, 4, 3, "#ff9aa4");
        } else if (b.kind === "lighthouse") {
            if (!reduced && Math.floor(now / 180) % 6 === 0) { A.rect(g, bx + 20, by - 6, 2, 2, "#ffffff"); }
        }
    }

    // a tiny monitor in the lab's window: noise resolving into a path, over and over
    var labMask = new Float32Array(35).fill(-1);
    [0, 1, 2, 9, 16, 17, 18, 25, 26, 27, 34].forEach(function (i) { labMask[i] = 1; });
    var labEps = M.gaussianField(35, 11), labBuf = new Float32Array(35);
    function labScreen(g, x, y, now) {
        var cycle = reduced ? 1 : (now / 4200) % 1;
        var k = Math.min(30, Math.floor(cycle * 40));
        M.denoiseFrame(labMask, labEps, k, 30, labBuf);
        var ab = M.alphaBar(k, 30);
        for (var cy = 0; cy < 5; cy++) {
            for (var cx = 0; cx < 7; cx++) {
                var v = labBuf[cy * 7 + cx];
                var red = Math.max(0, Math.min(1, v)) * ab;
                var gray = Math.round(70 + Math.max(0, Math.min(1, 0.5 + 0.5 * v)) * 150);
                A.rect(g, x + 3 + cx * 2, y + 2 + cy * 2, 2, 2, red > 0.55 ? A.C.coral : "rgb(" + gray + "," + gray + "," + Math.min(255, gray + 30) + ")");
            }
        }
    }

    /* ---------- layout ---------- */

    function resize() {
        var w = el.stage.clientWidth, h = el.stage.clientHeight;
        if (w < 50 || h < 50) return;
        var scale = Math.max(2, Math.min(5, Math.round(Math.min(w / 420, h / 250))));
        var dprI = Math.max(1, Math.round(window.devicePixelRatio || 1));
        view.cssW = w; view.cssH = h; view.scale = scale; view.dpr = dprI;
        view.w = Math.ceil(w / scale); view.h = Math.ceil(h / scale);
        canvas.width = w * dprI;
        canvas.height = h * dprI;
        dk = A.canvas(view.w, view.h);
        cam.x = clampCam(player.x - view.w / 2, world.W * T, view.w);
        cam.y = clampCam(player.y - view.h / 2, world.H * T, view.h);
    }

    function clampCam(v, total, vw) {
        if (vw >= total) return (total - vw) / 2;
        return Math.max(0, Math.min(total - vw, v));
    }

    /* ---------- movement ---------- */

    function tryMove(dx, dy) {
        var nx = player.x + dx;
        if (!IW.collides(world, nx, player.y)) player.x = nx;
        else if (dx) assist(dx, 0);
        var ny = player.y + dy;
        if (!IW.collides(world, player.x, ny)) player.y = ny;
        else if (dy) assist(0, dy);
    }

    // slide round corners: when blocked, try a nudge sideways of up to 4px
    function assist(dx, dy) {
        for (var s = 1; s <= 4; s++) {
            for (var sign = -1; sign <= 1; sign += 2) {
                var nx = player.x + (dy ? sign * s : 0), ny = player.y + (dx ? sign * s : 0);
                if (!IW.collides(world, nx + Math.sign(dx) * 0.5, ny + Math.sign(dy) * 0.5)) {
                    if (dy) player.x += sign * 0.6; else player.y += sign * 0.6;
                    return;
                }
            }
        }
    }

    function inputVec() {
        var x = 0, y = 0;
        if (keys.indexOf("left") !== -1 || pad.left) x -= 1;
        if (keys.indexOf("right") !== -1 || pad.right) x += 1;
        if (keys.indexOf("up") !== -1 || pad.up) y -= 1;
        if (keys.indexOf("down") !== -1 || pad.down) y += 1;
        return [x, y];
    }

    function updatePlayer(dt) {
        var v = inputVec();
        player.moving = false;
        if (digging) return;
        if (v[0] || v[1]) {
            path = null; dest = null;
            var len = Math.hypot(v[0], v[1]);
            var sp = SPEED * dt / 1000;
            tryMove(v[0] / len * sp, v[1] / len * sp);
            var last = keys[keys.length - 1];
            if (last && !pad.up && !pad.down && !pad.left && !pad.right) player.dir = last;
            else player.dir = Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] < 0 ? "left" : "right") : (v[1] < 0 ? "up" : "down");
            if (v[0] && v[1]) player.dir = Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] < 0 ? "left" : "right") : (v[1] < 0 ? "up" : "down");
            player.moving = true;
        } else if (path) {
            var step = path.steps[path.i];
            var tx = (step[0] + 0.5) * T, ty = (step[1] + 0.5) * T + 3;
            var dx = tx - player.x, dy = ty - player.y, dist = Math.hypot(dx, dy), sp2 = SPEED * 1.15 * dt / 1000;
            if (dist <= sp2) { player.x = tx; player.y = ty; path.i++; }
            else { player.x += dx / dist * sp2; player.y += dy / dist * sp2; }
            player.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
            player.moving = dist > 0.01;
            if (path.i >= path.steps.length) {
                var then = path.then;
                path = null; dest = null;
                if (then) activate(then);
            }
        }
        if (player.moving) player.ft += dt; else player.ft = 0;
    }

    function goTo(tx, ty, then) {
        var from = tileOf(player.x, player.y);
        var steps = IW.findPath(world, from[0], from[1], tx, ty);
        if (!steps) return false;
        if (!steps.length) { path = null; if (then) activate(then); return true; }
        path = { steps: steps, i: 0, then: then || null };
        dest = { x: (tx + 0.5) * T, y: (ty + 0.5) * T + 3, t: 0 };
        return true;
    }

    function goToTarget(t) {
        var cands = t.kind === "spot" || t.kind === "dig" ? [[t.tx, t.ty]] : [[t.tx, t.ty + 1], [t.tx - 1, t.ty], [t.tx + 1, t.ty], [t.tx, t.ty - 1]];
        if (t.kind === "cat") { var ct = tileOf(cat.x, cat.y); cands = [[ct[0], ct[1] + 1], [ct[0] + 1, ct[1]], [ct[0] - 1, ct[1]], [ct[0], ct[1] - 1]]; }
        for (var i = 0; i < cands.length; i++) {
            if (IW.walkable(world, cands[i][0], cands[i][1]) && goTo(cands[i][0], cands[i][1], t)) return true;
        }
        return false;
    }

    /* ---------- the cat ---------- */

    function updateCat(dt) {
        if (reduced) return;
        cat.timer -= dt;
        if (cat.sit) {
            if (cat.timer <= 0) {
                var home = world.plaza, tries = 0, steps = null;
                var from = tileOf(cat.x, cat.y);
                while (!steps && tries++ < 12) {
                    var tx = home.tx + Math.round((Math.random() - 0.5) * 12), ty = home.ty + Math.round((Math.random() - 0.5) * 10);
                    if (IW.walkable(world, tx, ty)) steps = IW.findPath(world, from[0], from[1], tx, ty);
                    if (steps && steps.length > 14) steps = null;
                }
                if (steps && steps.length) { cat.path = { steps: steps, i: 0 }; cat.sit = false; }
                else cat.timer = 1500;
            }
        } else if (cat.path) {
            var st = cat.path.steps[cat.path.i];
            var tx2 = (st[0] + 0.5) * T, ty2 = (st[1] + 0.9) * T;
            var dx = tx2 - cat.x, dy = ty2 - cat.y, dist = Math.hypot(dx, dy), sp = 20 * dt / 1000;
            if (dist <= sp) { cat.x = tx2; cat.y = ty2; cat.path.i++; } else { cat.x += dx / dist * sp; cat.y += dy / dist * sp; }
            if (Math.abs(dx) > 0.5) cat.dir = dx < 0 ? "left" : "right";
            cat.ft += dt;
            if (cat.path.i >= cat.path.steps.length) { cat.path = null; cat.sit = true; cat.timer = 2500 + Math.random() * 4500; }
        }
    }

    /* ---------- interaction ---------- */

    function labelOf(t) {
        switch (t.kind) {
            case "spot": return t.id === "dock" ? "Open the bottle" : "Enter the " + L.SPOTS[t.id].building;
            case "dig": return "Dig here";
            case "sign": return "Read the sign";
            case "cat": return "Pet the cat";
            case "owl": return "Talk to the owl";
            case "button": return "Press the button";
            case "chest": return "Open the chest";
        }
        return "Look";
    }

    function findNear() {
        var best = null, bestD = Infinity;
        var consider = function (t) {
            var d = Math.hypot(player.x - t.x, player.y - t.y);
            if (d <= t.reach && d < bestD) { best = t; bestD = d; }
        };
        world.interactables.forEach(function (t) {
            if (t.kind === "dig" && found.has(t.detail)) return;
            consider(t);
        });
        consider({ kind: "cat", id: "cat", x: cat.x, y: cat.y, reach: 22 });
        return best;
    }

    function updatePrompt() {
        if (dialogOpen() || digging) { el.prompt.hidden = true; el.act.disabled = true; return; }
        if (!near) { el.prompt.hidden = true; el.act.disabled = true; return; }
        var label = labelOf(near);
        if (el.prompt.dataset.label !== label) {
            el.prompt.dataset.label = label;
            el.prompt.innerHTML = "";
            var k = document.createElement("kbd");
            k.textContent = coarse ? "A" : "E";
            el.prompt.append(k, document.createTextNode(label));
            el.act.setAttribute("aria-label", label);
        }
        el.prompt.hidden = false;
        el.act.disabled = false;
    }

    function say(speaker, text) {
        el.bubble.innerHTML = "";
        var b = document.createElement("b");
        b.textContent = speaker;
        el.bubble.append(b, document.createTextNode(text));
        el.bubble.hidden = false;
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(function () { el.bubble.hidden = true; }, 5200);
    }

    function activate(t) {
        if (!t || dialogOpen()) return;
        var face = function () {
            var dx = t.x - player.x, dy = t.y - player.y;
            player.dir = Math.abs(dx) > Math.abs(dy) + 2 ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        };
        switch (t.kind) {
            case "spot": player.dir = "up"; openSpot(t.id); break;
            case "dig": startDig(t); break;
            case "sign": face(); say(L.SIGNS[t.signIndex].speaker, L.SIGNS[t.signIndex].text); break;
            case "cat": face(); say("Cat", L.CAT_LINES[catLine++ % L.CAT_LINES.length]); burst(cat.x, cat.y - 10, ["#ff7ac8"], 4); break;
            case "owl": face(); say("Owl, the judge", L.OWL_LINES[owlLine++ % L.OWL_LINES.length]); break;
            case "button": face(); pressButton(); break;
            case "chest": face(); openChest(); break;
        }
    }

    function interactNow() { if (near) activate(near); }

    /* ---------- digging ---------- */

    function startDig(t) {
        if (found.has(t.detail)) return;
        digging = { t: 0, target: t };
        player.dir = "down";
        player.x = t.x; player.y = Math.max(player.y, t.y - 4);
        if (IW.collides(world, player.x, player.y)) { player.x = (t.tx + 0.5) * T; player.y = (t.ty + 1) * T - 3; }
    }

    function updateDig(dt) {
        if (!digging) return;
        var prev = digging.t;
        digging.t += dt;
        var cross = function (ms) { return prev < ms && digging.t >= ms; };
        var t = digging.target;
        if (cross(180) || cross(380)) burst(t.x, t.y - 4, ["#c68f52", "#dba869", "#8c5b34"], 8);
        if (digging.t >= 620) {
            digging = null;
            burst(t.x, t.y - 6, ["#ffd23f", "#ffffff", "#ff4d8d", "#27d3cc"], 18);
            reveal(t.detail);
        }
    }

    function burst(x, y, colors, n) {
        if (reduced) return;
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 50;
            particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 35, life: 450 + Math.random() * 400, max: 850, color: colors[i % colors.length], size: Math.random() < 0.3 ? 2 : 1 });
        }
    }

    function confetti() {
        if (reduced) return;
        var colors = ["#ffd23f", "#ff4d8d", "#27d3cc", "#8e63ff", "#5ec24c", "#ff5d6c"];
        for (var i = 0; i < 120; i++) {
            particles.push({ x: cam.x + Math.random() * view.w, y: cam.y - 6 - Math.random() * 40, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 50, life: 2200 + Math.random() * 1500, max: 3700, color: colors[i % colors.length], size: 2, grav: 0 });
        }
    }

    function updateParticles(dt) {
        particles = particles.filter(function (p) { return (p.life -= dt) > 0; });
        particles.forEach(function (p) {
            p.x += p.vx * dt / 1000;
            p.y += p.vy * dt / 1000;
            p.vy += (p.grav === undefined ? 90 : p.grav) * dt / 1000;
        });
    }

    /* ---------- details, places, dialogs ---------- */

    function nearName(d) {
        if (d.near && L.SPOTS[d.near]) return "near the " + L.SPOTS[d.near].building.toLowerCase();
        return HINTS[d.id] || "somewhere on the island";
    }

    function verdictBox() {
        var g = world.garden;
        trail.add((g.heart[1] - g.y) * g.size + (g.heart[0] - g.x));
        var j = M.judge(g.maze, trail);
        var box = document.createElement("div");
        box.className = "verdict " + (j.solved ? "is-solved" : "is-lost");
        var big = document.createElement("span");
        big.className = "verdict-result";
        big.textContent = j.solved ? "Solved" : "Lost";
        var p1 = document.createElement("p"), p2 = document.createElement("p");
        if (j.solved) {
            p1.textContent = "One clean path from the gate to the heart, " + j.pathTiles + " tiles, nothing stray.";
            p2.textContent = "The owl nods once. This is the same judge unmaze uses: exactly one simple path, no repair step.";
        } else {
            var blobs = j.strayBlobs + " stray blob" + (j.strayBlobs === 1 ? "" : "s"), tiles = j.strayTiles + " stray tile" + (j.strayTiles === 1 ? "" : "s");
            p1.textContent = "Reason: " + (j.strayTiles ? blobs + ", " + tiles + " off the path." : "the trail does not cover the whole path.") + " The judge runs no repair step.";
            p2.textContent = "You took the scenic route. The owl respects it, and does not forgive it.";
        }
        box.append(big, p1, p2);
        return box;
    }

    function reveal(id) {
        var d = L.DETAILS.find(function (x) { return x.id === id; });
        var fresh = !found.has(id);
        if (fresh) { found.add(id); save(); updateHud(); }
        var done = found.size === TOTAL_DETAILS && fresh;
        var n = found.size;
        $("detail-kicker").textContent = (fresh ? "Detail " + n + " of " + TOTAL_DETAILS : "Already found") + " · " + nearName(d);
        $("detail-title").textContent = d.title;
        var extra = $("detail-extra");
        extra.replaceChildren();
        if (d.special === "chest") {
            $("detail-text").textContent = "Inside the chest: the strict judge's verdict on your walk through the hedge.";
            extra.append(verdictBox());
        } else {
            $("detail-text").textContent = d.text;
        }
        var cta = $("detail-cta");
        cta.hidden = !done;
        $("detail-ok").textContent = done ? "Keep wandering" : "Keep digging";
        if (done) {
            $("detail-kicker").textContent = "Every detail found · " + n + " of " + TOTAL_DETAILS;
            var fin = document.createElement("p");
            fin.className = "detail-text";
            fin.textContent = "That was the last one. You dug up everything on this island. The rest is a conversation.";
            extra.append(fin);
            confetti();
        }
        el.detail.showModal();
        $("detail-ok").focus();
    }

    function pressButton() {
        pressed++;
        pressAnim = 260;
        save();
        var line = pressed >= 4 ? "The button has said everything it will say." : L.BUTTON_LINES[Math.min(pressed, 3) - 1];
        if (pressed === 3 && !found.has("egg-button")) {
            say("Button", L.BUTTON_LINES[2]);
            setTimeout(function () { reveal("egg-button"); }, 700);
        } else say("Button", line);
    }

    function openChest() { reveal("egg-chest"); }

    function openSpot(id) {
        var meta = L.SPOTS[id];
        var head = $("spot-head");
        head.style.setProperty("--hue", HUES[meta.roof] || "#ff7ac8");
        $("spot-kicker").textContent = meta.kicker;
        $("spot-title").textContent = meta.title;
        var body = $("spot-body");
        body.replaceChildren();
        var section = document.querySelector('#codex [data-spot="' + id + '"]');
        if (section) {
            Array.prototype.forEach.call(section.children, function (child) {
                if (child.classList.contains("codex-h")) return;
                var copy = child.cloneNode(true);
                copy.querySelectorAll("[id]").forEach(function (n) { n.removeAttribute("id"); });
                body.append(copy);
            });
        }
        var wasNew = !places.has(id);
        places.add(id);
        save();
        updateHud();
        var mine = L.DETAILS.filter(function (d) { return d.near === id; });
        var got = mine.filter(function (d) { return found.has(d.id); }).length;
        var foot = $("spot-foot");
        foot.replaceChildren();
        var strong = document.createElement("b");
        if (!mine.length) { strong.textContent = "Nothing buried here."; foot.append(strong, " Everything is in the open."); }
        else if (got === mine.length) { strong.textContent = "All " + mine.length + " buried details found."; foot.append(strong, " Nice digging."); }
        else {
            strong.textContent = got + " of " + mine.length + " buried details found.";
            foot.append(strong, " Look for sparkling dirt around the " + meta.building.toLowerCase() + ".");
        }
        if (wasNew && places.size === TOTAL_PLACES) foot.append(" That is every place on the island.");
        el.spot.showModal();
        el.spot.scrollTop = 0;
        $("spot-close").focus();
    }

    /* ---------- index ---------- */

    var resetArmed = false;
    function renderIndex() {
        var ul = $("index-places");
        ul.replaceChildren();
        Object.keys(L.SPOTS).forEach(function (id) {
            var m = L.SPOTS[id];
            var li = document.createElement("li");
            li.className = "index-item" + (places.has(id) ? " is-done" : "");
            li.style.setProperty("--hue", HUES[m.roof]);
            var dot = document.createElement("span"); dot.className = "index-dot"; dot.setAttribute("aria-hidden", "true");
            var name = document.createElement("span"); name.className = "index-name";
            name.append(document.createTextNode(m.building + " · " + m.title));
            var small = document.createElement("small"); small.textContent = m.teaser + (places.has(id) ? " (visited)" : "");
            name.append(small);
            var btns = document.createElement("span"); btns.className = "index-btns";
            var read = document.createElement("button"); read.type = "button"; read.className = "btn btn-lemon"; read.textContent = "Read";
            read.setAttribute("aria-label", "Read " + m.title);
            read.addEventListener("click", function () { el.index.close(); openSpot(id); });
            var go = document.createElement("button"); go.type = "button"; go.className = "btn btn-cyan"; go.textContent = "Walk there";
            go.setAttribute("aria-label", "Walk to the " + m.building);
            go.addEventListener("click", function () {
                el.index.close();
                var t = interactableById(id);
                if (t) goToTarget(t);
            });
            btns.append(read, go);
            li.append(dot, name, btns);
            ul.append(li);
        });
        var dl = $("index-details");
        dl.replaceChildren();
        L.DETAILS.forEach(function (d) {
            var li = document.createElement("li");
            var ok = found.has(d.id);
            li.className = "index-item" + (ok ? " is-done" : " is-secret");
            var dot = document.createElement("span"); dot.className = "index-dot"; dot.setAttribute("aria-hidden", "true");
            var name = document.createElement("span"); name.className = "index-name";
            var text = ok ? d.title : "???";
            name.append(document.createTextNode(text));
            var small = document.createElement("small");
            small.textContent = ok ? (d.special === "chest" ? "The judge's verdict on your walk through the hedge." : d.text) : "Buried " + nearName(d) + ".";
            name.append(small);
            li.append(dot, name);
            dl.append(li);
        });
        $("index-count").textContent = found.size + "/" + TOTAL_DETAILS;
        $("index-reset").textContent = "Reset my progress";
        resetArmed = false;
        $("index-note").textContent = "";
    }

    function openIndex() {
        if (el.index.open) return;
        renderIndex();
        el.index.showModal();
        el.index.scrollTop = 0;
    }

    /* ---------- theme ---------- */

    function applyTheme(theme, persist) {
        root.setAttribute("data-theme", theme);
        root.style.colorScheme = theme;
        nightTarget = theme === "dark" ? 1 : 0;
        if (reduced) night = nightTarget;
        el.theme.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        var next = theme === "dark" ? "day" : "night";
        el.theme.setAttribute("aria-label", "Switch to " + next);
        el.theme.querySelector(".btn-theme-text").textContent = next.charAt(0).toUpperCase() + next.slice(1);
        if (persist) { try { localStorage.setItem("theme", theme); } catch (e) { /* ignore */ } }
    }

    /* ---------- render ---------- */

    var clouds = [[40, 30, 70, 22], [260, 140, 90, 26], [520, 70, 80, 20], [150, 380, 100, 28], [640, 330, 70, 20]];

    function render(now, dt) {
        var s = view.scale * view.dpr;
        ctx.setTransform(s, 0, 0, s, 0, 0);
        ctx.imageSmoothingEnabled = false;
        var cx = Math.round(cam.x), cy = Math.round(cam.y);
        A.drawOcean(ctx, cx, cy, view.w, view.h, world, now, !reduced);
        ctx.drawImage(art.land, -cx, -cy);
        ctx.save();
        ctx.translate(-cx, -cy);

        // buried spots on the ground
        world.digs.forEach(function (d, i) {
            var dug = found.has(d.detail);
            ctx.drawImage(art.spr.dig[dug ? 1 : 0].c, d.tx * T, d.ty * T);
            if (!dug) {
                var ph = reduced ? 0.2 : ((now / 700) + i * 0.37) % 2;
                if (ph < 0.55) {
                    var sx = d.tx * T + 11, sy = d.ty * T + 4;
                    A.rect(ctx, sx - 1, sy, 3, 1, "#fff"); A.rect(ctx, sx, sy - 1, 1, 3, "#fff");
                }
            }
        });

        // objects sorted by their baseline
        var x0 = cx - 40, x1 = cx + view.w + 40, y0 = cy - 50, y1 = cy + view.h + 60;
        var list = [];
        for (var i = 0; i < statics.length; i++) {
            var o = statics[i];
            if (o.by < y0 || o.y0 > y1 || o.x1 < x0 || o.x0 > x1) continue;
            list.push(o);
        }
        list.push({ by: player.y, draw: function (g) { A.drawPlayer(g, player.x, player.y, player.dir, player.moving ? [0, 1, 0, 3][Math.floor(player.ft / 120) % 4] : 0, digging ? Math.sin(digging.t / 90) * 0.5 + 0.5 : 0); } });
        list.push({ by: cat.y, draw: function (g) { A.drawCat(g, cat.x, cat.y, cat.dir, Math.floor(cat.ft / 150), cat.sit, now); } });
        list.sort(function (a, b) { return a.by - b.by; });
        for (var j = 0; j < list.length; j++) list[j].draw(ctx, now);

        if (!reduced) butterflies.forEach(function (bf) { A.drawButterfly(ctx, bf.x, bf.y, now, bf.seed); });

        // where you are heading
        if (dest) {
            var pulse = reduced ? 3 : 3 + Math.round(Math.sin(now / 150) * 1.5);
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillRect(Math.round(dest.x) - pulse, Math.round(dest.y), pulse * 2 + 1, 1);
            ctx.fillRect(Math.round(dest.x), Math.round(dest.y) - pulse, 1, pulse * 2 + 1);
        }

        // marker over whatever you can use
        if (near && !digging && !dialogOpen()) {
            var up = { spot: 24, dig: 12, sign: 32, owl: 34, chest: 26, button: 36, cat: 18 }[near.kind] || 20;
            var ax = near.kind === "cat" ? cat.x : near.x, ay = (near.kind === "cat" ? cat.y : near.y) - up + (reduced ? 0 : Math.round(Math.sin(now / 160) * 1.5));
            ax = Math.round(ax); ay = Math.round(ay);
            A.rect(ctx, ax - 3, ay - 1, 7, 2, A.C.ink); A.rect(ctx, ax - 2, ay + 1, 5, 2, A.C.ink); A.rect(ctx, ax - 1, ay + 3, 3, 2, A.C.ink); A.dot(ctx, ax, ay + 5, A.C.ink);
            A.rect(ctx, ax - 2, ay, 5, 1, A.C.gold); A.rect(ctx, ax - 1, ay + 1, 3, 1, A.C.gold); A.dot(ctx, ax, ay + 2, A.C.gold); A.rect(ctx, ax - 2, ay, 2, 1, "#fff3b0");
        }

        particles.forEach(function (p) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 400));
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        });
        ctx.globalAlpha = 1;

        if (!reduced && night < 0.6) {
            clouds.forEach(function (c, k) {
                var span = world.W * T + 200;
                var x = ((c[0] + now / (160 + k * 40)) % span) - 100;
                A.ell(ctx, Math.round(x), c[1], c[2], c[3], "rgba(25,45,120,0.075)");
            });
        }
        ctx.restore();

        if (night > 0.01) {
            var lights = art.lights.slice();
            lights.push({ x: player.x, y: player.y - 8, r: 46, color: "#ffe2a8", a: 0.95, flicker: true });
            if (!reduced) lights.push({ x: cat.x, y: cat.y - 4, r: 10, color: "#ffd89a", a: 0.4 });
            A.drawNight(ctx, dk, view.w, view.h, lights, cx, cy, now, night, reduced ? 0.6 : now / 2600);
            if (night > 0.4 && !reduced) {
                ctx.globalCompositeOperation = "lighter";
                fireflies.forEach(function (ff) {
                    var x = ff.x + Math.cos(now / 1400 + ff.a) * ff.r - cx, y = ff.y + Math.sin(now / 1100 + ff.a * 1.3) * ff.r * 0.7 - cy;
                    var tw = 0.5 + 0.5 * Math.sin(now / 350 + ff.a);
                    ctx.fillStyle = "rgba(255,240,120," + (0.25 * tw * night).toFixed(2) + ")";
                    ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
                    ctx.fillStyle = "rgba(255,250,170," + (0.9 * tw * night).toFixed(2) + ")";
                    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
                });
                ctx.globalCompositeOperation = "source-over";
            }
        }
    }

    /* ---------- minimap ---------- */

    var mm = $("minimap"), mmCtx = mm.getContext("2d"), mmBase = null;
    var MM_COL = ["#3a86e8", "#5ec24c", "#f6dfa8", "#dba869", "#cfd6ea", "#8c5b34", "#1f6b34", "#a6e27f", "#f4fbff"];
    function buildMinimap() {
        mmBase = A.canvas(world.W * 3, world.H * 3);
        for (var y = 0; y < world.H; y++) for (var x = 0; x < world.W; x++) A.rect(mmBase.g, x * 3, y * 3, 3, 3, MM_COL[world.tiles[y * world.W + x]]);
        world.decor.forEach(function (d) { if (d.kind === "tree") A.rect(mmBase.g, d.tx * 3, d.ty * 3, 3, 3, "#2f9e4f"); });
    }

    function drawMinimap(now) {
        if (!mmBase) buildMinimap();
        mmCtx.imageSmoothingEnabled = false;
        mmCtx.drawImage(mmBase.c, 0, 0);
        world.buildings.concat([{ id: "dock", roof: "wood", x: world.dock.x, y: world.dock.endY - 1, w: 2, h: 2 }]).forEach(function (b) {
            var meta = L.SPOTS[b.id];
            var cx = Math.round((b.x + b.w / 2) * 3), cy = Math.round((b.y + b.h / 2) * 3);
            A.rect(mmCtx, cx - 3, cy - 3, 7, 7, places.has(b.id) ? "#ffffff" : A.C.ink);
            A.rect(mmCtx, cx - 2, cy - 2, 5, 5, places.has(b.id) ? "#5ec24c" : HUES[meta.roof]);
        });
        var vx = Math.round(cam.x / T * 3), vy = Math.round(cam.y / T * 3), vw = Math.round(view.w / T * 3), vh = Math.round(view.h / T * 3);
        mmCtx.fillStyle = "rgba(255,255,255,0.9)";
        mmCtx.fillRect(vx, vy, vw, 1); mmCtx.fillRect(vx, vy + vh - 1, vw, 1); mmCtx.fillRect(vx, vy, 1, vh); mmCtx.fillRect(vx + vw - 1, vy, 1, vh);
        if (reduced || Math.floor(now / 400) % 2 === 0) {
            var px = Math.round(player.x / T * 3), py = Math.round((player.y - 4) / T * 3);
            A.rect(mmCtx, px - 2, py - 2, 5, 5, A.C.ink); A.rect(mmCtx, px - 1, py - 1, 3, 3, A.C.hoodie);
        }
    }

    /* ---------- loop ---------- */

    function frame(now) {
        if (!running) return;
        requestAnimationFrame(frame);
        var dt = Math.min(50, now - (last || now));
        last = now;
        var modal = dialogOpen();
        if (!modal) {
            updatePlayer(dt);
            updateDig(dt);
        } else player.moving = false;
        if (pressAnim > 0) pressAnim -= dt;
        updateCat(dt);
        updateParticles(dt);
        if (dest) dest.t += dt;
        butterflies.forEach(function (bf) {
            bf.a += dt / 1000;
            bf.x = bf.home[0] + Math.cos(bf.a * 0.9 + bf.seed) * 22 + Math.sin(bf.a * 2.1) * 6;
            bf.y = bf.home[1] + Math.sin(bf.a * 1.3 + bf.seed * 2) * 14 - 8;
        });
        if (night !== nightTarget) {
            var step = dt / 700;
            night = reduced ? nightTarget : (night < nightTarget ? Math.min(nightTarget, night + step) : Math.max(nightTarget, night - step));
        }
        var tx = clampCam(player.x - view.w / 2, world.W * T, view.w), ty = clampCam(player.y - view.h / 2 - 6, world.H * T, view.h);
        if (reduced) { cam.x = tx; cam.y = ty; }
        else { var k = 1 - Math.pow(0.001, dt / 1000); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }

        // trail inside the hedge garden, for the judge
        var g = world.garden, pt = tileOf(player.x, player.y);
        var lx = pt[0] - g.x, ly = pt[1] - g.y;
        if (lx >= 0 && ly >= 0 && lx < g.size && ly < g.size) trail.add(ly * g.size + lx);
        else if (trail.size && (lx < -1 || ly < -2 || lx > g.size || ly > g.size)) trail.clear();

        near = modal ? null : findNear();
        updatePrompt();
        render(now, dt);
        if (mm.offsetParent !== null) drawMinimap(now);
    }

    function start() {
        if (running) return;
        running = true;
        last = 0;
        requestAnimationFrame(frame);
    }

    /* ---------- input ---------- */

    var KEYDIR = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };

    function resetInput() { keys.length = 0; pad = {}; }

    function init() {
        applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
        night = nightTarget;
        updateHud();
        var steps = $("intro-steps");
        L.INTRO.steps.forEach(function (text) { var li = document.createElement("li"); li.textContent = text; steps.append(li); });

        el.theme.addEventListener("click", function () { applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true); });
        var sys = mq("(prefers-color-scheme: dark)");
        if (sys.addEventListener) sys.addEventListener("change", function (e) {
            var stored = null; try { stored = localStorage.getItem("theme"); } catch (er) { /* ignore */ }
            if (!stored) applyTheme(e.matches ? "dark" : "light", false);
        });

        $("btn-index").addEventListener("click", openIndex);
        $("btn-start").addEventListener("click", function () { el.intro.close(); });
        $("btn-intro-index").addEventListener("click", function () { el.intro.close(); openIndex(); });
        $("spot-close").addEventListener("click", function () { el.spot.close(); });
        $("detail-ok").addEventListener("click", function () { el.detail.close(); });
        $("index-close").addEventListener("click", function () { el.index.close(); });
        $("index-reset").addEventListener("click", function () {
            if (!resetArmed) { resetArmed = true; $("index-reset").textContent = "Really reset?"; $("index-note").textContent = "This forgets every place and detail."; return; }
            found.clear(); places.clear(); pressed = 0; trail.clear(); save(); updateHud(); renderIndex();
            $("index-note").textContent = "Progress cleared.";
        });
        el.prompt.addEventListener("click", interactNow);
        el.act.addEventListener("click", interactNow);

        [el.intro, el.spot, el.detail, el.index].forEach(function (d) {
            d.addEventListener("close", function () { resetInput(); canvas.focus({ preventScroll: true }); });
        });

        document.addEventListener("keydown", function (e) {
            if (dialogOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
            var dir = KEYDIR[e.key];
            if (dir) {
                e.preventDefault();
                if (keys.indexOf(dir) === -1) keys.push(dir);
                path = null; dest = null;
                return;
            }
            var tag = document.activeElement ? document.activeElement.tagName : "";
            if ((e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") && tag !== "BUTTON" && tag !== "A") {
                e.preventDefault();
                if (!e.repeat) interactNow();
            } else if (e.key === "i" || e.key === "I") {
                openIndex();
            } else if (e.key === "Escape") {
                el.bubble.hidden = true;
            }
        });
        document.addEventListener("keyup", function (e) {
            var dir = KEYDIR[e.key];
            var at = keys.indexOf(dir);
            if (at !== -1) keys.splice(at, 1);
        });
        window.addEventListener("blur", resetInput);

        document.querySelectorAll(".dpad button").forEach(function (btn) {
            var dir = btn.dataset.dir;
            btn.addEventListener("pointerdown", function (e) { e.preventDefault(); pad[dir] = true; path = null; dest = null; });
            ["pointerup", "pointerleave", "pointercancel"].forEach(function (type) { btn.addEventListener(type, function () { pad[dir] = false; }); });
        });

        var down = null;
        canvas.addEventListener("pointerdown", function (e) { down = { x: e.clientX, y: e.clientY }; });
        canvas.addEventListener("pointerup", function (e) {
            if (!down || dialogOpen()) { down = null; return; }
            var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
            down = null;
            if (moved > 10) return;
            tapAt(e.clientX, e.clientY);
        });

        window.addEventListener("resize", resize);
        if (typeof ResizeObserver === "function") new ResizeObserver(resize).observe(el.stage);
        resize();
        cam.x = clampCam(player.x - view.w / 2, world.W * T, view.w);
        cam.y = clampCam(player.y - view.h / 2, world.H * T, view.h);
        start();
        el.intro.showModal();

        if (DEBUG) {
            window.__island = {
                player: player, world: world, found: found, places: places,
                teleport: function (x, y) { player.x = x; player.y = y; path = null; },
                reveal: reveal, openSpot: openSpot, activate: activate, near: function () { return near; }, trail: trail
            };
        }
    }

    function tapAt(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var wx = (clientX - rect.left) / view.scale + Math.round(cam.x), wy = (clientY - rect.top) / view.scale + Math.round(cam.y);
        // something to use?
        var best = null, bestD = 13;
        world.interactables.forEach(function (t) {
            if (t.kind === "dig" && found.has(t.detail)) return;
            var cyy = t.kind === "spot" || t.kind === "dig" ? t.y : t.y - 8;
            var d = Math.hypot(wx - t.x, wy - cyy);
            if (d < bestD) { best = t; bestD = d; }
        });
        if (Math.hypot(wx - cat.x, wy - (cat.y - 5)) < 11) best = { kind: "cat", id: "cat", x: cat.x, y: cat.y, reach: 22 };
        if (!best) {
            for (var i = 0; i < world.buildings.length; i++) {
                var b = world.buildings[i];
                if (wx >= b.x * T && wx < (b.x + b.w) * T && wy >= b.y * T - 8 && wy < (b.y + b.h) * T) { best = interactableById(b.id); break; }
            }
        }
        if (best) {
            var d2 = Math.hypot(player.x - best.x, player.y - best.y);
            if (d2 <= best.reach && best.kind !== "spot") activate(best);
            else if (!goToTarget(best)) say("", "I can't find a way there.");
            return;
        }
        var tx = Math.floor(wx / T), ty = Math.floor((wy - 3) / T);
        if (IW.walkable(world, tx, ty)) goTo(tx, ty, null);
    }

    init();
})();
