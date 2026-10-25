import React, { useEffect, useState } from 'react';

const CREAM = '#F5F3EB';
const CHARCOAL = '#1F2326';
const GREEN = '#1E9E57';
const BLUE = '#3B63D6';
const ORANGE = '#F47B20';

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const [fadingOut, setFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadingOut(true);
            const finishTimer = setTimeout(onFinish, 400);
            return () => clearTimeout(finishTimer);
        }, 1800);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: CREAM,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: fadingOut ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
            }}
        >
            <style>{`
                @keyframes pulseLogo {
                    0% { transform: scale(0.94); opacity: 0.85; }
                    50% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes barWave {
                    0%, 100% { transform: scaleY(1); opacity: 0.6; }
                    50% { transform: scaleY(1.7); opacity: 1; }
                }
            `}</style>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'pulseLogo 1.4s ease-out infinite alternate',
                }}
            >
                {/* App Icon */}
                <div
                    style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(31, 35, 38, 0.15)',
                        marginBottom: '20px',
                    }}
                >
                    <img
                        src="/icon.png"
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <h1
                    style={{
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        color: CHARCOAL,
                        letterSpacing: '-0.02em',
                        margin: '0 0 14px 0',
                    }}
                >
                    Tap Untangle
                </h1>

                {/* Animated Color Bars Loading Indicator */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '18px' }}>
                    {[CHARCOAL, GREEN, BLUE, ORANGE].map((c, index) => (
                        <span
                            key={c}
                            style={{
                                width: '22px',
                                height: '5px',
                                borderRadius: '9999px',
                                backgroundColor: c,
                                display: 'inline-block',
                                animation: `barWave 1s ease-in-out infinite`,
                                animationDelay: `${index * 0.15}s`,
                                transformOrigin: 'center',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};