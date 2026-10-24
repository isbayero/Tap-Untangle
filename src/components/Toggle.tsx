import React from 'react';

interface ToggleProps {
    id?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ id, checked, onChange }) => (
    <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="ae-toggle"
        onClick={() => onChange(!checked)}
    />
);
