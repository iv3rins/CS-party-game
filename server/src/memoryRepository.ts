import { randomUUID } from 'node:crypto';
import type { Account, Activity, ChatMessage, CommandLog, MatchRecord, PersistedProposal, Principal, QueueEntry, Rating, RatingSettlement, Room, Session } from './domain.js';
import type { Repository } from './repository.js';
import { defaultGlickoRating, settleGlicko2 } from './glicko2.js';

const copy = <T>(value: T): T => structuredClone(value);

export class MemoryRepository implements Repository {
  private accounts = new Map<string, Account>();
  private sessions = new Map<string, Session>();
  private activities = new Map<string, Activity>();
  private queues = new Map<string, QueueEntry>();
  private rooms = new Map<string, Room>();
  private proposals = new Map<string, PersistedProposal>();
  private chat = new Map<string, ChatMessage[]>();
  private matches = new Map<string, MatchRecord>();
  private commands = new Map<string, CommandLog>();
  private ratings = new Map<string, Rating>();
  private settlements = new Map<string, RatingSettlement[]>();

  async createAccount(username: string, usernameNormalized: string, passwordHash: string) {
    if ([...this.accounts.values()].some(account => account.usernameNormalized === usernameNormalized)) throw new Error('USERNAME_TAKEN');
    const account = { id: randomUUID(), username, usernameNormalized, passwordHash };
    this.accounts.set(account.id, account);
    return copy(account);
  }
  async findAccountByNormalizedUsername(value: string) { return copy([...this.accounts.values()].find(account => account.usernameNormalized === value) ?? null); }
  async createSession(principal: Principal, tokenHash: string, expiresAt: Date) {
    const session = { ...principal, tokenHash, expiresAt };
    this.sessions.set(tokenHash, session);
    return copy(session);
  }
  async findSession(tokenHash: string, now: Date) {
    const session = this.sessions.get(tokenHash);
    return copy(session && session.expiresAt > now ? session : null);
  }
  async deleteSession(tokenHash: string) { this.sessions.delete(tokenHash); }
  async getActivity(principalId: string) { return copy(this.activities.get(principalId) ?? null); }
  async claimActivity(activity: Activity) {
    if (this.activities.has(activity.principalId)) return false;
    this.activities.set(activity.principalId, activity);
    return true;
  }
  async releaseActivity(principalId: string, referenceId?: string) {
    const current = this.activities.get(principalId);
    if (current && (!referenceId || current.referenceId === referenceId)) this.activities.delete(principalId);
  }
  async saveQueue(entry: QueueEntry) { this.queues.set(entry.principal.id, copy(entry)); }
  async getQueue(principalId: string) { return copy(this.queues.get(principalId) ?? null); }
  async listQueues(mode: 'casual' | 'ranked') { return copy([...this.queues.values()].filter(entry => entry.mode === mode)); }
  async deleteQueue(principalId: string) { this.queues.delete(principalId); }
  async saveProposal(proposal: PersistedProposal) { this.proposals.set(proposal.matchId, copy(proposal)); }
  async getProposal(matchId: string) { return copy(this.proposals.get(matchId) ?? null); }
  async listDueProposals(now: Date) { return copy([...this.proposals.values()].filter(proposal => proposal.deadline <= now)); }
  async deleteProposal(matchId: string) { this.proposals.delete(matchId); }
  async saveRoom(room: Room, expectedVersion?: number) { const current = this.rooms.get(room.id); if (expectedVersion !== undefined && (current?.version ?? 0) !== expectedVersion) return false; this.rooms.set(room.id, copy({ ...room, version: (current?.version ?? room.version ?? 0) + 1 })); return true; }
  async getRoom(roomId: string) { return copy(this.rooms.get(roomId) ?? null); }
  async getRoomByCode(inviteCode: string) { return copy([...this.rooms.values()].find(room => room.inviteCode === inviteCode) ?? null); }
  async appendChatMessage(message: ChatMessage) { const messages = this.chat.get(message.roomId) ?? []; messages.push(copy(message)); this.chat.set(message.roomId, messages.slice(-100)); }
  async listChatMessages(roomId: string, limit = 50) { return copy((this.chat.get(roomId) ?? []).slice(-limit)); }
  async saveMatch(match: MatchRecord) { this.matches.set(match.id, copy(match)); }
  async getMatch(matchId: string) { return copy(this.matches.get(matchId) ?? null); }
  async appendCommand(command: CommandLog) {
    const key = `${command.matchId}:${command.commandId}`;
    if (this.commands.has(key)) return false;
    this.commands.set(key, copy(command));
    return true;
  }
  async getCommand(matchId: string, commandId: string) { return copy(this.commands.get(`${matchId}:${commandId}`) ?? null); }
  async getRating(accountId: string, seasonId: string) {
    const key = `${accountId}:${seasonId}`;
    const rating = this.ratings.get(key) ?? defaultGlickoRating(accountId, seasonId);
    this.ratings.set(key, rating);
    return copy(rating);
  }
  async settleRanked(matchId: string, winnerAccountId: string | null, accountIds: [string, string], seasonId: string) {
    const existing = this.settlements.get(matchId);
    if (existing) return copy(existing);
    const [a, b] = await Promise.all(accountIds.map(id => this.getRating(id, seasonId))) as [Rating, Rating];
    const scoreA = winnerAccountId === null ? .5 : winnerAccountId === a.accountId ? 1 : 0;
    const [nextA, nextB, settlements] = settleGlicko2(a, b, scoreA as 0 | 0.5 | 1);
    settlements.forEach(settlement => { settlement.matchId = matchId; });
    this.ratings.set(`${a.accountId}:${seasonId}`, nextA);
    this.ratings.set(`${b.accountId}:${seasonId}`, nextB);
    const result = settlements;
    this.settlements.set(matchId, result);
    return copy(result);
  }
  async deleteCommandsBefore(before: Date) {
    let count = 0;
    for (const [key, command] of this.commands) if (command.acceptedAt < before) { this.commands.delete(key); count += 1; }
    return count;
  }
  async close() {}
}
