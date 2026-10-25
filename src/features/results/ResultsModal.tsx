import React, { useState } from 'react';
import { RoundResult } from '../../types/gameTypes';

interface ResultsModalProps {
    result: RoundResult | null;
    onNextLevel: () => void;
    onReplay: () => void;
    onHome: () => void;
    /** Should show a rewarded ad and resolve to true only if the player earned the reward */
    onWatchAdRevive?: () => Promise<boolean>;
    /** False once the player has already revived this round */
    canRevive?: boolean;
    /** Untangle rounds report hints used in the third stat. */
    isUntangle?: boolean;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
    result,
    onNextLevel,
    onReplay,
    onHome,
    onWatchAdRevive,
    canRevive = true,
    isUntangle = false,
}) => {
    const [adLoading, setAdLoading] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);

    if (!result) return null;

    const showRevive = !result.cleared && canRevive && !!onWatchAdRevive;

    const handleRevive = async () => {
        if (!onWatchAdRevive || adLoading) return;
        setAdLoading(true);
        setAdError(null);
        try {
            const rewarded = await onWatchAdRevive();
            if (!rewarded) setAdError('Watch the full ad to revive.');
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

    return (
        <div
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
            <div
                className="animate-pop-in"
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
                        style={{
                            display: 'flex',
                            gap: '6px',
                            marginBottom: '8px',
                            fontSize: '3.8rem',
                        }}
                    >
                        {Array.from({ length: 3 }, (_, i) => (
                            <span
                                key={i}
                                style={{
                                    color: i < result.stars ? '#F59E0B' : '#D4D0C5',
                                    filter:
                                        i < result.stars
                                            ? 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                                            : 'none',
                                    transform: i === 1 ? 'translateY(-6px)' : 'none',
                                }}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1
                    style={{
                        fontSize: '1.85rem',
                        fontWeight: 800,
                        color: '#181B20',
                        letterSpacing: '-0.02em',
                        margin: '0 0 6px 0',
                    }}
                >
                    {result.cleared ? 'Level Complete!' : 'Out of Lives!'}
                </h1>
                {!result.cleared && (
                    <div
                        style={{
                            fontSize: '0.95rem',
                            color: '#5A606A',
                            marginBottom: '18px',
                            lineHeight: 1.4,
                        }}
                    >
                        {showRevive
                            ? 'Watch a short ad to get a life back and keep your progress.'
                            : 'Give it another try, you can do it!'}
                    </div>
                )}

                {/* Score Banner */}
                {result.cleared && (
                    <div
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: '#3B6AD9',
                            marginBottom: '18px',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Score: {result.score.toLocaleString()} pts
                    </div>
                )}

                {/* 3-Column Stats Card */}
                <div
                    style={{
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
                    }}
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

                    {/* Mistakes Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#5A606A' }}>
                            {isUntangle ? 'Hints:' : 'Mistakes:'}                        </span>
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
                                onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                                onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <span style={{ fontSize: '1.3rem' }}>❤️</span>
                                {adLoading ? 'Loading ad…' : 'Watch Ad to Revive (+1 life)'}
                            </button>

                            {adError && (
                                <div style={{ fontSize: '0.85rem', color: '#B91C1C' }}>{adError}</div>
                            )}
                        </>
                    )}
                    {result.cleared && (
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
                    )}

                    <button
                        onClick={onReplay}
                        style={{
                            width: '100%',
                            height: '54px',
                            backgroundColor: result.cleared || showRevive ? '#FFFFFF' : '#3B6AD9',
                            color: result.cleared || showRevive ? '#181B20' : '#FFFFFF',
                            borderRadius: '14px',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            border: result.cleared || showRevive ? '1px solid #E2DFD7' : 'none',
                            boxShadow: result.cleared || showRevive
                                ? '0 2px 6px rgba(0, 0, 0, 0.04)'
                                : '0 6px 16px rgba(59, 106, 217, 0.28)',
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
                        Replay Level
                    </button>

                    <button
                        onClick={onHome}
                        style={{
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
                        }}
                    >
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
};