export type Direction = 'U' | 'D' | 'L' | 'R';

export type Coord = [row: number, col: number];

export interface Piece {
    id: number;
    cells: Coord[];
    dir: Direction;
}

export interface SlidingPiece {
    piece: Piece;
    startTime: number;
    duration: number;
    color: string;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    size: number;
    life: number;
}

export interface LevelConfig {
    levelNumber: number;
    rows: number;
    cols: number;
    pieces: Piece[];
}

export type GameMode = 'campaign' | 'zen' | 'daily' | 'untangle';

export interface LevelStats {
    stars: number;
    highScore: number;
    bestTime: number; // in seconds
    cleared: boolean;
}

export const motion = { reduced: false };

export interface PlayerProgress {
    version: number;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    musicEnabled: boolean;
    reduceMotion: boolean;
    highContrast: boolean;
    currentLevel: number;
    totalStars: number;
    campaignStats: Record<number, LevelStats>;
    dailyCompletedDates: string[];
    totalClearedPieces: number;
    bestComboStreak: number;
    untangleLevel: number;
    untangleStats: Record<number, LevelStats>;
}

export interface RoundResult {
    cleared: boolean;
    levelNumber: number;
    score: number;
    stars: number;
    timeSpent: number;
    movesTaken: number;
    mistakes: number;
    maxCombo: number;
    isNewHigh: boolean;
}