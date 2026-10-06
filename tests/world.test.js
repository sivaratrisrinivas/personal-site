// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/maze.js");
const Lore = require("../js/lore.js");
const IW = require("../js/world.js");

const w = IW.build();
const idx = (x, y) => y * w.W + x;

test("the island is deterministic", () => {
    const again = IW.build();
    assert.deepEqual(again.tiles, w.tiles);
    assert.deepEqual(again.interactables.map((i) => [i.id, i.tx, i.ty]), w.interactables.map((i) => [i.id, i.tx, i.ty]));
});

test("every place in the lore has a building (or the dock) and an interactable", () => {
    for (const id of Object.keys(Lore.SPOTS)) {
        assert.ok(w.byId[id], `${id} has a building`);
        assert.ok(w.interactables.some((i) => i.kind === "spot" && i.id === id), `${id} is interactable`);
    }
});

test("buildings sit on land and do not overlap each other, the garden, or the plaza", () => {
    const seen = new Map();
    for (const b of w.buildings) {
        for (let y = b.y; y < b.y + b.h; y++) {
            for (let x = b.x; x < b.x + b.w; x++) {
                assert.notEqual(w.tiles[idx(x, y)], IW.WATER, `${b.id} tile ${x},${y} is land`);
                assert.ok(w.solid[idx(x, y)], `${b.id} is solid`);
                assert.ok(![IW.HEDGE, IW.GARDEN, IW.PLAZA].includes(w.tiles[idx(x, y)]), `${b.id} clear of garden and plaza`);
                assert.ok(!seen.has(idx(x, y)), `${b.id} overlaps ${seen.get(idx(x, y))}`);
                seen.set(idx(x, y), b.id);
            }
        }
    }
});

test("everything you can interact with can be reached from the spawn", () => {
    const sx = Math.floor(w.spawn.x), sy = Math.floor(w.spawn.y);
    assert.ok(IW.walkable(w, sx, sy), "spawn is walkable");
    for (const i of w.interactables) {
        // signs, owl, chest, button and buildings are solid: reach the tile in front of them
        const candidates = [[i.tx, i.ty], [i.tx, i.ty + 1], [i.tx - 1, i.ty], [i.tx + 1, i.ty], [i.tx, i.ty - 1]];
        const ok = candidates.some(([tx, ty]) => IW.walkable(w, tx, ty) && IW.findPath(w, sx, sy, tx, ty) !== null);
        assert.ok(ok, `${i.id} (${i.kind}) at ${i.tx},${i.ty} is reachable`);
    }
});

test("every detail in the lore is buried exactly once, or is a special", () => {
    const buried = w.digs.map((d) => d.detail).sort();
    const expected = Lore.DETAILS.filter((d) => !d.special).map((d) => d.id).sort();
    assert.deepEqual(buried, expected);
    for (const d of w.digs) {
        assert.ok(!w.solid[idx(d.tx, d.ty)], `${d.id} is not buried in something solid`);
        assert.ok([IW.GRASS, IW.SNOW].includes(w.tiles[idx(d.tx, d.ty)]), `${d.id} is on open ground`);
    }
    assert.equal(new Set(w.digs.map((d) => idx(d.tx, d.ty))).size, w.digs.length, "no two share a tile");
    for (const sp of Lore.DETAILS.filter((d) => d.special)) {
        assert.ok(w.interactables.some((i) => i.id === sp.id), `${sp.id} has a home`);
    }
});

test("each dig sits near the place it is about", () => {
    for (const d of w.digs) {
        const lore = Lore.DETAILS.find((x) => x.id === d.detail);
        if (!lore.near || lore.abs) continue;
        const b = w.byId[lore.near];
        const dist = Math.hypot(d.tx - b.frontX, d.ty - b.frontY);
        assert.ok(dist <= 12, `${d.detail} is ${dist.toFixed(1)} tiles from ${lore.near}`);
    }
});

