import React from 'react';
import { Home, User, WavesLadder } from 'lucide-react';

export type TabType = 'main' | 'daily' | 'me';

interface BottomNavProps {
    currentTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'main', label: 'Main', icon: <Home size={22} strokeWidth={2} /> },
        { id: 'daily', label: 'Levels', icon: <WavesLadder size={22} strokeWidth={2} /> },
        { id: 'me', label: 'Me', icon: <User size={22} strokeWidth={2} /> },
    ];

    return (
        <nav
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(65px + var(--safe-bottom, 0px))',
                paddingBottom: 'var(--safe-bottom, 0px)',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #EAE6DD',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 50,
            }}
        >
            {tabs.map((t) => {
                const isActive = currentTab === t.id;
                return (
                    <button
                        key={t.id}
                        onClick={() => onTabChange(t.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            color: isActive ? '#3B6AD9' : '#8A909A',
                            cursor: 'pointer',
                            flex: 1,
                            padding: '8px 0',
                        }}
                    >
                        {t.icon}
                        <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500 }}>
                            {t.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};