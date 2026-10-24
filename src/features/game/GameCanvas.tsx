import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from './gameEngine';

interface GameCanvasProps {
    engine: GameEngine;
    onPieceTap: (pieceId: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onPieceTap }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const animFrameId = useRef<number | null>(null);

    const pad = 12;

    // Handle pointer down / hit detection
    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);

            const dpr = window.devicePixelRatio || 1;
            const effectiveCellSize = Math.floor(
                (canvas.width / dpr - pad * 2) / engine.config.cols
            );

            const col = Math.floor((x / dpr - pad) / effectiveCellSize);
            const row = Math.floor((y / dpr - pad) / effectiveCellSize);

            if (
                row >= 0 &&
                col >= 0 &&
                row < engine.config.rows &&
                col < engine.config.cols
            ) {
                const pieceId = engine.grid[row][col];
                if (pieceId !== -1) {
                    onPieceTap(pieceId);
                }
            }
        },
        [engine, onPieceTap, pad]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Responsive Canvas Resize matching Image design specifications
        const updateSize = () => {
            const containerWidth = container.clientWidth || 340;
            const containerHeight = Math.min(window.innerHeight * 0.58, 480);

            // Fit tightly inside both width and height constraints
            const cellByW = Math.floor((containerWidth - pad * 2) / engine.config.cols);
            const cellByH = Math.floor((containerHeight - pad * 2) / engine.config.rows);
            const cellSize = Math.max(20, Math.min(cellByW, cellByH));

            const w = cellSize * engine.config.cols + pad * 2;
            const h = cellSize * engine.config.rows + pad * 2;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        // Frame Loop
        const renderLoop = (now: number) => {
            const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
            lastTimeRef.current = now;

            engine.update(now, dt);

            const dpr = window.devicePixelRatio || 1;
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;
            const cellSize = Math.floor((w - pad * 2) / engine.config.cols);

            engine.render(ctx, w, h, cellSize, pad, now);

            animFrameId.current = requestAnimationFrame(renderLoop);
        };

        animFrameId.current = requestAnimationFrame(renderLoop);

        return () => {
            if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
            window.removeEventListener('resize', updateSize);
        };
    }, [engine, pad]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
            }}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                style={{
                    display: 'block',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E2D9',
                    borderRadius: '20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
                    touchAction: 'none',
                }}
            />
        </div>
    );
};