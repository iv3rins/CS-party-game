import type { QueueMode, RoomType } from './domain.js';

export const redisKeys = {
  entry: (id: string) => `cs-push:mm:entry:${id}`,
  queue: (mode: QueueMode) => `cs-push:mm:queue:${mode}`,
  proposal: (id: string) => `cs-push:mm:proposal:${id}`,
  index: (accountId: string) => `cs-push:mm:index:${accountId}`,
  due: (bucket: number) => `cs-push:mm:due:${bucket}`,
  room: (id: string) => `cs-push:room:${id}`,
  deadlines: (bucket: number) => `cs-push:room:deadlines:${bucket}`,
  membership: (id: string) => `cs-push:room:membership:${id}`,
  chat: (id: string) => `cs-push:room:chat:${id}`,
};

export const roomTypes: readonly RoomType[] = ['Private', 'Matchmade', 'PVE'];

export const lua = {
  claimActivity: `local current = redis.call('GET', KEYS[1])\nif current then return 0 end\nredis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])\nreturn 1`,
  acceptProposal: `local state = redis.call('HGET', KEYS[1], 'status')\nif state ~= 'pending' then return 0 end\nredis.call('SADD', KEYS[2], ARGV[1])\nlocal count = redis.call('SCARD', KEYS[2])\nif count >= tonumber(ARGV[2]) then redis.call('HSET', KEYS[1], 'status', 'accepted') return 2 end\nreturn 1`,
  versionedSave: `local version = tonumber(redis.call('HGET', KEYS[1], 'version') or '0')\nif version ~= tonumber(ARGV[1]) then return 0 end\nredis.call('HSET', KEYS[1], 'version', version + 1, 'payload', ARGV[2])\nreturn 1`,
};
