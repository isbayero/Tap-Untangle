import React, { useEffect, useMemo, useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { GameMode, RoundResult } from '../../types/gameTypes';
import { useGame } from '../../hooks/useGame';
import { GameHeader } from '../../components/GameHeader';
import { GameCanvas } from './GameCanvas';

interface GameScreenProps {
    level: number;
    mode: GameMode;
    reviveToken?: number;
    onExit: () => void;
    onFinished: (result: RoundResult) => void;
    onRestart?: () => void;
    onOpenPause: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
    level,
    mode,
    reviveToken = 0,
    onFinished,
    onOpenPause,
    onRestart,
}) => {
    const {
        engine,
        lives,
        combo,
        elapsedSeconds,
        handlePieceTap,
        requestHint,
        restart,
        revive,
    } = useGame(level, mode, onFinished);

    const initialTotalPieces = useMemo(
        () => engine.config.pieces.length,
        [engine.config.pieces.length]
    );
    const clearedCount = initialTotalPieces - engine.remainingPieces.length;

    const [showCombo, setShowCombo] = useState(false);
    useEffect(() => {
        if (combo < 2) {
            setShowCombo(false);
            return;
        }
        setShowCombo(true);
        const t = setTimeout(() => setShowCombo(false), 1200);
        return () => clearTimeout(t);
    }, [combo]);

    useEffect(() => {
        if (reviveToken > 0) revive();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviveToken]);

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
                lives={lives}
                elapsedSeconds={elapsedSeconds}
                clearedCount={clearedCount}
                totalCount={initialTotalPieces}
                onPause={onOpenPause}
            />

            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    position: 'relative',
                }}
            >
                <div
                    aria-live="polite"
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        backgroundColor: '#3B6AD9',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(59, 106, 217, 0.3)',
                        opacity: showCombo ? 1 : 0,
                        transform: showCombo ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.9)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        pointerEvents: 'none',
                        zIndex: 5,
                    }}
                >
                    ×{combo} Combo!
                </div>

                <GameCanvas engine={engine} onPieceTap={handlePieceTap} />
            </main>

            <footer
                style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    maxWidth: '380px',
                }}
            >
                <button
                    onClick={requestHint}
                    style={{
                        flex: 1,
                        height: '50px',
                        backgroundColor: '#FFFFFF',
                        color: '#181B20',
                        borderRadius: '14px',
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        border: '1px solid #E5E2D9',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
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
                    <Lightbulb size={18} strokeWidth={2} aria-hidden />
                    Hint
                </button>

                <button
                    onClick={() => { restart(); onRestart?.(); }} style={{
                        flex: 1,
                        height: '50px',
                        backgroundColor: '#FFFFFF',
                        color: '#181B20',
                        borderRadius: '14px',
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        border: '1px solid #E5E2D9',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
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
                    <RotateCcw size={18} strokeWidth={2} aria-hidden />
                    Restart
                </button>
            </footer>
        </div>
    );
};