import React from 'react';
import { PlayerProgress, GameMode } from '../../types/gameTypes';
import { Play, Network, ChevronRight } from 'lucide-react';

// Palette sampled from the app icon
const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';
const GREEN = '#1E9E57';
const BLUE = '#3B63D6';
const ORANGE = '#F47B20';

interface MainTabProps {
    progress: PlayerProgress;
    onStartGame: (mode: GameMode, level: number) => void;
    onGoToDaily?: () => void;
}

export const MainTab: React.FC<MainTabProps> = ({ progress, onStartGame }) => {
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
                gap: '44px',
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
                        width: '168px',
                        height: '168px',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        boxShadow: '0 14px 34px rgba(31, 35, 38, 0.16)',
                        marginBottom: '26px',
                    }}
                >
                    <img
                        src="/icon.png"
                        alt="Tap Untangle icon"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                    Free every arrow. Think before you tap.
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
                <button
                    onClick={() => onStartGame('campaign', progress.currentLevel)}
                    style={{
                        width: '100%',
                        height: '64px',
                        backgroundColor: BLUE,
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 10px 24px rgba(59, 99, 214, 0.38)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '14px',
                        transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <Play size={22} strokeWidth={2.5} fill="#FFFFFF" aria-hidden />
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {progress.currentLevel > 1 ? 'Continue' : 'New Game'}
                    </span>
                </button>
                {/* Untangle mode */}
                <button
                    onClick={() => onStartGame('untangle', progress.untangleLevel ?? 1)}
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
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <span
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(30, 158, 87, 0.12)',
                            color: GREEN,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Network size={20} strokeWidth={2.2} aria-hidden />
                    </span>
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: CHARCOAL }}>Untangle</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#767B84' }}>
                            Level {progress.untangleLevel ?? 1} · move the dots, no crossings
                        </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2.2} color="#686E78" aria-hidden />
                </button>

                {/* Level chip */}
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
                            backgroundColor: ORANGE,
                        }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: CHARCOAL }}>
                        Level {progress.currentLevel}
                    </span>
                </div>

            </div>
        </div>
    );
};