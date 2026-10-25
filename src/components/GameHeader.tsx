import React from 'react';
import { Pause } from 'lucide-react';

export const MAX_LIVES = 3;

interface GameHeaderProps {
    level: number;
    /** Number of lives remaining (0..MAX_LIVES). Defaults to MAX_LIVES. Pass null to hide pips. */
    lives?: number | null;
    /** Replaces the default "time · cleared/total" line. */
    subtitle?: string;
    elapsedSeconds: number;
    clearedCount: number;
    totalCount: number;
    onPause: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
    level,
    lives = MAX_LIVES,
    subtitle,
    elapsedSeconds,
    clearedCount,
    totalCount,
    onPause,
}) => {
    const hasLives = lives !== null;
    const livesLeft = Math.max(0, lives ?? MAX_LIVES);
    const unlimited = !Number.isFinite(livesLeft) || livesLeft > MAX_LIVES;
    const pct = totalCount > 0 ? Math.min(100, Math.max(0, (clearedCount / totalCount) * 100)) : 0;
    const mm = Math.floor(elapsedSeconds / 60);
    const ss = String(Math.floor(elapsedSeconds % 60)).padStart(2, '0');

    const formattedLevel = String(level).padStart(2, '0');

    return (
        <header
            style={{
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            {/* Top Bar: Pause Button, Title/Timer/Progress, Heart Pips */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                {/* Pause Button */}
                <button
                    onClick={onPause}
                    aria-label="Pause"
                    style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E2D9',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#181B20',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                    onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <Pause size={20} strokeWidth={2} />
                </button>

                {/* Level Title & Subtitle (Time & Count) */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: '#181B20',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Level {formattedLevel}
                    </span>
                    <span
                        style={{
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: '#686E78',
                        }}
                    >
                        {subtitle || `${mm}:${ss} · ${clearedCount}/${totalCount}`}
                    </span>
                </div>

                {/* Heart Pips / Lives Indicator */}
                <div
                    role="img"
                    aria-label={
                        unlimited ? 'Unlimited lives' : `${livesLeft} of ${MAX_LIVES} lives left`
                    }
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        visibility: hasLives ? 'visible' : 'hidden',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E2D9',
                        borderRadius: '9999px',
                        padding: '8px 12px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                    }}
                >
                    {Array.from({ length: MAX_LIVES }, (_, i) => {
                        const isOff = !unlimited && i >= livesLeft;
                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isOff ? '#D4D0C5' : '#E5484D',
                                    transform: isOff ? 'scale(0.85)' : 'scale(1)',
                                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Progress Bar */}
            <div
                style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#EAE6DD',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: '#3B6AD9',
                        borderRadius: '9999px',
                        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                />
            </div>
        </header>
    );
};