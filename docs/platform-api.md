# CS Party Arena 平台接入契约

`CS推推` 和后续合集大厅统一通过 `PlatformAdapter` 访问账号、设置、游戏清单、匹配、房间与天梯。当前 `LocalPlatformAdapter` 用于可交互单机原型；正式上线时替换为 HTTP/WebSocket adapter，游戏规则层不直接访问网络或大厅路由。

## 统一账号与个人信息

所有小游戏共享平台级 `accountId`。游客绑定正式账号后必须保留该 ID，或由服务端原子迁移全部游戏数据。

- `POST /v1/accounts/guests` `{ displayName? }` -> `Account`
- `GET /v1/me` -> `Account`
- `PATCH /v1/me` `{ displayName }` -> `Account`
- `POST /v1/me/bindings` `{ provider, credential }` -> `Account`

```ts
interface Account {
  accountId: string;
  displayName: string;
  isGuest: boolean;
  provider?: string;
  globalLevel: number;
  avatarSeed: string;
}
```

大厅个人面板展示头像、昵称、游客绑定入口、全局等级、各游戏独立段位和近期战绩。首版本地绑定按钮只调用占位 contract，不接第三方登录。

## 个人设置

- `GET /v1/me/preferences` -> `PlatformPreferences`
- `PATCH /v1/me/preferences` `Partial<PlatformPreferences>` -> `PlatformPreferences`

```ts
interface PlatformPreferences {
  soundEnabled: boolean;
  masterVolume: number; // 0..1
  language: 'zh-CN';
}
```

正式 adapter 应将偏好跨设备同步。当前 Local Adapter 使用 `cspa:preferences`；游戏内音效设置后续应通过该 contract 与大厅设置同步。

## 游戏发现与启动

- `GET /v1/games` -> `GameManifest[]`
- `GET /v1/games/{gameId}` -> `GameManifest`
- `GET /v1/games/{gameId}/summary` -> `GameSummary`
- `POST /v1/games/{gameId}/launch` -> `LaunchTicket`

```ts
interface LaunchTicket {
  gameId: string;
  launchPath: string;
  launchToken?: string;
}
```

Manifest 的 `gameId` 必须永久稳定，作为天梯、匹配、房间和对局数据的分区键。当前大厅提供 `cs-push`（`seasonId: 'season-v1'`，多人对战、天梯、匹配和房间）与 `cs-career`（`seasonId: 'career-v1'`，单人本地职业生涯）两个可玩 manifest。`cs-career` 不进入平台匹配、房间、对局和天梯；其存档由游戏自身管理。其余 manifest 使用 `availability: 'coming-soon'` 并禁用匹配与建房。

本地 `launchGame()` 返回 ticket，并发出 `cspa:navigate` 事件。生产 launch token 必须短期有效、一次性使用且绑定账号与目标游戏。

## 独立天梯与排行榜

天梯记录由 `(accountId, gameId, seasonId)` 唯一确定，统一账号不代表跨游戏共用分数。

- `GET /v1/games/{gameId}/seasons/{seasonId}/rating` -> `Rating`
- `GET /v1/games/{gameId}/seasons/{seasonId}/leaderboard?cursor=...` -> `{ entries, nextCursor? }`

本地存储键为 `cspa:rating:{accountId}:{gameId}:{seasonId}`。当前原型初始分为 1000：前 10 局使用 K=40，之后使用 K=20；胜、负、平分别记录。段位阈值由 `RANK_TIERS` 统一定义，游戏和大厅通过 `getRankTier()` 读取，避免各自硬编码。

同一 `matchId` 重复提交必须幂等，不得重复加减分或追加历史。最近 20 场记录存储在 `cspa:history:{accountId}:{gameId}:{seasonId}`，包含结果、对手分、分数变化和时间。新赛季可通过 `softResetElo()` 将旧分按 `旧分 × 0.7 + 1000 × 0.3` 回缩；正式赛季迁移应由服务端事务执行。

正式段位、K 因子和赛季重置参数由服务端按游戏及赛季配置，客户端只展示服务端返回的结算结果。

## 快速匹配

- `POST /v1/queues` `{ gameId, seasonId }` -> `QueueTicket`
- `GET /v1/queues/{queueId}` -> `QueueTicket`
- `DELETE /v1/queues/{queueId}` -> `QueueTicket`

```ts
type QueueStatus = 'searching' | 'matched' | 'cancelled' | 'expired';

interface QueueTicket {
  queueId: string;
  gameId: string;
  seasonId: string;
  status: QueueStatus;
  queuedAt: string;
  estimatedWaitSeconds: number;
  matchedRoomId?: string;
  match?: MatchSession;
}
```

本地 adapter 以约 6 秒延迟模拟匹配。大厅显示预计等待、取消按钮和匹配成功状态。单人 manifest 必须拒绝入队。真实服务端应使用 WebSocket/SSE 推送状态，同时保留 GET 接口用于重连恢复；重复入队和取消必须幂等。

## 公开与私密房间

- `GET /v1/rooms?gameId={gameId}&visibility=public` -> `GameRoom[]`
- `POST /v1/rooms` `{ gameId, seasonId, config }` -> `GameRoom`
- `POST /v1/rooms/join` `{ roomId?, inviteCode? }` -> `GameRoom`
- `POST /v1/rooms/{roomId}/leave` -> `204`
- `PATCH /v1/rooms/{roomId}/ready` `{ ready }` -> `GameRoom`
- `POST /v1/rooms/{roomId}/start` -> `MatchSession`

```ts
interface RoomConfig {
  name: string;
  visibility: 'public' | 'private';
  roundSeconds: 180;
  allowSpectators: boolean;
}

interface GameRoom {
  roomId: string;
  inviteCode: string;
  gameId: string;
  seasonId: string;
  config: RoomConfig;
  status: 'waiting' | 'ready' | 'started' | 'closed';
  hostAccountId: string;
  members: RoomMember[];
  spectatorCount: number;
  createdAt: string;
}
```

首版创建房间支持房间名称、公开/私密、固定 180 秒回合和观战开关。大厅展示同游戏的公开房间，并支持通过邀请码加入私密房间。等待页展示房间码、邀请链接、成员与准备状态；只有房主可开始，且必须达到游戏最低人数并全部准备。单人 manifest 必须拒绝建房。

正式房间服务还需实现成员 presence、断线重连、踢人、房主转移、配置锁定、分享码过期和状态广播。本地 adapter 在内存中模拟，不保证刷新后保留。

## 对局生命周期与权威结算

- `POST /v1/games/{gameId}/seasons/{seasonId}/matches` -> `MatchSession`
- `POST /v1/games/{gameId}/seasons/{seasonId}/matches/{matchId}/complete` -> `Rating`

Local Adapter 为了原型展示接受客户端 `outcome` 和 `opponentElo`。游客可以试玩多人对局，但 `completeMatch()` 不写入 ELO、胜负或对局历史；绑定账号后才开始记录。生产实现不得信任客户端结算字段：服务端必须验证玩家、房间、随机种子、部署意图、时钟、经济、单位状态和最终结果，再由权威服务端更新 ELO。推荐让 match token 绑定房间和参与者，完成接口只提交输入摘要或服务端内部对局结果 ID。

## 导航边界

- 游戏调用 `leaveToLobby()` 返回大厅。
- 本地 adapter 发出 detail 为 `{ path: '/lobby' }` 的 `cspa:navigate` 事件。
- `launchGame()` 发出 `{ path, launchToken }`。
- 嵌入式大厅监听事件；独立部署 adapter 可改用前端路由或 `location.assign()`。
