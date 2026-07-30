import { MATCHMAKING, type QueueEntry, type QueueMode } from './domain.js';

export type PartyGroup = { id: string; members: QueueEntry[]; averageRating: number; joinedAt: Date };

export const ratingRangeAt = (joinedAt: Date, now: Date) => Math.min(
  MATCHMAKING.maxRange,
  MATCHMAKING.initialRange + Math.floor(Math.max(0, now.getTime() - joinedAt.getTime()) / MATCHMAKING.expansionEveryMs) * MATCHMAKING.expansion,
);

export const compatibleGroups = (a: PartyGroup, b: PartyGroup, now: Date) => {
  if (!a.members.length || !b.members.length) return false;
  if (a.members[0].mode !== b.members[0].mode) return false;
  if (a.members.length + b.members.length > 2) return false;
  const range = Math.min(ratingRangeAt(a.joinedAt, now), ratingRangeAt(b.joinedAt, now));
  return Math.abs(a.averageRating - b.averageRating) <= range;
};

export const makePartyGroup = (members: QueueEntry[]): PartyGroup => ({
  id: members[0]?.partyId ?? members[0]?.id ?? '',
  members,
  averageRating: members.reduce((sum, entry) => sum + entry.rating, 0) / Math.max(1, members.length),
  joinedAt: new Date(Math.min(...members.map(entry => entry.joinedAt.getTime()))),
});

export const downgradeSizes = (elapsedMs: number, mode: QueueMode) => {
  if (mode !== 'ranked') return [2];
  if (elapsedMs >= MATCHMAKING.downgradeAfterMs.eightToFour) return [4, 2];
  if (elapsedMs >= MATCHMAKING.downgradeAfterMs.twelveToEight) return [8, 4, 2];
  return [12, 8, 4, 2];
};
