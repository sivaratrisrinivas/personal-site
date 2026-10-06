// Run with: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/maze.js");

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

test("mulberry32 is deterministic and stays in [0, 1)", () => {
    const a = M.mulberry32(42), b = M.mulberry32(42);
    for (let i = 0; i < 100; i++) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test("generate: same seed, same maze; different seeds differ", () => {
    assert.deepEqual(M.generate(7).walls, M.generate(7).walls);
    assert.notDeepEqual(M.generate(7).walls, M.generate(8).walls);
});

test("generate: every maze is perfect (connected, no loops)", () => {
    for (const seed of SEEDS) {
        const m = M.generate(seed, 11);
        let open = 0, edges = 0;
        for (let i = 0; i < m.walls.length; i++) {
            if (m.walls[i]) continue;
            open++;
            edges += M.openNeighbors(m.walls, m.size, i).filter((j) => j > i).length;
        }
        const { dist } = M.bfs(m.walls, m.size, m.entrance);
        const reached = Array.from(dist).filter((d) => d >= 0).length;
        assert.equal(reached, open, `seed ${seed}: every open tile is reachable`);
        assert.equal(edges, open - 1, `seed ${seed}: a tree has one fewer edge than tiles`);
        assert.equal(open, 2 * 11 * 11, `seed ${seed}: 121 cells + 120 passages + entrance`);
    }
});

test("generate: entrance on the outer ring, heart at the centre, solution is one simple path", () => {
    for (const seed of SEEDS) {
        const m = M.generate(seed, 11);
        const ex = m.entrance % m.size, ey = (m.entrance / m.size) | 0;
        assert.ok(ex === 0 || ey === 0 || ex === m.size - 1 || ey === m.size - 1, `seed ${seed}: entrance on ring`);
        assert.equal(m.walls[m.entrance], 0);
        assert.equal(m.heart, 11 * m.size + 11);
        assert.equal(m.solution[0], m.entrance);
        assert.equal(m.solution[m.solution.length - 1], m.heart);
        assert.equal(new Set(m.solution).size, m.solution.length, "no repeated tiles");
        for (let k = 1; k < m.solution.length; k++) {
            assert.ok(M.openNeighbors(m.walls, m.size, m.solution[k - 1]).includes(m.solution[k]));
        }
    }
});

test("judge: the exact path is SOLVED", () => {
    const m = M.generate(5, 11);
    const verdict = M.judge(m, new Set(m.solution));
    assert.equal(verdict.solved, true);
    assert.equal(verdict.reachedHeart, true);
    assert.equal(verdict.strayTiles, 0);
    assert.equal(verdict.strayBlobs, 0);
});

test("judge: a detour into a dead end is LOST, counted as one stray blob", () => {
    const m = M.generate(5, 11);
    const parent = M.bfs(m.walls, m.size, m.entrance).parent;
    const detour = M.pathTo(parent, m.entrance, m.deadEnds[0]);
    const verdict = M.judge(m, new Set([...m.solution, ...detour]));
    assert.equal(verdict.solved, false);
    assert.equal(verdict.reachedHeart, true);
    assert.equal(verdict.strayBlobs, 1);
    assert.ok(verdict.strayTiles > 0);
    assert.equal(verdict.missingTiles, 0);
});

test("judge: stopping short of the heart is not SOLVED", () => {
    const m = M.generate(5, 11);
    const verdict = M.judge(m, new Set(m.solution.slice(0, -3)));
    assert.equal(verdict.solved, false);
    assert.equal(verdict.reachedHeart, false);
    assert.equal(verdict.missingTiles, 3);
});

test("bfs with an allowed set stays inside it", () => {
    const m = M.generate(5, 11);
    const allowed = new Set(m.solution);
    const path = M.shortestPath(m.walls, m.size, m.entrance, m.heart, allowed);
    assert.deepEqual(path, m.solution);
    const off = m.deadEnds[0];
    assert.equal(M.shortestPath(m.walls, m.size, m.entrance, off, allowed), null);
});

test("denoise: schedule climbs from noise to clean, and the last frame is the exact path", () => {
    const steps = 40;
    assert.equal(M.alphaBar(steps, steps), 1);
    assert.ok(M.alphaBar(0, steps) < 0.001);
    for (let k = 1; k <= steps; k++) assert.ok(M.alphaBar(k, steps) > M.alphaBar(k - 1, steps));

    const mask = new Float32Array(35).fill(-1);
    [0, 1, 2, 9, 16, 17, 18, 25].forEach((i) => { mask[i] = 1; });
    const eps = M.gaussianField(mask.length, 99);
    assert.deepEqual(M.denoiseFrame(mask, eps, steps, steps), mask);

    const first = M.denoiseFrame(mask, eps, 0, steps);
    let agree = 0;
    for (let i = 0; i < mask.length; i++) if (Math.sign(first[i]) === Math.sign(mask[i])) agree++;
    assert.ok(agree / mask.length < 0.8, "pure noise should not already show the path");
});

test("gaussianField is roughly standard normal", () => {
    const field = M.gaussianField(20000, 1);
    const mean = field.reduce((a, b) => a + b, 0) / field.length;
    const variance = field.reduce((a, b) => a + (b - mean) ** 2, 0) / field.length;
    assert.ok(Math.abs(mean) < 0.05);
    assert.ok(Math.abs(variance - 1) < 0.08);
});
