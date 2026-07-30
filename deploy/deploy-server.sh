#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_USER="${DEPLOY_USER:-cs-party-deploy}"
DEPLOY_ROOT="/opt/cs-party-game"
SOURCE_DIR="$DEPLOY_ROOT/source"
SERVER_RELEASES_DIR="$DEPLOY_ROOT/releases-server"
CURRENT_SERVER_LINK="$DEPLOY_ROOT/current-server"
SERVER_ENV_FILE="$DEPLOY_ROOT/server.env"
SYSTEMD_SERVICE="/etc/systemd/system/cs-push-server.service"
NGINX_BACKEND_SNIPPET="/etc/nginx/snippets/cs-party-backend.conf"
DATABASE_NAME="${DATABASE_NAME:-cspa_main}"
DATABASE_USER="${DATABASE_USER:-cspa_app}"
KEEP_RELEASES=3
DOMAIN="${DOMAIN:-game.n1komajor.top}"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "请以 root 运行此脚本。"

install_postgresql() {
  if command -v psql >/dev/null 2>&1 && psql --version | grep -q "15"; then
    log "PostgreSQL 15 已安装，跳过"
    return
  fi
  log "安装 PostgreSQL 15"
  apt-get install -y postgresql-common
  /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-15
  systemctl enable --now postgresql
}

setup_database() {
  log "配置数据库和用户"
  if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DATABASE_NAME"; then
    sudo -u postgres psql -c "CREATE DATABASE $DATABASE_NAME;"
  fi
  if ! sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DATABASE_USER'" | grep -q 1; then
    local db_password
    db_password=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    sudo -u postgres psql -c "CREATE USER $DATABASE_USER WITH PASSWORD '$db_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DATABASE_NAME TO $DATABASE_USER;"
    export DATABASE_URL="postgresql://$DATABASE_USER:$db_password@localhost:5432/$DATABASE_NAME"
    log "数据库凭据已生成"
  else
    if [[ -f "$SERVER_ENV_FILE" ]]; then
      export DATABASE_URL=$(grep '^DATABASE_URL=' "$SERVER_ENV_FILE" | cut -d= -f2-)
      log "从已有环境文件加载数据库连接"
    else
      fail "数据库用户已存在但未找到连接字符串，请手动配置 $SERVER_ENV_FILE"
    fi
  fi
}

run_migrations() {
  log "执行数据库迁移"
  local migration_file="$SOURCE_DIR/server/migrations/001_initial.sql"
  [[ -f "$migration_file" ]] || fail "迁移文件不存在: $migration_file"
  
  # Check if migration has been run by checking for accounts table
  if sudo -u postgres psql -d "$DATABASE_NAME" -c "\dt accounts" 2>/dev/null | grep -q accounts; then
    log "数据库已初始化，跳过迁移"
  else
    log "首次运行迁移脚本"
    sudo -u postgres psql -d "$DATABASE_NAME" -f "$migration_file"
  fi

  log "授权数据库应用用户"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DATABASE_NAME" \
    -v app_user="$DATABASE_USER" <<'SQL'
GRANT USAGE, CREATE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO :"app_user";
SQL
}

build_server() {
  log "构建后端服务"
  local server_dir="$SOURCE_DIR/server"
  [[ -d "$server_dir" ]] || fail "后端目录不存在: $server_dir"
  
  sudo -u "$DEPLOY_USER" bash -lc "
    set -Eeuo pipefail
    cd '$server_dir'
    npm ci --no-audit --no-fund
    npm run build
    npm prune --omit=dev --no-audit --no-fund
  "
  
  [[ -f "$server_dir/dist/server/src/main.js" ]] || fail "后端构建失败，未生成入口文件"
}

publish_server_release() {
  local revision
  revision=$(sudo -u "$DEPLOY_USER" git -C "$SOURCE_DIR" rev-parse --short HEAD)
  local new_release="$SERVER_RELEASES_DIR/$(date -u +%Y%m%d%H%M%S)-$revision-server"
  
  log "发布后端版本 $(basename "$new_release")"
  mkdir -p "$new_release"
  rsync -a --delete "$SOURCE_DIR/server/dist/" "$new_release/dist/"
  mkdir -p "$new_release/dist/server/migrations"
  rsync -a "$SOURCE_DIR/server/migrations/" "$new_release/dist/server/migrations/"
  rsync -a "$SOURCE_DIR/server/node_modules/" "$new_release/node_modules/"
  rsync -a "$SOURCE_DIR/server/package.json" "$new_release/"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$new_release"
  
  ln -s "$new_release" "$CURRENT_SERVER_LINK.next"
  mv -Tf "$CURRENT_SERVER_LINK.next" "$CURRENT_SERVER_LINK"
}

