export const GAME_ID = 'cs-push';
export const SEASON_ID = 'season-v1';
export const CAREER_GAME_ID = 'cs-career';
export const CAREER_SEASON_ID = 'career-v1';

export type GameAvailability = 'available' | 'coming-soon' | 'maintenance';
export type RoomVisibility = 'public' | 'private';
export type RoomStatus = 'waiting' | 'ready' | 'started' | 'closed';
export type QueueStatus = 'searching' | 'matched' | 'accepted' | 'playing' | 'cancelled' | 'expired';

export interface Account {
  accountId: string;
  displayName: string;
  isGuest: boolean;
  provider?: string;
  globalLevel: number;
  avatarSeed: string;
}

export interface PlatformPreferences {
  soundEnabled: boolean;
  masterVolume: number;
  language: 'zh-CN';
}

export interface Rating {
  gameId: string;
  seasonId: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MatchRecord {
  matchId: string;
  gameId: string;
  seasonId: string;
  outcome: 'win' | 'loss' | 'draw';
  opponentElo: number;
  eloDelta: number;
  playedAt: string;
}

export interface RankTier {
  name: string;
  minElo: number;
  /** Optional: for display accents, but colour is never the sole indicator */
  key: string;
}

/** 段位定义 — minElo 升序排列，getRankTier 取最后一个满足条件的段位 */
export const RANK_TIERS: readonly RankTier[] = [
  { name: '白银精英',  minElo: 0,    key: 'silver' },
  { name: '黄金新星',  minElo: 1000, key: 'gold' },
  { name: '传奇之鹰',  minElo: 1200, key: 'eagle' },
  { name: '大师级',    minElo: 1400, key: 'master' },
] as const;

export function getRankTier(elo: number): RankTier {
  let result = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (elo >= tier.minElo) result = tier;
  }
  return result;
}

/** 赛季软重置：将旧分数向 1000 回缩 30%，保留赛季间连续性 */
export function softResetElo(previousElo: number): number {
  return Math.round(previousElo * 0.7 + 1000 * 0.3);
}

export interface GameManifest {
  gameId: string;
  slug: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  ranked: boolean;
  seasonId: string;
  launchPath: string;
  availability: GameAvailability;
  index: string;
}

export interface GameSummary extends GameManifest {
  onlinePlayers: number;
  activeMatches: number;
  rating?: Rating;
}

export interface LeaderboardEntry {
  rank: number;
  accountId: string;
  displayName: string;
  rating: Rating;
}

export interface LaunchTicket {
  gameId: string;
  launchPath: string;
  launchToken?: string;
}

export interface MatchSession {
  matchId: string;
  gameId: string;
  seasonId: string;
  opponentElo: number;
  startedAt: string;
}

export interface QueueTicket {
  queueId: string;
  gameId: string;
  seasonId: string;
  status: QueueStatus;
  queuedAt: string;
  estimatedWaitSeconds: number;
  matchedRoomId?: string;
  matchId?: string;
  side?: 'ct' | 't';
  readyDeadline?: string;
  match?: MatchSession;
}

export interface RoomConfig {
  name: string;
  visibility: RoomVisibility;
  roundSeconds: 180;
  allowSpectators: boolean;
}

export interface RoomMember {
  accountId: string;
  displayName: string;
  ready: boolean;
  isHost: boolean;
}

export interface GameRoom {
  roomId: string;
  inviteCode: string;
  gameId: string;
  seasonId: string;
  config: RoomConfig;
  status: RoomStatus;
  hostAccountId: string;
  members: RoomMember[];
  spectatorCount: number;
  createdAt: string;
}

export const gameManifest: GameManifest = {
  gameId: GAME_ID,
  slug: 'cs-push',
  name: 'CS推推',
  description: '购买枪械与战术道具，在五条战线上突破对手基地。',
  minPlayers: 2,
  maxPlayers: 2,
  ranked: true,
  seasonId: SEASON_ID,
  launchPath: '/games/cs-push',
  availability: 'available',
  index: '001',
};

