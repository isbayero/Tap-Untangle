import { Coord, Direction, Piece, LevelConfig } from '../../types/gameTypes';

export const DELTA: Record<Direction, [number, number]> = {
    U: [-1, 0],
    D: [1, 0],
    L: [0, -1],
    R: [0, 1],
};

export const DIRS: Direction[] = ['U', 'D', 'L', 'R'];

export function mulberry32(seed: number): () => number {
    let a = seed | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Grid dimensions scaled with level difficulty.
 * Every spot on this grid will be 100% filled.
 */
export function calculateGridParams(level: number): { rows: number; cols: number } {
    if (level <= 2) return { rows: 8, cols: 6 };
    if (level <= 5) return { rows: 10, cols: 7 };
    if (level <= 10) return { rows: 12, cols: 8 };
    if (level <= 20) return { rows: 14, cols: 9 };
    if (level <= 40) return { rows: 16, cols: 10 };
    if (level <= 70) return { rows: 18, cols: 11 };
    return { rows: 20, cols: 12 };
}

function snakeLengthRange(level: number): [number, number] {
    const min = Math.min(5 + Math.floor(level / 8), 10);
    const max = Math.min(10 + Math.floor(level / 3), 30);
    return [min, max];
}

export function rayCells(piece: Piece, rows: number, cols: number): Coord[] {
    const head = piece.cells[piece.cells.length - 1];
    const [dr, dc] = DELTA[piece.dir];
    const out: Coord[] = [];
    let r = head[0] + dr;
    let c = head[1] + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
        out.push([r, c]);
        r += dr;
        c += dc;
    }
    return out;
}

export function buildGrid(rows: number, cols: number, pieces: Piece[]): number[][] {
    const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
    for (const p of pieces) {
        for (const [r, c] of p.cells) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = p.id;
            }
        }
    }
    return grid;
}

export function canExit(piece: Piece, grid: number[][], rows: number, cols: number): boolean {
    for (const [r, c] of rayCells(piece, rows, cols)) {
        const occupant = grid[r][c];
        if (occupant !== -1 && occupant !== piece.id) {
            return false;
        }
    }
    return true;
}

export function solveLevel(rows: number, cols: number, pieces: Piece[]): number[] | null {
    const remaining = pieces.map((p) => ({ ...p, cells: [...p.cells] }));
    const exitOrder: number[] = [];

    while (remaining.length > 0) {
        const grid = buildGrid(rows, cols, remaining);
        const candidateIdx = remaining.findIndex((p) => canExit(p, grid, rows, cols));

        if (candidateIdx === -1) {
            return null; // Unsolvable configuration
        }

        exitOrder.push(remaining[candidateIdx].id);
        remaining.splice(candidateIdx, 1);
    }

    return exitOrder;
}


interface RawSnake {
    id: number;
    cells: Coord[];
}

/**
 * Partitions 100% of grid cells into snakes with ZERO empty gaps.
 */
function partitionFullGrid(rows: number, cols: number, prng: () => number, level: number): RawSnake[] {
    const [minLen, maxLen] = snakeLengthRange(level);
    const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    let unassignedCount = rows * cols;
    let snakes: RawSnake[] = [];

    const getFreeNeighbors = (r: number, c: number): Coord[] => {
        const out: Coord[] = [];
        for (const d of DIRS) {
            const nr = r + DELTA[d][0];
            const nc = c + DELTA[d][1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) out.push([nr, nc]);
        }
        return out;
    };

    while (unassignedCount > 0) {
        let bestStart: Coord | null = null;
        let minN = 999;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!visited[r][c]) {
                    const fn = getFreeNeighbors(r, c).length;
                    if (fn < minN) { minN = fn; bestStart = [r, c]; }
                }
            }
        }
        if (!bestStart) break;

        visited[bestStart[0]][bestStart[1]] = true;
        unassignedCount--;
        const cells: Coord[] = [bestStart];
        const target = minLen + Math.floor(prng() * (maxLen - minLen + 1));

        while (cells.length < target) {
            const [cr, cc] = cells[cells.length - 1];
            const free = getFreeNeighbors(cr, cc);
            if (free.length === 0) break;

            // Prefer turning over going straight so paths look like a maze
            const prev = cells.length > 1 ? cells[cells.length - 2] : null;
            const turning = prev
                ? free.filter(([r, c]) => !(r - cr === cr - prev[0] && c - cc === cc - prev[1]))
                : free;
            const pool = turning.length > 0 && prng() < 0.65 ? turning : free;

            pool.sort((a, b) => getFreeNeighbors(a[0], a[1]).length - getFreeNeighbors(b[0], b[1]).length);
            const next = prng() < 0.7 ? pool[0] : pool[Math.floor(prng() * pool.length)];

            visited[next[0]][next[1]] = true;
            unassignedCount--;
            cells.push(next);
        }
        // Ensure the last two segments are collinear so the head looks clean
        if (cells.length >= 3) {
            const a = cells[cells.length - 3];
            const b = cells[cells.length - 2];
            const c = cells[cells.length - 1];
            const bends = (b[0] - a[0]) !== (c[0] - b[0]) || (b[1] - a[1]) !== (c[1] - b[1]);
            if (bends) {
                // Either orientation can be the head, so a bend next to the head is fine;
                // this block is only a hook if you want stricter straight-heads later.
            }
        }
        snakes.push({ id: snakes.length, cells });
    }

    snakes = mergeShortSnakes(snakes, Math.max(3, Math.floor(minLen / 2)), maxLen + 4);
    return snakes.map((s, i) => ({ ...s, id: i }));
}

