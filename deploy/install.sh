#!/usr/bin/env bash
# AI Dad 一键安装（Ubuntu 22.04 / 24.04，root 用户执行）：
#   curl -fsSL https://raw.githubusercontent.com/jingwen00000-gif/ai-dad/main/deploy/install.sh | bash
# 可以重复执行：已有的密码不会被覆盖，只会拉取最新代码并重启。
# 想用自己的域名：API_DOMAIN=api.example.com bash install.sh（先把域名解析到这台服务器）
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jingwen00000-gif/ai-dad.git}"
APP_DIR="${APP_DIR:-/opt/ai-dad}"
WEB_ORIGIN="${WEB_ORIGIN:-https://jingwen00000-gif.github.io}"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m错误：%s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" = "0" ] || die "请用 root 用户执行（或在命令前加 sudo）"
command -v apt-get >/dev/null || die "这个脚本只支持 Ubuntu / Debian"

say "1/5 安装基础工具"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl openssl ca-certificates >/dev/null

if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  say "2/5 安装 Docker"
  curl -fsSL https://get.docker.com | sh
else
  say "2/5 Docker 已安装，跳过"
fi
systemctl enable --now docker >/dev/null 2>&1 || true

say "3/5 获取代码 → $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

ENV_FILE=deploy/.env
if [ ! -f "$ENV_FILE" ]; then
  say "4/5 生成配置和随机密码（$APP_DIR/$ENV_FILE）"
  if [ -z "${API_DOMAIN:-}" ]; then
    IP="$(curl -fsS --max-time 10 https://api.ipify.org || curl -fsS --max-time 10 https://ifconfig.me)"
    [ -n "$IP" ] || die "获取不到服务器公网 IP，请用 API_DOMAIN=你的域名 重新执行"
    API_DOMAIN="ai-dad.${IP//./-}.sslip.io"
  fi
  umask 077
  cat > "$ENV_FILE" <<CONF
API_DOMAIN=$API_DOMAIN
CORS_ORIGINS=$WEB_ORIGIN
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
ELEVENLABS_API_KEY=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
VOICE_DAILY_CHAR_LIMIT=20000
WX_APPID=
WX_SECRET=
CONF
else
  say "4/5 已有配置 $ENV_FILE，保留原来的密码"
fi
API_DOMAIN="$(grep '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"

say "5/5 构建并启动（第一次大约 3～6 分钟）"
docker compose -f deploy/docker-compose.yml --env-file "$ENV_FILE" up -d --build

printf '等待 HTTPS 证书和后端就绪'
for _ in $(seq 1 60); do
  # 用本机的 Caddy 检查（带正确的域名和证书），避免部分云服务器不能从内部访问自己的公网 IP
  if curl -fsS --max-time 5 --resolve "$API_DOMAIN:443:127.0.0.1" "https://$API_DOMAIN/health" >/dev/null 2>&1; then
    printf '\n\n\033[1;32m✅ 部署成功！\033[0m\n'
    printf '后端地址：https://%s\n' "$API_DOMAIN"
    printf '健康检查：https://%s/health\n\n' "$API_DOMAIN"
    printf '下一步：把上面的后端地址发给 Claude。\n'
    printf '添加 ElevenLabs 声音：编辑 %s/%s 填入 ELEVENLABS_API_KEY，然后执行 bash %s/deploy/update.sh\n' "$APP_DIR" "$ENV_FILE" "$APP_DIR"
    exit 0
  fi
  printf '.'
  sleep 5
done
printf '\n'
docker compose -f deploy/docker-compose.yml --env-file "$ENV_FILE" ps
die "5 分钟内没有就绪。最常见的原因：服务器防火墙 / 安全组没有放行 80 和 443 端口。放行后重新执行本脚本即可。"
