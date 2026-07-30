# CS推推在线版部署指南

VPS: `64.90.30.38`  
域名: `game.n1komajor.top`  
提交: `59aaecd`（或更新的 main HEAD）
系统: Debian 12

---

## 一、前端部署（已有流程）

使用现有 `deploy/deploy.sh`：

```bash
# 在 VPS 上执行
cd /opt/cs-party-game
export DEPLOY_COMMIT=59aaecd  # 或省略使用 main 最新
sudo -u cs-party-deploy bash deploy/deploy.sh
```

健康检查会验证：
- https://game.n1komajor.top/lobby
- https://game.n1komajor.top/games/cs-push
- https://game.n1komajor.top/games/cs-career

---

## 二、后端部署（新增步骤）

### 1. 安装 PostgreSQL 15 (Debian 12)

Debian 12 官方仓库默认提供 PostgreSQL 15：

```bash
# 更新软件源
sudo apt-get update

# 安装 PostgreSQL 15
sudo apt-get install -y postgresql-15 postgresql-client-15

# 启动并设置开机自启
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 验证安装
sudo systemctl status postgresql
psql --version  # 应显示 15.x
```

### 2. 创建统一数据库（共享账号和天梯）

**重要**：使用统一的 `cspa_main` 数据库，所有游戏共享账号、天梯和对局记录。

```bash
# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 24)
echo "数据库密码: $DB_PASSWORD" | sudo tee /opt/cs-party-game/db-password.txt
sudo chmod 600 /opt/cs-party-game/db-password.txt

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE cspa_main;
CREATE USER cspa_app WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE cspa_main TO cspa_app;
\c cspa_main
GRANT ALL ON SCHEMA public TO cspa_app;
EOF
```

### 3. 执行数据库迁移

```bash
cd /opt/cs-party-game
sudo -u cs-party-deploy git pull origin main
sudo -u cs-party-deploy bash -c "cd /opt/cs-party-game && PGPASSWORD='$DB_PASSWORD' psql -U cspa_app -h 127.0.0.1 -d cspa_main -f server/migrations/001_initial.sql"
```

### 4. 构建后端

```bash
cd /opt/cs-party-game/server
sudo -u cs-party-deploy npm ci --omit=dev
sudo -u cs-party-deploy npm run build
```

### 5. 生成环境配置

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

### 6. 安装 systemd 服务

```bash
sudo cp /opt/cs-party-game/deploy/cs-push-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cs-push-server
sudo systemctl start cs-push-server

# 检查状态
sudo systemctl status cs-push-server
sudo journalctl -u cs-push-server -f
```

### 7. 更新 Nginx 配置

编辑 `/etc/nginx/sites-available/cs-party-game`（或你的站点配置文件），在 `server` 块中添加：

```nginx
# 在 location / 之前添加以下两个 location

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

测试并重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 健康检查

```bash
# 后端健康检查
curl -i https://game.n1komajor.top/api/health

# 预期响应: HTTP/1.1 200 OK
# {"status":"ok"}

# 前端健康检查（已有）
curl -I https://game.n1komajor.top/lobby
curl -I https://game.n1komajor.top/games/cs-push
```

---

## 三、防火墙配置（如需）

如果 VPS 有防火墙，确保开放端口：

```bash
# ufw 示例
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# 内部端口 3001 不需要对外开放
```

---

## 四、运维命令

### 重启后端服务

```bash
sudo systemctl restart cs-push-server
sudo systemctl status cs-push-server
```

### 查看日志

```bash
# 实时日志
sudo journalctl -u cs-push-server -f

