import React, { useEffect, useMemo, useId, useState } from 'react';
import { Clock, Star } from 'lucide-react';
import { RoundResult } from '../../types/gameTypes';
import { ConfettiCanvas } from './ConfettiCanvas';

const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Counts a number up so the score lands with the rest of the reveal instead of
 * appearing fully formed. Jumps straight to the target under reduced motion.
 */
const useCountUp = (target: number, delay = 0, duration = 900): number => {
    const reduced = useMemo(() => prefersReducedMotion(), []);
    const [value, setValue] = useState(() => (reduced ? target : 0));

    useEffect(() => {
        if (reduced) {
            setValue(target);
            return;
        }

        let frame = 0;
        let startedAt = 0;

        const tick = (now: number) => {
            if (!startedAt) startedAt = now;
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        const timer = window.setTimeout(() => {
            frame = requestAnimationFrame(tick);
        }, delay);

        return () => {
            window.clearTimeout(timer);
            cancelAnimationFrame(frame);
        };
    }, [target, delay, duration, reduced]);

    return value;
};

interface ResultsModalProps {
    result: RoundResult | null;
    onNextLevel: () => void;
    onReplay: () => void;
    onHome: () => void;
    /** Should show a rewarded ad and resolve to true only if the player earned the reward */
    onWatchAdRevive?: () => Promise<boolean>;
    /** Called when the passive cooldown timer finishes and grants a free life/replay */
    onCooldownComplete?: () => void;
    /** False once the player has already revived mid-round */
    canRevive?: boolean;
    /** Cooldown in seconds before a life regenerates if the player doesn't watch an ad (default 120s) */
    cooldownSeconds?: number;
    /** Untangle rounds can optionally still show Hints, or unified Mistakes */
    isUntangle?: boolean;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
    result,
    onNextLevel,
    onReplay,
    onHome,
    onWatchAdRevive,
    onCooldownComplete,
    canRevive = true,
    cooldownSeconds = 120,
}) => {
    const [adLoading, setAdLoading] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);
    const [waitLeft, setWaitLeft] = useState(cooldownSeconds);
    const displayScore = useCountUp(result?.score ?? 0, 560, 900);
    const rawStarId = useId();
    const starGradientId = `result-star-gold${rawStarId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    // Reset & tick the cooldown timer whenever the modal opens on a failed round
    useEffect(() => {
        if (!result || result.cleared) return;
        setWaitLeft(cooldownSeconds);
        setAdError(null);

        if (cooldownSeconds <= 0) return;

        const id = window.setInterval(() => {
            setWaitLeft((prev) => {
                if (prev <= 1) {
                    window.clearInterval(id);
                    onCooldownComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [result, cooldownSeconds, onCooldownComplete]);

    if (!result) return null;

    const showRevive = !result.cleared && canRevive && !!onWatchAdRevive;
    const isCoolingDown = !result.cleared && waitLeft > 0;

    const handleRevive = async () => {
        if (!onWatchAdRevive || adLoading) return;
        setAdLoading(true);
        setAdError(null);
        try {
            const rewarded = await onWatchAdRevive();
            if (!rewarded) {
                setAdError('Watch the full ad to restore your life.');
            } else {
                setWaitLeft(0);
            }
        } catch {
            setAdError('Ad not available right now. Try again in a moment.');
        } finally {
            setAdLoading(false);
        }
    };

    const formatDuration = (totalSeconds: number): string => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins > 0) {
            return `${mins}m${secs}s`;
        }
        return `${secs}s`;
    };

    const waitMm = Math.floor(waitLeft / 60);
    const waitSs = String(waitLeft % 60).padStart(2, '0');

    return (
        <div
            className="result-screen"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                backgroundColor: '#F5F3EB',
                color: '#181B20',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                paddingTop: 'calc(var(--safe-top, 0px) + 24px)',
                paddingBottom: 'calc(var(--safe-bottom, 0px) + 24px)',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            {result.cleared && (
                <ConfettiCanvas particleCount={result.stars >= 3 ? 150 : 100} />
            )}

            <div
                className={result.cleared ? undefined : 'animate-pop-in'}
                style={{
                    width: '100%',
                    maxWidth: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                {/* Star Rating Display (only when cleared) */}
                {result.cleared && (
                    <div
                        className="result-stars"
                        role="img"
                        aria-label={`${result.stars} of 3 stars earned`}
                    >
                        {Array.from({ length: 3 }, (_, i) => {
                            const earned = i < result.stars;
                            return (
                                <span
                                    key={i}
                                    className={`result-star${earned ? ' result-star--earned' : ''}`}
                                    style={
                                        {
                                            '--star-delay': `${i * 80}ms`,
                                            marginTop: i === 1 ? '-6px' : 0,
                                        } as React.CSSProperties
                                    }
                                >
                                    <Star
                                        size={62}
                                        strokeWidth={0}
                                        fill={earned ? `url(#${starGradientId})` : '#D8D3C6'}
                                        aria-hidden
                                    />
                                    {earned && (
                                        <span className="result-star__spark" aria-hidden />
                                    )}
                                </span>
                            );
                        })}
                        <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
                            <defs>
                                <linearGradient
                                    id={starGradientId}
                                    x1="0"
                                    y1="0"
                                    x2="0.35"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#FCD34D" />
                                    <stop offset="55%" stopColor="#F59E0B" />
                                    <stop offset="100%" stopColor="#E58409" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                )}

                {/* Broken Heart Pips (when out of lives) */}
                {!result.cleared && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            borderRadius: '9999px',
                            padding: '8px 16px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                        }}
                    >
                        {Array.from({ length: 3 }, (_, i) => (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: !isCoolingDown && i === 0 ? '#E5484D' : '#D4D0C5',
                                    transition: 'background-color 0.25s ease',
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1
                    className={result.cleared ? 'result-reveal' : undefined}
                    style={{
                        fontSize: '1.85rem',
                        fontWeight: 800,
                        color: '#181B20',
                        letterSpacing: '-0.02em',
                        margin: '0 0 6px 0',
                        '--reveal-delay': '460ms',
                    } as React.CSSProperties}
                >
                    {result.cleared
                        ? 'Level Complete!'
                        : isCoolingDown
                            ? 'Out of Lives!'
                            : 'Life Restored!'}
                </h1>

                {!result.cleared && (
                    <div
                        style={{
                            fontSize: '0.95rem',
                            color: '#5A606A',
                            marginBottom: '14px',
                            lineHeight: 1.4,
                        }}
                    >
                        {isCoolingDown
                            ? showRevive
                                ? 'Watch a short ad to revive right where you left off, or wait for a life to recharge.'
                                : 'Wait for your life to recharge to try again.'
                            : 'Your life has recharged! Ready to jump back in?'}
                    </div>
                )}

                {/* Live Cooldown Pill (when out of lives) */}
                {!result.cleared && isCoolingDown && (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#EAE6DD',
                            color: '#181B20',
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            marginBottom: '18px',
                        }}
                    >
                        <Clock size={15} strokeWidth={2.2} />
                        <span>
                            Next life in {waitMm}:{waitSs}
                        </span>
                    </div>
                )}

                {/* Score Banner */}
                {result.cleared && (
                    <div
                        className="result-reveal"
                        style={
                            {
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: '#3B6AD9',
                                marginBottom: '18px',
                                letterSpacing: '-0.01em',
                                fontVariantNumeric: 'tabular-nums',
                                '--reveal-delay': '560ms',
                            } as React.CSSProperties
                        }
                    >
                        Score: {displayScore.toLocaleString()} pts
                    </div>
                )}

                {/* 3-Column Stats Card */}
                <div
                    className="result-reveal"
                    style={
                        {
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '16px',
                            border: '1px solid #E5E2D9',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                            alignItems: 'center',
                            padding: '16px 8px',
                            marginBottom: '24px',
                            '--reveal-delay': result.cleared ? '660ms' : '0ms',
                        } as React.CSSProperties
                    }
                >
                    {/* Time Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#5A606A' }}>
                            Time:
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#181B20' }}>
                            {formatDuration(result.timeSpent)}
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '36px', backgroundColor: '#ECE9E0' }} />

                    {/* Moves Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#5A606A' }}>
                            Moves:
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#181B20' }}>
                            {result.movesTaken}
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '36px', backgroundColor: '#ECE9E0' }} />

                    {/* Mistakes Column (Unified across both modes) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#5A606A' }}>
                            Mistakes:
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#181B20' }}>
                            {result.mistakes}
                        </span>
                    </div>
                </div>

                {/* Action Controls */}
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    {showRevive && (
                        <>
                            <button
                                onClick={handleRevive}
                                disabled={adLoading}
                                style={{
                                    width: '100%',
                                    height: '58px',
                                    background: 'linear-gradient(135deg, #F43F5E, #FB7185)',
                                    color: '#FFFFFF',
                                    borderRadius: '14px',
                                    fontSize: '1.05rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    boxShadow: '0 6px 16px rgba(244, 63, 94, 0.32)',
                                    cursor: adLoading ? 'default' : 'pointer',
                                    opacity: adLoading ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'transform 0.1s ease',
                                }}
                                onPointerDown={(e) =>
                                    (e.currentTarget.style.transform = 'scale(0.98)')
                                }
                                onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                onPointerLeave={(e) =>
                                    (e.currentTarget.style.transform = 'scale(1)')
                                }
                            >
                                <span style={{ fontSize: '1.3rem' }}>❤️</span>
                                {adLoading ? 'Loading ad…' : 'Watch Ad to Revive (+1 life)'}
                            </button>

                            {adError && (
                                <div style={{ fontSize: '0.85rem', color: '#B91C1C' }}>
                                    {adError}
                                </div>
                            )}
                        </>
                    )}

                    {result.cleared && (
                        <div
                            className="result-reveal"
                            style={
                                {
                                    width: '100%',
                                    '--reveal-delay': '740ms',
                                } as React.CSSProperties
                            }
                        >
                            <button
                                onClick={onNextLevel}
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    backgroundColor: '#3B6AD9',
                                    color: '#FFFFFF',
                                    borderRadius: '14px',
                                    fontSize: '1.05rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    boxShadow: '0 6px 16px rgba(59, 106, 217, 0.28)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s ease',
                                }}
                                onPointerDown={(e) =>
                                    (e.currentTarget.style.transform = 'scale(0.98)')
                                }
                                onPointerUp={(e) =>
                                    (e.currentTarget.style.transform = 'scale(1)')
                                }
                                onPointerLeave={(e) =>
                                    (e.currentTarget.style.transform = 'scale(1)')
                                }
                            >
                                Next Level
                            </button>
                        </div>
                    )}

                    <div
                        className={result.cleared ? 'result-reveal' : undefined}
                        style={
                            {
                                width: '100%',
                                '--reveal-delay': '770ms',
                            } as React.CSSProperties
                        }
                    >
                        <button
                            onClick={onReplay}
                            disabled={isCoolingDown}
                            style={{
                                width: '100%',
                                height: '54px',
                                backgroundColor:
                                    result.cleared || showRevive ? '#FFFFFF' : '#3B6AD9',
                                color: result.cleared || showRevive ? '#181B20' : '#FFFFFF',
                                borderRadius: '14px',
                                fontSize: '1.05rem',
                                fontWeight: 600,
                                border:
                                    result.cleared || showRevive ? '1px solid #E2DFD7' : 'none',
                                boxShadow:
                                    result.cleared || showRevive
                                        ? '0 2px 6px rgba(0, 0, 0, 0.04)'
                                        : '0 6px 16px rgba(59, 106, 217, 0.28)',
                                cursor: isCoolingDown ? 'not-allowed' : 'pointer',
                                opacity: isCoolingDown ? 0.55 : 1,
                                transition: 'transform 0.1s ease, opacity 0.2s ease',
                            }}
                            onPointerDown={(e) => {
                                if (!isCoolingDown)
                                    e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onPointerUp={(e) =>
                                (e.currentTarget.style.transform = 'scale(1)')
                            }
                            onPointerLeave={(e) =>
                                (e.currentTarget.style.transform = 'scale(1)')
                            }
                        >
                            {isCoolingDown
                                ? `Replay Unlocked in ${waitMm}:${waitSs}`
                                : 'Replay Level'}
                        </button>
                    </div>

                    <button
                        className={result.cleared ? 'result-reveal' : undefined}
                        onClick={onHome}
                        style={
                            {
                                background: 'transparent',
                                border: 'none',
                                color: '#484D56',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                                marginTop: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                '--reveal-delay': '800ms',
                            } as React.CSSProperties
                        }
                    >
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
};