# Child Growth OS（AI爸爸）

儿童双语成长 AI 陪伴：微信小程序 + NestJS + PostgreSQL。

## 目录

```
apps/
  api/            NestJS 12（ESM）+ Prisma 6 + Redis + JWT
  miniapp/        微信小程序（Taro 4 + React），见 apps/miniapp/README.md
  web/            Web MVP 高保真原型（Next.js 15，假数据），见 apps/web/README.md
                  手机桌面 App（PWA）：见 apps/web/PWA.md
  ios/            iPhone 原生外壳（Capacitor，需要 Mac + Xcode），见 apps/ios/README.md
packages/
  shared-types/   前后端共享取值类型（与数据库 CHECK 约束一致）
  shared-prompts/ Prompt 模板（Sprint 3）
infra/
  sql/            数据库迁移（唯一真源）+ seed/
  docker/         本地 Postgres 15(pgvector) + Redis 7 + Adminer
  docs/
```

## 本地启动

需要 Node 22+、pnpm 10、Docker。

```bash
pnpm install
pnpm db:up                       # 启动 Postgres / Redis / Adminer(http://localhost:8080)
cp apps/api/.env.example apps/api/.env
pnpm db:migrate                  # prisma migrate dev，应用 infra/sql 下的迁移
pnpm db:seed                     # 写入兴趣字典（恐龙、消防车、机器人、太空…）
pnpm dev:api                     # http://localhost:3000/health
```

测试：

```bash
pnpm --filter @cgo/api test       # 单元测试
pnpm --filter @cgo/api test:e2e   # 需要数据库和 Redis 已启动
```

## API（Sprint 1-2）

除标注「公开」外，都需要 `Authorization: Bearer <accessToken>`。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/wx-login | 公开。`{ code }` → `{ accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn, isNewUser }`。首次登录自动注册 |
| POST | /auth/refresh | 公开。`{ refreshToken }` → 新的一对 token；旧 refresh token 立即作废 |
| POST | /auth/logout | 公开。`{ refreshToken }` → 204 |
| GET | /auth/me | 当前家长 |
| GET | /children | 我的孩子（含 ageMonths / ageYears / ageStage / interests） |
| GET | /children/:id | 单个孩子；别人的孩子返回 404 |
| POST | /children | `{ nickname, birthday: "YYYY-MM-DD", gender? }`。最多 5 个，年龄 1-14 岁 |
| PATCH | /children/:id | 部分更新 |
| DELETE | /children/:id | 软删除 |
| GET | /interests | 兴趣字典：分类 → 标签 |
| GET | /children/:id/interests | 孩子的兴趣（按权重从高到低） |
| PUT | /children/:id/interests | `{ tagIds: [...] }` 整体替换，最多 8 个。新增权重 3；已有的保留权重 |
| GET | /voice/profiles | 家人的声音列表（爸爸 / 妈妈 / 奶奶 / 爷爷） |
| POST | /voice/profiles | `{ provider: "elevenlabs", voiceId, voiceName, relation?, language?, isDefault?, consent: true }`。会向服务商确认 Voice ID 存在；第一个自动设为默认 |
| POST | /voice/profiles/:id/default | 设为默认声音 |
| DELETE | /voice/profiles/:id | 删除声音及其生成过的音频 |
| POST | /voice/generate | `{ text, voiceProfileId? }` → `{ audioUrl, expiresAt, cached, characters }`。同一声音同一段文字只生成一次；每天有字数上限 |
| GET | /voice/audio/:id?exp&sig | 公开，凭签名播放 mp3（支持 Range，iPhone Safari 需要） |
| GET | /health | 公开。数据库 / Redis 状态 |

本地开发 `.env` 默认 `WX_MOCK_LOGIN=true`：不请求微信，openid = `mock_` + code，可以直接用 curl 或 H5 预览联调。
`NODE_ENV=production` 时开启 mock 会拒绝启动。

## 语音（家人声音）

1. 在 ElevenLabs 克隆声音（Voice Lab → Add Voice → Instant Voice Clone），复制 Voice ID。
2. `apps/api/.env` 填 `ELEVENLABS_API_KEY`（不填时语音接口返回 503）。
3. `POST /voice/profiles` 保存 Voice ID；之后故事、聊天调用 `VoiceService.synthesize()` 或 `POST /voice/generate`。

只存 Voice ID，不存声音模型。客户端传的是我们自己的 `voiceProfileId`（服务端校验归属），不直接传服务商的 voice_id。
换服务商（豆包 / CosyVoice）：实现 `src/voice/providers/voice-provider.ts` 里的 `VoiceProvider`，在 `VoiceProviderRegistry` 注册。
音频开发时存在 `apps/api/storage/`；上线换成 COS / OSS（实现 `AudioStorage`）。

## 数据库迁移的约定

- **SQL 是唯一真源**：`infra/sql/00X_*.sql`。`apps/api/prisma/migrations/00X_*/migration.sql` 是指向它们的符号链接。
  Windows 上克隆前需要 `git config --global core.symlinks true`（并开启开发者模式），否则链接会变成纯文本文件。
- 新增迁移：写 `infra/sql/004_xxx.sql` → 建目录 `apps/api/prisma/migrations/004_xxx/` 并链接 → `pnpm db:migrate`
  → `npx prisma db pull` 后按现有风格（PascalCase 模型 + `@@map`）整理 schema.prisma。
- **schema.prisma 必须映射全部表**。只映射部分表时，`prisma migrate dev` 会认为其余表多余并生成 `DROP TABLE`。
- CHECK 约束、RLS、触发器、视图 `children_view` 只存在于 SQL 中，Prisma 不感知，这是预期行为。

## 已冻结的决定（V1）

- 年龄：生日实时计算月龄，`children_view` 提供 age_months / age_years / age_stage(S1–S4)。
- 所有表开启 RLS 且不建策略：只有后端（表 owner）能访问。即使部署到 Supabase，也不会通过 REST 暴露。
- 大模型：通过 Provider 接口接入国产已备案模型（DeepSeek / 通义千问）。
- 暂缓的表：consents、level_history、interest_signals、story_words、story_answers、moderation_logs。
  在对应 Sprint 再加；**consents 必须在给外部家庭内测前加上**。

## 路线

| Sprint | 天数 | 内容 |
|---|---|---|
| 1 ✅ | 3 | 微信登录（openid → JWT + refresh token）、孩子档案增改 |
| 2 ✅ | 3 | 兴趣选择 |
| 3 | 5 | `POST /stories` 故事生成 |
| 4 | 5 | child_vocab 双语成长 |
| 5 | 7 | 记忆引擎 |

30 天目标：**10 个孩子连续使用 7 天**。