# 最近 100 行
sudo journalctl -u cs-push-server -n 100
```

### 清理过期命令日志（建议每日 cron）

```bash
# 添加到 crontab
echo "0 3 * * * cd /opt/cs-party-game/server && NODE_ENV=production DATABASE_URL='postgres://cspa_app:PASSWORD@127.0.0.1/cspa_main' node -e \"require('./dist/server/src/cleanup.js').cleanupCommandLogs(new (require('./dist/server/src/postgresRepository.js')).PostgresRepository())\"" | sudo tee -a /etc/cron.d/cs-push-cleanup
```

### 手动触发清理

```bash
cd /opt/cs-party-game/server
source /opt/cs-party-game/server.env
node -e "require('./dist/server/src/cleanup.js').cleanupCommandLogs(new (require('./dist/server/src/postgresRepository.js')).PostgresRepository()).then(() => console.log('Done'))"
```

### 数据库备份

```bash
# 每日备份示例
sudo -u postgres pg_dump cspa_main > /opt/cs-party-game/backups/cspa_main_$(date +%Y%m%d).sql
```

---

## 五、更新部署

当有新代码提交后：

```bash
cd /opt/cs-party-game

# 1. 前端更新（使用已有脚本）
sudo -u cs-party-deploy bash deploy/deploy.sh

# 2. 后端更新
sudo -u cs-party-deploy git pull origin main
cd server
sudo -u cs-party-deploy npm ci --omit=dev
sudo -u cs-party-deploy npm run build

# 3. 执行新迁移（如有）
# PGPASSWORD='密码' psql -U cspa_app -h 127.0.0.1 -d cspa_main -f server/migrations/00X_xxx.sql

# 4. 重启后端服务
sudo systemctl restart cs-push-server

# 5. 健康检查
curl -i https://game.n1komajor.top/api/health
```

---

## 六、故障排查

### 后端无法启动

```bash
# 检查日志
sudo journalctl -u cs-push-server -n 50

# 常见问题：
# 1. 数据库连接失败 → 检查 DATABASE_URL 和 PostgreSQL 状态
# 2. 端口冲突 → 检查 3001 是否被占用
# 3. 权限问题 → 确认 cs-party-deploy 用户有读取 server/ 的权限
```

### 前端无法连接后端

```bash
# 1. 确认后端运行
sudo systemctl status cs-push-server

# 2. 确认 Nginx 配置
sudo nginx -t
grep -A 10 "location /api/" /etc/nginx/sites-enabled/*

# 3. 测试直连后端
curl http://127.0.0.1:3001/api/health

# 4. 测试 Nginx 代理
curl -i https://game.n1komajor.top/api/health
```

### WebSocket 连接失败

```bash
# 检查 Nginx WebSocket 配置
grep -A 10 "location /ws" /etc/nginx/sites-enabled/*

# 确认 Upgrade 头正确转发
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://game.n1komajor.top/ws
```

---

## 七、当前状态说明

### ✅ 已完成
- 后端完整实现并通过测试
- 前端 WebSocket 客户端骨架
- 大厅改为正式版文案
- systemd 服务配置
- 部署脚本模板

### ⏳ 未完成（需后续实现）
- 前端在线模式完整 UI（命令待确认遮罩、对手连接状态、结束结果显示）
- 大厅在线队列/房间 API 集成（需 HttpPlatformAdapter）
- 双客户端端到端测试

### 🔄 当前可用功能
- **前端单机模式**：可直接访问 `/games/cs-push` 进行本地 AI 对战
- **后端 API**：健康检查、认证、队列、房间接口已就绪
- **WebSocket**：服务端已实现权威对局，但前端 UI 未完全对接

---

## 八、验证步骤

### 前端验证（本地 AI 模式）
访问 https://game.n1komajor.top/games/cs-push 应能正常游玩单机版

### 后端 API 验证
```bash
# 1. 健康检查
curl https://game.n1komajor.top/api/health

# 2. 创建游客会话
curl -i -X POST https://game.n1komajor.top/api/auth/guest

# 3. 注册账号
curl -i -X POST https://game.n1komajor.top/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"测试用户","password":"test1234"}'
```

---

**部署完成后，前端可正常访问，后端 API 就绪。完整在线对战功能需补齐前端 UI 对接和大厅集成。**