const adjacent = (a: Coord, b: Coord) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

/** Glue tiny leftover snakes onto a neighbouring snake's end so no stubby pieces remain. */
function mergeShortSnakes(snakes: RawSnake[], shortLen: number, cap: number): RawSnake[] {
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < snakes.length && !changed; i++) {
            const s = snakes[i];
            if (s.cells.length >= shortLen) continue;
            for (let j = 0; j < snakes.length && !changed; j++) {
                if (j === i) continue;
                const o = snakes[j];
                if (o.cells.length + s.cells.length > cap) continue;
                for (const sEnd of [0, s.cells.length - 1]) {
                    for (const oEnd of [0, o.cells.length - 1]) {
                        if (!adjacent(s.cells[sEnd], o.cells[oEnd])) continue;
                        const sOri = sEnd === s.cells.length - 1 ? s.cells : [...s.cells].reverse();
                        const oOri = oEnd === 0 ? o.cells : [...o.cells].reverse();
                        snakes[j] = { id: o.id, cells: [...sOri, ...oOri] };
                        snakes.splice(i, 1);
                        changed = true;
                        return mergeShortSnakes(snakes, shortLen, cap);
                    }
                }
            }
        }
    }
    return snakes;
}

/**
 * Reverse Peeling Solver: Assigns heads & exit directions to all snakes
 * by simulating exits backward from perimeter to deep interior.
 */
function peelAndAssignDirections(
    rows: number, cols: number, rawSnakes: RawSnake[], prng: () => number, deepBias: number
): Piece[] | null {
    // E[r][c] is true if cell (r, c) has already been cleared (empty runway)
    const E: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    const unpeeled = rawSnakes.map((s) => ({ id: s.id, cells: [...s.cells] }));
    const finalizedPieces: Piece[] = [];

    const rayLength = (r0: number, c0: number, dir: Direction): number => {
        const [dr, dc] = DELTA[dir];
        let r = r0 + dr, c = c0 + dc, n = 0;
        while (r >= 0 && r < rows && c >= 0 && c < cols) { n++; r += dr; c += dc; }
        return n;
    };

    const isRayClear = (startR: number, startC: number, dir: Direction): boolean => {
        const [dr, dc] = DELTA[dir];
        let r = startR + dr;
        let c = startC + dc;
        while (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (!E[r][c]) return false;
            r += dr;
            c += dc;
        }
        return true; // Reached border through cleared cells
    };

    const depthAt: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

    // Depth of a piece = 1 + deepest piece standing on its runway
    const rayDepth = (r0: number, c0: number, dir: Direction): number => {
        const [dr, dc] = DELTA[dir];
        let r = r0 + dr, c = c0 + dc, maxD = 0;
        while (r >= 0 && r < rows && c >= 0 && c < cols) {
            maxD = Math.max(maxD, depthAt[r][c]);
            r += dr; c += dc;
        }
        return maxD + 1;
    };

    while (unpeeled.length > 0) {
        interface Candidate {
            snakeIndex: number;
            cells: Coord[];
            dir: Direction;
            rayLen: number;
            depth: number;
        }
        const candidates: Candidate[] = [];

        for (let i = 0; i < unpeeled.length; i++) {
            const snake = unpeeled[i];
            const K = snake.cells.length;

            // Option 1: Head at cells[K - 1]
            const headA = snake.cells[K - 1];
            const prevA = K > 1 ? snake.cells[K - 2] : null;
            const naturalDirA: Direction | null = prevA
                ? DIRS.find((d) => DELTA[d][0] === headA[0] - prevA[0] && DELTA[d][1] === headA[1] - prevA[1]) || null
                : null;

            const dirsA: Direction[] = naturalDirA ? [naturalDirA] : DIRS;

            for (const d of dirsA) {
                if (isRayClear(headA[0], headA[1], d)) {
                    candidates.push({
                        snakeIndex: i,
                        cells: [...snake.cells],
                        dir: d,
                        rayLen: rayLength(headA[0], headA[1], d),
                        depth: rayDepth(headA[0], headA[1], d),
                    });
                    break;
                }
            }

            // Option 2: Head at cells[0] (reverse the snake array)
            if (K > 1) {
                const headB = snake.cells[0];
                const prevB = snake.cells[1];
                const naturalDirB: Direction | null = DIRS.find(
                    (d) => DELTA[d][0] === headB[0] - prevB[0] && DELTA[d][1] === headB[1] - prevB[1]
                ) || null;

                const dirsB: Direction[] = naturalDirB ? [naturalDirB] : DIRS;

                for (const d of dirsB) {
                    if (isRayClear(headB[0], headB[1], d)) {
                        candidates.push({
                            snakeIndex: i,
                            cells: [...snake.cells].reverse(),
                            dir: d,
                            rayLen: rayLength(headB[0], headB[1], d),
                            depth: rayDepth(headB[0], headB[1], d),
                        });
                        break;
                    }
                }
            }
        }

        if (candidates.length === 0) {
            return null; // Deadlock encountered, retry generation
        }

        // Pick the deepest candidate most of the time (builds long dependency chains)
        const maxDepth = Math.max(...candidates.map((c) => c.depth));
        const deepest = candidates.filter((c) => c.depth === maxDepth);
        const pickFrom = prng() < deepBias ? deepest : candidates;
        const chosen = pickFrom[Math.floor(prng() * pickFrom.length)];
        const [peeledSnake] = unpeeled.splice(chosen.snakeIndex, 1);

        // Vacate this snake's cells and record their depth
        for (const [r, c] of chosen.cells) {
            E[r][c] = true;
            depthAt[r][c] = chosen.depth;
        }

        finalizedPieces.push({
            id: peeledSnake.id,
            cells: chosen.cells,
            dir: chosen.dir,
        });
    }

    return finalizedPieces;
}

