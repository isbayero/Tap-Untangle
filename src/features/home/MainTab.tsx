import React, { useState } from 'react';
import { PlayerProgress, GameMode } from '../../types/gameTypes';
import { Play, Compass, ChevronRight, Clock, Film } from 'lucide-react';

// Palette sampled from the app icon
const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';
const GREEN = '#1E9E57';
const BLUE = '#3B63D6';
const ORANGE = '#F47B20';
const DANGER = '#D93B4E';

interface MainTabProps {
    progress: PlayerProgress;
    onStartGame: (mode: GameMode, level: number) => void;
    onGoToDaily?: () => void;
    cooldownSecondsLeft?: number;
    onWatchAdRefill?: () => Promise<boolean>;
}

export const MainTab: React.FC<MainTabProps> = ({
    progress,
    onStartGame,
    cooldownSecondsLeft = 0,
    onWatchAdRefill,
}) => {
    const [adLoading, setAdLoading] = useState(false);

    const untangleLevel = progress.untangleLevel ?? 1;
    const arrowLevel = progress.currentLevel ?? 1;
    const isCoolingDown = cooldownSecondsLeft > 0;
    const mm = Math.floor(cooldownSecondsLeft / 60);
    const ss = String(cooldownSecondsLeft % 60).padStart(2, '0');

    const handleRefillAd = async () => {
        if (!onWatchAdRefill || adLoading) return;
        setAdLoading(true);
        try {
            await onWatchAdRefill();
        } finally {
            setAdLoading(false);
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: CREAM,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '36px',
                padding: '24px 24px 90px 24px',
                paddingTop: 'calc(var(--safe-top, 0px) + 24px)',
                overflowY: 'auto',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            {/* Brand block: icon, title, color strip, tagline */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: '160px',
                        height: '160px',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        boxShadow: '0 14px 34px rgba(31, 35, 38, 0.16)',
                        marginBottom: '22px',
                    }}
                >
                    <img
                        src="/icon.png"
                        alt="Tap Untangle icon"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                </div>

                <h1
                    style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        color: CHARCOAL,
                        letterSpacing: '-0.02em',
                        margin: '0 0 12px 0',
                        lineHeight: 1.1,
                    }}
                >
                    Tap Untangle
                </h1>

                {/* Four-color accent strip */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    {[CHARCOAL, GREEN, BLUE, ORANGE].map((c) => (
                        <span
                            key={c}
                            style={{
                                width: '28px',
                                height: '6px',
                                borderRadius: '9999px',
                                backgroundColor: c,
                            }}
                        />
                    ))}
                </div>

                <p
                    style={{
                        margin: 0,
                        fontSize: '0.98rem',
                        fontWeight: 500,
                        color: '#5A606A',
                        lineHeight: 1.4,
                    }}
                >
                    Move the dots until no lines cross.
                </p>
            </div>

            {/* Play block */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                }}
            >
                {/* Cooldown Alert Banner (if player quit while out of lives) */}
                {isCoolingDown && (
                    <div
                        style={{
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            border: `1px solid ${DANGER}`,
                            borderRadius: '16px',
                            padding: '12px 14px',
                            boxShadow: '0 4px 12px rgba(217, 59, 78, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color={DANGER} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span
                                    style={{
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: CHARCOAL,
                                    }}
                                >
                                    Recharging Lives ({mm}:{ss})
                                </span>
                                <span style={{ fontSize: '0.74rem', color: '#767B84' }}>
                                    Wait or watch an ad to play now
                                </span>
                            </div>
                        </div>

                        {onWatchAdRefill && (
                            <button
                                onClick={handleRefillAd}
                                disabled={adLoading}
                                style={{
                                    backgroundColor: DANGER,
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: adLoading ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    flexShrink: 0,
                                }}
                            >
                                <Film size={14} />
                                {adLoading ? 'Loading…' : 'Refill'}
                            </button>
                        )}
                    </div>
                )}

                {/* Main CTA: Untangle Mode */}
                <button
                    disabled={isCoolingDown}
                    onClick={() => onStartGame('untangle', untangleLevel)}
                    style={{
                        width: '100%',
                        height: '64px',
                        backgroundColor: BLUE,
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 10px 24px rgba(59, 99, 214, 0.38)',
                        cursor: isCoolingDown ? 'not-allowed' : 'pointer',
                        opacity: isCoolingDown ? 0.55 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '14px',
                        transition: 'transform 0.1s ease, opacity 0.2s ease',
                    }}
                    onPointerDown={(e) => {
                        if (!isCoolingDown) e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <Play size={22} strokeWidth={2.5} fill="#FFFFFF" aria-hidden />
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {isCoolingDown
                            ? `Wait ${mm}:${ss}`
                            : untangleLevel > 1
                                ? `Continue · Level ${untangleLevel}`
                                : 'Play Untangle'}
                    </span>
                </button>

                {/* Secondary Mode: Arrow Escape ('campaign') */}
                <button
                    disabled={isCoolingDown}
                    onClick={() => onStartGame('campaign', arrowLevel)}
                    style={{
                        width: '100%',
                        height: '64px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E2D9',
                        borderRadius: '18px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: isCoolingDown ? 'not-allowed' : 'pointer',
                        opacity: isCoolingDown ? 0.55 : 1,
                        textAlign: 'left',
                        transition: 'transform 0.1s ease, opacity 0.2s ease',
                    }}
                    onPointerDown={(e) => {
                        if (!isCoolingDown) e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <span
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(244, 123, 32, 0.12)',
                            color: ORANGE,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Compass size={20} strokeWidth={2.2} aria-hidden />
                    </span>
                    <span
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                        }}
                    >
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: CHARCOAL }}>
                            Arrow Escape
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#767B84' }}>
                            Level {arrowLevel} · free every arrow without colliding
                        </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2.2} color="#686E78" aria-hidden />
                </button>

                {/* Level chip (Main Untangle Level) */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E2D9',
                        borderRadius: '9999px',
                        padding: '8px 16px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <span
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: GREEN,
                        }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: CHARCOAL }}>
                        Untangle Level {untangleLevel}
                    </span>
                </div>
            </div>
        </div>
    );
};