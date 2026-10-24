import { describe, it, expect, beforeEach } from 'vitest';
import {
    loadProgress,
    recordLevelCompletion,
} from '../services/storage';

describe('Arrow Escape - Persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('falls back to default structure on empty storage', () => {
        const p = loadProgress();
        expect(p.version).toBe(1);
        expect(p.currentLevel).toBe(1);
        expect(p.totalStars).toBe(0);
    });

    it('records level completion and accumulates stars', () => {
        const initial = loadProgress();
        const updated = recordLevelCompletion(initial, 1, 3, 1500, 25, 8, 4);

        expect(updated.currentLevel).toBe(2);
        expect(updated.totalStars).toBe(3);
        expect(updated.campaignStats[1].highScore).toBe(1500);

        // Ensure state persists in localStorage
        const retrieved = loadProgress();
        expect(retrieved.campaignStats[1].stars).toBe(3);
    });
});