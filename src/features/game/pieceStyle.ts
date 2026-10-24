// Drop-in drawing helpers for the new look. Call these from GameEngine.render()
// in place of the current board background and piece drawing.

export const THEME = {
    bg: '#0c0d10',
    dot: 'rgba(255,255,255,0.14)',
    danger: '#f0634f',
} as const;

// Six hues at similar lightness so no piece shouts over the others.
export const PIECE_COLORS = [
    '#f2785c', // coral
    '#f2b84b', // amber
    '#7bc59b', // sage
    '#6ab0f2', // sky
    '#a593f0', // violet
    '#ee7fa8', // rose
] as const;

export const pieceColor = (id: number): string => PIECE_COLORS[id % PIECE_COLORS.length];

export type Heading = readonly [dx: number, dy: number];

export const HEADINGS = {
    U: [0, -1],
    D: [0, 1],
    L: [-1, 0],
    R: [1, 0],
} as const satisfies Record<string, Heading>;

/** Fills the page color and the faint dot grid. No card, border or shadow. */
export function drawBoardBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rows: number,
    cols: number,
    cell: number,
    pad: number,
): void {
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = THEME.dot;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.beginPath();
            ctx.arc(pad + c * cell + cell / 2, pad + r * cell + cell / 2, 1.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export interface PieceDrawOptions {
    /** Cell centers in canvas px, tail first, head last. */
    points: ReadonlyArray<readonly [number, number]>;
    /** Unit direction the head points, e.g. HEADINGS.R. */
    heading: Heading;
    cell: number;
    color: string;
    alpha?: number;
    /** 0..1 white glow under the piece, used for hints. */
    halo?: number;
}

function trace(ctx: CanvasRenderingContext2D, pts: PieceDrawOptions['points']): void {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

/** Flat rounded stroke plus a small solid arrowhead. No texture, no shading. */
export function drawPiece(ctx: CanvasRenderingContext2D, o: PieceDrawOptions): void {
    const { points, heading, cell, color } = o;
    const alpha = o.alpha ?? 1;
    const halo = o.halo ?? 0;
    const lw = cell * 0.2;
    const [dx, dy] = heading;
    const px = -dy;
    const py = dx;
    const [hx, hy] = points[points.length - 1];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (halo > 0 && points.length > 1) {
        ctx.globalAlpha = halo * 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lw + cell * 0.24;
        trace(ctx, points);
        ctx.stroke();
    }

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    if (points.length > 1) {
        trace(ctx, points);
        ctx.stroke();
    }

    // Arrowhead: the 3px same-color stroke rounds the corners.
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx + dx * cell * 0.38, hy + dy * cell * 0.38);
    ctx.lineTo(hx - dx * cell * 0.02 + px * cell * 0.2, hy - dy * cell * 0.02 + py * cell * 0.2);
    ctx.lineTo(hx - dx * cell * 0.02 - px * cell * 0.2, hy - dy * cell * 0.02 - py * cell * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}
