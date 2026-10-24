import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'secondary',
    size = 'md',
    fullWidth = false,
    children,
    ...rest
}) => (
    <button
        type="button"
        className={`ae-btn ae-btn--${variant} ae-btn--${size}${fullWidth ? ' ae-btn--full' : ''}`}
        {...rest}
    >
        {children}
    </button>
);
