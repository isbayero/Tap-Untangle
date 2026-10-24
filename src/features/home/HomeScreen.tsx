import React from 'react';
import { PlayerProgress, GameMode } from '../../types/gameTypes';

interface HomeScreenProps {
    progress: PlayerProgress;
    onStartGame: (mode: GameMode, level: number) => void;
    onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    progress,
    onStartGame,
    onOpenSettings,
}) => {
    const formattedLevel = String(progress.currentLevel).padStart(2, '0');

    const handleDailyChallenge = () => {
        const todaySeed = parseInt(
            new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            10
        );
        onStartGame('daily', (todaySeed % 50) + 1);
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#F5F3EB',
                color: '#1A1D24',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 24px',
                paddingTop: 'calc(var(--safe-top, 0px) + 20px)',
                paddingBottom: 'calc(var(--safe-bottom, 0px) + 28px)',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            {/* Top Bar: Level Pill & Settings Icon */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        backgroundColor: '#E5E2D9',
                        color: '#2C3038',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Level {formattedLevel}
                </div>

                <button
                    onClick={onOpenSettings}
                    aria-label="Settings"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2C3038',
                        cursor: 'pointer',
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>

            {/* Center Hero Title & Interlocking Arrow Graphic */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '8px',
                    marginTop: '-12px',
                }}
            >
                <h1
                    style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        color: '#181B20',
                        letterSpacing: '-0.03em',
                        margin: 0,
                    }}
                >
                    Tap Untangle
                </h1>
                <p
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: 500,
                        color: '#484D56',
                        margin: 0,
                        marginBottom: '28px',
                    }}
                >
                    Arrow Escape
                </p>

                {/* 8-Way Interlocking Arrow Star Graphic */}
                <div
                    style={{
                        width: '210px',
                        height: '210px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg
                        width="210"
                        height="210"
                        viewBox="0 0 200 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Diagonal: Bottom-Left to Top-Right (Dark Slate) & Bottom-Left Tip (Taupe) */}
                        <line
                            x1="52"
                            y1="148"
                            x2="100"
                            y2="100"
                            stroke="#8C8275"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <polygon points="36,164 68,154 46,132" fill="#8C8275" />

                        <line
                            x1="100"
                            y1="100"
                            x2="148"
                            y2="52"
                            stroke="#222934"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <polygon points="164,36 132,46 154,68" fill="#222934" />

                        {/* Diagonal: Top-Left (Blue) to Bottom-Right (Taupe) */}
                        <line
                            x1="52"
                            y1="52"
                            x2="100"
                            y2="100"
                            stroke="#3B6AD9"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <polygon points="36,36 46,68 68,46" fill="#3B6AD9" />

                        <line
                            x1="100"
                            y1="100"
                            x2="148"
                            y2="148"
                            stroke="#8C8275"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <polygon points="164,164 154,132 132,154" fill="#8C8275" />

                        {/* Horizontal: Left (Dark Slate) & Right (Taupe) */}
                        <line
                            x1="34"
                            y1="100"
                            x2="100"
                            y2="100"
                            stroke="#222934"
                            strokeWidth="13"
                        />
                        <polygon points="12,100 42,82 42,118" fill="#222934" />

                        <line
                            x1="100"
                            y1="100"
                            x2="166"
                            y2="100"
                            stroke="#8C8275"
                            strokeWidth="13"
                        />
                        <polygon points="188,100 158,82 158,118" fill="#8C8275" />

                        {/* Vertical Overpass: Up & Down (Royal Blue) */}
                        <line
                            x1="100"
                            y1="34"
                            x2="100"
                            y2="166"
                            stroke="#3B6AD9"
                            strokeWidth="13"
                        />
                        <polygon points="100,12 82,42 118,42" fill="#3B6AD9" />
                        <polygon points="100,188 82,158 118,158" fill="#3B6AD9" />

                        {/* Center Overlap Right Turn Accent */}
                        <path
                            d="M100 78 V94 Q100 100 106 100 H122"
                            stroke="#222934"
                            strokeWidth="11"
                            fill="none"
                        />
                    </svg>
                </div>
            </div>

            {/* Bottom Action Controls */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    width: '100%',
                    maxWidth: '340px',
                }}
            >
                {/* Primary Play Button */}
                <button
                    onClick={() => onStartGame('campaign', progress.currentLevel)}
                    style={{
                        width: '100%',
                        height: '54px',
                        backgroundColor: '#3B6AD9',
                        color: '#FFFFFF',
                        borderRadius: '14px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 6px 16px rgba(59, 106, 217, 0.28)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    Play
                </button>

                {/* Secondary Daily Challenge Button */}
                <button
                    onClick={handleDailyChallenge}
                    style={{
                        width: '100%',
                        height: '54px',
                        backgroundColor: '#FFFFFF',
                        color: '#1A1D24',
                        borderRadius: '14px',
                        fontSize: '1.02rem',
                        fontWeight: 600,
                        border: '1px solid #E2DFD7',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
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
                    <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2C3038"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <circle cx="8" cy="14" r="1" fill="#2C3038" />
                        <circle cx="12" cy="14" r="1" fill="#2C3038" />
                        <circle cx="16" cy="14" r="1" fill="#2C3038" />
                        <circle cx="8" cy="18" r="1" fill="#2C3038" />
                        <circle cx="12" cy="18" r="1" fill="#2C3038" />
                    </svg>
                    Daily Challenge
                </button>

                {/* Underlined Zen Mode Link */}
                <button
                    onClick={() => onStartGame('zen', progress.currentLevel)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#5A606A',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        marginTop: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                    }}
                >
                    Zen Mode
                </button>
            </div>
        </div>
    );
};