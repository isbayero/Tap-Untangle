export interface ScoreBreakdown {
    baseScore: number;
    comboBonus: number;
    timeBonus: number;
    mistakePenalty: number;
    totalScore: number;
    stars: number;
}

export function calculateRoundScore(
    totalPieces: number,
    _movesTaken: number,
    mistakes: number,
    secondsElapsed: number,
    maxCombo: number
): ScoreBreakdown {
    const baseScore = totalPieces * 100;
    const comboBonus = maxCombo * 150;
    const timeBonus = Math.max(0, Math.floor((120 - secondsElapsed) * 8));
    const mistakePenalty = mistakes * 80;

    const totalScore = Math.max(10, baseScore + comboBonus + timeBonus - mistakePenalty);

    // Star Ratings Formula
    let stars = 1;
    if (mistakes === 0 && secondsElapsed <= totalPieces * 3.5) {
        stars = 3;
    } else if (mistakes <= 1 && secondsElapsed <= totalPieces * 6) {
        stars = 2;
    }

    return {
        baseScore,
        comboBonus,
        timeBonus,
        mistakePenalty,
        totalScore,
        stars,
    };
}