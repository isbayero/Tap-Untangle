import { describe, it, expect } from 'vitest';
import {
    DELTA,
    calculateGridParams,
    buildGrid,
    rayCells,
    canExit,
    solveLevel,
    generateSolvableLevel,
} from '../features/game/gameRules';
import { Piece } from '../types/gameTypes';

describe('Arrow Escape - Core Game Rules', () => {
    it('correctly maps direction unit vectors', () => {
        expect(DELTA.U).toEqual([-1, 0]);
        expect(DELTA.D).toEqual([1, 0]);
        expect(DELTA.L).toEqual([0, -1]);
        expect(DELTA.R).toEqual([0, 1]);
    });

    it('scales grid boundaries progressively with level difficulty', () => {
        const l1 = calculateGridParams(1);
        const l20 = calculateGridParams(20);

        expect(l1.cols).toBeLessThanOrEqual(l20.cols);
        expect(l1.rows).toBeLessThanOrEqual(l20.rows);
    });

    it('calculates exit runway ray cells correctly', () => {
        const testPiece: Piece = {
            id: 0,
            cells: [[2, 2]],
            dir: 'R',
        };
        const rays = rayCells(testPiece, 5, 5);
        expect(rays).toEqual([
            [2, 3],
            [2, 4],
        ]);
    });

    it('accurately identifies whether a piece is blocked or clear to exit', () => {
        const freePiece: Piece = { id: 0, cells: [[0, 0]], dir: 'R' };
        const blockerPiece: Piece = { id: 1, cells: [[0, 2]], dir: 'D' };

        const grid = buildGrid(3, 3, [freePiece, blockerPiece]);

        expect(canExit(freePiece, grid, 3, 3)).toBe(false);
        expect(canExit(blockerPiece, grid, 3, 3)).toBe(true);
    });

    it('solves a solvable piece arrangement deterministically', () => {
        const p1: Piece = { id: 0, cells: [[0, 0]], dir: 'R' }; // Blocked by p2
        const p2: Piece = { id: 1, cells: [[0, 2]], dir: 'U' }; // Can exit immediately

        const solution = solveLevel(3, 3, [p1, p2]);
        expect(solution).toEqual([1, 0]);
    });

    it('generates fully solvable levels via procedural generator', () => {
        const level = generateSolvableLevel(3, 42);
        expect(level.pieces.length).toBeGreaterThan(0);
        const solution = solveLevel(level.rows, level.cols, level.pieces);
        expect(solution).not.toBeNull();
    });
});