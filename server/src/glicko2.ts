import type { Rating, RatingSettlement } from './domain.js';

const SCALE = 173.7178;
const q = Math.log(10) / 400;
const g = (rd: number) => 1 / Math.sqrt(1 + (3 * q * q * rd * rd) / (Math.PI * Math.PI));
const expected = (rating: number, opponent: number, opponentRd: number) => 1 / (1 + Math.exp(-g(opponentRd) * (rating - opponent) / 400));

export function defaultGlickoRating(accountId: string, seasonId: string): Rating {
  return { accountId, seasonId, elo: 1000, rating: 1500, deviation: 350, volatility: 0.06, periods: 0, wins: 0, losses: 0, draws: 0 };
}

export function settleGlicko2(a: Rating, b: Rating, scoreA: 0 | 0.5 | 1): [Rating, Rating, RatingSettlement[]] {
  const scoreB = (1 - scoreA) as 0 | 0.5 | 1;
  const update = (self: Rating, opponent: Rating, score: 0 | 0.5 | 1) => {
    const phi = self.deviation / SCALE;
    const opponentPhi = opponent.deviation / SCALE;
    const impact = g(opponent.deviation);
    const variance = 1 / (q * q * impact * impact * expected(self.rating, opponent.rating, opponent.deviation) * (1 - expected(self.rating, opponent.rating, opponent.deviation)));
    const delta = variance * q * impact * (score - expected(self.rating, opponent.rating, opponent.deviation));
    const nextDeviation = Math.max(30, Math.min(350, Math.sqrt(1 / (1 / (phi * phi) + 1 / variance)) * SCALE));
    const rawDelta = (q / (1 / (phi * phi) + 1 / variance)) * impact * (score - expected(self.rating, opponent.rating, opponent.deviation)) * SCALE;
    const nextRating = self.rating + Math.max(-100, Math.min(100, rawDelta));
    return { ...self, elo: Math.round(nextRating - 500), rating: nextRating, deviation: nextDeviation, periods: self.periods + 1, wins: self.wins + (score === 1 ? 1 : 0), losses: self.losses + (score === 0 ? 1 : 0), draws: self.draws + (score === 0.5 ? 1 : 0) };
  };
  const nextA = update(a, b, scoreA);
  const nextB = update(b, a, scoreB);
  return [nextA, nextB, [{ matchId: '', accountId: a.accountId, oldElo: a.elo, newElo: nextA.elo, oldRating: a.rating, newRating: nextA.rating }, { matchId: '', accountId: b.accountId, oldElo: b.elo, newElo: nextB.elo, oldRating: b.rating, newRating: nextB.rating }]];
}
