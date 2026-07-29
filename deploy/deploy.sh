#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/iv3rins/CS-party-game.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_COMMIT="${DEPLOY_COMMIT:-}"
DOMAIN="${DOMAIN:-game.n1komajor.top}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-iverins.user@gmail.com}"
DEPLOY_USER="${DEPLOY_USER:-cs-party-deploy}"
DEPLOY_ROOT="/opt/cs-party-game"
SOURCE_DIR="$DEPLOY_ROOT/source"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
DEPENDENCY_STAMP="$DEPLOY_ROOT/.dependency-stamp"
NGINX_SITE="/etc/nginx/sites-available/cs-party-game"
NGINX_SNIPPET="/etc/nginx/snippets/cs-party-game.conf"
KEEP_RELEASES=5

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "请以 root 运行此脚本。"

install_system_packages() {
  local packages=(ca-certificates curl git gnupg nginx rsync certbot python3-certbot-nginx)
  local missing=()
  for package in "${packages[@]}"; do
    dpkg -s "$package" >/dev/null 2>&1 || missing+=("$package")
  done
  if ((${#missing[@]})); then
    log "安装系统依赖: ${missing[*]}"
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y "${missing[@]}"
  else
    log "系统依赖已安装，跳过"
  fi
}

install_node() {
  if command -v node >/dev/null 2>&1 && node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20 || (a===20 && b>=19) ? 0 : 1)'; then
    log "Node.js $(node -v) 满足要求，跳过安装"
    return
  fi
  log "安装 Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
}

ensure_deploy_user() {
  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    log "创建无特权构建用户 $DEPLOY_USER"
    useradd --system --create-home --shell /bin/bash "$DEPLOY_USER"
  fi
  mkdir -p "$DEPLOY_ROOT" "$RELEASES_DIR"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_ROOT"
}

as_deploy_user() {
  runuser -u "$DEPLOY_USER" -- "$@"
}

ensure_swap() {
  if [[ -n $(swapon --show --noheadings 2>/dev/null) ]]; then
    log "Swap 已启用，跳过创建"
    return
  fi
  log "未检测到 Swap，创建 1GB /swapfile"
  if fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
    grep -qF '/swapfile none swap sw 0 0' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
  else
    rm -f /swapfile
    printf 'WARNING: Swap 创建失败，将继续部署。\n' >&2
  fi
}

update_source() {
  if [[ ! -d "$SOURCE_DIR/.git" ]]; then
    log "首次克隆仓库"
    as_deploy_user git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$SOURCE_DIR"
  else
    log "更新 Git 仓库到 origin/$BRANCH"
    as_deploy_user git -C "$SOURCE_DIR" fetch --prune origin "$BRANCH"
  fi

  if [[ -n "$DEPLOY_COMMIT" ]]; then
    log "固定部署提交 $DEPLOY_COMMIT"
    as_deploy_user git -C "$SOURCE_DIR" fetch --prune origin "$DEPLOY_COMMIT" || true
    as_deploy_user git -C "$SOURCE_DIR" checkout --detach "$DEPLOY_COMMIT"
  else
    as_deploy_user git -C "$SOURCE_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
    as_deploy_user git -C "$SOURCE_DIR" reset --hard "origin/$BRANCH"
  fi
}

install_project_dependencies() {
  [[ -f "$SOURCE_DIR/package-lock.json" ]] || fail "仓库缺少 package-lock.json"
  local node_major fingerprint previous=""
  node_major=$(node -p 'process.versions.node.split(".")[0]')
  fingerprint=$(printf '%s:%s' "$(sha256sum "$SOURCE_DIR/package-lock.json" | awk '{print $1}')" "$node_major")
  [[ -f "$DEPENDENCY_STAMP" ]] && previous=$(<"$DEPENDENCY_STAMP")

  if [[ ! -d "$SOURCE_DIR/node_modules" || "$fingerprint" != "$previous" ]]; then
    log "依赖首次安装或锁文件已变化，执行 npm ci"
    as_deploy_user bash -lc "cd '$SOURCE_DIR' && npm ci --no-audit --no-fund"
    printf '%s\n' "$fingerprint" > "$DEPENDENCY_STAMP"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPENDENCY_STAMP"
  else
    log "依赖未变化，跳过 npm ci"
  fi
}

validate_and_build() {
  log "执行 lint、test 和生产构建"
  as_deploy_user bash -lc "
    set -Eeuo pipefail
    cd '$SOURCE_DIR'
    export CI=1 NODE_OPTIONS='--max-old-space-size=768'
    npm run lint
    if find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print -quit | grep -q .; then
      npm test
    else
      printf 'No test files in repository; skipping npm test.\n'
    fi
    npm run build
  "
  [[ -f "$SOURCE_DIR/dist/index.html" ]] || fail "构建未生成 dist/index.html"
}

configure_firewall() {
  if ! command -v ufw >/dev/null 2>&1; then
    log "未安装 UFW，跳过本机防火墙配置；请确认云安全组放行 80/443"
    return
  fi
  log "放行 SSH、HTTP 和 HTTPS"
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  if ufw status | grep -q '^Status: inactive'; then
    ufw --force enable >/dev/null
  fi
}

configure_nginx() {
  log "配置 Nginx SPA 路由和静态缓存"
  cat > "$NGINX_SNIPPET" <<EOF
root $CURRENT_LINK;
index index.html;

location = /index.html {
    add_header Cache-Control "no-cache";
}

location /assets/ {
    try_files \$uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    try_files \$uri \$uri/ /index.html;
}

add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

  if [[ ! -f "$NGINX_SITE" ]]; then
    cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    include $NGINX_SNIPPET;
}
EOF
  fi

  ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/cs-party-game
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
}

OLD_TARGET=""
NEW_RELEASE=""

publish_release() {
  local revision
  revision=$(as_deploy_user git -C "$SOURCE_DIR" rev-parse --short HEAD)
  NEW_RELEASE="$RELEASES_DIR/$(date -u +%Y%m%d%H%M%S)-$revision"
  [[ -L "$CURRENT_LINK" ]] && OLD_TARGET=$(readlink -f "$CURRENT_LINK")

  log "发布版本 $(basename "$NEW_RELEASE")"
  mkdir -p "$NEW_RELEASE"
  rsync -a --delete "$SOURCE_DIR/dist/" "$NEW_RELEASE/"
  chown -R root:root "$NEW_RELEASE"
  ln -s "$NEW_RELEASE" "$CURRENT_LINK.next"
  mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
}

rollback_release() {
  log "发布验证失败，回滚 current 链接"
  if [[ -n "$OLD_TARGET" ]]; then
    ln -sfn "$OLD_TARGET" "$CURRENT_LINK"
  else
    rm -f "$CURRENT_LINK"
  fi
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}

configure_https() {
  log "安装或续用 HTTPS 证书并确认 Nginx TLS 配置"
  certbot --nginx --non-interactive --agree-tos --redirect --keep-until-expiring \
    --email "$LETSENCRYPT_EMAIL" --domains "$DOMAIN"
}

cleanup_releases() {
  mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{print $2}')
  if ((${#releases[@]} > KEEP_RELEASES)); then
    log "清理旧版本，仅保留最近 $KEEP_RELEASES 个"
    printf '%s\0' "${releases[@]:KEEP_RELEASES}" | xargs -0r rm -rf
  fi
}

health_check() {
  log "检查线上 SPA 路由和哈希资源"
  local path body asset
  for path in /lobby /games/cs-push /games/cs-career; do
    body=$(curl --fail --silent --show-error --location --max-time 20 "https://$DOMAIN$path") || return 1
    grep -q '<div id="root"></div>' <<<"$body" || return 1
    grep -q 'src="/assets/index-' <<<"$body" || return 1
  done
  asset=$(grep -o 'src="/assets/index-[^"]*\.js"' <<<"$body" | head -n1 | cut -d'"' -f2)
  [[ -n "$asset" ]] || return 1
  curl --fail --silent --show-error --max-time 20 "https://$DOMAIN$asset" >/dev/null || return 1
}

activate_and_verify() {
  systemctl enable --now nginx
  nginx -t
  systemctl reload nginx
  configure_https
  nginx -t
  systemctl reload nginx
  health_check
}

main() {
  install_system_packages
  install_node
  ensure_deploy_user
  ensure_swap
  update_source
  install_project_dependencies
  validate_and_build
  configure_firewall
  configure_nginx
  publish_release
  if ! activate_and_verify; then
    rollback_release
    fail "HTTPS、Nginx 或线上健康检查失败，已回滚发布"
  fi
  cleanup_releases
  log "部署完成: https://$DOMAIN/lobby"
}

main "$@"
