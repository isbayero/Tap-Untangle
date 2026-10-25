import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Lock, Check, Play, Star, Target, Film } from 'lucide-react';
import { GameMode, PlayerProgress } from '../../types/gameTypes';

// Palette sampled from the app icon
const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';
const GREEN = '#1E9E57';
const BLUE = '#3B63D6';
const ORANGE = '#F47B20';
const GOLD = '#F59E0B';
const DANGER = '#D93B4E';

interface DailyTabProps {
    onBack: () => void;
    onStartLevel: (mode: GameMode, level: number) => void;
    progress: PlayerProgress;
    cooldownSecondsLeft?: number;
    onWatchAdRefill?: () => Promise<boolean>;
}

const TOTAL_LEVELS = 300;

// Ladder geometry
const ROW_H = 92;
const TOP_PAD = 44;
const LADDER_W = 300;
const AMP = 64;
const OFFSETS = [0, 1, 0, -1];

const xFor = (i: number) => LADDER_W / 2 + OFFSETS[i % OFFSETS.length] * AMP;
const yFor = (i: number) => TOP_PAD + i * ROW_H;

/** Smooth S-curve through the centers of nodes `from`..`to` */
const buildPath = (from: number, to: number): string => {
    let d = `M ${xFor(from)} ${yFor(from)}`;
    for (let i = from; i < to; i++) {
        const x1 = xFor(i);
        const y1 = yFor(i);
        const x2 = xFor(i + 1);
        const y2 = yFor(i + 1);
        const my = (y1 + y2) / 2;
        d += ` C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
    }
    return d;
};

export const DailyTab: React.FC<DailyTabProps> = ({
    onBack,
    onStartLevel,
    progress,
    cooldownSecondsLeft = 0,
    onWatchAdRefill,
}) => {
    // Untangle is the primary mode on the ladder
    const [ladderMode, setLadderMode] = useState<'untangle' | 'campaign'>('untangle');
    const [adLoading, setAdLoading] = useState(false);

    const isUntangle = ladderMode === 'untangle';
    const currentUnlockedLevel = isUntangle
        ? (progress.untangleLevel ?? 1)
        : (progress.currentLevel ?? 1);
    const activeStats = isUntangle
        ? (progress.untangleStats ?? {})
        : (progress.campaignStats ?? {});

    // Compute stars for the currently viewed mode
    const modeStars = useMemo(() => {
        return Object.values(activeStats).reduce((sum, s) => sum + (s?.stars ?? 0), 0);
    }, [activeStats]);

    const currentIdx = Math.min(Math.max(currentUnlockedLevel - 1, 0), TOTAL_LEVELS - 1);

    const [selectedLevel, setSelectedLevel] = useState<number>(currentUnlockedLevel);
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setSelectedLevel(currentUnlockedLevel);
    }, [currentUnlockedLevel, ladderMode]);

    const scrollToCurrent = useCallback(
        (smooth: boolean) => {
            const el = scrollerRef.current;
            if (!el) return;
            el.scrollTo({
                top: Math.max(0, yFor(currentIdx) - el.clientHeight / 2),
                behavior: smooth ? 'smooth' : 'auto',
            });
        },
        [currentIdx]
    );

    useEffect(() => {
        scrollToCurrent(false);
    }, [scrollToCurrent, ladderMode]);

    const levels = useMemo(() => Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1), []);
    const donePath = useMemo(() => buildPath(0, currentIdx), [currentIdx]);
    const restPath = useMemo(() => buildPath(currentIdx, TOTAL_LEVELS - 1), [currentIdx]);

    const ladderHeight = TOP_PAD * 2 + (TOTAL_LEVELS - 1) * ROW_H;
    const progressPct = Math.min(
        100,
        (Math.max(0, currentUnlockedLevel - 1) / TOTAL_LEVELS) * 100
    );

    const selectedStats = activeStats[selectedLevel];
    const selectedStars = selectedStats?.stars ?? (selectedLevel < currentUnlockedLevel ? 3 : 0);
    const selectedCleared = !!selectedStats?.cleared || selectedLevel < currentUnlockedLevel;

    const isCoolingDown = cooldownSecondsLeft > 0;
    const mm = Math.floor(cooldownSecondsLeft / 60);
    const ss = String(cooldownSecondsLeft % 60).padStart(2, '0');

    const handlePrimaryAction = async () => {
        if (isCoolingDown) {
            if (!onWatchAdRefill || adLoading) return;
            setAdLoading(true);
            try {
                const ok = await onWatchAdRefill();
                if (ok) onStartLevel(ladderMode, selectedLevel);
            } finally {
                setAdLoading(false);
            }
            return;
        }
        onStartLevel(ladderMode, selectedLevel);
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: CREAM,
                display: 'flex',
                justifyContent: 'center',
                boxSizing: 'border-box',
                padding: '0 16px 90px 16px',
                paddingTop: 'calc(var(--safe-top, 0px) + 12px)',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            <style>{`
                @keyframes ladderPulse {
                    0%   { box-shadow: 0 0 0 0 rgba(59, 99, 214, 0.45); }
                    70%  { box-shadow: 0 0 0 14px rgba(59, 99, 214, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 99, 214, 0); }
                }
            `}</style>

            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={onBack}
                        aria-label="Back"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            color: CHARCOAL,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <ChevronLeft size={22} />
                    </button>

                    {/* Segmented Mode Toggle: Untangle (Main) vs Arrows */}
                    <div
                        style={{
                            display: 'flex',
                            backgroundColor: '#EAE6DD',
                            padding: '4px',
                            borderRadius: '9999px',
                            gap: '4px',
                        }}
                    >
                        <button
                            onClick={() => setLadderMode('untangle')}
                            style={{
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '6px 14px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: isUntangle ? '#FFFFFF' : 'transparent',
                                color: isUntangle ? CHARCOAL : '#686E78',
                                boxShadow: isUntangle ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Untangle
                        </button>
                        <button
                            onClick={() => setLadderMode('campaign')}
                            style={{
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '6px 14px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: !isUntangle ? '#FFFFFF' : 'transparent',
                                color: !isUntangle ? CHARCOAL : '#686E78',
                                boxShadow: !isUntangle ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Arrows
                        </button>
                    </div>

                    <button
                        onClick={() => scrollToCurrent(true)}
                        aria-label="Jump to current level"
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            color: BLUE,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <Target size={20} />
                    </button>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <div
                        style={{
                            flex: 1.4,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            borderRadius: '16px',
                            padding: '12px 14px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                                marginBottom: '8px',
                            }}
                        >
                            <span
                                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#5A606A' }}
                            >
                                {isUntangle ? 'Untangle Progress' : 'Arrows Progress'}
                            </span>
                            <span
                                style={{ fontSize: '0.9rem', fontWeight: 800, color: CHARCOAL }}
                            >
                                {currentUnlockedLevel}/{TOTAL_LEVELS}
                            </span>
                        </div>
                        <div
                            style={{
                                height: '8px',
                                borderRadius: '9999px',
                                backgroundColor: '#ECE9E0',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${progressPct}%`,
                                    height: '100%',
                                    backgroundColor: GREEN,
                                    borderRadius: '9999px',
                                    transition: 'width 0.4s ease',
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            borderRadius: '16px',
                            padding: '12px 14px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#5A606A' }}>
                            Stars
                        </span>
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: CHARCOAL,
                            }}
                        >
                            <Star size={14} fill={GOLD} color={GOLD} />
                            {modeStars}/{TOTAL_LEVELS * 3}
                        </span>
                    </div>
                </div>

                {/* Ladder card (only this part scrolls) */}
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '22px',
                        border: '1px solid #E5E2D9',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        ref={scrollerRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: `${LADDER_W}px`,
                                height: `${ladderHeight}px`,
                                flexShrink: 0,
                            }}
                        >
                            {/* Connecting path */}
                            <svg
                                width={LADDER_W}
                                height={ladderHeight}
                                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                                aria-hidden
                            >
                                <path
                                    d={restPath}
                                    fill="none"
                                    stroke="#DAD6CA"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    strokeDasharray="2 10"
                                />
                                {currentIdx > 0 && (
                                    <path
                                        d={donePath}
                                        fill="none"
                                        stroke={GREEN}
                                        strokeWidth={5}
                                        strokeLinecap="round"
                                    />
                                )}
                            </svg>

                            {/* Level nodes */}
                            {levels.map((lvl, idx) => {
                                const stats = activeStats[lvl];
                                const isCompleted =
                                    !!stats?.cleared || lvl < currentUnlockedLevel;
                                const isCurrent = lvl === currentUnlockedLevel;
                                const isUnlocked = lvl <= currentUnlockedLevel;
                                const isSelected = lvl === selectedLevel;
                                const isMilestone = lvl % 5 === 0;
                                const stars = stats?.stars ?? (isCompleted ? 3 : 0);
                                const size = isMilestone ? 64 : 54;

                                let bg = '#ECE9E0';
                                let fg = '#A0A5B1';
                                let border = '2px solid #E0DCD0';
                                if (isCompleted) {
                                    bg = GREEN;
                                    fg = '#FFFFFF';
                                    border = `2px solid ${GREEN}`;
                                } else if (isCurrent) {
                                    bg = BLUE;
                                    fg = '#FFFFFF';
                                    border = `2px solid ${BLUE}`;
                                }
                                if (isMilestone && !isCompleted && !isCurrent) {
                                    border = `2px solid ${ORANGE}`;
                                    if (isUnlocked) fg = CHARCOAL;
                                }

                                return (
                                    <React.Fragment key={lvl}>
                                        <button
                                            disabled={!isUnlocked}
                                            onClick={() => setSelectedLevel(lvl)}
                                            aria-label={
                                                isUnlocked ? `Level ${lvl}` : `Level ${lvl} locked`
                                            }
                                            style={{
                                                position: 'absolute',
                                                left: `${xFor(idx) - size / 2}px`,
                                                top: `${yFor(idx) - size / 2}px`,
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                borderRadius: isMilestone ? '18px' : '50%',
                                                backgroundColor: bg,
                                                color: fg,
                                                border,
                                                boxShadow: isSelected
                                                    ? `0 0 0 3px #FFFFFF, 0 0 0 6px ${CHARCOAL}`
                                                    : '0 3px 8px rgba(0, 0, 0, 0.08)',
                                                animation: isCurrent
                                                    ? 'ladderPulse 1.8s ease-out infinite'
                                                    : 'none',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: isUnlocked ? 'pointer' : 'default',
                                                padding: 0,
                                                zIndex: 1,
                                            }}
                                        >
                                            {!isUnlocked ? (
                                                <Lock size={18} strokeWidth={2.2} />
                                            ) : (
                                                <>
                                                    <span
                                                        style={{
                                                            fontSize: isMilestone
                                                                ? '1.1rem'
                                                                : '1rem',
                                                            fontWeight: 800,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {lvl}
                                                    </span>
                                                    {isCompleted && (
                                                        <Check
                                                            size={12}
                                                            strokeWidth={3.5}
                                                            style={{ marginTop: '2px' }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </button>

                                        {isCompleted && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${xFor(idx) - 19}px`,
                                                    top: `${yFor(idx) + size / 2 + 5}px`,
                                                    width: '38px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    gap: '2px',
                                                    zIndex: 2,
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                {[1, 2, 3].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={11}
                                                        fill={s <= stars ? GOLD : '#E5E2D9'}
                                                        color={s <= stars ? GOLD : '#E5E2D9'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom action bar */}
                <div style={{ flexShrink: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 4px 8px 4px',
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: CHARCOAL }}>
                            {isUntangle ? 'Untangle' : 'Arrows'} · Level {selectedLevel}
                        </span>
                        {selectedCleared ? (
                            <span style={{ display: 'flex', gap: '3px' }}>
                                {[1, 2, 3].map((s) => (
                                    <Star
                                        key={s}
                                        size={15}
                                        fill={s <= selectedStars ? GOLD : '#E5E2D9'}
                                        color={s <= selectedStars ? GOLD : '#E5E2D9'}
                                    />
                                ))}
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: ORANGE }}>
                                Not cleared yet
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handlePrimaryAction}
                        disabled={isCoolingDown && (!onWatchAdRefill || adLoading)}
                        style={{
                            width: '100%',
                            height: '58px',
                            backgroundColor: isCoolingDown ? DANGER : BLUE,
                            color: '#FFFFFF',
                            borderRadius: '18px',
                            border: 'none',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            boxShadow: isCoolingDown
                                ? '0 8px 20px rgba(217, 59, 78, 0.3)'
                                : '0 8px 20px rgba(59, 99, 214, 0.35)',
                            cursor:
                                isCoolingDown && !onWatchAdRefill ? 'not-allowed' : 'pointer',
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
                        {isCoolingDown ? (
                            <>
                                <Film size={20} />
                                {adLoading
                                    ? 'Loading Ad…'
                                    : `Watch Ad to Play Now (or wait ${mm}:${ss})`}
                            </>
                        ) : (
                            <>
                                <Play size={20} fill="#FFFFFF" />
                                Play Level {selectedLevel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};