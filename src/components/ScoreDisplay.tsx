import React from 'react';

interface ScoreDisplayProps {
    label: string;
    value: string | number;
    highlight?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
    label,
    value,
    highlight = false,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: highlight ? 'rgba(59, 106, 217, 0.08)' : '#FFFFFF',
                border: `1px solid ${highlight ? '#3B6AD9' : '#E5E2D9'}`,
                padding: '6px 12px',
                borderRadius: '12px',
                minWidth: '64px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
        >
            <span
                style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#686E78',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    color: highlight ? '#3B6AD9' : '#181B20',
                }}
            >
                {value}
            </span>
        </div>
    );
};