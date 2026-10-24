import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    title?: string;
    /** When set, tapping the backdrop or pressing Escape closes the sheet. */
    onClose?: () => void;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
    useEffect(() => {
        if (!isOpen || !onClose) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="ae-modal" onClick={onClose}>
            <div
                className="ae-modal__sheet"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                {title && <h2 className="ae-modal__title">{title}</h2>}
                {children}
            </div>
        </div>
    );
};
