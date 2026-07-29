# CS推推在线版 - 交付总结

提交: `ac59b06`  
日期: 2026-07-29  
VPS: `64.90.30.38`  
域名: `game.n1k0major.top`

---

## 一、已完成功能

### 后端服务 (server/)
✅ **认证系统**
- 游客会话（UUID + Cookie）
- 注册/登录（Argon2 密码哈希）
- 用户名规则：3-18 位中英文数字下划线，大小写不敏感
- HttpOnly + Secure + SameSite=Lax Cookie
- 会话 30 天有效期

✅ **匹配队列**
- casual/ranked 双模式
- 游客限制：只能 casual，不能 ranked
- 单一活动互斥（一人同时只能有一个队列/房间/对局）
- 匹配算法：±100 ELO 起，每 10 秒扩大 50
- 10 秒 ready check，超时无惩罚

✅ **私密房间**
- 6 位数字邀请码
- 房主 ready/start/leave 控制
- 支持游客

✅ **权威对局**
- 10Hz 服务端模拟
- Seeded RNG（可复现）
- 命令严格校验：buy_deploy/use_item/forfeit
- commandId 幂等性
- 断线 30 秒 AI 接管（使用当前资源）
- 超时自动判负
- seed + 命令日志 + 结果持久化 30 天

✅ **天梯系统**
- 初始 1000 ELO
- 前 10 局 K=40，之后 K=20
- matchId + accountId 双边幂等结算
- 只有 ranked 队列影响 ELO
- 记录 wins/losses/draws

✅ **测试覆盖**
- 10 项 Vitest 测试全部通过
- Seeded RNG 确定性
- 队列规则（游客限制、活动互斥、匹配范围）
- 房间流程（create/join/ready/start/leave）
- 命令幂等性
- 断线 AI 接管
- Ranked 幂等结算

✅ **工程质量**
- TypeScript 严格模式
- `npm run lint` 通过
- `npm test` 通过
- `npm run build` 成功
- README + .env.example

### 前端集成 (src/)
✅ **在线客户端骨架** (`src/games/cs-push/onlineClient.ts`)
- WebSocket 连接 `/ws`
- match.subscribe/snapshot/command/finished 消息
- 命令状态跟踪（pending/accepted/rejected）
- 断线重连支持

✅ **路由参数解析** (`src/app/Router.tsx`)
- 识别 `/games/cs-push?matchId=xxx&side=ct`
- 传递参数给 CsPushGame

✅ **游戏双模式支持** (`src/games/cs-push/CsPushGame.tsx`)
- 本地模式：保持原有单机 AI 逻辑
- 在线模式：接受 matchId + mySide 参数，使用 OnlineMatchClient

✅ **大厅正式版文案** (`src/lobby/Lobby.tsx`)
- 移除所有"本地模拟/体验"标识
- 连接状态改为"在线"
- "快速匹配"、"创建房间"、"加入房间"
- 匹配弹窗改为正式表述

### 部署配置 (deploy/)
✅ **systemd 服务** (`deploy/cs-push-server.service`)
- User: cs-party-deploy
- Restart: on-failure
- EnvironmentFile 支持

✅ **部署指南** (`deploy/DEPLOY-ONLINE.md`)
- PostgreSQL 安装
- 数据库创建和迁移
- 环境变量生成
- Nginx /api 和 /ws 代理配置
- 健康检查步骤
- 运维命令（重启/日志/备份/清理）
- 故障排查指南

✅ **协议文档** (`docs/cs-push-online-protocol.md`)
- WebSocket 消息格式
- REST API 端点
- 权威模拟规则
- 断线重连协议

---

## 二、部署状态

### 当前可部署
✅ **前端**：使用现有 `deploy/deploy.sh`，提交 `ac59b06`  
✅ **后端**：按 `deploy/DEPLOY-ONLINE.md` 步骤执行

### 当前可用功能
✅ **前端单机模式**：访问 `/games/cs-push` 可正常游玩本地 AI 对战  
✅ **后端 API**：健康检查、认证、队列、房间接口已就绪  
✅ **WebSocket 服务**：权威对局、断线 AI、天梯结算已实现

---

## 三、未完成部分（需后续补齐）

### 前端在线 UI 对接
⏳ **CsPushGame 在线模式 UI**
- [ ] 命令"待服务器确认"半透明遮罩
- [ ] 对手连接状态显示
- [ ] 断线倒计时（30 秒）
- [ ] 结束后显示结果并禁用操作
- [ ] "返回大厅"按钮（替代"再次行动"）
- [ ] 错误提示（command.rejected）

### 大厅在线 API 集成
⏳ **HttpPlatformAdapter 实现**
- [ ] POST /api/auth/guest|register|login
- [ ] POST /api/queues（轮询或 WebSocket 监听匹配）
- [ ] POST /api/matches/:matchId/accept
- [ ] 接受后跳转 `/games/cs-push?matchId=xxx&side=ct`
- [ ] 大厅"快速匹配"调用在线 API（替代本地模拟）

### 端到端验证
⏳ **双客户端测试**
- [ ] 两个浏览器窗口分别注册
- [ ] 同时加入 casual 队列
- [ ] 匹配成功，双方 accept
- [ ] 进入对局，一方购买部署，另一方看到
- [ ] 一方断线，AI 接管；重连恢复控制
- [ ] 对局结束，验证 ranked ELO 变化
- [ ] 私密房间流程验证

---

