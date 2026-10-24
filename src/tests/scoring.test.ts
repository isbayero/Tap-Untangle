import { describe, it, expect } from 'vitest';
import { calculateRoundScore } from '../features/game/scoring';

describe('Arrow Escape - Scoring System', () => {
    it('awards 3 stars for flawless and fast completion', () => {
        const breakdown = calculateRoundScore(10, 10, 0, 20, 5);
        expect(breakdown.stars).toBe(3);
        expect(breakdown.totalScore).toBeGreaterThan(1000);
    });

    it('deducts penalties for mistakes and drops star tier', () => {
        const perfect = calculateRoundScore(10, 10, 0, 30, 2);
        const flawed = calculateRoundScore(10, 12, 3, 30, 0);

        expect(flawed.totalScore).toBeLessThan(perfect.totalScore);
        expect(flawed.stars).toBe(1);
    });
});