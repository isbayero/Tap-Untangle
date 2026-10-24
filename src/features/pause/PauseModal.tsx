import React from 'react';

interface PauseModalProps {
    isOpen: boolean;
    onResume: () => void;
    onRestart: () => void;
    onQuit: () => void;
    onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
    isOpen,
    onResume,
    onRestart,
    onQuit,
    onOpenSettings,
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                backgroundColor: 'rgba(245, 243, 235, 0.85)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            <div
                className="animate-pop-in"
                style={{
                    width: '100%',
                    maxWidth: '340px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    border: '1px solid #E5E2D9',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                {/* Title */}
                <h2
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#181B20',
                        letterSpacing: '-0.02em',
                        margin: '0 0 22px 0',
                    }}
                >
                    PAUSED
                </h2>

                {/* Action Controls Card List */}
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    {/* Resume Button (Primary Solid Blue) */}
                    <button
                        onClick={onResume}
                        style={{
                            width: '100%',
                            height: '52px',
                            backgroundColor: '#3B6AD9',
                            color: '#FFFFFF',
                            borderRadius: '14px',
                            fontSize: '1.02rem',
                            fontWeight: 600,
                            border: 'none',
                            boxShadow: '0 6px 16px rgba(59, 106, 217, 0.28)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Resume
                    </button>

                    {/* Restart Level Button (Secondary White Card with Subtle Border) */}
                    <button
                        onClick={onRestart}
                        style={{
                            width: '100%',
                            height: '52px',
                            backgroundColor: '#FFFFFF',
                            color: '#181B20',
                            borderRadius: '14px',
                            fontSize: '1.02rem',
                            fontWeight: 600,
                            border: '1px solid #E2DFD7',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Restart Level
                    </button>

                    {/* Settings Button (Placeholder / Action) */}
                    <button
                        onClick={onOpenSettings}
                        style={{
                            width: '100%',
                            height: '52px',
                            backgroundColor: '#FFFFFF',
                            color: '#181B20',
                            borderRadius: '14px',
                            fontSize: '1.02rem',
                            fontWeight: 600,
                            border: '1px solid #E2DFD7',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                        onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Settings
                    </button>

                    {/* Exit to Home / Main Menu (Underlined text link) */}
                    <button
                        onClick={onQuit}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#5A606A',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                            marginTop: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        Exit to Home
                    </button>
                </div>
            </div>
        </div>
    );
};