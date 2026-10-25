export interface Pt {
    x: number;
    y: number;
}
export type Edge = readonly [number, number];

export interface UntangleLevel {
    level: number;
    edges: Edge[];
    /** A layout with zero crossings. Proves solvability and powers hints. */
    solution: Pt[];
    /** Scrambled layout the player starts from. */
    start: Pt[];
}

export function mulberry32(seed: number): () => number {
    let a = seed | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- geometry ----------

const orient = (a: Pt, b: Pt, c: Pt): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const touches = (a: Edge, b: Edge): boolean =>
    a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1];

/** True when the two segments properly cross. Edges sharing a node never count. */
export function edgesCross(p: readonly Pt[], a: Edge, b: Edge): boolean {
    if (touches(a, b)) return false;
    const p1 = p[a[0]];
    const p2 = p[a[1]];
    const p3 = p[b[0]];
    const p4 = p[b[1]];
    return orient(p1, p2, p3) * orient(p1, p2, p4) < 0 && orient(p3, p4, p1) * orient(p3, p4, p2) < 0;
}

function intersection(a: Pt, b: Pt, c: Pt, d: Pt): Pt {
    const rx = b.x - a.x;
    const ry = b.y - a.y;
    const sx = d.x - c.x;
    const sy = d.y - c.y;
    const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / (rx * sy - ry * sx);
    return { x: a.x + t * rx, y: a.y + t * ry };
}

export interface Crossings {
    count: number;
    /** bad[i] is true when edge i crosses at least one other edge. */
    bad: boolean[];
    /** Where the crossings happen, for drawing markers. */
    points: Pt[];
}

export function findCrossings(p: readonly Pt[], edges: readonly Edge[]): Crossings {
    const bad = new Array<boolean>(edges.length).fill(false);
    const points: Pt[] = [];
    let count = 0;
    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            if (!edgesCross(p, edges[i], edges[j])) continue;
            count++;
            bad[i] = bad[j] = true;
            points.push(intersection(p[edges[i][0]], p[edges[i][1]], p[edges[j][0]], p[edges[j][1]]));
        }
    }
    return { count, bad, points };
}

// ---------- generation ----------

export function untangleParams(level: number) {
    return {
        nodes: Math.min(28, 6 + Math.floor((level - 1) * 0.7)),
        /** Share of the non-tree edges that are kept. More edges, tighter puzzle. */
        extra: Math.min(0.7, 0.25 + level * 0.015),
    };
}

function scatter(n: number, rnd: () => number): Pt[] {
    let minD = 0.62 / Math.sqrt(n);
    const pts: Pt[] = [];
    let tries = 0;
    while (pts.length < n) {
        const q = { x: 0.06 + rnd() * 0.88, y: 0.06 + rnd() * 0.88 };
        if (pts.every((p) => Math.hypot(p.x - q.x, p.y - q.y) >= minD)) pts.push(q);
        else if (++tries > 400) {
            minD *= 0.9;
            tries = 0;
        }
    }
    return pts;
}

/**
 * Solvable by construction: edges are chosen on a fixed set of points so that
 * none cross, then the points are scrambled onto a circle. Moving every dot
 * back to `solution` untangles it.
 */
function build(level: number, seed: number): UntangleLevel | null {
    const { nodes: n, extra } = untangleParams(level);
    const rnd = mulberry32(seed);
    const solution = scatter(n, rnd);

    const pairs: { e: Edge; d: number }[] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            pairs.push({ e: [i, j], d: Math.hypot(solution[i].x - solution[j].x, solution[i].y - solution[j].y) });
        }
    }
    pairs.sort((a, b) => a.d - b.d);

    // Greedy non-crossing edges, shortest first: a connected triangulation.
    const tri: Edge[] = [];
    for (const { e } of pairs) if (!tri.some((f) => edgesCross(solution, e, f))) tri.push(e);

    // Spanning tree keeps the graph connected; a share of the rest adds difficulty.
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const edges: Edge[] = [];
    const rest: Edge[] = [];
    for (const e of tri) {
        const a = find(e[0]);
        const b = find(e[1]);
        if (a !== b) {
            parent[a] = b;
            edges.push(e);
        } else rest.push(e);
    }
    shuffle(rest, rnd);
    edges.push(...rest.slice(0, Math.max(2, Math.round(rest.length * extra))));

    const minCross = Math.max(2, Math.floor(edges.length * 0.25));
    let best: Pt[] | null = null;
    let bestCount = -1;
    for (let t = 0; t < 120; t++) {
        const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
        const start = new Array<Pt>(n);
        order.forEach((node, k) => {
            const a = (k / n) * Math.PI * 2 - Math.PI / 2;
            start[node] = { x: 0.5 + 0.4 * Math.cos(a), y: 0.5 + 0.4 * Math.sin(a) };
        });
        const c = findCrossings(start, edges).count;
        if (c > bestCount) {
            bestCount = c;
            best = start;
        }
        if (c >= minCross) break;
    }
    if (!best || bestCount < 2) return null;
    return { level, edges, solution, start: best };
}

export function generateUntangleLevel(level: number): UntangleLevel {
    for (let attempt = 0; attempt < 20; attempt++) {
        const lv = build(level, level * 104729 + attempt * 7919);
        if (lv) return lv;
    }
    throw new Error(`Could not generate untangle level ${level}`);
}

// ---------- hints and scoring ----------

/** The dot whose move to its home spot removes the most crossings, or -1. */
export function bestHintNode(p: readonly Pt[], level: UntangleLevel): number {
    let best = -1;
    let bestCount = Infinity;
    for (let i = 0; i < p.length; i++) {
        if (Math.hypot(p[i].x - level.solution[i].x, p[i].y - level.solution[i].y) < 0.02) continue;
        const q = p.slice();
        q[i] = level.solution[i];
        const c = findCrossings(q, level.edges).count;
        if (c < bestCount) {
            bestCount = c;
            best = i;
        }
    }
    return best;
}

export function rateUntangle(nodes: number, moves: number, hints: number): 1 | 2 | 3 {
    if (hints === 0 && moves <= nodes * 2) return 3;
    if (moves <= nodes * 4) return 2;
    return 1;
}

export function scoreUntangle(nodes: number, moves: number, hints: number, seconds: number): number {
    return Math.max(100, Math.round(nodes * 150 - moves * 5 - hints * 200 - seconds * 2));
}
