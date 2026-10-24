import { PlayerProgress, LevelStats } from '../types/gameTypes';

const STORAGE_KEY = 'ARROW_ESCAPE_PLAYER_PROGRESS_V1';

const DEFAULT_PROGRESS: PlayerProgress = {
    version: 1,
    soundEnabled: true,
    hapticsEnabled: true,
    highContrast: false,
    musicEnabled: false,
    reduceMotion: false,
    currentLevel: 1,
    totalStars: 0,
    campaignStats: {},
    dailyCompletedDates: [],
    totalClearedPieces: 0,
    bestComboStreak: 0,
};

export function loadProgress(): PlayerProgress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_PROGRESS };
        const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
        return {
            ...DEFAULT_PROGRESS,
            ...parsed,
            campaignStats: parsed.campaignStats ?? {},
            dailyCompletedDates: parsed.dailyCompletedDates ?? [],
        };
    } catch {
        return { ...DEFAULT_PROGRESS };
    }
}

export function saveProgress(progress: PlayerProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
        console.warn('Unable to persist game progress:', err);
    }
}

export function recordLevelCompletion(
    prev: PlayerProgress,
    level: number,
    stars: number,
    score: number,
    timeSpent: number,
    clearedPieces: number,
    maxStreak: number
): PlayerProgress {
    const existing: LevelStats = prev.campaignStats[level] || {
        stars: 0,
        highScore: 0,
        bestTime: 999999,
        cleared: false,
    };

    const newStars = Math.max(existing.stars, stars);
    const starsDiff = newStars - existing.stars;

    const updatedStats: LevelStats = {
        stars: newStars,
        highScore: Math.max(existing.highScore, score),
        bestTime: Math.min(existing.bestTime, timeSpent),
        cleared: true,
    };

    const updated: PlayerProgress = {
        ...prev,
        currentLevel: Math.max(prev.currentLevel, level + 1),
        totalStars: prev.totalStars + starsDiff,
        campaignStats: {
            ...prev.campaignStats,
            [level]: updatedStats,
        },
        totalClearedPieces: prev.totalClearedPieces + clearedPieces,
        bestComboStreak: Math.max(prev.bestComboStreak, maxStreak),
    };

    saveProgress(updated);
    return updated;
}