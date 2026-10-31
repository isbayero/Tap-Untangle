import React, { useEffect, useRef } from 'react';
import { launchConfetti } from './confetti';

interface ConfettiCanvasProps {
    /** Rough number of pieces; scale this up for a perfect 3-star round. */
    particleCount?: number;
}

/**
 * Full-screen, non-interactive confetti layer. Mounting it fires the burst;
 * unmounting tears the animation loop down. Skipped entirely when the player
 * asks for reduced motion.
 */
export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ particleCount = 110 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;

        return launchConfetti(canvas, { particleCount });
    }, [particleCount]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 3,
            }}
        />
    );
};
