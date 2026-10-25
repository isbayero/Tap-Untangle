import { LevelConfig, Piece, SlidingPiece, Particle, motion } from '../../types/gameTypes';
import { DELTA, rayCells, canExit } from './gameRules';

export const PIECE_PALETTE = [
    '#38bdf8', // Sky Blue
    '#f43f5e', // Rose
    '#fbbf24', // Amber
    '#34d399', // Mint Emerald
    '#a855f7', // Violet
    '#fb923c', // Orange Coral
    '#4ade80', // Lime
    '#ec4899', // Fuchsia
];

const ARROW_COLOR = '#111111';
const DANGER_COLOR = '#D93B4E';
const HINT_COLOR = '#3B63D6';
const BOARD_COLOR = '#ffffff';

const SHAKE_DURATION = 360;

/**
 * Generates the full exit track for a piece:
 * The body coordinates from tail (cells[0]) to head (cells[cells.length - 1]),
 * followed by linear waypoints projected forward along piece.dir out of the grid.
 */
function getPieceTrackWaypoints(piece: Piece, maxExitSteps: number): [number, number][] {
    const waypoints: [number, number][] = piece.cells.map(([r, c]) => [r, c]);
    const [dr, dc] = DELTA[piece.dir];
    const head = waypoints[waypoints.length - 1];

    for (let step = 1; step <= maxExitSteps; step++) {
        waypoints.push([head[0] + dr * step, head[1] + dc * step]);
    }
    return waypoints;
}

/**
 * Samples a continuous coordinate along track waypoints at distance u with strict NaN guards.
 */
function sampleTrack(waypoints: [number, number][], u: number): [number, number] {
    if (!waypoints || waypoints.length === 0) return [0, 0];
    if (waypoints.length === 1) return waypoints[0];

    if (Number.isNaN(u) || u <= 0) return waypoints[0];

    const maxIdx = waypoints.length - 1;
    if (u >= maxIdx) return waypoints[maxIdx];

    const idx = Math.min(Math.floor(u), maxIdx - 1);
    const frac = Math.max(0, Math.min(1, u - idx));

    const p0 = waypoints[idx] ?? waypoints[0];
    const p1 = waypoints[idx + 1] ?? p0;

    return [
        p0[0] + (p1[0] - p0[0]) * frac,
        p0[1] + (p1[1] - p0[1]) * frac,
    ];
}

/**
 * Computes the dynamic screen-pixel polyline for an arrow at progress distance `dist`.
 */
function getSnakeVertices(
    piece: Piece,
    dist: number,
    cellSize: number,
    pad: number,
    ox: number = 0,
    oy: number = 0
): { coords: [number, number][]; headDir: [number, number] } {
    const K = piece.cells.length;
    const s = cellSize;
    const [dr, dc] = DELTA[piece.dir] ?? [0, 1];
    const safeDist = Number.isNaN(dist) ? 0 : Math.max(0, dist);

    // 1-cell piece: slides straight
    if (K === 1) {
        const r = piece.cells[0][0] + dr * safeDist;
        const c = piece.cells[0][1] + dc * safeDist;
        const px = pad + c * s + s / 2 + ox;
        const py = pad + r * s + s / 2 + oy;
        return {
            coords: [[px, py]],
            headDir: [dc, dr],
        };
    }

    // Multi-cell piece: slithers along corners
    const waypoints = getPieceTrackWaypoints(piece, 35);
    const L = K - 1; // total body length in grid units
    const sTail = safeDist;
    const sHead = safeDist + L;

    const pts: [number, number][] = [];

    // 1. Moving tail vertex
    const tailGrid = sampleTrack(waypoints, sTail);
    pts.push([
        pad + tailGrid[1] * s + s / 2 + ox,
        pad + tailGrid[0] * s + s / 2 + oy,
    ]);

    // 2. Intermediate corner vertices that the body currently spans
    const startIdx = Math.floor(sTail) + 1;
    const endIdx = Math.ceil(sHead);
    for (let m = startIdx; m < endIdx; m++) {
        if (m > sTail + 0.001 && m < sHead - 0.001 && m < waypoints.length) {
            const wp = waypoints[m];
            if (wp) {
                pts.push([
                    pad + wp[1] * s + s / 2 + ox,
                    pad + wp[0] * s + s / 2 + oy,
                ]);
            }
        }
    }

    // 3. Moving head vertex
    const headGrid = sampleTrack(waypoints, sHead);
    pts.push([
        pad + headGrid[1] * s + s / 2 + ox,
        pad + headGrid[0] * s + s / 2 + oy,
    ]);

    return {
        coords: pts,
        headDir: [dc, dr],
    };
}

