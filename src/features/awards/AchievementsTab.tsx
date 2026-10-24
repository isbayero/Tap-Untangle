import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { PlayerProgress } from '../../types/gameTypes';
import { ACHIEVEMENTS, getStats } from './achievementData';

const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';
const COLORS = { green: '#1E9E57', blue: '#3B63D6', orange: '#F47B20', charcoal: '#1F2326' };

interface Props {
    progress: PlayerProgress;
    onBack: () => void;
}

export const AchievementsTab: React.FC<Props> = ({ progress, onBack }) => {
    const stats = getStats(progress);
    const unlocked = ACHIEVEMENTS.filter((a) => a.value(stats) >= a.target).length;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: CREAM,
                boxSizing: 'border-box',
                padding: '0 16px 90px 16px',
                paddingTop: 'calc(var(--safe-top, 0px) + 12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <button
                        onClick={onBack}
                        aria-label="Back"
                        style={{
                            width: 42, height: 42, borderRadius: '50%', backgroundColor: '#FFF',
                            border: '1px solid #E5E2D9', color: CHARCOAL, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: CHARCOAL }}>Achievements</h2>
                    <div style={{ width: 42 }} />
                </div>

                <div
                    style={{
                        flexShrink: 0, backgroundColor: '#FFF', border: '1px solid #E5E2D9',
                        borderRadius: 16, padding: '12px 14px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5A606A' }}>Unlocked</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: CHARCOAL }}>
                        {unlocked}/{ACHIEVEMENTS.length}
                    </span>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ACHIEVEMENTS.map((a) => {
                        const raw = a.value(stats);
                        const value = Math.min(raw, a.target);
                        const done = raw >= a.target;
                        const color = COLORS[a.color];
                        return (
                            <div
                                key={a.id}
                                style={{
                                    backgroundColor: '#FFF', border: '1px solid #E5E2D9', borderRadius: 16,
                                    padding: 14, display: 'flex', gap: 12, alignItems: 'center',
                                    opacity: done ? 1 : 0.95,
                                }}
                            >
                                <div
                                    style={{
                                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                                        backgroundColor: done ? color : '#ECE9E0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', filter: done ? 'none' : 'grayscale(1)',
                                    }}
                                >
                                    {a.emoji}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: CHARCOAL }}>{a.title}</span>
                                        {done && <Check size={18} color={color} strokeWidth={3} />}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#5A606A', margin: '2px 0 8px' }}>{a.description}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1, height: 7, borderRadius: 9999, backgroundColor: '#ECE9E0', overflow: 'hidden' }}>
                                            <div style={{ width: `${(value / a.target) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 9999 }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A606A' }}>
                                            {value}/{a.target}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};