export const careerGameManifest: GameManifest = {
  gameId: CAREER_GAME_ID,
  slug: 'cs-career',
  name: 'CS 选手职业生涯',
  description: '从 16 岁的试训开始，写下自己的职业档案。',
  minPlayers: 1,
  maxPlayers: 1,
  ranked: false,
  seasonId: CAREER_SEASON_ID,
  launchPath: '/games/cs-career',
  availability: 'available',
  index: '002',
};

const comingSoonGames: GameManifest[] = [
  { gameId: 'cs-bump', slug: 'cs-bump', name: 'CS撞撞', description: '近距冲刺，抢占擂台。', minPlayers: 2, maxPlayers: 2, ranked: false, seasonId: 'bump-v1', launchPath: '/games/cs-bump', availability: 'coming-soon', index: '003' },
  { gameId: 'cs-retake', slug: 'cs-retake', name: '残局回防', description: '短局残局，快速拆包。', minPlayers: 2, maxPlayers: 6, ranked: false, seasonId: 'retake-v1', launchPath: '/games/cs-retake', availability: 'coming-soon', index: '004' },
];

export interface PlatformAdapter {
  createGuest(displayName?: string): Promise<Account>;
  getAccount(): Promise<Account>;
  updateDisplayName(name: string): Promise<Account>;
  bindAccount(input: { provider: string; credential: string }): Promise<Account>;
  getPreferences(): Promise<PlatformPreferences>;
  updatePreferences(input: Partial<PlatformPreferences>): Promise<PlatformPreferences>;
  listGames(): Promise<GameManifest[]>;
  getGame(gameId: string): Promise<GameManifest>;
  getGameSummary(gameId: string): Promise<GameSummary>;
  launchGame(gameId: string): Promise<LaunchTicket>;
  getRating(gameId: string, seasonId: string): Promise<Rating>;
  getLeaderboard(gameId: string, seasonId: string, cursor?: string): Promise<{ entries: LeaderboardEntry[]; nextCursor?: string }>;
  getMatchHistory(gameId: string, seasonId: string): Promise<MatchRecord[]>;
  startMatch(input: { gameId: string; seasonId: string }): Promise<MatchSession>;
  completeMatch(input: { matchId: string; gameId: string; seasonId: string; outcome: 'win' | 'loss' | 'draw'; opponentElo: number }): Promise<Rating>;
  joinQueue(input: { gameId: string; seasonId: string }): Promise<QueueTicket>;
  getQueueStatus(queueId: string): Promise<QueueTicket>;
  cancelQueue(queueId: string): Promise<QueueTicket>;
  acceptMatch(matchId: string): Promise<QueueTicket>;
  listRooms(input: { gameId: string; visibility?: RoomVisibility }): Promise<GameRoom[]>;
  createRoom(input: { gameId: string; seasonId: string; config: RoomConfig }): Promise<GameRoom>;
  joinRoom(input: { roomId?: string; inviteCode?: string }): Promise<GameRoom>;
  getRoomStatus(roomId: string): Promise<{ room: GameRoom; matchId?: string; side?: 'ct' | 't' }>;
  leaveRoom(roomId: string): Promise<void>;
  setRoomReady(input: { roomId: string; ready: boolean }): Promise<GameRoom>;
  startRoom(roomId: string): Promise<MatchSession>;
  leaveToLobby(): void;
}

