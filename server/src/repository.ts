import type { Account, Activity, ChatMessage, CommandLog, MatchRecord, PersistedProposal, PlayerFeedback, Principal, QueueEntry, Rating, RatingSettlement, Room, Session } from './domain.js';

export interface Repository {
  createAccount(username: string, usernameNormalized: string, passwordHash: string): Promise<Account>;
  findAccountByNormalizedUsername(usernameNormalized: string): Promise<Account | null>;
  createSession(principal: Principal, tokenHash: string, expiresAt: Date): Promise<Session>;
  findSession(tokenHash: string, now: Date): Promise<Session | null>;
  deleteSession(tokenHash: string): Promise<void>;
  getActivity(principalId: string): Promise<Activity | null>;
  claimActivity(activity: Activity): Promise<boolean>;
  releaseActivity(principalId: string, referenceId?: string): Promise<void>;
  saveQueue(entry: QueueEntry): Promise<void>;
  getQueue(principalId: string): Promise<QueueEntry | null>;
  listQueues(mode: 'casual' | 'ranked'): Promise<QueueEntry[]>;
  deleteQueue(principalId: string): Promise<void>;
  saveProposal(proposal: PersistedProposal): Promise<void>;
  getProposal(matchId: string): Promise<PersistedProposal | null>;
  listDueProposals(now: Date): Promise<PersistedProposal[]>;
  deleteProposal(matchId: string): Promise<void>;
  saveRoom(room: Room, expectedVersion?: number): Promise<boolean>;
  getRoom(roomId: string): Promise<Room | null>;
  getRoomByCode(inviteCode: string): Promise<Room | null>;
  appendChatMessage(message: ChatMessage): Promise<void>;
  listChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
  saveMatch(match: MatchRecord): Promise<void>;
  getMatch(matchId: string): Promise<MatchRecord | null>;
  appendCommand(command: CommandLog): Promise<boolean>;
  getCommand(matchId: string, commandId: string): Promise<CommandLog | null>;
  submitFeedback(feedback:PlayerFeedback):Promise<void>;
  getRating(accountId: string, seasonId: string): Promise<Rating>;
  settleRanked(matchId: string, winnerAccountId: string | null, accountIds: [string, string], seasonId: string): Promise<RatingSettlement[]>;
  deleteCommandsBefore(before: Date): Promise<number>;
  close(): Promise<void>;
}
