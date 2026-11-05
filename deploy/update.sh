#!/usr/bin/env bash
# 更新到最新代码并重启（数据不会丢失）：bash /opt/ai-dad/deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
docker image prune -f >/dev/null
docker compose -f deploy/docker-compose.yml --env-file deploy/.env ps