const ACCOUNT_KEY = 'cspa:account';
const PREFERENCES_KEY = 'cspa:preferences';
const ratingKey = (accountId: string, gameId: string, seasonId: string) => `cspa:rating:${accountId}:${gameId}:${seasonId}`;
const historyKey = (accountId: string, gameId: string, seasonId: string) => `cspa:history:${accountId}:${gameId}:${seasonId}`;
const completedMatchKey = (accountId: string, gameId: string) => `cspa:completed:${accountId}:${gameId}`;
const HISTORY_LIMIT = 20;
/** 「新手保护段」局数阈值：总局数 < PROVISIONAL_THRESHOLD 时 K=40，此后 K=20 */
const PROVISIONAL_THRESHOLD = 10;
const K_PROVISIONAL = 40;
const K_ESTABLISHED = 20;
const defaultPreferences: PlatformPreferences = { soundEnabled: true, masterVolume: .55, language: 'zh-CN' };
const allGames = [gameManifest, careerGameManifest, ...comingSoonGames];

const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const clone = <T,>(value: T): T => structuredClone(value);

const defaultRating = (gameId: string, seasonId: string): Rating => ({ gameId, seasonId, elo: 1000, wins: 0, losses: 0, draws: 0 });

export class LocalPlatformAdapter implements PlatformAdapter {
  private queues = new Map<string, QueueTicket>();
  private rooms = new Map<string, GameRoom>();

  async createGuest(displayName?: string): Promise<Account> {
    const account: Account = {
      accountId: crypto.randomUUID(),
      displayName: displayName?.trim().slice(0, 18) || `游客-${Math.floor(1000 + Math.random() * 9000)}`,
      isGuest: true,
      globalLevel: 1,
      avatarSeed: crypto.randomUUID(),
    };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    return account;
  }

  async getAccount(): Promise<Account> {
    const stored = localStorage.getItem(ACCOUNT_KEY);
    return stored ? JSON.parse(stored) as Account : this.createGuest();
  }

  async updateDisplayName(name: string): Promise<Account> {
    const account = { ...(await this.getAccount()), displayName: name.trim().slice(0, 18) || '游客' };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    return account;
  }

  async bindAccount(input: { provider: string; credential: string }): Promise<Account> {
    if (!input.credential.trim()) throw new Error('缺少账号绑定凭据');
    const account = { ...(await this.getAccount()), isGuest: false, provider: input.provider };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    return account;
  }

  async getPreferences(): Promise<PlatformPreferences> {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : { ...defaultPreferences };
  }

  async updatePreferences(input: Partial<PlatformPreferences>): Promise<PlatformPreferences> {
    const next = { ...(await this.getPreferences()), ...input };
    next.masterVolume = Math.max(0, Math.min(1, next.masterVolume));
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    return next;
  }

  async listGames(): Promise<GameManifest[]> {
    return clone(allGames);
  }

  async getGame(gameId: string): Promise<GameManifest> {
    const game = allGames.find(item => item.gameId === gameId);
    if (!game) throw new Error(`未知游戏: ${gameId}`);
    return clone(game);
  }

  async getGameSummary(gameId: string): Promise<GameSummary> {
    const manifest = await this.getGame(gameId);
    return {
      ...manifest,
      onlinePlayers: manifest.availability === 'available' ? 128 : 0,
      activeMatches: manifest.availability === 'available' ? 36 : 0,
      rating: manifest.ranked ? await this.getRating(gameId, manifest.seasonId) : undefined,
    };
  }

  async launchGame(gameId: string): Promise<LaunchTicket> {
    const game = await this.getGame(gameId);
    if (game.availability !== 'available') throw new Error(`${game.name} 尚未部署`);
    const ticket = { gameId, launchPath: game.launchPath, launchToken: crypto.randomUUID() };
    window.dispatchEvent(new CustomEvent('cspa:navigate', { detail: { path: ticket.launchPath, launchToken: ticket.launchToken } }));
    return ticket;
  }

  async getRating(gameId: string, seasonId: string): Promise<Rating> {
    const account = await this.getAccount();
    const stored = localStorage.getItem(ratingKey(account.accountId, gameId, seasonId));
    if (stored) {
      const parsed = JSON.parse(stored) as Rating;
      // 兼容旧存档：补全 draws 字段
      if (parsed.draws === undefined) return { ...parsed, draws: 0 };
      return parsed;
    }
    return defaultRating(gameId, seasonId);
  }