export class GameEngine {
    public config: LevelConfig;
    public remainingPieces: Piece[];
    public slidingPieces: SlidingPiece[] = [];
    public particles: Particle[] = [];
    public grid: number[][];

    // Supports multiple simultaneous shakes + flashes the blocking cell on mistake
    public shakingPieces: Map<number, number> = new Map();
    public blockedCellFlash: { r: number; c: number; startTime: number } | null = null;

    public hintPieceId: number | null = null;
    public hintStartTime: number = 0;

    constructor(config: LevelConfig) {
        this.config = config;
        this.remainingPieces = config.pieces.map((p) => ({
            ...p,
            cells: p.cells.map(([r, c]) => [r, c] as [number, number]),
        }));
        this.grid = Array.from({ length: config.rows }, () => Array(config.cols).fill(-1));
        this.refreshGrid();
    }

    public refreshGrid(): void {
        for (let r = 0; r < this.config.rows; r++) {
            for (let c = 0; c < this.config.cols; c++) {
                this.grid[r][c] = -1;
            }
        }
        for (const p of this.remainingPieces) {
            for (const [r, c] of p.cells) {
                if (r >= 0 && r < this.config.rows && c >= 0 && c < this.config.cols) {
                    this.grid[r][c] = p.id;
                }
            }
        }
    }

    public canPieceEscape(pieceId: number): boolean {
        const p = this.remainingPieces.find((item) => item.id === pieceId);
        if (!p) return false;
        return canExit(p, this.grid, this.config.rows, this.config.cols);
    }

    /**
     * Finds the first cell along the piece's exit ray that blocks it, so we can highlight the collision.
     */
    public findBlockerCell(pieceId: number): [number, number] | null {
        const p = this.remainingPieces.find((item) => item.id === pieceId);
        if (!p) return null;
        const rays = rayCells(p, this.config.rows, this.config.cols);
        for (const [rr, cc] of rays) {
            const occupant = this.grid[rr]?.[cc];
            if (occupant !== undefined && occupant !== -1 && occupant !== p.id) {
                return [rr, cc];
            }
        }
        return null;
    }

    /**
     * Finds the best valid movable piece for the Hint button.
     */
    public findBestHintPiece(): Piece | null {
        for (const p of this.remainingPieces) {
            if (canExit(p, this.grid, this.config.rows, this.config.cols)) {
                return p;
            }
        }
        return null;
    }

    public triggerShake(pieceId: number, now: number): void {
        this.shakingPieces.set(pieceId, now);
        const blocker = this.findBlockerCell(pieceId);
        if (blocker) {
            this.blockedCellFlash = { r: blocker[0], c: blocker[1], startTime: now };
        }
    }

    /**
     * Highlights a movable piece. Does NOT auto-expire after 2.5s so rewarded-ad hints aren't lost!
     */
    public setHint(pieceId: number, now: number): void {
        this.hintPieceId = pieceId;
        this.hintStartTime = now;
    }

    public clearPiece(pieceId: number, now: number): Piece | null {
        const index = this.remainingPieces.findIndex((p) => p.id === pieceId);
        if (index === -1) return null;

        const [cleared] = this.remainingPieces.splice(index, 1);
        this.refreshGrid();

        const color = PIECE_PALETTE[cleared.id % PIECE_PALETTE.length];
        this.slidingPieces.push({
            piece: cleared,
            startTime: now,
            duration: 400,
            color,
        });

        this.shakingPieces.delete(pieceId);
        if (this.hintPieceId === pieceId) {
            this.hintPieceId = null;
        }

        return cleared;
    }

