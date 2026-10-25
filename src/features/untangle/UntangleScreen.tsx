import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { RoundResult } from '../../types/gameTypes';
import { GameHeader, MAX_LIVES } from '../../components/GameHeader';
import {
    Crossings,
    Pt,
    bestHintNode,
    findCrossings,
    generateUntangleLevel,
    rateUntangle,
    scoreUntangle,
} from '../../core/untangle';

interface UntangleScreenProps {
    level: number;
    onFinished: (result: RoundResult) => void;
    onOpenPause: () => void;
    /** Resolve true when the player earned the hint, e.g. after a rewarded ad. Defaults to free. */
    onRequestHint?: () => Promise<boolean>;
    /** Best saved score for this level, used to flag a new high score. */
    bestScore?: number;
}

// Same palette as MainTab and the modals.
const C = {
    cream: '#F5F3EB',
    charcoal: '#1F2326',
    blue: '#3B63D6',
    green: '#1E9E57',
    danger: '#D93B4E',
    edge: '#A3A8B1',
    border: '#E5E2D9',
    muted: '#767B84',
    white: '#FFFFFF',
} as const;

const PAD = 20;
const NODE_R = 11;
const HIT_R = 28;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface ActionButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1,
            height: '50px',
            backgroundColor: C.white,
            color: '#181B20',
            border: '1px solid #E5E2D9',
            borderRadius: '14px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            fontSize: '0.98rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s ease',
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
        onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
        {icon}
        {label}
    </button>
);