  async getMatchHistory(gameId: string, seasonId: string): Promise<MatchRecord[]> {
    const account = await this.getAccount();
    const stored = localStorage.getItem(historyKey(account.accountId, gameId, seasonId));
    return stored ? (JSON.parse(stored) as MatchRecord[]) : [];
  }

  async getLeaderboard(gameId: string, seasonId: string): Promise<{ entries: LeaderboardEntry[]; nextCursor?: string }> {
    const account = await this.getAccount();
    return { entries: [{ rank: 1, accountId: account.accountId, displayName: account.displayName, rating: await this.getRating(gameId, seasonId) }] };
  }

  async startMatch(input: { gameId: string; seasonId: string }): Promise<MatchSession> {
    const game = await this.getGame(input.gameId);
    if (game.availability !== 'available') throw new Error(`${game.name} 尚未部署`);
    if (game.maxPlayers < 2) throw new Error(`${game.name} 是单人游戏，不创建平台对局`);
    return { ...input, matchId: crypto.randomUUID(), opponentElo: 1040, startedAt: new Date().toISOString() };
  }

  async completeMatch(input: { matchId: string; gameId: string; seasonId: string; outcome: 'win' | 'loss' | 'draw'; opponentElo: number }): Promise<Rating> {
    const account = await this.getAccount();
    if (account.isGuest) return this.getRating(input.gameId, input.seasonId);
    const completedKey = completedMatchKey(account.accountId, input.gameId);
    const completedRaw = localStorage.getItem(completedKey);
    const completedSet = new Set<string>(completedRaw ? JSON.parse(completedRaw) : []);

    // 幂等保护：同一 matchId 重复提交时直接返回当前 rating
    if (completedSet.has(input.matchId)) {
      return this.getRating(input.gameId, input.seasonId);
    }

    const rating = await this.getRating(input.gameId, input.seasonId);
    const totalGames = rating.wins + rating.losses + rating.draws;
    const k = totalGames < PROVISIONAL_THRESHOLD ? K_PROVISIONAL : K_ESTABLISHED;
    const actual = input.outcome === 'win' ? 1 : input.outcome === 'draw' ? .5 : 0;
    const expected = 1 / (1 + 10 ** ((input.opponentElo - rating.elo) / 400));
    const delta = Math.round(k * (actual - expected));
    const oldElo = rating.elo;
    rating.elo = Math.max(0, rating.elo + delta);

    if (input.outcome === 'win') rating.wins += 1;
    else if (input.outcome === 'loss') rating.losses += 1;
    else rating.draws += 1;

    localStorage.setItem(ratingKey(account.accountId, input.gameId, input.seasonId), JSON.stringify(rating));

    // 记录已完成的 matchId
    completedSet.add(input.matchId);
    localStorage.setItem(completedKey, JSON.stringify([...completedSet]));

    // 追加对局历史，最多保留 HISTORY_LIMIT 条
    const historyRaw = localStorage.getItem(historyKey(account.accountId, input.gameId, input.seasonId));
    const history: MatchRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({
      matchId: input.matchId,
      gameId: input.gameId,
      seasonId: input.seasonId,
      outcome: input.outcome,
      opponentElo: input.opponentElo,
      eloDelta: rating.elo - oldElo,
      playedAt: new Date().toISOString(),
    });
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
    localStorage.setItem(historyKey(account.accountId, input.gameId, input.seasonId), JSON.stringify(history));

    return rating;
  }

  async joinQueue(input: { gameId: string; seasonId: string }): Promise<QueueTicket> {
    const game = await this.getGame(input.gameId);
    if (game.maxPlayers < 2) throw new Error(`${game.name} 是单人游戏，无需匹配`);
    throw new Error('真人匹配需要在线平台服务');
  }

