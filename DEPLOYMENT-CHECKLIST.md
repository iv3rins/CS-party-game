# CS推推在线版 - 最终验证清单

提交: `e21cf03`  
日期: 2026-07-29  
系统: Debian 12

---

## ✅ 已完成修复

### 1. 接受按钮样式修复
- ✅ 修复队列弹窗"进入对局"按钮样式
- ✅ 黄色背景 + 深色文字对比清晰

### 2. 真人在线匹配实现
- ✅ `platform.ts` 调用后端 `/api/queues` API
- ✅ 轮询 `/api/queues/current` 获取匹配状态
- ✅ 匹配成功后跳转 `/games/cs-push?matchId=xxx&side=ct`
- ✅ 后端不可用时自动回退本地模拟

### 3. 数据库统一方案
- ✅ 数据库名从 `cs_push` 改为 `cspa_main`
- ✅ 用户名从 `cs_push_app` 改为 `cspa_app`
- ✅ 所有游戏共享账号、天梯、对局记录
- ✅ 更新 `.env.example` 和部署文档

### 4. Debian 12 部署文档
- ✅ 添加 Debian 12 PostgreSQL 15 安装步骤
- ✅ 更新所有数据库引用
- ✅ 迁移、备份、清理脚本统一使用 `cspa_main`

---

## 📋 VPS 部署步骤（按顺序执行）

### 第一步：前端部署
```bash
cd /opt/cs-party-game
sudo -u cs-party-deploy git pull origin main
export DEPLOY_COMMIT=e21cf03
sudo -u cs-party-deploy bash deploy/deploy.sh
```

验证：
- https://game.n1komajor.top/lobby ✓
- https://game.n1komajor.top/games/cs-push ✓

### 第二步：PostgreSQL 安装（Debian 12）
```bash
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-client-15
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### 第三步：创建统一数据库
```bash
DB_PASSWORD=$(openssl rand -base64 24)
echo "数据库密码: $DB_PASSWORD" | sudo tee /opt/cs-party-game/db-password.txt
sudo chmod 600 /opt/cs-party-game/db-password.txt

sudo -u postgres psql << EOF
CREATE DATABASE cspa_main;
CREATE USER cspa_app WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE cspa_main TO cspa_app;
\c cspa_main
GRANT ALL ON SCHEMA public TO cspa_app;
EOF
```

### 第四步：执行数据库迁移
```bash
cd /opt/cs-party-game
PGPASSWORD="$DB_PASSWORD" psql -U cspa_app -h 127.0.0.1 -d cspa_main -f server/migrations/001_initial.sql
```

### 第五步：构建后端
```bash
cd /opt/cs-party-game/server
sudo -u cs-party-deploy npm ci --omit=dev
sudo -u cs-party-deploy npm run build
```

### 第六步：生成环境配置
```bash
COOKIE_SECRET=$(openssl rand -base64 48)

sudo tee /opt/cs-party-game/server.env > /dev/null << EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3001
DATABASE_URL=postgres://cspa_app:$DB_PASSWORD@127.0.0.1/cspa_main
COOKIE_SECRET=$COOKIE_SECRET
SESSION_DAYS=30
RATE_LIMIT_MAX=120
EOF

sudo chown cs-party-deploy:cs-party-deploy /opt/cs-party-game/server.env
sudo chmod 600 /opt/cs-party-game/server.env
```

### 第七步：安装 systemd 服务
```bash
sudo cp /opt/cs-party-game/deploy/cs-push-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cs-push-server
sudo systemctl start cs-push-server
sudo systemctl status cs-push-server
```

### 第八步：更新 Nginx 配置
编辑 `/etc/nginx/sites-available/cs-party-game`，在 `location /` 之前添加：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;
    proxy_read_timeout 60s;
}

location /ws {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;
    proxy_read_timeout 300s;
}
```

测试并重载：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 验证步骤

