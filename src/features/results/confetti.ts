/**
 * Tiny canvas confetti burst — no dependencies.
 *
 * The caller owns the canvas element and gets a `stop()` back, so React can
 * tear the whole thing down on unmount without leaving a rAF loop running.
 * Everything is driven off elapsed time (not frame counts) so it plays at the
 * same speed on 60Hz and 120Hz screens.
 */

export interface ConfettiOptions {
    /** Pieces are picked from this palette. Defaults to the app palette. */
    colors?: string[];
    /** Rough total number of pieces across all emitters. */
    particleCount?: number;
    /** Hard stop in ms so a stuck particle can never keep the loop alive. */
    maxDurationMs?: number;
}

type ParticleShape = 'strip' | 'square' | 'circle';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rotation: number;
    spin: number;
    /** Phase used to fake the piece of paper flipping edge-on. */
    tilt: number;
    tiltSpeed: number;
    age: number;
    ttl: number;
    shape: ParticleShape;
    /** Per-piece opacity so a burst has depth instead of reading as a flat wall. */
    alpha: number;
}

const DEFAULT_COLORS = ['#3B6AD9', '#1E9E57', '#F59E0B', '#F47B20', '#F43F5E', '#8B5CF6'];

const GRAVITY = 1450; // px / s²
const DRAG = 1.5; // fraction of velocity shed per second
const MAX_DT = 1 / 30; // clamp after tab switches so nothing teleports

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const makeParticle = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    colors: string[]
): Particle => {
    const roll = Math.random();
    const shape: ParticleShape = roll < 0.2 ? 'circle' : roll < 0.65 ? 'strip' : 'square';
    return {
        x,
        y,
        vx,
        vy,
        w: shape === 'strip' ? rand(4, 7) : rand(6, 11),
        h: rand(8, 15),
        color: pick(colors),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-9, 9),
        tilt: rand(0, Math.PI * 2),
        tiltSpeed: rand(4, 11),
        age: 0,
        ttl: rand(1.5, 2.4),
        shape,
        alpha: rand(0.78, 1),
    };
};

/**
 * Fires a three-stage burst (left cannon, right cannon, centre pop) into the
 * supplied canvas. Returns a cleanup function.
 */
export function launchConfetti(
    canvas: HTMLCanvasElement,
    options: ConfettiOptions = {}
): () => void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    const colors = options.colors?.length ? options.colors : DEFAULT_COLORS;
    const maxDuration = options.maxDurationMs ?? 2600;

    let width = 0;
    let height = 0;

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Same visual density on a phone and a desktop: a flat piece count on a
    // 390px screen turns the celebration into confetti soup.
    const requestedCount = options.particleCount ?? 110;
    const areaScale = Math.min(1, Math.max(0.55, (width * height) / 900000));
    const total = Math.max(12, Math.round(requestedCount * areaScale));

    const particles: Particle[] = [];

    const burst = (
        originX: number,
        originY: number,
        angle: number,
        spread: number,
        count: number,
        speedMin: number,
        speedMax: number
    ) => {
        for (let i = 0; i < count; i++) {
            const a = angle + rand(-spread / 2, spread / 2);
            const speed = rand(speedMin, speedMax);
            particles.push(
                makeParticle(
                    originX,
                    originY,
                    Math.cos(a) * speed,
                    Math.sin(a) * speed,
                    colors
                )
            );
        }
    };

    // Three beats: two cannons arcing in from the lower corners, a slow pop
    // behind the stars, and a sparse shower from above so the burst keeps
    // falling after the initial hit.
    const side = Math.max(1, Math.round(total * 0.26));
    const rain = Math.max(1, Math.round(total * 0.22));
    const middle = Math.max(1, total - side * 2 - rain);

    burst(width * 0.04, height * 0.55, -Math.PI * 0.3, Math.PI * 0.16, side, 720, 1060);
    burst(width * 0.96, height * 0.55, -Math.PI * 0.7, Math.PI * 0.16, side, 720, 1060);
    burst(width * 0.5, height * 0.32, -Math.PI / 2, Math.PI * 1.2, middle, 260, 620);

    for (let i = 0; i < rain; i++) {
        particles.push(
            makeParticle(
                rand(width * 0.04, width * 0.96),
                rand(-height * 0.15, -12),
                rand(-40, 40),
                rand(80, 220),
                colors
            )
        );
    }

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let stopped = false;

    const finish = () => {
        stopped = true;
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, width, height);
    };

    const frame = (now: number) => {
        if (stopped) return;
        const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
        last = now;
        elapsed += dt * 1000;

        ctx.clearRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;
            if (p.age >= p.ttl) {
                particles.splice(i, 1);
                continue;
            }

            const damp = Math.max(0, 1 - DRAG * dt);
            p.vx *= damp;
            p.vy = p.vy * damp + GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.spin * dt;
            p.tilt += p.tiltSpeed * dt;

            // Hold full opacity, then fall off over the last 30% of life.
            const fadeStart = p.ttl * 0.7;
            const alpha = p.age < fadeStart ? 1 : 1 - (p.age - fadeStart) / (p.ttl * 0.3);

            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha * p.alpha);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(1, Math.cos(p.tilt));
            ctx.fillStyle = p.color;
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.restore();
        }

        if (particles.length > 0 && elapsed < maxDuration) {
            raf = requestAnimationFrame(frame);
        } else {
            finish();
        }
    };

    raf = requestAnimationFrame(frame);

    return () => {
        stopped = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        ctx.clearRect(0, 0, width, height);
    };
}
