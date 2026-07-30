export const GAME_ID = 'cs-push';
export const SEASON_ID = 'season-v1';

export type QueueMode = 'casual' | 'ranked';
export type RoomType = 'Private' | 'Matchmade' | 'PVE';
export type ActivityKind = 'queue' | 'ready_check' | 'room' | 'match';
export type MatchStatus = 'ready_check' | 'playing' | 'finished';
export type MatchOutcome = 'ct' | 't' | 'draw';
export type DeadlineKind = 'ready_check' | 'disconnect' | 'room_expiry';

export const MATCHMAKING = { initialRange: 100, expansion: 50, expansionEveryMs: 10_000, maxRange: 500, readyWindowMs: 15_000, downgradeAfterMs: { twelveToEight: 30_000, eightToFour: 60_000 } } as const;

export interface QueueEntryRecord {
  entryId: string;
  accountId: string;
  gameId: string;
  seasonId: string;
  mode: QueueMode;
  partyId?: string;
  rating: number;
  joinedAt: Date;
  memberCount: number;
  version: number;
}

export interface MatchProposal {
  proposalId: string;
  entryIds: string[];
  mode: QueueMode;
  createdAt: Date;
  deadline: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedBy: string[];
  retainedGroupId?: string;
}

export interface Principal {
  id: string;
  accountId: string | null;
  username: string | null;
  guest: boolean;
}

export interface Account {
  id: string;
  username: string;
  usernameNormalized: string;
  passwordHash: string;
}

export interface Session extends Principal {
  tokenHash: string;
  expiresAt: Date;
}

export interface Activity {
  principalId: string;
  kind: ActivityKind;
  referenceId: string;
}

export interface QueueEntry {
  id: string;
  principal: Principal;
  mode: QueueMode;
  rating: number;
  joinedAt: Date;
  partyId?: string;
  memberCount?: number;
  version?: number;
}

export interface ReadyCheck {
  matchId: string;
  entries: [QueueEntry, QueueEntry];
  accepted: Set<string>;
  deadline: Date;
  version: number;
  retainedGroupId?: string;
}

export interface RoomMember {
  principal: Principal;
  ready: boolean;
  joinedAt: Date;
}

export interface Room {
  id: string;
  inviteCode: string;
  ownerPrincipalId: string;
  members: RoomMember[];
  status: 'open' | 'started' | 'closed';
  type?: RoomType;
  version?: number;
  createdAt?: Date;
  disconnectedUntil?: Record<string, Date>;
}

export interface PersistedProposal {
  matchId: string;
  entries: QueueEntry[];
  accepted: string[];
  deadline: Date;
  version: number;
  retainedGroupId?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  principalId: string;
  text: string;
  createdAt: Date;
}

export interface MatchParticipant {
  principal: Principal;
  side: 'ct' | 't';
}

export interface MatchRecord {
  id: string;
  mode: QueueMode | 'room';
  status: MatchStatus;
  seed: string;
  rulesVersion: string;
  participants: [MatchParticipant, MatchParticipant];
  result?: MatchResult;
}

export interface MatchResult {
  matchId: string;
  outcome: MatchOutcome;
  reason: 'base' | 'time' | 'forfeit' | 'disconnect';
  finishedAt: string;
  playerBase: number;
  aiBase: number;
}

export type MatchCommand =
  | { type: 'buy_deploy'; slot: number; lane: number }
  | { type: 'use_item'; slot: number; lane: number }
  | { type: 'forfeit' };

export interface CommandLog {
  matchId: string;
  principalId: string;
  commandId: string;
  sequence: number;
  command: MatchCommand;
  acceptedAt: Date;
}

export interface Rating {
  accountId: string;
  seasonId: string;
  elo: number;
  rating: number;
  deviation: number;
  volatility: number;
  periods: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface RatingSettlement {
  matchId: string;
  accountId: string;
  oldElo: number;
  newElo: number;
  oldRating?: number;
  newRating?: number;
}

export interface Deadline { id: string; kind: DeadlineKind; ownerId: string; dueAt: Date; version: number; priority: number; }
export type PublicProjection = { state: unknown; yourSide: 'ct' | 't'; yourShop: unknown[]; opponent: { side: 'ct' | 't'; connected: boolean; base: number; lanes: unknown[] } };