generate_server_env() {
  if [[ -f "$SERVER_ENV_FILE" ]]; then
    log "服务器环境文件已存在，跳过生成"
    return
  fi
  
  log "生成服务器环境配置"
  local cookie_secret
  cookie_secret=$(openssl rand -base64 48 | tr -d '/+=' | head -c 32)
  
  cat > "$SERVER_ENV_FILE" <<EOF
DATABASE_URL=${DATABASE_URL}
COOKIE_SECRET=${cookie_secret}
SESSION_DAYS=30
RATE_LIMIT_MAX=120
HOST=127.0.0.1
PORT=3001
EOF
  
  chmod 600 "$SERVER_ENV_FILE"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$SERVER_ENV_FILE"
}

install_systemd_service() {
  log "安装 systemd 服务"
  local node_path
  node_path=$(which node)
  [[ -z "$node_path" ]] && fail "找不到 Node.js 可执行文件"
  
  # Generate service file with actual node path
  cat > "$SYSTEMD_SERVICE" <<EOF
[Unit]
Description=CS Party Arena Backend Server
After=network.target postgresql.service

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$CURRENT_SERVER_LINK
EnvironmentFile=$SERVER_ENV_FILE
ExecStart=$node_path $CURRENT_SERVER_LINK/dist/server/src/main.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEPLOY_ROOT

[Install]
WantedBy=multi-user.target
EOF
  
  systemctl daemon-reload
  systemctl enable cs-push-server
  systemctl restart cs-push-server
  sleep 3
  systemctl status cs-push-server --no-pager || fail "后端服务启动失败"
}

configure_nginx_backend() {
  log "配置 Nginx 后端代理"
  cat > "$NGINX_BACKEND_SNIPPET" <<'EOF'
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
EOF

  # Update main site config to include backend snippet
  local nginx_site="/etc/nginx/sites-available/cs-party-game"
  if [[ ! -f "$nginx_site" ]]; then
    log "Nginx 站点配置不存在，请先运行前端部署脚本"
    return 1
  fi
  
  if ! grep -q "cs-party-backend.conf" "$nginx_site"; then
    log "更新 Nginx 站点配置以包含后端路由"
    # Find the first server block and insert after server_name
    sed -i '/server_name.*'"$DOMAIN"'/a\    include /etc/nginx/snippets/cs-party-backend.conf;' "$nginx_site"
  fi
  
  nginx -t
  systemctl reload nginx
}

health_check_backend() {
  log "健康检查后端 API"
  local max_attempts=10
  local attempt=1
  local body

  while ((attempt <= max_attempts)); do
    if body=$(curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:3001/api/health") && grep -q '"status":"ok"' <<<"$body"; then
      if body=$(curl --fail --silent --show-error --max-time 10 "https://$DOMAIN/api/health") && grep -q '"status":"ok"' <<<"$body"; then
        log "后端本机及公网健康检查通过"
        return 0
      fi
    fi
    log "等待后端启动... ($attempt/$max_attempts)"
    sleep 2
    ((attempt++))
  done
  
  fail "后端健康检查失败"
}

cleanup_server_releases() {
  if [[ ! -d "$SERVER_RELEASES_DIR" ]]; then
    return
  fi
  
  mapfile -t releases < <(find "$SERVER_RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{print $2}')
  if ((${#releases[@]} > KEEP_RELEASES)); then
    log "清理旧后端版本，仅保留最近 $KEEP_RELEASES 个"
    printf '%s\0' "${releases[@]:KEEP_RELEASES}" | xargs -0r rm -rf
  fi
}

main() {
  mkdir -p "$SERVER_RELEASES_DIR"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SERVER_RELEASES_DIR"
  
  install_postgresql
  setup_database
  run_migrations
  build_server
  publish_server_release
  generate_server_env
  install_systemd_service
  configure_nginx_backend
  health_check_backend
  cleanup_server_releases
  
  log "后端部署完成"
  log "服务状态: systemctl status cs-push-server"
  log "查看日志: journalctl -u cs-push-server -f"
  log "健康检查: curl https://$DOMAIN/api/health"
}

# Only run if not being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
