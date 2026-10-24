import React from 'react';
import { Award, Gamepad2, Settings, HelpCircle, Info, ShieldCheck, UserCheck, Ban, ChevronRight } from 'lucide-react';

interface MeTabProps {
    onOpenSettings: () => void;
    onOpenAchievements: () => void;
    onOpenAwards: () => void;
}


export const MeTab: React.FC<MeTabProps> = ({ onOpenSettings, onOpenAchievements, onOpenAwards }) => {
    const menuSections = [
        {
            items: [
                { label: 'Awards', icon: <Award size={20} color="#3B63D6" />, onClick: onOpenAwards },
                { label: 'Achievements', icon: <Gamepad2 size={20} color="#1E9E57" />, onClick: onOpenAchievements },
            ],
        },
        {
            items: [
                { label: 'Settings', icon: <Settings size={20} color="#3B63D6" />, onClick: onOpenSettings },
            ],
        },
        {
            items: [
                { label: 'Help', icon: <HelpCircle size={20} color="#1E9E57" />, onClick: () => { } },
                { label: 'About Game', icon: <Info size={20} color="#3B63D6" />, onClick: () => { } },
                { label: 'Privacy Rights', icon: <ShieldCheck size={20} color="#7C3AED" />, onClick: () => { } },
                { label: 'Privacy Preferences', icon: <UserCheck size={20} color="#06B6D4" />, onClick: () => { } },
            ],
        },
        {
            items: [
                { label: 'Remove Ads', icon: <Ban size={20} color="#EF4444" />, onClick: () => { } },
            ],
        },
    ];

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#F5F3EB',
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '90px',
                overflowY: 'auto',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            {/* Top Title Bar */}
            <div
                style={{
                    padding: '20px 20px 12px 20px',
                    paddingTop: 'calc(var(--safe-top, 0px) + 20px)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#181B20',
                }}
            >
                Profile & Settings
            </div>

            {/* Menu Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 16px' }}>
                {menuSections.map((section, sIdx) => (
                    <div
                        key={sIdx}
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '16px',
                            border: '1px solid #E5E2D9',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                            overflow: 'hidden',
                        }}
                    >
                        {section.items.map((item, iIdx) => (
                            <button
                                key={iIdx}
                                onClick={item.onClick}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 18px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: iIdx < section.items.length - 1 ? '1px solid #F0EDE6' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8F6F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {item.icon}
                                    </div>
                                    <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#181B20' }}>
                                        {item.label}
                                    </span>
                                </div>
                                <ChevronRight size={18} color="#8A909A" />
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};