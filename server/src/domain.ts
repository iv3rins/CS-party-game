export const GAME_ID = 'cs-push';
export const SEASON_ID = 'season-v1';

export type QueueMode = 'casual' | 'ranked';
export type ActivityKind = 'queue' | 'ready_check' | 'room' | 'match';
export type MatchStatus = 'ready_check' | 'playing' | 'finished';
export type MatchOutcome = 'ct' | 't' | 'draw';

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
}

export interface ReadyCheck {
  matchId: string;
  entries: [QueueEntry, QueueEntry];
  accepted: Set<string>;
  deadline: Date;
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
  status: 'open' | 'started';
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
  wins: number;
  losses: number;
  draws: number;
}

export interface RatingSettlement {
  matchId: string;
  accountId: string;
  oldElo: number;
  newElo: number;
}