## 四、部署清单

### 前端部署（立即可用）
```bash
cd /opt/cs-party-game
export DEPLOY_COMMIT=ac59b06
sudo -u cs-party-deploy bash deploy/deploy.sh
```

### 后端部署（按 deploy/DEPLOY-ONLINE.md）
1. 安装 PostgreSQL 15
2. 创建数据库 cs_push 和用户
3. 执行 server/migrations/001_initial.sql
4. 构建后端：cd server && npm ci --omit=dev && npm run build
5. 生成 /opt/cs-party-game/server.env
6. 安装 systemd 服务
7. 更新 Nginx 配置（/api 和 /ws）
8. 健康检查：curl https://game.n1k0major.top/api/health

---

## 五、技术栈

### 后端
- Node.js 22
- TypeScript 5.7
- Fastify 5.2 (HTTP + WebSocket)
- PostgreSQL 15
- @fastify/websocket + ws
- argon2 (密码哈希)
- zod (配置校验)
- Vitest (测试)

### 前端
- React 18
- TypeScript 5.6
- Vite 8
- Vitest (测试)

### 部署
- systemd (进程管理)
- Nginx (反向代理 + TLS)
- PostgreSQL (持久化)

---

## 六、关键设计决策

1. **服务端权威**：防止作弊，确保 ranked 公平性
2. **命令幂等**：网络重传不会重复扣钱或部署
3. **Seeded RNG**：可复现对局，支持审计和调试
4. **断线 AI**：保证对局连续性，允许重连
5. **30 天日志保留**：平衡存储和争议解决
6. **单活动互斥**：简化状态管理，避免并发冲突
7. **Cookie 会话**：同源部署，简化认证
8. **10Hz 模拟**：平衡实时性和服务器负载

---

## 七、验证步骤

### 本地验证（已通过）
```bash
# 后端
cd server
npm run lint  # ✅ 通过
npm test      # ✅ 10/10 通过
npm run build # ✅ 成功

# 前端
npm run lint  # ✅ 通过
npm test      # ✅ 82/82 通过
npm run build # ✅ 成功
```

### VPS 验证（部署后执行）
```bash
# 前端健康检查
curl -I https://game.n1k0major.top/lobby
curl -I https://game.n1k0major.top/games/cs-push

# 后端健康检查
curl -i https://game.n1k0major.top/api/health

# 游客会话
curl -i -X POST https://game.n1k0major.top/api/auth/guest

# 注册账号
curl -i -X POST https://game.n1k0major.top/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"测试用户","password":"test1234"}'
```

---

## 八、文件清单

### 新增后端文件
```
server/
├── package.json
├── tsconfig.json
├── README.md
├── .env.example
├── migrations/
│   └── 001_initial.sql
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── config.ts
│   ├── domain.ts
│   ├── auth.ts
│   ├── services.ts
│   ├── repository.ts
│   ├── memoryRepository.ts
│   ├── postgresRepository.ts
│   ├── matchRuntime.ts
│   ├── rng.ts
│   └── cleanup.ts
└── test/
    └── core.test.ts
```

### 新增前端文件
```
src/games/cs-push/onlineClient.ts
```

### 新增部署文件
```
deploy/cs-push-server.service
deploy/deploy-server.sh
deploy/DEPLOY-ONLINE.md
```

### 新增文档
```
docs/cs-push-online-protocol.md
```

### 修改文件
```
src/lobby/Lobby.tsx          # 正式版文案
src/app/Router.tsx           # query 参数解析
src/games/cs-push/CsPushGame.tsx  # 双模式支持
deploy/README.md             # 部署文档更新
```

---

## 九、残余风险

### 高优先级
1. **前端在线 UI 未完成**：用户看不到"待确认"状态和对手连接
2. **大厅未集成在线 API**：用户无法进入在线对局
3. **未经端到端测试**：实际对战流程未验证

### 中优先级
4. **PostgreSQL 未配置备份**：需手动设置 cron 备份
5. **命令日志清理未自动化**：需手动设置 cron 清理
6. **监控未配置**：建议添加 Prometheus + Grafana

### 低优先级
7. **性能未压测**：不确定单机支持多少并发对局
8. **安全审计未完成**：建议专业安全审查
9. **错误追踪未配置**：建议添加 Sentry

---

## 十、后续建议

### 立即执行（高优）
1. 按 `deploy/DEPLOY-ONLINE.md` 完成后端部署
2. 验证健康检查和基础 API
3. 补齐前端在线 UI（命令遮罩、连接状态、结束结果）
4. 实现 HttpPlatformAdapter
5. 双客户端端到端测试

### 短期优化（中优）
6. 配置 PostgreSQL 自动备份
7. 配置命令日志自动清理
8. 添加监控和告警
9. 性能压测和优化

### 长期增强（低优）
10. 添加观战功能
11. 添加回放系统
12. 添加排行榜和赛季
13. 添加好友和组队

---

## 十一、联系和支持

### 部署问题
参考 `deploy/DEPLOY-ONLINE.md` 故障排查章节

### 开发问题
- 后端：`server/README.md`
- 协议：`docs/cs-push-online-protocol.md`
- 平台：`docs/platform-api.md`

### Git 仓库
https://github.com/iv3rins/CS-party-game.git

---

**交付状态**：后端完整可用，前端骨架就绪，大厅已改正式版文案。部署后可验证 API 和单机游戏，在线对战需补齐 UI 对接和端到端测试。
