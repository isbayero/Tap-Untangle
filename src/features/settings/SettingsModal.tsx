import React, { useId, useState } from 'react';
import { PlayerProgress } from '../../types/gameTypes';

const BLUE = '#3B63D6';

interface SettingsModalProps {
    isOpen: boolean;
    progress: PlayerProgress;
    onUpdate: (updater: (p: PlayerProgress) => PlayerProgress) => void;
    onClose: () => void;
}

interface SettingRowProps {
    label: string;
    hint?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    isLast?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, hint, checked, onChange, isLast = false }) => {
    const id = useId();
    return (
        <label
            htmlFor={id}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                borderBottom: isLast ? 'none' : '1px solid #F0EDE6',
                cursor: 'pointer',
                userSelect: 'none',
            }}
        >
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#181B20' }}>{label}</span>
                {hint && <span style={{ fontSize: '0.78rem', color: '#767B84' }}>{hint}</span>}
            </span>
            <span style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px', flexShrink: 0 }}>
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: checked ? BLUE : '#CBD0D8',
                        borderRadius: '9999px',
                        transition: 'background-color 0.2s ease',
                    }}
                />
                <span
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: checked ? '23px' : '3px',
                        width: '22px',
                        height: '22px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.18)',
                        transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                />
            </span>
        </label>
    );
};

type InfoKind = 'privacy' | 'about' | null;

const INFO: Record<Exclude<InfoKind, null>, { title: string; body: string[] }> = {
    privacy: {
        title: 'Privacy Policy',
        body: [
            'Tap Untangle stores your progress, stars and settings only on this device.',
            'We do not collect personal information. If ads are shown, the ad provider may use its own identifiers under its own policy.',
            'Resetting progress from Settings erases all saved data.',
        ],
    },
    about: {
        title: 'About Game',
        body: [
            'Tap Untangle: Arrow Escape',
            'Version 1.0.4',
            'Free every arrow by tapping it in the right order. A wrong tap costs a life.',
        ],
    },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, progress, onUpdate, onClose }) => {
    const [info, setInfo] = useState<InfoKind>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    if (!isOpen) return null;

    const close = () => {
        setInfo(null);
        setConfirmReset(false);
        onClose();
    };

    const doReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    const linkRowStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid #F0EDE6',
        fontSize: '0.98rem',
        fontWeight: 600,
        color: '#181B20',
        textAlign: 'left',
        cursor: 'pointer',
    };

    const chevron = (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#686E78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8E5DC',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 110,
                backgroundColor: '#F5F3EB',
                color: '#181B20',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                paddingTop: 'calc(var(--safe-top, 0px) + 18px)',
                paddingBottom: 'calc(var(--safe-bottom, 0px) + 24px)',
                fontFamily: 'var(--font-main, system-ui, -apple-system, sans-serif)',
                overflowY: 'auto',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={close}
                        aria-label="Back"
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E2D9',
                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#181B20',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Settings</h2>
                    <div style={{ width: '38px' }} />
                </div>

                {/* Preferences */}
                <div style={cardStyle}>
                    <SettingRow
                        label="Sound Effects"
                        checked={progress.soundEnabled}
                        onChange={(next) => onUpdate((p) => ({ ...p, soundEnabled: next }))}
                    />
                    <SettingRow
                        label="Haptic Feedback"
                        checked={progress.hapticsEnabled}
                        onChange={(next) => onUpdate((p) => ({ ...p, hapticsEnabled: next }))}
                    />
                    <SettingRow
                        label="Background Music"
                        checked={progress.musicEnabled ?? false}
                        onChange={(next) => onUpdate((p) => ({ ...p, musicEnabled: next }))}
                    />
                    <SettingRow
                        label="Reduce Motion"
                        hint="Turns off shake, sparks and UI animations"
                        checked={progress.reduceMotion ?? false}
                        onChange={(next) => onUpdate((p) => ({ ...p, reduceMotion: next }))}
                        isLast
                    />
                </div>

                {/* Info & actions */}
                <div style={cardStyle}>
                    <button type="button" onClick={() => setInfo('privacy')} style={linkRowStyle}>
                        <span>Privacy Policy</span>
                        {chevron}
                    </button>
                    <button type="button" onClick={() => setInfo('about')} style={linkRowStyle}>
                        <span>About Game</span>
                        {chevron}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        style={{ ...linkRowStyle, borderBottom: 'none', color: '#D93B4E' }}
                    >
                        <span>Reset Progress</span>
                    </button>
                </div>

                <div style={{ marginTop: 'auto', fontSize: '0.82rem', fontWeight: 500, color: '#767B84', textAlign: 'center' }}>
                    Version 1.0.4
                </div>
            </div>

            {/* Info sheet */}
            {info && (
                <div
                    onClick={() => setInfo(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 120,
                        backgroundColor: 'rgba(24, 27, 32, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '340px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '22px',
                            padding: '24px',
                            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                        }}
                    >
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800 }}>{INFO[info].title}</h3>
                        {INFO[info].body.map((line, i) => (
                            <p key={i} style={{ margin: '0 0 10px 0', fontSize: '0.92rem', lineHeight: 1.5, color: '#484D56' }}>
                                {line}
                            </p>
                        ))}
                        <button
                            onClick={() => setInfo(null)}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                height: '48px',
                                backgroundColor: BLUE,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Reset confirmation */}
            {confirmReset && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 120,
                        backgroundColor: 'rgba(24, 27, 32, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '340px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '22px',
                            padding: '24px',
                            textAlign: 'center',
                            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                        }}
                    >
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800 }}>Reset everything?</h3>
                        <p style={{ margin: '0 0 18px 0', fontSize: '0.92rem', lineHeight: 1.5, color: '#484D56' }}>
                            This erases your level, stars, achievements and settings. It can't be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setConfirmReset(false)}
                                style={{
                                    flex: 1,
                                    height: '48px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#181B20',
                                    border: '1px solid #E2DFD7',
                                    borderRadius: '14px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={doReset}
                                style={{
                                    flex: 1,
                                    height: '48px',
                                    backgroundColor: '#D93B4E',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};