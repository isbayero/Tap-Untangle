import React from 'react';
import { ChevronLeft, Lock, Trophy, Medal } from 'lucide-react';
import { PlayerProgress } from '../../types/gameTypes';
import { AWARDS, TIER_COLORS, getStats } from './achievementData';

const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';

interface Props {
    progress: PlayerProgress;
    onBack: () => void;
}

export const AwardsTab: React.FC<Props> = ({ progress, onBack }) => {
    const stats = getStats(progress);
    const earned = AWARDS.filter((a) => a.value(stats) >= a.target).length;

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
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: CHARCOAL }}>Awards</h2>
                    <div style={{ width: 42 }} />
                </div>

                <div
                    style={{
                        flexShrink: 0, backgroundColor: '#FFF', border: '1px solid #E5E2D9',
                        borderRadius: 16, padding: '12px 14px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5A606A' }}>Earned</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: CHARCOAL }}>
                        {earned}/{AWARDS.length}
                    </span>
                </div>

                <div
                    style={{
                        flex: 1, minHeight: 0, overflowY: 'auto',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start',
                    }}
                >
                    {AWARDS.map((a) => {
                        const raw = a.value(stats);
                        const done = raw >= a.target;
                        const c = TIER_COLORS[a.tier];
                        const Icon = a.id.startsWith('m-') ? Medal : Trophy;
                        return (
                            <div
                                key={a.id}
                                style={{
                                    backgroundColor: '#FFF', border: '1px solid #E5E2D9', borderRadius: 18,
                                    padding: '16px 10px 14px', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', textAlign: 'center', gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        width: 72, height: 72, borderRadius: '50%',
                                        background: done ? `linear-gradient(145deg, ${c.from}, ${c.to})` : '#ECE9E0',
                                        border: `3px solid ${done ? c.ring : '#E0DCD0'}`,
                                        boxShadow: done ? `0 8px 18px ${c.to}55` : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {done ? (
                                        <Icon size={32} color="#FFFFFF" strokeWidth={2} />
                                    ) : (
                                        <Lock size={24} color="#A0A5B1" />
                                    )}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: CHARCOAL }}>{a.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#5A606A' }}>{a.requirement}</div>
                                {!done && (
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F47B20' }}>
                                        {raw}/{a.target}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};