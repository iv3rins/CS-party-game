import type { PersistedProposal } from './domain.js';
import { lua, redisKeys } from './redisKeys.js';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { PX?: number; NX?: boolean }): Promise<unknown>;
  del(key: string): Promise<number>;
  eval(script: string, keys: string[], args: string[]): Promise<number>;
}

export class MatchmakingRedisStore {
  constructor(private redis: RedisLike) {}
  async claimActivity(principalId: string, referenceId: string, ttlMs = 120_000) { return (await this.redis.eval(lua.claimActivity, [`cs-push:activity:${principalId}`], [referenceId, String(ttlMs)])) === 1; }
  async saveProposal(proposal: PersistedProposal, ttlMs = 60_000) { await this.redis.set(redisKeys.proposal(proposal.matchId), JSON.stringify(proposal), { PX: ttlMs }); }
  async getProposal(matchId: string) { const raw = await this.redis.get(redisKeys.proposal(matchId)); return raw ? JSON.parse(raw) as PersistedProposal : null; }
  async deleteProposal(matchId: string) { await this.redis.del(redisKeys.proposal(matchId)); }
}