  async getQueueStatus(_queueId: string): Promise<QueueTicket> {
    throw new Error('真人匹配需要在线平台服务');
  }

  async cancelQueue(_queueId: string): Promise<QueueTicket> {
    throw new Error('真人匹配需要在线平台服务');
  }

  async acceptMatch(_matchId: string): Promise<QueueTicket> {
    throw new Error('本地适配器不支持真人匹配确认');
  }

  async listRooms(input: { gameId: string; visibility?: RoomVisibility }): Promise<GameRoom[]> {
    return [...this.rooms.values()]
      .filter(room => room.gameId === input.gameId && room.status !== 'closed' && (!input.visibility || room.config.visibility === input.visibility))
      .map(clone);
  }

  async createRoom(input: { gameId: string; seasonId: string; config: RoomConfig }): Promise<GameRoom> {
    const account = await this.getAccount();
    const game = await this.getGame(input.gameId);
    if (game.availability !== 'available') throw new Error(`${game.name} 尚未部署`);
    if (game.maxPlayers < 2) throw new Error(`${game.name} 是单人游戏，进度不会创建为平台房间`);
    const room: GameRoom = {
      roomId: crypto.randomUUID(),
      inviteCode: makeInviteCode(),
      gameId: input.gameId,
      seasonId: input.seasonId,
      config: { ...input.config, name: input.config.name.trim().slice(0, 30) || `${account.displayName} 的房间`, roundSeconds: 180 },
      status: 'waiting',
      hostAccountId: account.accountId,
      members: [{ accountId: account.accountId, displayName: account.displayName, ready: true, isHost: true }],
      spectatorCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.rooms.set(room.roomId, room);
    return clone(room);
  }

  async joinRoom(input: { roomId?: string; inviteCode?: string }): Promise<GameRoom> {
    const room = [...this.rooms.values()].find(item => item.roomId === input.roomId || item.inviteCode === input.inviteCode);
    if (!room) throw new Error('房间不存在或邀请码无效');
    if (room.status !== 'waiting' && room.status !== 'ready') throw new Error('房间已开始');
    const account = await this.getAccount();
    if (!room.members.some(member => member.accountId === account.accountId)) {
      const game = await this.getGame(room.gameId);
      if (room.members.length >= game.maxPlayers) throw new Error('房间已满');
      room.members.push({ accountId: account.accountId, displayName: account.displayName, ready: false, isHost: false });
      room.status = 'ready';
    }
    return clone(room);
  }

  async getRoomStatus(roomId: string): Promise<{ room: GameRoom; matchId?: string; side?: 'ct' | 't' }> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');
    return { room: clone(room) };
  }

  async leaveRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const account = await this.getAccount();
    room.members = room.members.filter(member => member.accountId !== account.accountId);
    if (!room.members.length) room.status = 'closed';
    else if (room.hostAccountId === account.accountId) {
      room.members[0].isHost = true;
      room.hostAccountId = room.members[0].accountId;
    }
  }

  async setRoomReady(input: { roomId: string; ready: boolean }): Promise<GameRoom> {
    const room = this.rooms.get(input.roomId);
    if (!room) throw new Error('房间不存在');
    const account = await this.getAccount();
    const member = room.members.find(item => item.accountId === account.accountId);
    if (!member) throw new Error('你不在该房间中');
    member.ready = input.ready;
    const game = await this.getGame(room.gameId);
    room.status = room.members.length >= game.minPlayers && room.members.every(item => item.ready) ? 'ready' : 'waiting';
    return clone(room);
  }

  async startRoom(roomId: string): Promise<MatchSession> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('房间不存在');
    const account = await this.getAccount();
    if (room.hostAccountId !== account.accountId) throw new Error('只有房主可以开始');
    const game = await this.getGame(room.gameId);
    if (room.members.length < game.minPlayers || room.members.length > game.maxPlayers || !room.members.every(member => member.ready)) throw new Error('等待所有玩家准备');
    room.status = 'started';
    return this.startMatch({ gameId: room.gameId, seasonId: room.seasonId });
  }

  leaveToLobby() {
    window.dispatchEvent(new CustomEvent('cspa:navigate', { detail: { path: '/lobby' } }));
  }
}

