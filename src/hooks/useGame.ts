
import { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, LevelConfig, RoundResult } from '../types/gameTypes';
import { GameEngine } from '../features/game/gameEngine';
import { generateSolvableLevel, solveLevel } from '../features/game/gameRules';
import { calculateRoundScore } from '../features/game/scoring';
import { sound } from '../services/audio';
import { haptics } from '../services/haptics';

export function useGame(
    levelNumber: number,
    mode: GameMode,
    onFinished: (result: RoundResult) => void
) {
    const [levelConfig, setLevelConfig] = useState<LevelConfig>(() =>
        generateSolvableLevel(levelNumber)
    );
    const [engine, setEngine] = useState<GameEngine>(() => new GameEngine(levelConfig));
    const [lives, setLives] = useState<number>(3);
    const [moves, setMoves] = useState<number>(0);
    const [mistakes, setMistakes] = useState<number>(0);
    const [combo, setCombo] = useState<number>(0);
    const [maxCombo, setMaxCombo] = useState<number>(0);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);

    const initialPieceCount = useRef<number>(levelConfig.pieces.length);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    const startNewGame = useCallback(
        (lvl: number) => {
            const cfg = generateSolvableLevel(lvl);
            setLevelConfig(cfg);
            setEngine(new GameEngine(cfg));
            setLives(mode === 'zen' ? Infinity : 3);
            setMoves(0);
            setMistakes(0);
            setCombo(0);
            setMaxCombo(0);
            setElapsedSeconds(0);
            setIsPaused(false);
            setIsCompleted(false);
            initialPieceCount.current = cfg.pieces.length;
        },
        [mode]
    );

    useEffect(() => {
        startNewGame(levelNumber);
    }, [levelNumber, startNewGame]);

    useEffect(() => {
        if (isPaused || isCompleted) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setElapsedSeconds((sec) => sec + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, isCompleted]);

    const handlePieceTap = useCallback(
        (pieceId: number) => {
            if (isPaused || isCompleted) return;

            const now = performance.now();
            const canEscape = engine.canPieceEscape(pieceId);
            const nextMoves = moves + 1;
            setMoves(nextMoves);

            if (canEscape) {
                const cleared = engine.clearPiece(pieceId, now);
                if (cleared) {
                    const nextCombo = combo + 1;
                    const updatedMaxCombo = Math.max(maxCombo, nextCombo);
                    setCombo(nextCombo);
                    setMaxCombo(updatedMaxCombo);

                    sound.playSlide(nextCombo);
                    void haptics.tap();

                    if (engine.remainingPieces.length === 0) {
                        setIsCompleted(true);
                        sound.playWin();
                        void haptics.success();

                        const breakdown = calculateRoundScore(
                            initialPieceCount.current,
                            nextMoves,
                            mistakes,
                            elapsedSeconds,
                            updatedMaxCombo
                        );

                        onFinishedRef.current({
                            cleared: true,
                            levelNumber,
                            score: breakdown.totalScore,
                            stars: breakdown.stars,
                            timeSpent: elapsedSeconds,
                            movesTaken: nextMoves,
                            mistakes,
                            maxCombo: updatedMaxCombo,
                            isNewHigh: true,
                        });
                    }
                }
            } else {
                // Blocked move
                engine.triggerShake(pieceId, now);
                setCombo(0);
                const nextMistakes = mistakes + 1;
                setMistakes(nextMistakes);

                sound.playBlocked();
                void haptics.error();

                if (mode !== 'zen') {
                    const nextLives = lives - 1;
                    setLives(nextLives);

                    if (nextLives <= 0) {
                        setIsCompleted(true);
                        onFinishedRef.current({
                            cleared: false,
                            levelNumber,
                            score: 0,
                            stars: 0,
                            timeSpent: elapsedSeconds,
                            movesTaken: nextMoves,
                            mistakes: nextMistakes,
                            maxCombo,
                            isNewHigh: false,
                        });
                    }
                }
            }
        },
        [
            engine,
            isPaused,
            isCompleted,
            combo,
            moves,
            mistakes,
            elapsedSeconds,
            maxCombo,
            mode,
            levelNumber,
            lives,
        ]
    );

    const requestHint = useCallback(() => {
        if (isPaused || isCompleted) return;
        const exitOrder = solveLevel(
            engine.config.rows,
            engine.config.cols,
            engine.remainingPieces
        );
        if (exitOrder && exitOrder.length > 0) {
            engine.setHint(exitOrder[0], performance.now());
            sound.playHint();
            void haptics.tap();
        }
    }, [engine, isPaused, isCompleted]);

    const revive = useCallback(() => {
        setLives(1);
        setIsCompleted(false); // re-enables taps and restarts the timer effect
        setCombo(0);
    }, []);

    return {
        engine,
        levelConfig,
        lives,
        moves,
        combo,
        elapsedSeconds,
        isPaused,
        setIsPaused,
        handlePieceTap,
        requestHint,
        revive,
        restart: () => startNewGame(levelNumber),
    };
}