export const UntangleScreen: React.FC<UntangleScreenProps> = ({
    level,
    onFinished,
    onOpenPause,
    onRequestHint,
    bestScore = 0,
}) => {
    const lvl = useMemo(() => generateUntangleLevel(level), [level]);
    const initialCrossings = useMemo(() => findCrossings(lvl.start, lvl.edges).count, [lvl]);

    const wrapRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef(320);
    const pts = useRef<Pt[]>(lvl.start.map((p) => ({ ...p })));
    const cross = useRef<Crossings>(findCrossings(pts.current, lvl.edges));
    const drag = useRef<{
        i: number;
        sx: number;
        sy: number;
        moved: boolean;
        startCrossings: number;
    } | null>(null);
    const anim = useRef<{ i: number; from: Pt; to: Pt; t0: number } | null>(null);
    const flashRef = useRef<{ i: number; until: number } | null>(null);

    const doneRef = useRef(false);
    const failedRef = useRef(false);
    const movesRef = useRef(0);
    const hintsRef = useRef(0);
    const mistakesRef = useRef(0);
    const secsRef = useRef(0);

    const [size, setSize] = useState(320);
    const [crossings, setCrossings] = useState(cross.current.count);
    const [mistakes, setMistakes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [done, setDone] = useState(false);
    const [failed, setFailed] = useState(false);

    const finish = useCallback(
        (cleared: boolean) => {
            if (doneRef.current) return;
            doneRef.current = true;
            failedRef.current = !cleared;
            setDone(cleared);
            setFailed(!cleared);

            const n = lvl.start.length;
            window.setTimeout(() => {
                const penaltyCount = hintsRef.current + mistakesRef.current;
                const score = cleared
                    ? scoreUntangle(n, movesRef.current, penaltyCount, secsRef.current)
                    : 0;
                const stars = cleared
                    ? rateUntangle(n, movesRef.current, penaltyCount)
                    : 0;

                onFinished({
                    cleared,
                    levelNumber: level,
                    score,
                    stars,
                    timeSpent: secsRef.current,
                    movesTaken: movesRef.current,
                    mistakes: mistakesRef.current,
                    maxCombo: 0,
                    isNewHigh: cleared && score > bestScore,
                });
            }, 700);
        },
        [lvl, level, bestScore, onFinished]
    );

    const recompute = useCallback(() => {
        cross.current = findCrossings(pts.current, lvl.edges);
        setCrossings(cross.current.count);
    }, [lvl]);

    const reset = useCallback(() => {
        pts.current = lvl.start.map((p) => ({ ...p }));
        drag.current = null;
        anim.current = null;
        flashRef.current = null;
        doneRef.current = false;
        failedRef.current = false;
        movesRef.current = 0;
        hintsRef.current = 0;
        mistakesRef.current = 0;
        secsRef.current = 0;
        setMistakes(0);
        setSeconds(0);
        setDone(false);
        setFailed(false);
        recompute();
    }, [lvl, recompute]);

    useEffect(() => {
        reset();
    }, [reset]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (doneRef.current) return;
            secsRef.current += 1;
            setSeconds(secsRef.current);
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    // Fit the board to the space available.
    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const fit = () => {
            const s = Math.floor(Math.min(wrap.clientWidth - 2, wrap.clientHeight - 10, 440));
            if (s > 0) {
                sizeRef.current = s;
                setSize(s);
            }
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
    }, [size]);

    // Draw loop.
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        let raf = 0;

        const toPx = (p: Pt): [number, number] => {
            const s = sizeRef.current;
            return [PAD + p.x * (s - PAD * 2), PAD + p.y * (s - PAD * 2)];
        };

        const frame = (now: number) => {
            const s = sizeRef.current;
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, s, s);

            const a = anim.current;
            if (a) {
                const t = Math.min(1, (now - a.t0) / 300);
                const e = 1 - Math.pow(1 - t, 3);
                pts.current[a.i] = {
                    x: a.from.x + (a.to.x - a.from.x) * e,
                    y: a.from.y + (a.to.y - a.from.y) * e,
                };
                recompute();
                if (t >= 1) {
                    anim.current = null;
                    if (cross.current.count === 0) finish(true);
                }
            }

            const c = cross.current;
            const isDone = doneRef.current;
            const isFailed = failedRef.current;
            ctx.lineCap = 'round';
            lvl.edges.forEach((e, i) => {
                const [x1, y1] = toPx(pts.current[e[0]]);
                const [x2, y2] = toPx(pts.current[e[1]]);
                ctx.strokeStyle = isDone
                    ? isFailed
                        ? C.danger
                        : C.green
                    : c.bad[i]
                        ? C.danger
                        : C.edge;
                ctx.lineWidth = c.bad[i] ? 3 : 2.5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });

            if (!isDone || isFailed) {
                ctx.strokeStyle = C.danger;
                ctx.lineWidth = 2;
                for (const q of c.points) {
                    const [x, y] = toPx(q);
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            const flash = flashRef.current;
            pts.current.forEach((p, i) => {
                const [x, y] = toPx(p);
                const held = drag.current?.i === i;
                const isFlashing = flash && flash.i === i && now < flash.until;

                if (held || isFlashing) {
                    ctx.fillStyle = isFlashing
                        ? 'rgba(217, 59, 78, 0.28)'
                        : 'rgba(59, 99, 214, 0.18)';
                    ctx.beginPath();
                    ctx.arc(x, y, NODE_R + 9, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = isDone
                    ? isFailed
                        ? C.danger
                        : C.green
                    : isFlashing
                        ? C.danger
                        : C.charcoal;
                ctx.beginPath();
                ctx.arc(x, y, held ? NODE_R + 2 : NODE_R, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = C.white;
                ctx.lineWidth = 3;
                ctx.stroke();
            });

            raf = requestAnimationFrame(frame);
        };

        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [lvl, recompute, finish]);

    const locate = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const s = sizeRef.current;
        const x = (e.clientX - r.left) * (s / r.width);
        const y = (e.clientY - r.top) * (s / r.height);
        return {
            px: x,
            py: y,
            x: clamp01((x - PAD) / (s - PAD * 2)),
            y: clamp01((y - PAD) / (s - PAD * 2)),
        };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (doneRef.current || anim.current) return;
        const q = locate(e);
        const s = sizeRef.current;
        let best = -1;
        let bestD = HIT_R;
        pts.current.forEach((p, i) => {
            const d = Math.hypot(
                PAD + p.x * (s - PAD * 2) - q.px,
                PAD + p.y * (s - PAD * 2) - q.py
            );
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        });
        if (best < 0) return;
        drag.current = {
            i: best,
            sx: q.x,
            sy: q.y,
            moved: false,
            startCrossings: cross.current.count,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const d = drag.current;
        if (!d) return;
        const q = locate(e);
        pts.current[d.i] = { x: q.x, y: q.y };
        if (Math.hypot(q.x - d.sx, q.y - d.sy) > 0.02) d.moved = true;
        recompute();
    };

    const onPointerUp = () => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;

        if (d.moved) {
            movesRef.current += 1;
            if (cross.current.count > d.startCrossings) {
                mistakesRef.current += 1;
                setMistakes(mistakesRef.current);
                flashRef.current = { i: d.i, until: performance.now() + 450 };

                if (mistakesRef.current >= MAX_LIVES) {
                    finish(false);
                    return;
                }
            }
        }

        if (cross.current.count === 0) finish(true);
    };

    const hint = async () => {
        if (doneRef.current || anim.current) return;
        const ok = onRequestHint ? await onRequestHint() : true;
        if (!ok) return;
        const i = bestHintNode(pts.current, lvl);
        if (i < 0) return;
        hintsRef.current += 1;
        anim.current = {
            i,
            from: { ...pts.current[i] },
            to: { ...lvl.solution[i] },
            t0: performance.now(),
        };
    };

    const mm = Math.floor(seconds / 60);
    const ss = String(seconds % 60).padStart(2, '0');
    const livesLeft = Math.max(0, MAX_LIVES - mistakes);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: C.cream,
                color: C.charcoal,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 20px',
                paddingTop: 'calc(var(--safe-top, 0px) + 12px)',
                paddingBottom: 'calc(var(--safe-bottom, 0px) + 24px)',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <GameHeader
                level={level}
                lives={livesLeft}
                subtitle={`${crossings} ${crossings === 1 ? 'crossing' : 'crossings'} · ${mm}:${ss}`}
                elapsedSeconds={seconds}
                clearedCount={Math.max(0, initialCrossings - crossings)}
                totalCount={initialCrossings}
                onPause={onOpenPause}
            />

            <main
                ref={wrapRef}
                style={{
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: C.white,
                        border: `1px solid ${failed ? C.danger : C.border}`,
                        borderRadius: '22px',
                        boxShadow: '0 8px 24px rgba(31, 35, 38, 0.08)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        style={{ width: size, height: size, display: 'block', touchAction: 'none' }}
                        aria-label={`Untangle board. ${crossings} crossings left, ${livesLeft} lives remaining.`}
                    />
                </div>
            </main>

            <p
                style={{
                    margin: '0 0 14px',
                    minHeight: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: failed ? C.danger : done ? C.green : C.muted,
                    textAlign: 'center',
                }}
            >
                {failed
                    ? 'Out of lives! Too many new crossings.'
                    : done
                        ? 'Untangled.'
                        : mistakes > 0
                            ? `Careful — adding crossings costs a life (${livesLeft} left).`
                            : 'Drag the dots until no lines cross.'}
            </p>

            <footer
                style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    maxWidth: '380px',
                }}
            >
                <ActionButton
                    label="Hint"
                    icon={<Lightbulb size={18} strokeWidth={2} aria-hidden />}
                    onClick={hint}
                />
                <ActionButton
                    label="Restart"
                    icon={<RotateCcw size={18} strokeWidth={2} aria-hidden />}
                    onClick={reset}
                />
            </footer>
        </div>
    );
};