### 1. 后端健康检查
```bash
curl -i https://game.n1komajor.top/api/health
# 预期: HTTP/1.1 200 OK
# {"status":"ok"}
```

### 2. 游客会话创建
```bash
curl -i -X POST https://game.n1komajor.top/api/auth/guest
# 预期: 返回 Set-Cookie 头
```

### 3. 注册测试账号
```bash
curl -i -X POST https://game.n1komajor.top/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"测试用户1","password":"test1234"}'
# 预期: 200 OK，返回账号信息和 Cookie
```

### 4. 加入队列测试
```bash
# 保存上一步返回的 Cookie
COOKIE="cs_push_session=..."

curl -i -X POST https://game.n1komajor.top/api/queues \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"gameId":"cs-push","seasonId":"season-v1","mode":"casual"}'
# 预期: 返回队列 ID
```

### 5. 前端真人匹配测试
1. 打开两个浏览器窗口（或无痕模式）
2. 两个窗口都访问 https://game.n1komajor.top/lobby
3. 窗口A：注册账号"玩家A"
4. 窗口B：注册账号"玩家B"
5. 两个窗口同时点击"快速匹配"
6. **预期行为**：
   - 显示"正在匹配"弹窗
   - 10秒内两个窗口都收到"对手已找到"
   - 点击"进入对局"按钮（黄色背景+深色文字）
   - 跳转到 `/games/cs-push?matchId=xxx&side=ct` 或 `side=t`
   - 进入在线对局界面

### 6. 在线对局功能测试
- [ ] 一方购买武器部署，另一方看到实体出现
- [ ] 一方使用道具，另一方看到效果
- [ ] 一方断线，服务器AI接管
- [ ] 断线方重连，恢复控制权
- [ ] 对局结束，双方看到结果
- [ ] ranked 模式验证 ELO 变化

---

## 🔧 故障排查

### 后端无法启动
```bash
sudo journalctl -u cs-push-server -n 50
# 常见问题：
# 1. DATABASE_URL 错误 → 检查 /opt/cs-party-game/server.env
# 2. 端口 3001 被占用 → lsof -i :3001
# 3. 权限问题 → ls -la /opt/cs-party-game/server/
```

### 前端连接后端失败
```bash
# 1. 确认后端运行
sudo systemctl status cs-push-server

# 2. 直连后端测试
curl http://127.0.0.1:3001/api/health

# 3. 测试 Nginx 代理
curl -i https://game.n1komajor.top/api/health

# 4. 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 匹配一直是 AI
```bash
# 1. 确认后端日志
sudo journalctl -u cs-push-server -f

# 2. 确认队列 API 可用
curl -X POST https://game.n1komajor.top/api/queues \
  -H "Cookie: cs_push_session=..." \
  -H "Content-Type: application/json" \
  -d '{"gameId":"cs-push","seasonId":"season-v1","mode":"casual"}'

# 3. 浏览器开发者工具查看网络请求
# 打开 F12 → Network → 刷新页面 → 查看 /api/queues 请求
```

### WebSocket 连接失败
```bash
# 测试 WebSocket 握手
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://game.n1komajor.top/ws

# 检查 Nginx WebSocket 配置
grep -A 10 "location /ws" /etc/nginx/sites-enabled/*
```

---

## 📊 当前状态

### ✅ 已实现
- 后端完整可用（认证、队列、对局、天梯）
- 前端在线匹配逻辑
- 数据库统一方案
- Debian 12 部署文档
- 接受按钮样式修复

### ⏳ 待验证
- 双客户端真人对战流程
- 在线对局 UI 完整性（待确认遮罩、连接状态等）

### 🎯 下一步
1. 按部署清单在 VPS 上执行
2. 验证后端健康检查
3. 双浏览器测试真人匹配
4. 验证在线对局功能
5. 如有问题查看故障排查章节

---

**部署完成后，前端大厅"快速匹配"将调用真实后端 API，双方匹配成功后进入在线对局！**
