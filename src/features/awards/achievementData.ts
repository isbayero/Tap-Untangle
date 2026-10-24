import { PlayerProgress } from '../../types/gameTypes';

export interface Stats {
    levelReached: number;
    levelsCleared: number;
    totalStars: number;
    threeStarLevels: number;
}

export function getStats(progress: PlayerProgress): Stats {
    const cs = progress.campaignStats ?? {};
    const entries = Object.entries(cs) as [string, { cleared?: boolean; stars?: number }][];
    const cleared = entries.filter(([, s]) => s?.cleared).length;
    // Levels below currentLevel count as cleared even if stats are missing
    const levelsCleared = Math.max(cleared, Math.max(0, progress.currentLevel - 1));
    return {
        levelReached: progress.currentLevel,
        levelsCleared,
        totalStars: progress.totalStars ?? 0,
        threeStarLevels: entries.filter(([, s]) => (s?.stars ?? 0) >= 3).length,
    };
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: 'green' | 'blue' | 'orange' | 'charcoal';
    target: number;
    value: (s: Stats) => number;
}

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first', title: 'First Untangle', description: 'Clear your first level', emoji: '🎯', color: 'green', target: 1, value: (s) => s.levelsCleared },
    { id: 'c10', title: 'Getting Warm', description: 'Clear 10 levels', emoji: '🔥', color: 'orange', target: 10, value: (s) => s.levelsCleared },
    { id: 'c25', title: 'Puzzle Regular', description: 'Clear 25 levels', emoji: '🧩', color: 'blue', target: 25, value: (s) => s.levelsCleared },
    { id: 'c50', title: 'Knot Breaker', description: 'Clear 50 levels', emoji: '🪢', color: 'green', target: 50, value: (s) => s.levelsCleared },
    { id: 'c100', title: 'Mastermind', description: 'Clear 100 levels', emoji: '🧠', color: 'charcoal', target: 100, value: (s) => s.levelsCleared },
    { id: 's30', title: 'Star Collector', description: 'Earn 30 stars', emoji: '⭐', color: 'orange', target: 30, value: (s) => s.totalStars },
    { id: 's150', title: 'Constellation', description: 'Earn 150 stars', emoji: '🌟', color: 'blue', target: 150, value: (s) => s.totalStars },
    { id: 'p10', title: 'Flawless x10', description: 'Get 3 stars on 10 levels', emoji: '💎', color: 'green', target: 10, value: (s) => s.threeStarLevels },
    { id: 'p50', title: 'Perfectionist', description: 'Get 3 stars on 50 levels', emoji: '👑', color: 'charcoal', target: 50, value: (s) => s.threeStarLevels },
];

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Award {
    id: string;
    tier: Tier;
    title: string;
    requirement: string;
    target: number;
    value: (s: Stats) => number;
}

export const AWARDS: Award[] = [
    { id: 'a-bronze', tier: 'Bronze', title: 'Bronze Trophy', requirement: 'Earn 15 stars', target: 15, value: (s) => s.totalStars },
    { id: 'a-silver', tier: 'Silver', title: 'Silver Trophy', requirement: 'Earn 60 stars', target: 60, value: (s) => s.totalStars },
    { id: 'a-gold', tier: 'Gold', title: 'Gold Trophy', requirement: 'Earn 200 stars', target: 200, value: (s) => s.totalStars },
    { id: 'a-plat', tier: 'Platinum', title: 'Platinum Trophy', requirement: 'Earn 500 stars', target: 500, value: (s) => s.totalStars },
    { id: 'm-25', tier: 'Bronze', title: 'Level 25 Medal', requirement: 'Reach level 25', target: 25, value: (s) => s.levelReached },
    { id: 'm-75', tier: 'Silver', title: 'Level 75 Medal', requirement: 'Reach level 75', target: 75, value: (s) => s.levelReached },
    { id: 'm-150', tier: 'Gold', title: 'Level 150 Medal', requirement: 'Reach level 150', target: 150, value: (s) => s.levelReached },
    { id: 'm-300', tier: 'Platinum', title: 'Level 300 Medal', requirement: 'Reach level 300', target: 300, value: (s) => s.levelReached },
];

export const TIER_COLORS: Record<Tier, { from: string; to: string; ring: string }> = {
    Bronze: { from: '#F5A25D', to: '#C4702B', ring: '#A85A1E' },
    Silver: { from: '#E4E7EC', to: '#A3AAB5', ring: '#8A929E' },
    Gold: { from: '#FFD66B', to: '#F59E0B', ring: '#C77F05' },
    Platinum: { from: '#9AD7F5', to: '#4C8FD6', ring: '#3A74B3' },
};