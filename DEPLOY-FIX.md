# CS-Push 匹配与房间功能修复部署指南

## 问题描述

匹配和创建房间时出现错误：`Unexpected token '<', "<!doctype "... is not valid JSON`

## 根本原因

1. **开发环境**：缺少 `vite.config.ts`，导致 `/api/*` 请求返回 HTML 而不是代理到后端
2. **生产环境**：Nginx 没有正确配置 `/api/` 和 `/ws` 反向代理到后端服务

## 已修复内容

### 前端修复

1. **新增 `vite.config.ts`**
   - 开发时自动代理 `/api` → `http://127.0.0.1:3001`
   - 开发时自动代理 `/ws` → `http://127.0.0.1:3001`（WebSocket）
   - 支持通过 `VITE_MULTIPLAYER_SERVER` 环境变量自定义后端地址

2. **改进 `src/platform.ts`**
   - `OnlinePlatformAdapter` 检测 HTML 回退页
   - 明确报错"多人服务路由未配置"而不是"Unexpected token '<'"
   - 对非 JSON 响应和无效 JSON 增加专门处理

3. **新增测试覆盖**
   - 验证 HTML 回退检测逻辑
   - 验证正常 JSON 响应流程

### 后端修复

1. **改进 `server/src/main.ts`**
   - 支持 `DATABASE_URL=memory://` 本地开发模式（无需 PostgreSQL）
   - 自动加载 `.env` 配置文件

2. **改进 `deploy/deploy-server.sh`**
   - 在 `server_name` 行后插入后端代理配置，更健壮
   - 增加 Nginx 配置文件存在性检查
   - 健康检查同时验证本机和公网 `/api/health` 的 JSON 响应
   - 增加代理超时配置（API 60s，WebSocket 300s）

## 部署步骤

### 1. 提交并推送代码

```bash
git add .
git commit -m "fix: 修复匹配与房间 API 路由配置问题"
git push origin main
```

### 2. 记录提交哈希

```bash
git rev-parse HEAD
# 复制完整的 40 位哈希
```

### 3. 登录服务器重新部署

**重要：必须先部署前端，再部署后端**

```bash
ssh root@你的服务器IP

# 3.1 部署前端
RELEASE_COMMIT="刚才复制的完整哈希"
curl -fsSLo /tmp/cs-party-deploy.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy.sh"
DEPLOY_COMMIT="$RELEASE_COMMIT" bash /tmp/cs-party-deploy.sh

# 3.2 部署后端
curl -fsSLo /tmp/cs-party-deploy-server.sh \
  "https://raw.githubusercontent.com/iv3rins/CS-party-game/$RELEASE_COMMIT/deploy/deploy-server.sh"
bash /tmp/cs-party-deploy-server.sh
```

### 4. 验证部署

```bash
# 检查后端服务状态
systemctl status cs-push-server

# 检查后端本地健康
curl http://127.0.0.1:3001/api/health
# 应该返回: {"status":"ok"}

# 检查 Nginx 配置
nginx -t
cat /etc/nginx/snippets/cs-party-backend.conf
grep -n "cs-party-backend.conf" /etc/nginx/sites-available/cs-party-game

# 检查公网 API
curl https://game.n1k0major.top/api/health
# 应该返回: {"status":"ok"}

# 测试游客会话创建
curl -i -X POST https://game.n1k0major.top/api/auth/guest
# 应该返回 200 和 JSON，包含 Set-Cookie
```

### 5. 浏览器验证

1. 访问 `https://game.n1k0major.top/lobby`
2. 选择 **CS推推**
3. 点击 **快速匹配** 或 **创建房间**
4. 应该显示"正在匹配..."或房间创建成功，而不是报错

## 本地开发

### 启动后端（内存模式，无需 PostgreSQL）

```bash
cd server
npm install
npm run dev
# 后端运行在 http://127.0.0.1:3001
```

### 启动前端

在另一个终端：

```bash
npm run dev
# 前端运行在 http://localhost:5173
# Vite 自动代理 /api 和 /ws 到后端
```

## 常见问题

### Q: 部署后仍然报错"多人服务路由未配置"

**A:** 检查 Nginx 配置是否正确包含后端代理：

```bash
grep -A 5 "location /api/" /etc/nginx/snippets/cs-party-backend.conf
grep "cs-party-backend.conf" /etc/nginx/sites-available/cs-party-game
nginx -t
systemctl reload nginx
```

### Q: 后端服务无法启动

**A:** 检查日志和数据库连接：

```bash
journalctl -u cs-push-server -n 50
cat /opt/cs-party-game/server.env
sudo -u postgres psql -d cspa_main -c "\dt"
```

### Q: 本地开发时仍然报错

**A:** 确认后端已启动并监听 3001 端口：

```bash
curl http://127.0.0.1:3001/api/health
lsof -i :3001  # Linux/Mac
netstat -an | findstr :3001  # Windows
```

## 技术细节

### Vite 代理配置

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    '/ws': { target: 'http://127.0.0.1:3001', changeOrigin: true, ws: true },
  },
}
```

### Nginx 反向代理配置

```nginx
# /etc/nginx/snippets/cs-party-backend.conf
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Cookie $http_cookie;
    proxy_read_timeout 60s;
}

location /ws {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
}
```

### 错误检测逻辑

```typescript
// src/platform.ts
private async parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(response.ok
      ? '多人服务路由未配置：服务器返回了网页而不是 JSON'
      : `多人服务不可用 (${response.status})`);
  }
  return await response.json() as T;
}
```

## 验证清单

- [ ] 前端 lint 通过
- [ ] 前端测试通过（106 tests）
- [ ] 前端构建成功
- [ ] 后端 lint 通过
- [ ] 后端测试通过（28 tests）
- [ ] 后端构建成功
- [ ] 后端服务在生产环境正常运行
- [ ] `/api/health` 返回 JSON
- [ ] 匹配功能正常
- [ ] 创建房间功能正常
- [ ] WebSocket 连接正常
