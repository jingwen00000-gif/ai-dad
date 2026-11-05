#!/usr/bin/env bash
# 备份数据库到 deploy/backups/，保留最近 14 份。建议每天自动执行：
#   (crontab -l 2>/dev/null; echo "30 3 * * * bash /opt/ai-dad/deploy/backup.sh") | crontab -
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups
file="backups/ai-dad-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose -f docker-compose.yml --env-file .env exec -T postgres pg_dump -U ai_dad ai_dad | gzip > "$file"
ls -1t backups/*.sql.gz | tail -n +15 | xargs -r rm --
echo "备份完成：$(pwd)/$file"
