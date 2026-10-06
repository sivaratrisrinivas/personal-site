/*
 * Pure maze logic for the hedge-maze site. No DOM, no globals beyond the export,
 * so the same file runs in the browser (window.HedgeMaze) and under `node --test`.
 *
 * The maze follows the unmaze project: an odd-sized square grid where cells sit on
 * odd tiles and walls on even ones, built with Wilson's algorithm (uniform random
 * spanning tree) and entered from a gap in the outer ring, with the heart at the centre.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.HedgeMaze = factory();
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    function mulberry32(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* A maze of n x n cells is drawn on a (2n+1) x (2n+1) grid of tiles; walls[i] === 1 is hedge. */
    function generate(seed, n) {
        n = n || 11;
        var rng = mulberry32(seed);
        var size = 2 * n + 1;
        var walls = new Uint8Array(size * size).fill(1);
        var inTree = new Uint8Array(n * n);
        var next = new Int32Array(n * n);
        var tileOf = function (cx, cy) { return (2 * cy + 1) * size + (2 * cx + 1); };

        var mid = n >> 1;
        var treeRoot = mid * n + mid;
        inTree[treeRoot] = 1;
        walls[tileOf(mid, mid)] = 0;

        for (var start = 0; start < n * n; start++) {
            if (inTree[start]) continue;
            var u = start;
            while (!inTree[u]) {
                var ux = u % n, uy = (u / n) | 0, vx, vy;
                do {
                    var d = DIRS[(rng() * 4) | 0];
                    vx = ux + d[0];
                    vy = uy + d[1];
                } while (vx < 0 || vy < 0 || vx >= n || vy >= n);
                next[u] = vy * n + vx;
                u = next[u];
            }
            u = start;
            while (!inTree[u]) {
                inTree[u] = 1;
                var v = next[u];
                var cx = u % n, cy = (u / n) | 0, wx = v % n, wy = (v / n) | 0;
                walls[tileOf(cx, cy)] = 0;
                walls[(2 * cy + 1 + (wy - cy)) * size + (2 * cx + 1 + (wx - cx))] = 0;
                u = v;
            }
        }

        // The entrance is a gap in the outer ring, in front of a random ring cell.
        var ring = [];
        for (var cy2 = 0; cy2 < n; cy2++) {
            for (var cx2 = 0; cx2 < n; cx2++) {
                if (cx2 === 0 || cy2 === 0 || cx2 === n - 1 || cy2 === n - 1) ring.push([cx2, cy2]);
            }
        }
        var pick = ring[(rng() * ring.length) | 0];
        var sides = [];
        if (pick[0] === 0) sides.push([0, 2 * pick[1] + 1]);
        if (pick[0] === n - 1) sides.push([size - 1, 2 * pick[1] + 1]);
        if (pick[1] === 0) sides.push([2 * pick[0] + 1, 0]);
        if (pick[1] === n - 1) sides.push([2 * pick[0] + 1, size - 1]);
        var gap = sides[(rng() * sides.length) | 0];
        var entrance = gap[1] * size + gap[0];
        walls[entrance] = 0;

        var heart = tileOf(mid, mid);
        var solution = shortestPath(walls, size, entrance, heart);

        var entranceCell = -1;
        for (var k = 0; k < 4; k++) {
            var ex = gap[0] + DIRS[k][0], ey = gap[1] + DIRS[k][1];
            if (ex >= 1 && ey >= 1 && ex < size - 1 && ey < size - 1 && !walls[ey * size + ex]) entranceCell = ey * size + ex;
        }

        var deadEnds = [];
        for (var y = 1; y < size; y += 2) {
            for (var x = 1; x < size; x += 2) {
                var i = y * size + x;
                if (i === heart || i === entranceCell) continue;
                if (openNeighbors(walls, size, i).length === 1) deadEnds.push(i);
            }
        }

        return {
            seed: seed, n: n, size: size, walls: walls,
            entrance: entrance, entranceCell: entranceCell, heart: heart,
            solution: solution, deadEnds: deadEnds
        };
    }

    function openNeighbors(walls, size, i) {
        var x = i % size, y = (i / size) | 0, out = [];
        for (var k = 0; k < 4; k++) {
            var nx = x + DIRS[k][0], ny = y + DIRS[k][1];
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            var j = ny * size + nx;
            if (!walls[j]) out.push(j);
        }
        return out;
    }

    /* Breadth-first search. `allowed` (a Set), when given, limits which tiles may be entered. */
    function bfs(walls, size, from, allowed) {
        var dist = new Int32Array(walls.length).fill(-1);
        var parent = new Int32Array(walls.length).fill(-1);
        var queue = [from];
        dist[from] = 0;
        for (var head = 0; head < queue.length; head++) {
            var u = queue[head];
            var nb = openNeighbors(walls, size, u);
            for (var k = 0; k < nb.length; k++) {
                var v = nb[k];
                if (dist[v] !== -1) continue;
                if (allowed && !allowed.has(v)) continue;
                dist[v] = dist[u] + 1;
                parent[v] = u;
                queue.push(v);
            }
        }
        return { dist: dist, parent: parent };
    }

    function pathTo(parent, from, to) {
        if (to !== from && parent[to] === -1) return null;
        var path = [to];
        while (to !== from) {
            to = parent[to];
            path.push(to);
        }
        return path.reverse();
    }

    function shortestPath(walls, size, from, to, allowed) {
        return pathTo(bfs(walls, size, from, allowed).parent, from, to);
    }

    /*
     * The strict judge, after unmaze: a route is SOLVED only if the visited tiles are exactly
     * the one simple path from entrance to heart. Anything else is stray, and nothing repairs it.
     */
    function judge(maze, visited) {
        var seen = visited instanceof Set ? visited : new Set(visited);
        var path = new Set(maze.solution);
        var stray = new Set();
        var covered = 0;
        seen.forEach(function (i) {
            if (path.has(i)) covered++;
            else stray.add(i);
        });
        var blobs = 0, flooded = new Set();
        stray.forEach(function (start) {
            if (flooded.has(start)) return;
            blobs++;
            var stack = [start];
            flooded.add(start);
            while (stack.length) {
                var u = stack.pop();
                var nb = openNeighbors(maze.walls, maze.size, u);
                for (var k = 0; k < nb.length; k++) {
                    if (stray.has(nb[k]) && !flooded.has(nb[k])) {
                        flooded.add(nb[k]);
                        stack.push(nb[k]);
                    }
                }
            }
        });
        var missing = maze.solution.length - covered;
        return {
            reachedHeart: seen.has(maze.heart),
            solved: stray.size === 0 && missing === 0,
            strayTiles: stray.size,
            strayBlobs: blobs,
            missingTiles: missing,
            pathTiles: maze.solution.length
        };
    }

    /* ---- the stand-in "model": the true path, hidden under a made-up noise schedule ---- */

    // Cosine noise schedule. k = steps is fully clean (1), k = 0 is fully noise (about 0).
    function alphaBar(k, steps) {
        var s = 0.008;
        var f = function (x) { return Math.pow(Math.cos(((x + s) / (1 + s)) * Math.PI / 2), 2); };
        return f(1 - k / steps) / f(0);
    }

    function gaussianField(length, seed) {
        var rng = mulberry32(seed);
        var out = new Float32Array(length);
        for (var i = 0; i < length; i += 2) {
            var u = Math.max(rng(), 1e-9), v = rng();
            var mag = Math.sqrt(-2 * Math.log(u));
            out[i] = mag * Math.cos(2 * Math.PI * v);
            if (i + 1 < length) out[i + 1] = mag * Math.sin(2 * Math.PI * v);
        }
        return out;
    }

    function denoiseFrame(mask, eps, k, steps, out) {
        var ab = alphaBar(k, steps), a = Math.sqrt(ab), b = Math.sqrt(Math.max(0, 1 - ab));
        out = out || new Float32Array(mask.length);
        for (var i = 0; i < mask.length; i++) out[i] = a * mask[i] + b * eps[i];
        return out;
    }

    return {
        mulberry32: mulberry32,
        generate: generate,
        openNeighbors: openNeighbors,
        bfs: bfs,
        pathTo: pathTo,
        shortestPath: shortestPath,
        judge: judge,
        alphaBar: alphaBar,
        gaussianField: gaussianField,
        denoiseFrame: denoiseFrame
    };
});