test("the garden is the unmaze maze: entrance on the road side, the heart reachable, the chest at the heart", () => {
    const g = w.garden;
    assert.equal(g.size, 11);
    assert.equal(g.entrance[1], g.y, "entrance gap in the top row");
    const sx = g.entrance[0], sy = g.entrance[1];
    assert.ok(IW.walkable(w, sx, sy));
    const chest = w.interactables.find((i) => i.kind === "chest");
    assert.deepEqual([chest.tx, chest.ty], g.heart);
    const beside = [[g.heart[0] + 1, g.heart[1]], [g.heart[0] - 1, g.heart[1]], [g.heart[0], g.heart[1] + 1], [g.heart[0], g.heart[1] - 1]];
    const spawn = [Math.floor(w.spawn.x), Math.floor(w.spawn.y)];
    assert.ok(beside.some(([x, y]) => IW.walkable(w, x, y) && IW.findPath(w, spawn[0], spawn[1], x, y)), "walk from spawn to the heart");
    // the walls in the world are exactly the maze's walls
    for (let y = 0; y < g.size; y++) {
        for (let x = 0; x < g.size; x++) {
            const hedge = w.tiles[idx(g.x + x, g.y + y)] === IW.HEDGE;
            assert.equal(hedge, g.maze.walls[y * g.size + x] === 1);
        }
    }
});

test("the garden judge: the exact route is solved, a detour is lost", () => {
    const g = w.garden;
    assert.equal(M.judge(g.maze, new Set(g.maze.solution)).solved, true);
    const dead = g.maze.deadEnds[0];
    const detour = M.pathTo(M.bfs(g.maze.walls, g.maze.size, g.maze.entrance).parent, g.maze.entrance, dead);
    assert.equal(M.judge(g.maze, new Set([...g.maze.solution, ...detour])).solved, false);
});

test("collision: water and buildings block, roads do not", () => {
    const T = IW.T;
    const spawnX = w.spawn.x * T + T / 2, spawnY = w.spawn.y * T + T - 2;
    assert.equal(IW.collides(w, spawnX, spawnY), false, "the spawn tile is free");
    assert.equal(IW.collides(w, 2 * T, 2 * T), true, "ocean blocks");
    const b = w.buildings[0];
    assert.equal(IW.collides(w, (b.x + 1) * T, (b.y + 1) * T), true, "buildings block");
    assert.equal(IW.collides(w, -5, 100), true, "the world edge blocks");
});

test("pathfinding avoids solids and returns adjacent steps", () => {
    const sx = Math.floor(w.spawn.x), sy = Math.floor(w.spawn.y);
    const target = w.interactables.find((i) => i.kind === "spot" && i.id === "school");
    const path = IW.findPath(w, sx, sy, target.tx, target.ty);
    assert.ok(path && path.length > 5);
    let [px, py] = [sx, sy];
    for (const [x, y] of path) {
        assert.equal(Math.abs(x - px) + Math.abs(y - py), 1);
        assert.ok(IW.walkable(w, x, y));
        [px, py] = [x, y];
    }
    assert.equal(IW.findPath(w, sx, sy, 0, 0), null, "no path into the ocean");
});

test("the dock reaches out into the water and ends at the contact bottle", () => {
    const dock = w.interactables.find((i) => i.id === "dock");
    assert.equal(w.tiles[idx(dock.tx, dock.ty)], IW.PLANK);
    assert.equal(w.tiles[idx(dock.tx + 2, dock.ty)], IW.WATER);
});

test("decor never blocks a road or sits on a dig", () => {
    const digs = new Set(w.digs.map((d) => idx(d.tx, d.ty)));
    for (const d of w.decor) {
        assert.ok(![IW.PATH, IW.PLAZA, IW.PLANK, IW.HEDGE, IW.GARDEN].includes(w.tiles[idx(d.tx, d.ty)]) || d.kind === "lamp" || d.kind === "fence", `${d.kind} at ${d.tx},${d.ty}`);
        assert.ok(!digs.has(idx(d.tx, d.ty)));
    }
});