/**
 * Generates an Arrow Maze level where 100% of cells are occupied.
 */
function countWaves(rows: number, cols: number, pieces: Piece[]): number {
    let remaining = pieces.map((p) => ({ ...p, cells: [...p.cells] }));
    let waves = 0;
    while (remaining.length > 0) {
        const grid = buildGrid(rows, cols, remaining);
        const free = remaining.filter((p) => canExit(p, grid, rows, cols));
        if (free.length === 0) return -1;
        const ids = new Set(free.map((p) => p.id));
        remaining = remaining.filter((p) => !ids.has(p.id));
        waves++;
    }
    return waves;
}

function difficultyScore(rows: number, cols: number, pieces: Piece[]): number {
    const waves = countWaves(rows, cols, pieces);
    if (waves < 0) return -1;
    const grid = buildGrid(rows, cols, pieces);
    const freeAtStart = pieces.filter((p) => canExit(p, grid, rows, cols)).length;
    // Deep chains are good, many free arrows at the start are bad
    return waves * 10 - freeAtStart * 4;
}

export function generateSolvableLevel(level: number, customSeed?: number): LevelConfig {
    const { rows, cols } = calculateGridParams(level);
    const baseSeed = customSeed ?? level * 9973 + 104729;
    const deepBias = Math.min(0.6 + level * 0.01, 0.97);
    let best: LevelConfig | null = null;
    let bestScore = -Infinity;
    let found = 0;

    for (let attempt = 0; attempt < 600 && found < 15; attempt++) {
        const prng = mulberry32(baseSeed + attempt * 179424673);
        const snakes = partitionFullGrid(rows, cols, prng, level);
        const pieces = peelAndAssignDirections(rows, cols, snakes, prng, deepBias);
        if (!pieces || pieces.length === 0) continue;

        const normalized: Piece[] = pieces.map((p, idx) => ({ ...p, id: idx }));
        if (normalized.reduce((n, p) => n + p.cells.length, 0) !== rows * cols) continue;

        const score = difficultyScore(rows, cols, normalized);
        if (score < 0) continue;

        found++;
        if (score > bestScore) {
            bestScore = score;
            best = { levelNumber: level, rows, cols, pieces: normalized };
        }
    }
    if (best) return best;

    // Fallback guaranteed layout if all attempts fail
    const fallbackPieces: Piece[] = [];
    let id = 0;
    for (let r = 0; r < rows; r++) {
        fallbackPieces.push({
            id: id++,
            cells: Array.from({ length: cols }, (_, c) => [r, c] as Coord),
            dir: r % 2 === 0 ? 'R' : 'L',
        });
    }
    return { levelNumber: level, rows, cols, pieces: fallbackPieces };
}