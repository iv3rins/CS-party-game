# CS推推在线协议 v1

## 边界

- 稳定标识：`gameId: cs-push`、`seasonId: season-v1`。
- API 与 WebSocket 同源：`/api`、`/ws`，由 Nginx 反向代理。
- 服务端以 10Hz 运行权威模拟；客户端不运行游戏 tick，只渲染快照并发送指令。
- 引擎内部 `player` 映射 CT（从左向右），`ai` 映射 T（从右向左）；在线玩家由服务端随机分配 CT/T。
- 对局 seed、玩家指令和最终摘要持久化，完整指令日志保留 30 天。

## 身份与会话

- `POST /api/auth/guest`：创建游客会话。游客可参加休闲队列和私密休闲房。
- `POST /api/auth/register`：唯一用户名（3–18 位，中英文、数字、下划线；英文忽略大小写）和密码。
- `POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`。
- 会话使用 `HttpOnly; Secure; SameSite=Lax` Cookie。数据库只保存 session token 哈希。
- 首发不提供密码找回；注册界面必须明确提示。

## 活动互斥

一个账号/游客会话全平台最多拥有一个活动：队列、匹配确认、房间或对局。服务端以数据库约束和事务校验，客户端状态不作为依据。

## 队列

- `POST /api/queues` `{ gameId, seasonId, mode: casual | ranked }`
- `GET /api/queues/current`
- `DELETE /api/queues/current`
- 游客只能进入 `casual`；`ranked` 需要已注册账号。
- 天梯从 `±100 ELO` 搜索，每等待 10 秒扩大 50。
- 匹配成功后双方收到 `match.ready_check`，10 秒内调用 `POST /api/matches/{matchId}/accept`。超时或拒绝无处罚，已接受玩家重新入队。

## 私密房间

- `POST /api/rooms`：创建休闲私密房间。
- `POST /api/rooms/join`：使用六位邀请码加入。
- `PATCH /api/rooms/{roomId}/ready`
- `POST /api/rooms/{roomId}/start`
- `POST /api/rooms/{roomId}/leave`
- 私密房间不结算 ELO；首发不提供观战。

## WebSocket

连接：`GET /ws`，自动携带会话 Cookie。

客户端消息：

```ts
type ClientMessage =
  | { type: 'match.subscribe'; matchId: string; lastSequence?: number }
  | { type: 'match.command'; matchId: string; commandId: string; command: MatchCommand }
  | { type: 'ping'; clientTime: number };

type MatchCommand =
  | { type: 'buy_deploy'; slot: number; lane: number }
  | { type: 'use_item'; slot: number; lane: number }
  | { type: 'forfeit' };
```

服务端消息：

```ts
type ServerMessage =
  | { type: 'session.ready'; accountId: string }
  | { type: 'match.snapshot'; sequence: number; match: PublicMatchState }
  | { type: 'command.accepted'; commandId: string; sequence: number }
  | { type: 'command.rejected'; commandId: string; code: CommandErrorCode; message: string }
  | { type: 'match.finished'; result: MatchResult }
  | { type: 'match.connection'; playerId: string; connected: boolean; reconnectDeadline?: string }
  | { type: 'pong'; clientTime: number; serverTime: number };
```

指令严格校验：参与者、对局状态、频率、商店槽、金币、出口、道具次数、目标和重复 `commandId`。客户端先显示“待服务器确认”，收到 accepted 后等待下一快照出现实体；不做预测生成。

## 断线与判负

- WebSocket 断开后保留席位 30 秒，普通 AI 使用该玩家当前金币、商店和道具库存接管，不生成额外资源。
- 30 秒内重连并订阅 match 后恢复控制。
- 超时或主动认输判负；天梯队列正常扣分，休闲/私密房不修改 ELO。

## 权威结算

- 初始 1000 ELO；前 10 局 K=40，之后 K=20；胜/负/平独立计数。
- 只有 ranked 队列修改 ELO。私密房和 casual 队列不修改。
- 服务端事务锁定双方 rating，以 `matchId + accountId` 做幂等结算。
- `season-v1` 首发；换季初始分为 `round(old * 0.7 + 1000 * 0.3)`。
- 客户端不能提交 outcome、opponentElo 或目标分数。

## 随机与回放

- 每场生成服务端 seed。商店、优秀枪位和 AI 决策全部使用该 seed 的可复现 RNG。
- 保存 seed、规则版本、全部已接受指令、连接事件和最终摘要 30 天。
- 日志仅用于仲裁与故障分析，首发不提供用户回放 UI。
