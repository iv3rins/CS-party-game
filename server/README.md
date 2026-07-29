# CS推推在线服务

Node 22、TypeScript、Fastify、PostgreSQL 和 WebSocket 的独立服务。服务使用 `cs-push` / `season-v1` 分区，以 10Hz 运行权威模拟。

## 运行

```bash
cp .env.example .env
npm install
npm run dev
```

生产构建和启动：

```bash
npm run build
npm start
```

启动时自动执行 `migrations/001_initial.sql`（迁移可重复执行的首次部署面向空数据库）。生产环境应由部署系统仅执行一次迁移。Cookie 始终设置 `Secure`，本地 HTTP 调试需通过 HTTPS 反向代理。

## API

- `GET /api/health`
- `POST /api/auth/guest`
- `POST /api/auth/register` `{ "username", "password" }`
- `POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`
- `POST /api/queues` `{ "gameId":"cs-push", "seasonId":"season-v1", "mode":"casual|ranked" }`
- `GET|DELETE /api/queues/current`
- `POST /api/matches/:matchId/accept`
- `POST /api/rooms`、`POST /api/rooms/join` `{ "inviteCode" }`
- `PATCH /api/rooms/:roomId/ready` `{ "ready" }`
- `POST /api/rooms/:roomId/start|leave`
- `GET /ws` 支持 `match.subscribe`、`match.command`、`ping`

会话 token 只通过 `HttpOnly; Secure; SameSite=Lax` Cookie 传输，数据库仅保存 SHA-256 token 哈希。密码使用 Argon2。所有 HTTP 和 WebSocket 握手请求应用全局限流。

## 运维

`cleanupCommandLogs(repository)` 删除 30 天前的完整命令日志；建议每日运行。对局的 seed、规则版本、已接受命令和最终 JSON 摘要保存在 PostgreSQL。运行 `npm run lint && npm test && npm run build` 验证工程。
