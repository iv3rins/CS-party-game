# Debian 12 部署

站点以 Nginx 静态文件部署，不运行常驻 Node 服务。

## 当前发布性质

当前发布为 **CS Party Arena 前端体验版**：

- `CS推推` 可进行本地 AI 演练。
- 账号、偏好、天梯和近期战绩保存在当前浏览器 `localStorage`。
- 匹配与房间为本地模拟流程，不连接其他设备；内存房间刷新后消失。
- 排行榜不是服务器全局榜单，对局结果也不是服务端权威结算。

因此本脚本只部署前端静态资源。真实多人、跨设备房间和权威天梯需要后续 Fastify/PostgreSQL/WebSocket 服务，不能仅靠本脚本实现。

## 上线前准备

1. 将 `game.n1komajor.top` 的 DNS `A` 记录指向服务器公网 IPv4。
2. 在云服务器安全组中开放 TCP `22`、`80`、`443`；脚本会在已安装 UFW 时自动放行这三个端口。
3. 将包含 `deploy/deploy.sh` 的代码推送到公开 GitHub 仓库 `https://github.com/iv3rins/CS-party-game.git` 的 `main` 分支。
4. 确认服务器可以访问 GitHub、NodeSource、npm 和 Let's Encrypt。

## 首次部署

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

## 后续更新

更新合并并推送到 `main` 后，使用新的完整提交哈希重复固定提交部署流程：

```bash
RELEASE_COMMIT="新的完整提交哈希"
curl -fsSLo /tmp/cs-party-deploy.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy.sh"
less /tmp/cs-party-deploy.sh
DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh
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

构建失败时不会切换线上 `current` 版本。

## 常用检查

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
