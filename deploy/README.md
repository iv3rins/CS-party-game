# Debian 12 部署

站点包含前端静态资源和后端 Fastify/PostgreSQL/WebSocket 服务。

## 发布架构

- **前端 SPA**: Nginx 静态托管，部署到 `/opt/cs-party-game/current`
- **后端服务**: systemd 常驻服务，监听 `127.0.0.1:3001`，提供 `/api/*` 和 `/ws` WebSocket
- **数据库**: PostgreSQL 15，数据库名 `cs_push`
- **反向代理**: Nginx 将 `/api/` 和 `/ws` 代理到后端

## 当前功能

- `CS推推` 支持本地 AI 演练（单机模式）
- `CS推推` 支持在线对战（通过 `?matchId=xxx&side=ct` 参数启用 WebSocket 客户端）
- 账号、会话、天梯、匹配队列由后端 PostgreSQL 持久化
- 跨设备实时对战通过 WebSocket 同步游戏状态

## 上线前准备

1. 将 `game.n1komajor.top` 的 DNS `A` 记录指向服务器公网 IPv4。
2. 在云服务器安全组中开放 TCP `22`、`80`、`443`；脚本会在已安装 UFW 时自动放行这三个端口。
3. 将包含 `deploy/deploy.sh` 的代码推送到公开 GitHub 仓库 `https://github.com/iv3rins/CS-party-game.git` 的 `main` 分支。
4. 确认服务器可以访问 GitHub、NodeSource、npm 和 Let's Encrypt。

## 首次部署

部署分为前端和后端两个独立步骤。

### 步骤 1: 部署前端 SPA

以 root 登录服务器：

```bash
ssh root@服务器公网IP
```

固定要发布的 Git 提交，下载脚本到文件并审阅后执行。不要把可变的 `main` 脚本直接管道给 root shell：

```bash
RELEASE_COMMIT="填写已推送的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy.sh"
less /tmp/cs-party-deploy.sh
DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh
```

脚本安装系统组件时使用 root 权限，但 Git、`npm ci`、lint、测试和构建均由无特权的 `cs-party-deploy` 用户执行。

首次运行会：

- 安装缺失的 Git、Nginx、Node.js 22、Certbot 和 rsync。
- 创建无特权构建用户 `cs-party-deploy`，避免 root 与 Git 工作区混用。
- 已安装 UFW 时放行 SSH、HTTP 和 HTTPS。
- 没有 Swap 时创建 1GB `/swapfile`。
- 克隆 `main` 分支到 `/opt/cs-party-game/source`。
- 执行 `npm ci`、lint、测试和生产构建。
- 将构建结果发布到版本化目录，并原子切换 `current` 软链接。
- 配置 Nginx SPA 路由，使 `/lobby`、`/games/cs-push` 和 `/games/cs-career` 可直接刷新。
- 为 `game.n1komajor.top` 申请 Let's Encrypt 证书并强制 HTTPS。
- 保留最近 5 个构建版本。

### 步骤 2: 部署后端服务

前端部署成功后，在同一服务器上部署后端：

```bash
RELEASE_COMMIT="相同的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy-server.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy-server.sh"
less /tmp/cs-party-deploy-server.sh
bash /tmp/cs-party-deploy-server.sh
```

后端部署会：

- 安装 PostgreSQL 15 并创建数据库 `cs_push` 和用户 `cs_push_user`
- 执行 `server/migrations/001_initial.sql` 初始化数据库表结构
- 在 `server/` 目录执行 `npm ci --omit=dev` 和 `npm run build`
- 将后端构建发布到 `/opt/cs-party-game/current-server`
- 生成 `/opt/cs-party-game/server.env`（包含 `DATABASE_URL`、32+ 字符 `COOKIE_SECRET`、`SESSION_DAYS=30`、`RATE_LIMIT_MAX=120`）
- 安装 systemd 服务 `cs-push-server.service` 并启动
- 更新 Nginx 配置片段，添加后端代理：
  - `/api/*` 代理到 `http://127.0.0.1:3001`
  - `/ws` WebSocket 代理到 `http://127.0.0.1:3001`
- 健康检查 `http://127.0.0.1:3001/api/health` 和 `https://$DOMAIN/api/health`
- 保留最近 3 个后端版本

## 后续更新

更新合并并推送到 `main` 后，使用新的完整提交哈希重复固定提交部署流程。

### 更新前端

```bash
RELEASE_COMMIT="新的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy.sh"
less /tmp/cs-party-deploy.sh
DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh
```

### 更新后端

```bash
RELEASE_COMMIT="新的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy-server.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy-server.sh"
less /tmp/cs-party-deploy-server.sh
bash /tmp/cs-party-deploy-server.sh
```

脚本会拉取最新提交。仅在以下情况执行 `npm ci`：

- `node_modules` 不存在。
- `package-lock.json` 内容发生变化。
- Node.js 主版本发生变化。

普通源码更新不会重复安装依赖。每次都会运行 lint 和 build；仓库包含测试文件时才运行 test：

```bash
npm run lint
# 存在 src/**/*.test.ts(x) 时执行 npm test
npm run build
```

构建失败时不会切换线上 `current` 版本。后端更新会自动重启 `cs-push-server` 服务。

## 常用检查

### 前端

```bash
systemctl status nginx
nginx -t
journalctl -u nginx -n 100 --no-pager
curl -I https://game.n1komajor.top/lobby
curl -I https://game.n1komajor.top/games/cs-push
curl -I https://game.n1komajor.top/games/cs-career
readlink -f /opt/cs-party-game/current
```

三个 URL 都应返回 `200`，并且直接刷新游戏路径不能出现 Nginx `404`。

### 后端

```bash
systemctl status cs-push-server
journalctl -u cs-push-server -n 100 --no-pager
journalctl -u cs-push-server -f  # 实时日志
curl http://127.0.0.1:3001/api/health
curl https://game.n1komajor.top/api/health
readlink -f /opt/cs-party-game/current-server
cat /opt/cs-party-game/server.env  # 查看配置（包含敏感信息）
```

后端服务应处于 `active (running)` 状态，健康检查返回 `{"status":"ok"}`。

### 数据库

```bash
sudo -u postgres psql -d cs_push -c "\dt"  # 查看表结构
sudo -u postgres psql -d cs_push -c "SELECT COUNT(*) FROM accounts;"  # 账号数
sudo -u postgres psql -d cs_push -c "SELECT COUNT(*) FROM matches WHERE status='playing';"  # 进行中对局
```

## 本次部署命令

在本机连接服务器后执行：

```bash
ssh root@你的服务器公网IP
RELEASE_COMMIT="填写已推送的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy.sh"
less /tmp/cs-party-deploy.sh
DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh
```

若服务器禁止 root SSH，请以普通管理用户登录，审阅脚本后使用：

```bash
sudo env DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh
```

源码位于 `/opt/cs-party-game/source`，线上静态文件通过 `/opt/cs-party-game/current` 指向最近一次成功发布。
