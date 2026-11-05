# 部署 AI Dad 后端（一台服务器，约 15 分钟）

部署后得到一个 HTTPS 后端地址，例如 `https://ai-dad.47-1-2-3.sslip.io`。
包含：PostgreSQL（数据）、Redis、后端 API、Caddy（自动 HTTPS 证书）。只开放 80 / 443 端口。

## 1. 买一台服务器

推荐 **阿里云 / 腾讯云「轻量应用服务器」香港地域**（大陆和澳洲都能访问，不需要 ICP 备案）：

| 项目 | 选择 |
|---|---|
| 地域 | 中国香港 |
| 镜像 | 系统镜像 **Ubuntu 24.04**（或 22.04） |
| 套餐 | 2 核 2GB 内存、40GB 以上硬盘即可 |

## 2. 放行 80 和 443 端口

控制台 → 这台服务器 →「防火墙」（阿里云 ECS 叫「安全组」）→ 添加规则：TCP **80**、TCP **443**，来源 `0.0.0.0/0`。
（HTTPS 证书要通过 80/443 申请，不放行会部署失败。）

## 3. 一条命令安装

控制台里点「远程连接」/「登录」打开网页终端（root 用户），粘贴：

```bash
curl -fsSL https://raw.githubusercontent.com/jingwen00000-gif/ai-dad/main/deploy/install.sh | bash
```

大约 3～6 分钟，最后显示「✅ 部署成功」和后端地址。把后端地址发给 Claude，用来连接网页版。

脚本做的事：安装 Docker → 下载代码到 `/opt/ai-dad` → 生成随机密码到 `/opt/ai-dad/deploy/.env` → 启动全部服务 → 自动申请 HTTPS 证书。
可以重复执行，不会覆盖已有密码和数据。

有自己的域名时（先把域名解析到服务器 IP）：

```bash
curl -fsSL https://raw.githubusercontent.com/jingwen00000-gif/ai-dad/main/deploy/install.sh | API_DOMAIN=api.example.com bash
```

## 4. 填入 ElevenLabs（家人声音）

```bash
nano /opt/ai-dad/deploy/.env
```

在 `ELEVENLABS_API_KEY=` 后面粘贴 API Key，保存（Ctrl+O 回车，Ctrl+X 退出），然后：

```bash
bash /opt/ai-dad/deploy/update.sh
```

## 日常维护

更新到最新代码（数据保留）：

```bash
bash /opt/ai-dad/deploy/update.sh
```

立即备份数据库：

```bash
bash /opt/ai-dad/deploy/backup.sh
```

每天凌晨 3:30 自动备份（保留最近 14 份）：

```bash
(crontab -l 2>/dev/null; echo "30 3 * * * bash /opt/ai-dad/deploy/backup.sh") | crontab -
```

查看运行状态和日志：

```bash
cd /opt/ai-dad && docker compose -f deploy/docker-compose.yml --env-file deploy/.env ps
```

```bash
cd /opt/ai-dad && docker compose -f deploy/docker-compose.yml --env-file deploy/.env logs --tail 100 api
```

## 常见问题

- **一直等不到「部署成功」**：九成是 80/443 没放行（第 2 步）。放行后重新执行安装命令。
- **`.env` 里的密码**：只在服务器上，不在 GitHub 上；不要发到聊天里。
- **sslip.io 是什么**：免费的 DNS 服务，把 `xxx.47-1-2-3.sslip.io` 指向 IP `47.1.2.3`，这样不买域名也能有 HTTPS。