    public spawnClearParticles(piece: Piece, cellSize: number, pad: number): void {
        if (motion.reduced) return;
        const head = piece.cells[piece.cells.length - 1];
        const px = pad + head[1] * cellSize + cellSize / 2;
        const py = pad + head[0] * cellSize + cellSize / 2;
        const color = ARROW_COLOR;

        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                alpha: 1,
                size: Math.random() * 3 + 2,
                life: 1,
            });
        }
    }

    public update(now: number, dt: number): { completedSlides: boolean } {
        let completed = false;
        // Scale velocity to 60fps baseline so 120Hz displays don't double particle speed
        const stepScale = Math.min(3, Math.max(0.1, dt * 60));

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * stepScale;
            pt.y += pt.vy * stepScale;
            pt.life -= dt * 2.2;
            pt.alpha = Math.max(0, pt.life);
            if (pt.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update Sliding pieces
        for (let i = this.slidingPieces.length - 1; i >= 0; i--) {
            const slide = this.slidingPieces[i];
            const elapsed = now - slide.startTime;
            if (elapsed >= slide.duration) {
                this.slidingPieces.splice(i, 1);
                completed = true;
            }
        }

        // Clean up finished shakes
        for (const [id, startTime] of this.shakingPieces.entries()) {
            if (now - startTime > SHAKE_DURATION) {
                this.shakingPieces.delete(id);
            }
        }

        if (this.blockedCellFlash && now - this.blockedCellFlash.startTime > SHAKE_DURATION) {
            this.blockedCellFlash = null;
        }

        return { completedSlides: completed };
    }

    public render(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        cellSize: number,
        pad: number,
        now: number
    ): void {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = BOARD_COLOR;
        ctx.fillRect(0, 0, width, height);

        // Subtle grid dots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let r = 0; r < this.config.rows; r++) {
            for (let c = 0; c < this.config.cols; c++) {
                const cx = pad + c * cellSize + cellSize / 2;
                const cy = pad + r * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Collision / Blocker Flash (shows the player WHICH cell blocked their arrow)
        if (this.blockedCellFlash) {
            const { r, c, startTime } = this.blockedCellFlash;
            const progress = Math.min(1, Math.max(0, (now - startTime) / SHAKE_DURATION));
            const flashAlpha = (1 - progress) * 0.32;
            const bx = pad + c * cellSize + 3;
            const by = pad + r * cellSize + 3;
            ctx.save();
            ctx.fillStyle = `rgba(217, 59, 78, ${flashAlpha})`;
            ctx.strokeStyle = `rgba(217, 59, 78, ${(1 - progress) * 0.75})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, cellSize - 6, cellSize - 6, 8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Hint Guide Runway
        if (this.hintPieceId !== null) {
            const hintPiece = this.remainingPieces.find((p) => p.id === this.hintPieceId);
            if (hintPiece) {
                const rays = rayCells(hintPiece, this.config.rows, this.config.cols);
                const pulse = motion.reduced ? 1 : 0.65 + 0.35 * Math.sin((now - this.hintStartTime) / 180);
                ctx.fillStyle = `rgba(59, 99, 214, ${0.14 * pulse})`;
                for (const [rr, cc] of rays) {
                    const rx = pad + cc * cellSize + 2;
                    const ry = pad + rr * cellSize + 2;
                    ctx.beginPath();
                    ctx.roundRect(rx, ry, cellSize - 4, cellSize - 4, 8);
                    ctx.fill();
                }
            }
        }

        // 1. Render Static Remaining Pieces
        for (const piece of this.remainingPieces) {
            let ox = 0;
            let oy = 0;
            let alpha = 1;
            let pieceColor = ARROW_COLOR;

            // Shake + Red Flash on mistake
            const shakeStart = this.shakingPieces.get(piece.id);
            if (shakeStart !== undefined) {
                const t = Math.max(0, now - shakeStart);
                const progress = Math.min(1, t / SHAKE_DURATION);
                pieceColor = DANGER_COLOR;
                if (!motion.reduced) {
                    const intensity = Math.sin(t / 22) * 6 * (1 - progress);
                    const [dr, dc] = DELTA[piece.dir];
                    ox = dc * intensity;
                    oy = dr * intensity;
                }
            } else if (piece.id === this.hintPieceId) {
                // Hint highlight: tint the hinted arrow blue so it stands out clearly
                pieceColor = HINT_COLOR;
                if (!motion.reduced) {
                    const t = now - this.hintStartTime;
                    alpha = 0.65 + 0.35 * Math.abs(Math.cos(t / 160));
                }
            }

            this.renderSnakePiece(ctx, piece, 0, ox, oy, alpha, cellSize, pad, pieceColor);
        }

        // 2. Render Sliding Escaping Pieces (Snake Movement)
        for (const slide of this.slidingPieces) {
            const elapsed = Math.max(0, now - slide.startTime);
            const t = Math.min(1, elapsed / (slide.duration || 400));

            const progress = Math.pow(t, 2.1);
            const dMax = Math.max(this.config.rows, this.config.cols) + slide.piece.cells.length + 3;
            const dist = dMax * progress;
            const alpha = Math.max(0, 1 - t * 0.5);

            this.renderSnakePiece(ctx, slide.piece, dist, 0, 0, alpha, cellSize, pad, ARROW_COLOR);
        }

        // 3. Render Particle Sparks
        for (const pt of this.particles) {
            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    private renderSnakePiece(
        ctx: CanvasRenderingContext2D,
        p: Piece,
        dist: number,
        ox: number,
        oy: number,
        alpha: number,
        cellSize: number,
        pad: number,
        color: string = ARROW_COLOR
    ): void {
        const s = cellSize;

        const { coords, headDir } = getSnakeVertices(p, dist, cellSize, pad, ox, oy);
        if (coords.length === 0) return;

        const [dx, dy] = headDir;
        const px = -dy;
        const py = dx;

        // The arrowhead TIP sits exactly on the head vertex (the grid point).
        const [hx, hy] = coords[coords.length - 1];
        const HEAD_LEN = 0.42; // tip -> base, in cell units
        const HEAD_HALF_W = 0.3;
        const NOTCH = 0.28; // tip -> notch, in cell units

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = s * 0.22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // --- A. Shaft (always physically touches the arrowhead) ---
        const notchX = hx - dx * s * NOTCH;
        const notchY = hy - dy * s * NOTCH;
        let shaft: [number, number][];

        if (coords.length === 1) {
            const tailX = hx - dx * s * 0.6;
            const tailY = hy - dy * s * 0.6;
            shaft = [
                [tailX, tailY],
                [notchX, notchY],
            ];
        } else {
            const n = coords.length;
            shaft = coords.map(([x, y]) => [x, y] as [number, number]);
            const segX = hx - shaft[n - 2][0];
            const segY = hy - shaft[n - 2][1];
            const segLen = Math.hypot(segX, segY);
            const aligned =
                segLen < 0.0001 || Math.abs((segX * dx + segY * dy) / segLen) > 0.99;

            if (aligned) {
                const trim = Math.min(segLen, s * NOTCH);
                if (segLen > 0.0001) {
                    shaft[n - 1] = [hx - (segX / segLen) * trim, hy - (segY / segLen) * trim];
                }
            } else {
                shaft.push([notchX, notchY]);
            }
        }

        // Block only the tiny patch just beyond the arrow tip (stops the round join poking out)
        const BIG = 1e5;
        const PATCH = s * 0.25;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-BIG, -BIG, BIG * 2, BIG * 2);
        ctx.moveTo(hx + px * PATCH + dx * 0.5, hy + py * PATCH + dy * 0.5);
        ctx.lineTo(hx - px * PATCH + dx * 0.5, hy - py * PATCH + dy * 0.5);
        ctx.lineTo(hx - px * PATCH + dx * PATCH, hy - py * PATCH + dy * PATCH);
        ctx.lineTo(hx + px * PATCH + dx * PATCH, hy + py * PATCH + dy * PATCH);
        ctx.closePath();
        ctx.clip('evenodd');

        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shaft[0][0], shaft[0][1]);
        for (let i = 1; i < shaft.length; i++) ctx.lineTo(shaft[i][0], shaft[i][1]);
        ctx.stroke();
        ctx.restore();

        // Tail anchor dot
        ctx.beginPath();
        ctx.arc(shaft[0][0], shaft[0][1], s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // Direction chevrons along the body (multi-cell only)
        if (coords.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = s * 0.05;
            for (let i = 0; i < shaft.length - 1; i++) {
                const sx = shaft[i + 1][0] - shaft[i][0];
                const sy = shaft[i + 1][1] - shaft[i][1];
                const len = Math.hypot(sx, sy);
                if (len > s * 0.35) {
                    const mx = (shaft[i][0] + shaft[i + 1][0]) / 2;
                    const my = (shaft[i][1] + shaft[i + 1][1]) / 2;
                    const uDx = sx / len;
                    const uDy = sy / len;
                    const uPx = -uDy;
                    const uPy = uDx;
                    ctx.beginPath();
                    ctx.moveTo(
                        mx - uDx * s * 0.07 + uPx * s * 0.09,
                        my - uDy * s * 0.07 + uPy * s * 0.09
                    );
                    ctx.lineTo(mx + uDx * s * 0.07, my + uDy * s * 0.07);
                    ctx.lineTo(
                        mx - uDx * s * 0.07 - uPx * s * 0.09,
                        my - uDy * s * 0.07 - uPy * s * 0.09
                    );
                    ctx.stroke();
                }
            }
        }

        // --- B. Arrowhead: tip exactly on the grid point ---
        const baseX = hx - dx * s * HEAD_LEN;
        const baseY = hy - dy * s * HEAD_LEN;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(baseX + px * s * HEAD_HALF_W, baseY + py * s * HEAD_HALF_W);
        ctx.lineTo(notchX, notchY);
        ctx.lineTo(baseX - px * s * HEAD_HALF_W, baseY - py * s * HEAD_HALF_W);
        ctx.closePath();
        ctx.fill();

        // White chevron accent inside the head
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = s * 0.05;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hx - dx * s * 0.28 + px * s * 0.12, hy - dy * s * 0.28 + py * s * 0.12);
        ctx.lineTo(hx - dx * s * 0.1, hy - dy * s * 0.1);
        ctx.lineTo(hx - dx * s * 0.28 - px * s * 0.12, hy - dy * s * 0.28 - py * s * 0.12);
        ctx.stroke();

        ctx.restore();
    }
}