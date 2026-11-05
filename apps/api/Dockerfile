# AI Dad 后端镜像。构建上下文是仓库根目录：
#   docker build -f apps/api/Dockerfile -t ai-dad-api .
# 同一个镜像既跑后端（node dist/main.js），也跑数据库迁移（prisma migrate deploy）。
# 用完整版 bookworm 镜像：自带 OpenSSL（Prisma 数据库引擎需要）和 CA 证书，构建时不用 apt 安装
FROM node:22-bookworm

# 可选：构建环境走需要自定义证书的代理时，用 --secret id=ca,src=证书文件 传入（正常服务器不需要）
RUN --mount=type=secret,id=ca,required=false \
  if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
  npm install -g pnpm@10.28.0

WORKDIR /app

# 先只拷依赖清单，依赖不变时可复用缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/miniapp/package.json apps/miniapp/
COPY apps/ios/package.json apps/ios/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-prompts/package.json packages/shared-prompts/
RUN --mount=type=secret,id=ca,required=false \
  if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
  pnpm install --frozen-lockfile --filter @cgo/api... --ignore-scripts

COPY infra infra
COPY apps/api apps/api

WORKDIR /app/apps/api
RUN --mount=type=secret,id=ca,required=false \
  if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
  pnpm exec prisma generate && pnpm build

ENV NODE_ENV=production \
    PORT=3000 \
    VOICE_STORAGE_DIR=/data/storage
RUN mkdir -p /data/storage && chown -R node:node /data /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