type ServerPrincipal = { id: string; accountId: string | null; username: string | null; guest: boolean };
type ServerRoom = { id: string; inviteCode: string; ownerPrincipalId: string; status: 'open' | 'started'; members: Array<{ principal: ServerPrincipal; ready: boolean; joinedAt: string }> };
type ServerQueueState = { status: 'idle' | 'searching' | 'ready_check' | 'playing'; queueId?: string; joinedAt?: string; estimatedWaitSeconds?: number; matchId?: string; accepted?: boolean; deadline?: string; side?: 'ct' | 't' };

export class OnlinePlatformAdapter extends LocalPlatformAdapter {
  private serverPrincipal: ServerPrincipal | null = null;
  private roomConfigs = new Map<string, RoomConfig>();

  async getAccount(): Promise<Account> {
    const principal = await this.ensureServerSession();
    return { accountId: principal.id, displayName: principal.username ?? `游客-${principal.id.slice(0, 4)}`, isGuest: principal.guest, globalLevel: 1, avatarSeed: principal.id };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({ message: `服务器请求失败 (${response.status})` })) as { message?: string };
      throw new Error(failure.message || `服务器请求失败 (${response.status})`);
    }
    return response.json() as Promise<T>;
  }

  private async ensureServerSession() {
    if (this.serverPrincipal) return this.serverPrincipal;
    const current = await fetch('/api/auth/me', { credentials: 'include' });
    if (current.ok) this.serverPrincipal = await current.json() as ServerPrincipal;
    else if (current.status === 401) this.serverPrincipal = await this.request<ServerPrincipal>('/api/auth/guest', { method: 'POST', body: '{}' });
    else throw new Error(`无法连接多人服务 (${current.status})`);
    return this.serverPrincipal;
  }

  private queueTicket(state: ServerQueueState, fallbackId = ''): QueueTicket {
    if (state.status === 'idle') return { queueId: fallbackId, gameId: GAME_ID, seasonId: SEASON_ID, status: 'cancelled', queuedAt: new Date().toISOString(), estimatedWaitSeconds: 10 };
    const status: QueueStatus = state.status === 'ready_check' ? (state.accepted ? 'accepted' : 'matched') : state.status;
    return { queueId: state.queueId ?? fallbackId, gameId: GAME_ID, seasonId: SEASON_ID, status, queuedAt: state.joinedAt ?? new Date().toISOString(), estimatedWaitSeconds: state.estimatedWaitSeconds ?? 10, matchId: state.matchId, matchedRoomId: state.matchId, side: state.side, readyDeadline: state.deadline };
  }

  private room(room: ServerRoom): GameRoom {
    const config = this.roomConfigs.get(room.id) ?? { name: 'CS推推私人房间', visibility: 'private', roundSeconds: 180, allowSpectators: false };
    return { roomId: room.id, inviteCode: room.inviteCode, gameId: GAME_ID, seasonId: SEASON_ID, config, status: room.status === 'started' ? 'started' : room.members.length === 2 && room.members.every(member => member.ready) ? 'ready' : 'waiting', hostAccountId: room.ownerPrincipalId, members: room.members.map(member => ({ accountId: member.principal.id, displayName: member.principal.username ?? `玩家-${member.principal.id.slice(0, 4)}`, ready: member.ready, isHost: member.principal.id === room.ownerPrincipalId })), spectatorCount: 0, createdAt: room.members[0]?.joinedAt ?? new Date().toISOString() };
  }

  async joinQueue(input: { gameId: string; seasonId: string }): Promise<QueueTicket> {
    const game = await this.getGame(input.gameId);
    if (game.maxPlayers < 2) throw new Error(`${game.name} 是单人游戏，无需匹配`);
    await this.ensureServerSession();
    return this.queueTicket(await this.request<ServerQueueState>('/api/queues', { method: 'POST', body: JSON.stringify({ ...input, mode: 'casual' }) }));
  }

  async getQueueStatus(queueId: string): Promise<QueueTicket> {
    await this.ensureServerSession();
    return this.queueTicket(await this.request<ServerQueueState>('/api/queues/current'), queueId);
  }

  async cancelQueue(queueId: string): Promise<QueueTicket> {
    await this.ensureServerSession();
    await this.request<{ ok: boolean }>('/api/queues/current', { method: 'DELETE' });
    return { queueId, gameId: GAME_ID, seasonId: SEASON_ID, status: 'cancelled', queuedAt: new Date().toISOString(), estimatedWaitSeconds: 10 };
  }

  async acceptMatch(matchId: string): Promise<QueueTicket> {
    await this.ensureServerSession();
    return this.queueTicket(await this.request<ServerQueueState>(`/api/matches/${encodeURIComponent(matchId)}/accept`, { method: 'POST', body: '{}' }));
  }

  async listRooms(_input: { gameId: string; visibility?: RoomVisibility }): Promise<GameRoom[]> { return []; }

  async createRoom(input: { gameId: string; seasonId: string; config: RoomConfig }): Promise<GameRoom> {
    const game = await this.getGame(input.gameId);
    if (game.maxPlayers < 2) throw new Error(`${game.name} 是单人游戏，不能创建房间`);
    await this.ensureServerSession();
    const room = await this.request<ServerRoom>('/api/rooms', { method: 'POST', body: JSON.stringify({ gameId: input.gameId, seasonId: input.seasonId }) });
    this.roomConfigs.set(room.id, { ...input.config, visibility: 'private', roundSeconds: 180, allowSpectators: false });
    return this.room(room);
  }

  async joinRoom(input: { roomId?: string; inviteCode?: string }): Promise<GameRoom> {
    await this.ensureServerSession();
    if (!input.inviteCode) throw new Error('请输入六位房间码');
    return this.room(await this.request<ServerRoom>('/api/rooms/join', { method: 'POST', body: JSON.stringify({ inviteCode: input.inviteCode }) }));
  }

  async getRoomStatus(roomId: string): Promise<{ room: GameRoom; matchId?: string; side?: 'ct' | 't' }> {
    await this.ensureServerSession();
    const state = await this.request<{ room: ServerRoom; match?: { matchId: string; side: 'ct' | 't' } }>(`/api/rooms/${encodeURIComponent(roomId)}`);
    return { room: this.room(state.room), matchId: state.match?.matchId, side: state.match?.side };
  }

  async leaveRoom(roomId: string): Promise<void> {
    await this.ensureServerSession();
    await this.request<ServerRoom>(`/api/rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST', body: '{}' });
  }

  async setRoomReady(input: { roomId: string; ready: boolean }): Promise<GameRoom> {
    await this.ensureServerSession();
    return this.room(await this.request<ServerRoom>(`/api/rooms/${encodeURIComponent(input.roomId)}/ready`, { method: 'PATCH', body: JSON.stringify({ ready: input.ready }) }));
  }

  async startRoom(roomId: string): Promise<MatchSession> {
    await this.ensureServerSession();
    const state = await this.request<{ matchId: string; side: 'ct' | 't' }>(`/api/rooms/${encodeURIComponent(roomId)}/start`, { method: 'POST', body: '{}' });
    return { matchId: state.matchId, gameId: GAME_ID, seasonId: SEASON_ID, opponentElo: 1000, startedAt: new Date().toISOString() };
  }
}

export const platform: PlatformAdapter = new OnlinePlatformAdapter();
