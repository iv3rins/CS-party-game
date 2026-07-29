import { randomUUID } from 'node:crypto';
import type { Account, Activity, CommandLog, MatchRecord, Principal, QueueEntry, Rating, RatingSettlement, Room, Session } from './domain.js';
import type { Repository } from './repository.js';

const copy = <T>(value: T): T => structuredClone(value);

export class MemoryRepository implements Repository {
  private accounts = new Map<string, Account>();
  private sessions = new Map<string, Session>();
  private activities = new Map<string, Activity>();
  private queues = new Map<string, QueueEntry>();
  private rooms = new Map<string, Room>();
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
  async saveRoom(room: Room) { this.rooms.set(room.id, copy(room)); }
  async getRoom(roomId: string) { return copy(this.rooms.get(roomId) ?? null); }
  async getRoomByCode(inviteCode: string) { return copy([...this.rooms.values()].find(room => room.inviteCode === inviteCode) ?? null); }
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
    const rating = this.ratings.get(key) ?? { accountId, seasonId, elo: 1000, wins: 0, losses: 0, draws: 0 };
    this.ratings.set(key, rating);
    return copy(rating);
  }
  async settleRanked(matchId: string, winnerAccountId: string | null, accountIds: [string, string], seasonId: string) {
    const existing = this.settlements.get(matchId);
    if (existing) return copy(existing);
    const [a, b] = await Promise.all(accountIds.map(id => this.getRating(id, seasonId))) as [Rating, Rating];
    const expectedA = 1 / (1 + 10 ** ((b.elo - a.elo) / 400));
    const scoreA = winnerAccountId === null ? .5 : winnerAccountId === a.accountId ? 1 : 0;
    const scoreB = 1 - scoreA;
    const nextA = Math.round(a.elo + (a.wins + a.losses + a.draws < 10 ? 40 : 20) * (scoreA - expectedA));
    const nextB = Math.round(b.elo + (b.wins + b.losses + b.draws < 10 ? 40 : 20) * (scoreB - (1 - expectedA)));
    const update = (rating: Rating, score: number, elo: number) => ({ ...rating, elo, wins: rating.wins + (score === 1 ? 1 : 0), losses: rating.losses + (score === 0 ? 1 : 0), draws: rating.draws + (score === .5 ? 1 : 0) });
    this.ratings.set(`${a.accountId}:${seasonId}`, update(a, scoreA, nextA));
    this.ratings.set(`${b.accountId}:${seasonId}`, update(b, scoreB, nextB));
    const result = [{ matchId, accountId: a.accountId, oldElo: a.elo, newElo: nextA }, { matchId, accountId: b.accountId, oldElo: b.elo, newElo: nextB }];
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
