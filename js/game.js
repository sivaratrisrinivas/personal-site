/*
 * The hedge-maze game. The plain portfolio stays in the page as the single source of truth:
 * each room clones the section tagged data-room="<id>" into a dialog, so content is edited once.
 * Pure maze logic lives in maze.js; this file is canvas, input, dialogs and state.
 */
(function () {
    "use strict";

    const M = window.HedgeMaze;
    const root = document.documentElement;
    const canvas = document.getElementById("maze");
    if (!M || !canvas || !canvas.getContext) {
        root.setAttribute("data-mode", "plain");
        return;
    }

    const N = 11;
    const STEPS = 40;
    const GRAIN = 3;
    const STEP_MS = 105;
    const LIGHT_TILES = 3.6;
    const FOG_ALPHA = 1;
    const STORE_KEY = "hedge-card-v1";
    const PLAIN_HASH = /^#(top|about|experience|open-source|work|contact)$/;

    const ROOMS = {
        profile: { label: "Profile", kicker: "Who", teaser: "the short version" },
        independent: { label: "Independent", kicker: "Roles", teaser: "two upstream pull requests, two very different endings" },
        accenture: { label: "Accenture", kicker: "Roles", teaser: "an ETL script and 50 hours a month" },
        "better-auth": { label: "better-auth", kicker: "Open source", teaser: "a sign-in error that gave away who has an account" },
        "go-ethereum": { label: "go-ethereum", kicker: "Open source", teaser: "binary-searching the merge block" },
        unmaze: { label: "unmaze", kicker: "Projects", teaser: "noise in, path out" },
        bingo: { label: "Bingo", kicker: "Projects", teaser: "5,000 films, four ways to search them" },
        resumes: { label: "Résumés & links", kicker: "Elsewhere", teaser: "four PDFs and the usual profiles" },
        heart: { label: "The heart", kicker: "The end of the maze", teaser: "say hello" }
    };
    const ROOM_IDS = ["profile", "independent", "accenture", "better-auth", "go-ethereum", "unmaze", "bingo", "resumes"];
    const CARD_ORDER = ["profile", "independent", "accenture", "better-auth", "heart", "go-ethereum", "unmaze", "bingo", "resumes"];
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const KEYS = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right"
    };
    const WHISPERS = [
        "Rooms glow through the snow. Follow the amber.",
        "The model solved this in about three seconds. Take your time.",
        "Dead ends are where the good stuff is.",
        "Press C. The card will walk you anywhere.",
        "Something in the hedge is watching. It is probably fine."
    ];

    const $ = (id) => document.getElementById(id);
    const els = {
        stage: $("game-stage"), status: $("game-status"), whisper: $("game-whisper"), modelNote: $("model-note"),
        intro: $("dlg-intro"), room: $("dlg-room"), card: $("dlg-card"),
        roomBody: $("room-body"), roomKicker: $("room-kicker"), roomTitle: $("room-title"), roomFoot: $("room-foot"),
        cardGrid: $("card-grid"), cardSummary: $("card-summary"), cardVerdict: $("card-verdict"), cardNote: $("card-tools-note"),
        count: $("card-count"), btnModel: $("btn-model"), btnMode: $("btn-mode")
    };

    const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false });
    const reducedQuery = mq("(prefers-reduced-motion: reduce)");
    let reduced = reducedQuery.matches;
    if (typeof reducedQuery.addEventListener === "function") {
        reducedQuery.addEventListener("change", (e) => { reduced = e.matches; dirty = true; });
    }

    /* ---------- persistence ---------- */

    const opened = new Set(loadOpened());

    function loadOpened() {
        try {
            const list = JSON.parse(localStorage.getItem(STORE_KEY));
            return Array.isArray(list) ? list.filter((id) => CARD_ORDER.includes(id)) : [];
        } catch {
            return [];
        }
    }

    function saveOpened() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify([...opened])); } catch { /* private mode */ }
    }

    /* ---------- state ---------- */

    let seed, maze, size, mask, eps;
    let roomAt = new Map();
    let roomIdx = {};
    let eyes = [];
    let eyeSeen = new Set();
    let visited = new Set();
    let runRooms = new Set();
    let gx = 0, gy = 0, rx = 0, ry = 0, facing = "right";
    let moving = null;
    let queue = [];
    let held = null;
    let pendingDir = null;
    const keys = [];
    const model = { state: "off", k: 0, last: 0 };
    let particles = [];
    let flakes = [];
    let idleSince = 0;
    let whisperAt = 0;
    let whisperN = 0;
    let dirty = true;
    let running = false;
    let tNow = 0;

    let tile = 16, cssW = 0, dpr = 1;
    let col = {};
    const ctx = canvas.getContext("2d");
    const mazeLayer = document.createElement("canvas");
    const memLayer = document.createElement("canvas");
    const fogLayer = document.createElement("canvas");
    const modelLayer = document.createElement("canvas");
    const mazeCtx = mazeLayer.getContext("2d");
    const memCtx = memLayer.getContext("2d");
    const fogCtx = fogLayer.getContext("2d");
    const modelCtx = modelLayer.getContext("2d");
    let frameBuf = null;

    /* ---------- colors ---------- */

    function hexToRgb(hex) {
        let h = hex.replace("#", "").trim();
        if (h.length === 3) h = h.split("").map((c) => c + c).join("");
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    function readColors() {
        const cs = getComputedStyle(root);
        const g = (name) => cs.getPropertyValue(name).trim();
        col = {
            bg: g("--color-bg"), accent: g("--accent"), accentStrong: g("--accent-strong"), text: g("--color-text"),
            hedge: g("--game-hedge"), hedgeHi: g("--game-hedge-hi"), hedgeLo: g("--game-hedge-lo"), snow: g("--game-snow"),
            lantern: g("--game-lantern"), route: g("--game-route"), ghost: g("--game-ghost"), ghostInk: g("--game-ghost-ink"),
            dark: root.getAttribute("data-theme") === "dark"
        };
        col.bgRGB = hexToRgb(col.bg);
        col.routeRGB = hexToRgb(col.route);
        col.lanternRGB = hexToRgb(col.lantern);
        col.accentRGB = hexToRgb(col.accent);
    }

    /* ---------- maze lifecycle ---------- */

    function randomSeed() {
        return 1 + Math.floor(Math.random() * 999999);
    }

    function seedFromUrl() {
        const n = parseInt(new URLSearchParams(location.search).get("maze"), 10);
        return Number.isFinite(n) && n > 0 && n < 2147483647 ? n : null;
    }

    function writeUrl() {
        try {
            const params = new URLSearchParams(location.search);
            params.delete("plain");
            params.set("maze", String(seed));
            history.replaceState(null, "", `${location.pathname}?${params}`);
        } catch { /* file:// and sandboxes */ }
    }

    function startMaze(nextSeed) {
        seed = nextSeed;
        maze = M.generate(seed, N);
        size = maze.size;
        const placed = M.placeRooms(maze, ROOM_IDS, seed);
        roomAt = new Map(placed.map((r) => [r.idx, r.id]));
        roomIdx = {};
        placed.forEach((r) => { roomIdx[r.id] = r.idx; });
        eyes = M.placeEyes(maze, 5, seed);
        eyeSeen = new Set();
        mask = M.pathMask(maze, GRAIN);
        eps = M.gaussianField(mask.length, seed ^ 0x9e3779b9);
        frameBuf = new Float32Array(mask.length);
        modelLayer.width = modelLayer.height = size * GRAIN;

        gx = maze.entrance % size;
        gy = (maze.entrance / size) | 0;
        rx = gx;
        ry = gy;
        facing = "right";
        moving = null;
        queue = [];
        held = pendingDir = null;
        keys.length = 0;
        visited = new Set([maze.entrance]);
        runRooms = new Set();
        particles = [];
        setModel(false);
        writeUrl();
        updateCount();
        setStatus("You are at the entrance. The heart is in the middle.");
        els.whisper.textContent = "";
        idleSince = performance.now();
        if (layout()) dirty = true;
    }

    function curIdx() {
        return moving ? moving.toIdx : gy * size + gx;
    }

    /* ---------- layout & layers ---------- */

    function layout() {
        // The board, status line and d-pad are one cluster; the board gets what the others leave.
        const game = els.stage.parentElement, cs = getComputedStyle(game);
        const hud = game.querySelector(".game-hud"), pad = game.querySelector(".dpad");
        const padH = getComputedStyle(pad).display === "none" ? 0 : pad.offsetHeight;
        const w = els.stage.clientWidth;
        const h = game.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - hud.offsetHeight - padH;
        if (w < 60 || h < 60 || !maze) return false;
        tile = Math.max(8, Math.floor(Math.min(w, h) / size));
        cssW = tile * size;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const px = Math.round(cssW * dpr);
        canvas.style.width = canvas.style.height = `${cssW}px`;
        [canvas, mazeLayer, memLayer, fogLayer].forEach((c) => { c.width = c.height = px; });
        readColors();
        buildStatic();
        rebuildMemory();
        flakes = Array.from({ length: Math.round(cssW / 9) }, () => newFlake(true));
        dirty = true;
        return true;
    }

    function buildStatic() {
        const c = mazeCtx;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.fillStyle = col.bg;
        c.fillRect(0, 0, cssW, cssW);
        const rng = M.mulberry32(seed * 7 + 13);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const wall = maze.walls[y * size + x];
                if (wall) drawHedge(c, x, y, rng);
                else if (rng() < 0.35) {
                    c.fillStyle = rgba(hexToRgb(col.snow), col.dark ? 0.1 : 0.9);
                    c.beginPath();
                    c.arc((x + rng()) * tile, (y + rng()) * tile, tile * 0.05, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }
    }

    function drawHedge(c, x, y, rng) {
        const px = x * tile, py = y * tile;
        c.save();
        c.beginPath();
        c.rect(px, py, tile, tile);
        c.clip();
        c.fillStyle = col.hedge;
        c.fillRect(px, py, tile, tile);
        for (let k = 0; k < 4; k++) {
            c.fillStyle = rng() < 0.5 ? col.hedgeHi : col.hedgeLo;
            c.beginPath();
            c.arc(px + rng() * tile, py + rng() * tile, tile * (0.14 + rng() * 0.16), 0, Math.PI * 2);
            c.fill();
        }
        const open = (xx, yy) => xx >= 0 && yy >= 0 && xx < size && yy < size && !maze.walls[yy * size + xx];
        if (y === 0 || open(x, y - 1)) {
            c.fillStyle = col.snow;
            c.beginPath();
            c.ellipse(px + tile / 2, py + tile * 0.1, tile * 0.58, tile * 0.2, 0, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();
    }

    function rebuildMemory() {
        const m = memCtx;
        m.setTransform(1, 0, 0, 1, 0, 0);
        m.globalCompositeOperation = "source-over";
        m.clearRect(0, 0, memLayer.width, memLayer.height);
        m.fillStyle = rgba(col.bgRGB, FOG_ALPHA);
        m.fillRect(0, 0, memLayer.width, memLayer.height);
        visited.forEach((i) => punch(i % size, (i / size) | 0));
    }

    function punch(x, y) {
        const s = tile * dpr, cx = (x + 0.5) * s, cy = (y + 0.5) * s, r = s * 2;
        const g = memCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(0,0,0,0.85)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        memCtx.globalCompositeOperation = "destination-out";
        memCtx.fillStyle = g;
        memCtx.fillRect(cx - r, cy - r, r * 2, r * 2);
        memCtx.globalCompositeOperation = "source-over";
    }

    /* ---------- drawing ---------- */

    function newFlake(anywhere) {
        return {
            x: Math.random() * cssW, y: anywhere ? Math.random() * cssW : -4,
            r: 0.6 + Math.random() * 1.4, vy: 10 + Math.random() * 18, ph: Math.random() * 6.28
        };
    }

    function draw(now, dt) {
        if (!cssW) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(mazeLayer, 0, 0, cssW, cssW);
        drawFootprints();
        drawEyes(now);
        drawDoors(now);
        drawFog(now);
        drawBeacons(now);
        drawPlayer(now);
        drawParticles(dt);
        if (model.state !== "off") {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(modelLayer, 0, 0, cssW, cssW);
            ctx.imageSmoothingEnabled = true;
        }
        if (!reduced) drawSnow(dt);
    }

    function drawFootprints() {
        ctx.fillStyle = rgba(col.accentRGB, 0.5);
        visited.forEach((i) => {
            ctx.beginPath();
            ctx.arc(((i % size) + 0.5) * tile, (((i / size) | 0) + 0.5) * tile, tile * 0.11, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawEyes(now) {
        const pcx = rx + 0.5, pcy = ry + 0.5;
        eyes.forEach((idx, n) => {
            const x = (idx % size) + 0.5, y = ((idx / size) | 0) + 0.5;
            const blink = !reduced && ((now / 1000 + n * 1.7) % 5) < 0.14;
            const ang = Math.atan2(pcy - y, pcx - x);
            [-0.2, 0.2].forEach((dx) => {
                const ex = (x + dx) * tile, ey = y * tile;
                ctx.fillStyle = col.lantern;
                ctx.beginPath();
                ctx.ellipse(ex, ey, tile * 0.11, blink ? tile * 0.015 : tile * 0.11, 0, 0, Math.PI * 2);
                ctx.fill();
                if (!blink) {
                    ctx.fillStyle = "#1a1612";
                    ctx.beginPath();
                    ctx.arc(ex + Math.cos(ang) * tile * 0.04, ey + Math.sin(ang) * tile * 0.04, tile * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }

    function drawDoors(now) {
        // entrance chevron
        const ex = maze.entrance % size, ey = (maze.entrance / size) | 0;
        const ix = (maze.entranceCell % size) - ex, iy = ((maze.entranceCell / size) | 0) - ey;
        ctx.save();
        ctx.translate((ex + 0.5) * tile, (ey + 0.5) * tile);
        ctx.rotate(Math.atan2(iy, ix));
        ctx.fillStyle = col.lantern;
        ctx.beginPath();
        ctx.moveTo(tile * 0.28, 0);
        ctx.lineTo(-tile * 0.18, -tile * 0.26);
        ctx.lineTo(-tile * 0.18, tile * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // heart
        const hx = ((maze.heart % size) + 0.5) * tile, hy = (((maze.heart / size) | 0) + 0.5) * tile;
        ctx.strokeStyle = col.route;
        ctx.lineWidth = Math.max(1.5, tile * 0.1);
        ctx.beginPath();
        ctx.arc(hx, hy, tile * 0.33, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = Math.max(1, tile * 0.07);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
            const cx = hx + sx * tile * 0.44, cy = hy + sy * tile * 0.44;
            ctx.beginPath();
            ctx.moveTo(cx - sx * tile * 0.18, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy - sy * tile * 0.18);
            ctx.stroke();
        });
        ctx.fillStyle = opened.has("heart") ? col.accent : col.lantern;
        ctx.beginPath();
        ctx.arc(hx, hy, tile * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // rooms: little arched doors, stamped blue once read
        roomAt.forEach((id, idx) => {
            const x = idx % size, y = (idx / size) | 0;
            const px = x * tile, py = y * tile, w = tile * 0.62, x0 = px + (tile - w) / 2;
            const done = opened.has(id);
            ctx.fillStyle = done ? col.accent : col.lantern;
            ctx.beginPath();
            ctx.moveTo(x0, py + tile * 0.9);
            ctx.lineTo(x0, py + tile * 0.48);
            ctx.arc(px + tile / 2, py + tile * 0.48, w / 2, Math.PI, 0);
            ctx.lineTo(x0 + w, py + tile * 0.9);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = done ? col.bg : "#1a1612";
            ctx.lineWidth = Math.max(1, tile * 0.07);
            ctx.beginPath();
            if (done) {
                ctx.moveTo(px + tile * 0.36, py + tile * 0.6);
                ctx.lineTo(px + tile * 0.47, py + tile * 0.72);
                ctx.lineTo(px + tile * 0.66, py + tile * 0.45);
            } else {
                ctx.arc(px + tile * 0.6, py + tile * 0.68, tile * 0.035, 0, Math.PI * 2);
            }
            ctx.stroke();
        });
    }

    function drawFog(now) {
        const f = fogCtx;
        f.setTransform(1, 0, 0, 1, 0, 0);
        f.globalCompositeOperation = "copy";
        f.drawImage(memLayer, 0, 0);
        f.globalCompositeOperation = "destination-out";
        const s = tile * dpr;
        const flicker = reduced ? 1 : 1 + 0.03 * Math.sin(now / 130) + 0.02 * Math.sin(now / 47);
        const cx = (rx + 0.5) * s, cy = (ry + 0.5) * s, r = s * LIGHT_TILES * flicker;
        const g = f.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.55, "rgba(0,0,0,0.9)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        f.fillStyle = g;
        f.fillRect(cx - r, cy - r, r * 2, r * 2);
        f.globalCompositeOperation = "source-over";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(fogLayer, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const lx = (rx + 0.5) * tile, ly = (ry + 0.5) * tile, lr = tile * LIGHT_TILES * flicker;
        const warm = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        warm.addColorStop(0, rgba(col.lanternRGB, col.dark ? 0.22 : 0.16));
        warm.addColorStop(1, rgba(col.lanternRGB, 0));
        ctx.fillStyle = warm;
        ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    }

    function drawBeacons(now) {
        const glow = (idx, rgb, a, n) => {
            const x = ((idx % size) + 0.5) * tile, y = (((idx / size) | 0) + 0.5) * tile;
            const pulse = reduced ? 1 : 1 + 0.18 * Math.sin(now / 520 + n);
            const r = tile * 1.25 * pulse;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, rgba(rgb, a));
            g.addColorStop(1, rgba(rgb, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        };
        let n = 0;
        roomAt.forEach((id, idx) => {
            glow(idx, opened.has(id) ? col.accentRGB : col.lanternRGB, opened.has(id) ? 0.3 : 0.55, n++);
        });
        glow(maze.heart, col.routeRGB, 0.4, n);
    }

    function drawPlayer(now) {
        const bob = reduced ? 0 : Math.sin(now / 220) * tile * 0.04;
        const cx = (rx + 0.5) * tile, cy = (ry + 0.5) * tile + bob;
        const r = tile * 0.4;
        const side = facing === "left" ? -1 : 1;
        // lantern
        const lx = cx + side * r * 1.05, ly = cy + r * 0.35;
        const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 1.4);
        halo.addColorStop(0, rgba(col.lanternRGB, 0.65));
        halo.addColorStop(1, rgba(col.lanternRGB, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(lx - r * 1.4, ly - r * 1.4, r * 2.8, r * 2.8);
        ctx.fillStyle = col.lantern;
        ctx.beginPath();
        ctx.arc(lx, ly, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // ghost
        const hem = cy + r * 0.95;
        ctx.beginPath();
        ctx.moveTo(cx - r, hem);
        ctx.lineTo(cx - r, cy - r * 0.1);
        ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
        ctx.lineTo(cx + r, hem);
        const sc = (r * 2) / 3;
        for (let k = 0; k < 3; k++) {
            const x1 = cx + r - sc * k, x2 = x1 - sc;
            ctx.quadraticCurveTo((x1 + x2) / 2, hem + (k % 2 ? -1 : 1) * r * 0.3, x2, hem);
        }
        ctx.closePath();
        ctx.fillStyle = col.ghost;
        ctx.fill();
        ctx.strokeStyle = col.ghostInk;
        ctx.lineWidth = Math.max(1, tile * 0.06);
        ctx.stroke();
        // eyes follow the way you are heading
        const d = DIRS[facing];
        ctx.fillStyle = "#1a1612";
        [-0.36, 0.36].forEach((dx) => {
            ctx.beginPath();
            ctx.arc(cx + dx * r + d[0] * r * 0.16, cy - r * 0.22 + d[1] * r * 0.12, r * 0.13, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawParticles(dt) {
        if (!particles.length) return;
        particles = particles.filter((p) => (p.life -= dt) > 0);
        particles.forEach((p) => {
            p.x += p.vx * dt / 1000;
            p.y += p.vy * dt / 1000;
            p.vy += 60 * dt / 1000;
            ctx.fillStyle = rgba(col.lanternRGB, Math.max(0, p.life / 900));
            ctx.beginPath();
            ctx.arc(p.x, p.y, tile * 0.07, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function burst() {
        if (reduced) return;
        const x = (rx + 0.5) * tile, y = (ry + 0.5) * tile;
        for (let i = 0; i < 48; i++) {
            const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 110;
            particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 500 + Math.random() * 500 });
        }
    }

    function drawSnow(dt) {
        ctx.fillStyle = col.dark ? "rgba(237, 232, 220, 0.5)" : "rgba(46, 101, 132, 0.28)";
        flakes.forEach((f, n) => {
            f.y += f.vy * dt / 1000;
            f.ph += dt / 900;
            f.x += Math.sin(f.ph) * 8 * dt / 1000;
            if (f.y > cssW + 4) flakes[n] = newFlake(false);
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /* ---------- the stand-in model ---------- */

    function renderModelFrame() {
        const side = size * GRAIN;
        M.denoiseFrame(mask, eps, model.k, STEPS, frameBuf);
        const ab = M.alphaBar(model.k, STEPS);
        const staticA = Math.min(0.95, 1.6 * (1 - ab));
        const img = modelCtx.createImageData(side, side);
        const d = img.data, red = col.routeRGB;
        for (let i = 0, o = 0; i < frameBuf.length; i++, o += 4) {
            const v = frameBuf[i];
            const level = Math.max(0, Math.min(1, 0.5 + 0.5 * v));
            const gray = 60 + level * 185;
            const redA = Math.max(0, Math.min(1, v)) * ab * 0.95;
            const sA = staticA * (1 - redA);
            const A = redA + sA;
            if (A < 0.002) continue;
            d[o] = (red[0] * redA + gray * sA) / A;
            d[o + 1] = (red[1] * redA + gray * sA) / A;
            d[o + 2] = (red[2] * redA + gray * sA) / A;
            d[o + 3] = A * 255;
        }
        modelCtx.putImageData(img, 0, 0);
    }

    function setModel(on) {
        if (on) {
            model.state = reduced ? "shown" : "running";
            model.k = reduced ? STEPS : 0;
            model.last = performance.now();
            if (col.routeRGB) renderModelFrame();
            setStatus(reduced ? "The model's answer is the red thread." : "The model is denoising…");
        } else {
            model.state = "off";
        }
        els.btnModel.setAttribute("aria-pressed", on ? "true" : "false");
        els.modelNote.hidden = !on;
        dirty = true;
    }

    /* ---------- movement ---------- */

    const isOpen = (x, y) => x >= 0 && y >= 0 && x < size && y < size && !maze.walls[y * size + x];
    const dialogOpen = () => !!document.querySelector("dialog[open]");
    const inGame = () => root.getAttribute("data-mode") === "game";
    const playing = () => inGame() && !dialogOpen();

    function startMove(toIdx) {
        const tx = toIdx % size, ty = (toIdx / size) | 0;
        const dx = tx - gx, dy = ty - gy;
        if (Math.abs(dx) + Math.abs(dy) !== 1) { queue = []; return; }
        facing = dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";
        moving = { fx: gx, fy: gy, tx, ty, toIdx, t0: tNow };
    }

    function tryDir(dir) {
        const d = DIRS[dir];
        facing = dir;
        dirty = true;
        if (isOpen(gx + d[0], gy + d[1])) startMove((gy + d[1]) * size + gx + d[0]);
    }

    function finishStep() {
        gx = moving.tx;
        gy = moving.ty;
        rx = gx;
        ry = gy;
        const idx = moving.toIdx;
        moving = null;
        if (!visited.has(idx)) {
            visited.add(idx);
            punch(gx, gy);
        }
        onArrive(idx);
    }

    function onArrive(idx) {
        if (queue.length || dialogOpen()) return;
        if (roomAt.has(idx)) { openRoom(roomAt.get(idx)); return; }
        if (idx === maze.heart) { openRoom("heart"); return; }
        eyes.forEach((e) => {
            const ex = e % size, ey = (e / size) | 0;
            if (!eyeSeen.has(e) && Math.abs(ex - gx) + Math.abs(ey - gy) <= 1) {
                eyeSeen.add(e);
                setStatus("The hedge blinked.");
            }
        });
    }

    function update(now, dt) {
        tNow = now;
        if (moving) {
            const t = reduced ? 1 : Math.min(1, (now - moving.t0) / STEP_MS);
            rx = moving.fx + (moving.tx - moving.fx) * t;
            ry = moving.fy + (moving.ty - moving.fy) * t;
            dirty = true;
            if (t >= 1) finishStep();
        }
        if (!moving && !dialogOpen()) {
            if (queue.length) startMove(queue.shift());
            else if (held || pendingDir) {
                const dir = held || pendingDir;
                pendingDir = null;
                tryDir(dir);
            }
        }
        if (model.state === "running" && now - model.last >= 70) {
            model.last = now;
            model.k += 1;
            renderModelFrame();
            if (model.k >= STEPS) {
                model.state = "shown";
                setStatus("The model's answer is the red thread. It does not walk it; it just knows.");
            }
            dirty = true;
        }
        if (!reduced && now - idleSince > 22000 && now - whisperAt > 14000 && !dialogOpen()) {
            whisperAt = now;
            els.whisper.textContent = WHISPERS[whisperN++ % WHISPERS.length];
        }
    }

    let lastFrame = 0;
    function frame(now) {
        if (!running) return;
        requestAnimationFrame(frame);
        const dt = Math.min(64, now - (lastFrame || now));
        lastFrame = now;
        update(now, dt);
        if (dirty || !reduced) {
            draw(now, dt);
            dirty = false;
        }
    }

    function startLoop() {
        if (running) return;
        running = true;
        lastFrame = 0;
        requestAnimationFrame(frame);
    }

    function stopLoop() {
        running = false;
    }

    function userActive() {
        idleSince = performance.now();
        if (els.whisper.textContent) els.whisper.textContent = "";
    }

    /* ---------- walking helpers ---------- */

    function walkTo(id) {
        const target = id === "heart" ? maze.heart : roomIdx[id];
        if (target === undefined) return;
        const from = curIdx();
        const path = M.shortestPath(maze.walls, size, from, target);
        queue = [];
        held = pendingDir = null;
        if (!path || path.length < 2) {
            if (!moving) openRoom(id);
            return;
        }
        queue = path.slice(1);
        setStatus(`Walking to ${ROOMS[id].label}…`);
        userActive();
    }

    function tapAt(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((clientX - rect.left) / rect.width) * size);
        const y = Math.floor(((clientY - rect.top) / rect.height) * size);
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const idx = y * size + x;
        if (idx === curIdx()) { openHere(); return; }
        if (!visited.has(idx)) {
            setStatus("Walk there first. You can tap any footprint to go back to it.");
            return;
        }
        const path = M.shortestPath(maze.walls, size, curIdx(), idx, visited);
        if (path && path.length > 1) {
            queue = path.slice(1);
            held = pendingDir = null;
        }
    }

    // A swipe runs down the corridor until it reaches a junction, a room, or a wall.
    function runDir(dir) {
        const d = DIRS[dir];
        const start = curIdx();
        let x = start % size, y = (start / size) | 0, came = start;
        const path = [];
        for (let guard = 0; guard < size * size; guard++) {
            if (!isOpen(x + d[0], y + d[1])) break;
            x += d[0];
            y += d[1];
            const idx = y * size + x;
            path.push(idx);
            const exits = M.openNeighbors(maze.walls, size, idx).filter((j) => j !== came);
            came = idx;
            if (exits.length !== 1 || roomAt.has(idx) || idx === maze.heart) break;
        }
        if (path.length) {
            queue = path;
            held = pendingDir = null;
        } else {
            tryDir(dir);
        }
    }

    function openHere() {
        const idx = curIdx();
        if (roomAt.has(idx)) openRoom(roomAt.get(idx));
        else if (idx === maze.heart) openRoom("heart");
    }

    /* ---------- card, rooms, verdict ---------- */

    function setStatus(text) {
        els.status.textContent = text;
    }

    function updateCount() {
        els.count.textContent = `${opened.size}/9`;
    }

    function completeLines(set) {
        return LINES.filter((line) => line.every((i) => set.has(CARD_ORDER[i])));
    }

    function markOpened(id) {
        const before = completeLines(opened).length;
        const hadAll = opened.size === CARD_ORDER.length;
        if (id !== "heart") runRooms.add(id);
        if (!opened.has(id)) {
            opened.add(id);
            saveOpened();
        }
        updateCount();
        if (opened.size === CARD_ORDER.length && !hadAll) return "blackout";
        return completeLines(opened).length > before ? "bingo" : "";
    }

    function cloneClean(node) {
        const copy = node.cloneNode(true);
        copy.removeAttribute("id");
        copy.removeAttribute("data-room");
        copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        return copy;
    }

    function openRoom(id) {
        const def = ROOMS[id];
        if (!def || els.room.open) return;
        const nodes = [...document.querySelectorAll(`[data-room="${id}"]`)].map(cloneClean);
        els.roomBody.replaceChildren(...nodes);
        if (id === "heart") els.roomBody.append(buildVerdict());
        els.roomTitle.textContent = def.label;
        const n = ROOM_IDS.indexOf(id) + 1;
        els.roomKicker.textContent = id === "heart" ? def.kicker : `${def.kicker} · room ${n} of ${ROOM_IDS.length}`;

        const note = markOpened(id);
        const foot = els.roomFoot;
        foot.replaceChildren();
        foot.append(`Stamped. ${opened.size} of ${CARD_ORDER.length} squares on your card.`);
        if (note) {
            const strong = document.createElement("strong");
            strong.textContent = note === "blackout" ? " BLACKOUT." : " BINGO.";
            foot.append(strong, note === "blackout" ? " You read everything. The maze has nothing left to hide." : " A full line on your card.");
            setStatus(note === "blackout" ? "Blackout. Every square stamped." : "Bingo. A full line on your card.");
            burst();
        } else {
            setStatus(`${def.label}. ${opened.size} of ${CARD_ORDER.length} stamped.`);
        }
        dirty = true;
        els.room.showModal();
        els.room.scrollTop = 0;
    }

    function plural(n, word) {
        return `${n} ${word}${n === 1 ? "" : "s"}`;
    }

    function buildVerdict() {
        const j = M.judge(maze, visited);
        const rooms = runRooms.size;
        const box = document.createElement("div");
        box.className = "verdict";
        const head = document.createElement("div");
        head.className = "verdict-head";
        const label = document.createElement("span");
        label.className = "verdict-label";
        label.textContent = "Verdict on your route";
        const result = document.createElement("span");
        result.className = "verdict-result";
        head.append(label, result);
        const lines = [];
        if (!j.reachedHeart) {
            box.classList.add("is-waiting");
            result.textContent = "Waiting";
            lines.push("The judge sits at the heart. It grades your route when you arrive: exactly one simple path, no stray blobs, no repair step.");
        } else if (j.solved) {
            box.classList.add("is-solved");
            result.textContent = "Solved";
            lines.push(`One clean path, ${j.pathTiles} tiles, nothing stray.`);
            lines.push(`You opened ${rooms} of ${ROOM_IDS.length} rooms on this walk. They are in the dead ends you skipped.`);
        } else {
            box.classList.add("is-lost");
            result.textContent = "Lost";
            lines.push(`Reason: ${plural(j.strayBlobs, "stray blob")}, ${plural(j.strayTiles, "stray tile")} off the path. The judge runs no repair step.`);
            lines.push(rooms
                ? `You also opened ${rooms} of ${ROOM_IDS.length} rooms on this walk, which is the better score.`
                : "You wandered and opened no rooms. They are in the dead ends.");
        }
        box.append(head);
        lines.forEach((text) => {
            const p = document.createElement("p");
            p.textContent = text;
            box.append(p);
        });
        return box;
    }

    function renderCard() {
        const lit = new Set();
        completeLines(opened).forEach((line) => line.forEach((i) => lit.add(i)));
        els.cardGrid.replaceChildren(...CARD_ORDER.map((id, i) => {
            const def = ROOMS[id];
            const stamped = opened.has(id);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "card-cell" + (stamped ? " is-stamped" : "") + (lit.has(i) ? " is-line" : "");
            btn.dataset.id = id;
            btn.setAttribute("aria-label", `${def.label}: ${def.teaser}. ${stamped ? "Stamped." : "Not visited yet."} Walk me there.`);
            const label = document.createElement("span");
            label.className = "card-cell-label";
            label.textContent = def.label;
            const teaser = document.createElement("span");
            teaser.className = "card-cell-teaser";
            teaser.textContent = def.teaser;
            const state = document.createElement("span");
            state.className = "card-cell-state";
            state.textContent = stamped ? "Stamped" : "Walk me there";
            btn.append(label, teaser, state);
            return btn;
        }));
        els.cardSummary.textContent = `${opened.size} of ${CARD_ORDER.length}`;
        els.cardVerdict.replaceChildren(buildVerdict());
        els.card.querySelector(".dlg-kicker").textContent = `Your card · maze #${seed}`;
        els.cardNote.textContent = "";
    }

    function openCard() {
        if (dialogOpen()) return;
        renderCard();
        els.card.showModal();
        els.card.scrollTop = 0;
    }

    /* ---------- modes & wiring ---------- */

    function closeDialogs() {
        document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    }

    function resetInput() {
        keys.length = 0;
        held = pendingDir = null;
    }

    function setMode(mode, persist) {
        closeDialogs();
        root.setAttribute("data-mode", mode);
        if (persist) {
            try { localStorage.setItem("mode", mode); } catch { /* ignore */ }
        }
        const game = mode === "game";
        els.btnMode.textContent = game ? "Plain page" : "Play the maze";
        els.btnMode.setAttribute("aria-label", game ? "Switch to the plain page" : "Switch to the maze game");
        if (game) {
            if (PLAIN_HASH.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
            requestAnimationFrame(() => {
                layout();
                startLoop();
                dirty = true;
                canvas.focus({ preventScroll: true });
            });
        } else {
            stopLoop();
            window.scrollTo(0, 0);
        }
    }

    function newMaze() {
        closeDialogs();
        startMaze(randomSeed());
        canvas.focus({ preventScroll: true });
    }

    function init() {
        readColors();
        startMaze(seedFromUrl() || randomSeed());
        updateCount();
        setMode(root.getAttribute("data-mode") === "plain" ? "plain" : "game", false);

        els.btnMode.addEventListener("click", () => setMode(inGame() ? "plain" : "game", true));
        $("skip-game").addEventListener("click", () => setMode("plain", true));
        $("btn-intro-plain").addEventListener("click", () => setMode("plain", true));
        $("btn-start").addEventListener("click", () => els.intro.close());
        $("btn-card").addEventListener("click", openCard);
        $("btn-new").addEventListener("click", newMaze);
        els.btnModel.addEventListener("click", () => setModel(model.state === "off"));
        $("room-close").addEventListener("click", () => els.room.close());
        $("card-close").addEventListener("click", () => els.card.close());

        els.cardGrid.addEventListener("click", (e) => {
            const cell = e.target.closest(".card-cell");
            if (!cell) return;
            els.card.close();
            walkTo(cell.dataset.id);
        });
        $("card-share").addEventListener("click", () => {
            const url = `${location.origin}${location.pathname}?maze=${seed}`;
            const done = () => { els.cardNote.textContent = "Link copied."; };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => window.prompt("Copy this link:", url));
            else window.prompt("Copy this link:", url);
        });
        $("card-reset").addEventListener("click", () => {
            opened.clear();
            runRooms.clear();
            saveOpened();
            updateCount();
            renderCard();
            els.cardNote.textContent = "Card cleared.";
            dirty = true;
        });

        [els.intro, els.room, els.card].forEach((dlg) => {
            dlg.addEventListener("close", () => {
                resetInput();
                userActive();
                dirty = true;
                if (inGame() && !dialogOpen() && dlg !== els.card) canvas.focus({ preventScroll: true });
            });
        });

        document.addEventListener("keydown", (e) => {
            if (!playing() || e.ctrlKey || e.metaKey || e.altKey) return;
            const dir = KEYS[e.key];
            if (dir) {
                e.preventDefault();
                if (!keys.includes(dir)) keys.push(dir);
                held = dir;
                pendingDir = dir;
                queue = [];
                userActive();
                return;
            }
            const tag = document.activeElement ? document.activeElement.tagName : "";
            if ((e.key === "Enter" || e.key === " ") && tag !== "BUTTON" && tag !== "A") {
                e.preventDefault();
                openHere();
            } else if (e.key === "c" || e.key === "C") {
                openCard();
            } else if (e.key === "m" || e.key === "M") {
                setModel(model.state === "off");
            } else if (e.key === "Escape" && model.state !== "off") {
                setModel(false);
            }
        });
        document.addEventListener("keyup", (e) => {
            const dir = KEYS[e.key];
            if (!dir) return;
            const at = keys.indexOf(dir);
            if (at !== -1) keys.splice(at, 1);
            held = keys[keys.length - 1] || null;
        });
        window.addEventListener("blur", resetInput);

        let ptr = null;
        canvas.addEventListener("pointerdown", (e) => {
            ptr = { x: e.clientX, y: e.clientY };
            userActive();
            try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        });
        canvas.addEventListener("pointerup", (e) => {
            if (!ptr || !playing()) { ptr = null; return; }
            const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
            ptr = null;
            if (Math.hypot(dx, dy) < 14) tapAt(e.clientX, e.clientY);
            else runDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
        });
        canvas.addEventListener("pointercancel", () => { ptr = null; });

        document.querySelectorAll(".dpad button").forEach((btn) => {
            const dir = btn.dataset.dir;
            btn.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                if (!playing()) return;
                held = pendingDir = dir;
                queue = [];
                userActive();
            });
            ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
                btn.addEventListener(type, () => { if (held === dir) held = null; });
            });
        });

        if (typeof ResizeObserver === "function") {
            const ro = new ResizeObserver(() => { if (inGame() && layout()) dirty = true; });
            ro.observe(els.stage.parentElement);
            ro.observe(document.querySelector(".game-hud"));
        }
        window.addEventListener("resize", () => { if (inGame() && layout()) dirty = true; });

        new MutationObserver(() => {
            if (!cssW) return;
            readColors();
            buildStatic();
            rebuildMemory();
            if (model.state !== "off") renderModelFrame();
            dirty = true;
        }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

        window.addEventListener("hashchange", () => {
            if (inGame() && PLAIN_HASH.test(location.hash)) setMode("plain", false);
        });

        const baseTitle = document.title;
        document.addEventListener("visibilitychange", () => {
            document.title = document.hidden && inGame() ? "the lantern is going out…" : baseTitle;
        });

        if (inGame()) els.intro.showModal();
    }

    init();
})();
