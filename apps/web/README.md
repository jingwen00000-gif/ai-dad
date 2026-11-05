# apps/web — AI Dad Web MVP（高保真原型 V1）

Next.js 15（App Router）+ TypeScript + Tailwind CSS 4 + shadcn/ui 风格组件 + Zustand。
**全部假数据驱动**：数据在 `src/lib/mock-data.ts` / `src/lib/songs.ts`，交互状态存浏览器 localStorage（设置页可「Reset demo」）。

```bash
pnpm --filter @cgo/web dev     # http://localhost:3001
pnpm --filter @cgo/web build && pnpm --filter @cgo/web start
```

## 页面

| 路由 | 说明 |
|---|---|
| `/` | 首页：Parent Login / Enter Kid Mode |
| `/kid/home` | 孩子首页：爸爸头像、问候、“爸爸在哪”横幅、功能卡片 |
| `/kid/chat` | 和 Dad AI 聊天（文字；语音 V2） |
| `/kid/stories`、`/kid/stories/[id]` | 故事列表（按兴趣推荐）/ 播放器（逐段朗读高亮、点赞、听后问答写入 learning_events） |
| `/kid/growth` | 成长：阅读星级、单词数、本周新词、AI 评价、徽章（`#badges`） |
| `/kid/dad-location` | 爸爸在哪：城市、当地时间、天气、航线图、爸爸留言、爸爸的真实动态 |
| `/kid/sing`、`/kid/sing/[id]` | 儿歌：搜索、分类、专属歌（自动带孩子名字）、跟唱歌词高亮 |
| `/parent` | 家长概览 |
| `/parent/children` | 孩子档案：年龄、阶段、兴趣，可编辑 |
| `/parent/memories` | Dad Memory Vault：五类记忆，新增 / 删除，显示被哪个故事引用 |
| `/parent/reports` | 成长报告：概览、兴趣排行、阅读趋势、每周时长 |
| `/parent/settings` | 爸爸所在城市 / 状态 / 天气、给孩子留言、使用时长 |
| `/parent/avatar` | 爸爸形象：2D 卡通外观编辑，或上传 3D（VRM）形象 |

孩子模式右上角 🔒 是家长门：答对乘法题才能进入家长区。

## AI 爸爸虚拟形象

- **2D 卡通**（默认，`components/dad-avatar.tsx`）：纯 SVG + CSS 动画，离线可用。家长在 `/parent/avatar` 调肤色、发型、发色、眼镜、胡子、衣服。
- **3D**（`components/dad-avatar-3d.tsx`）：three.js + @pixiv/three-vrm 渲染 VRM 模型（如 VRoid Studio 导出）。
  家长在 `/parent/avatar` 上传 `.vrm`，文件存在本机 IndexedDB（`lib/vrm-store.ts`），只有选了 3D 才加载 three.js。
  3D 加载失败或设备不支持 WebGL 时自动退回 2D。
- 两者状态一致：`idle` 呼吸眨眼 · `waving` 挥手 · `listening` 歪头 · `thinking` 抬眼 · `talking` 口型 · `happy` 笑。
  聊天里：孩子输入时听、等回复时思考、回复时边读边对口型（右上角可静音）。
- 跟时间有关的内容（年龄、问候语）在浏览器挂载后再计算（`lib/use-mounted.ts`），避免与构建时预渲染的结果不一致。

## 原则（接真实数据时保持）

- **AI 不冒充真爸爸**：Dad AI 是“用爸爸声音的 AI 伙伴”，被问到时诚实回答（见 `src/lib/dad-replies.ts`）。
- **爸爸的留言和动态只来自爸爸本人**：AI 只负责用爸爸声音朗读，不代写、不编造“爸爸今天做了什么”。
- **位置只到城市**：不收集精确定位，距离由城市坐标计算。
- **歌曲版权**：只收录公有领域和原创歌曲；有版权的（如 You Are My Sunshine、数鸭子）需授权后再加。
  “爸爸唱歌”需要爸爸本人录音——声音克隆只能说话，不能唱歌。

## 接后端时需要的新表

| 前端类型 | 表 | 说明 |
|---|---|---|
| `DadMemory` | `dad_memories` | 属于家长（不是孩子）：category / title / content；可选 embedding 供故事检索 |
| `DadPresence` | `dad_presence` | user_id、city_code、status、weather、updated_at（**不存经纬度**） |
| `DadMessage` | `dad_messages` | user_id、child_id、text、voice_url、played_at |
| `DadActivityDay` | `dad_activity` | 爸爸的真实事件（听了故事、发了留言、手动记录） |
| `Song` | `songs` + `song_recordings` | license 字段必填；录音按爸爸存 |

## 说明

- shadcn/ui 组件按官方格式手写在 `src/components/ui/`（开发环境无法访问 ui.shadcn.com）。本地联网后可继续 `npx shadcn add <组件>`。
- 不使用 Google Fonts（大陆无法访问），用系统字体。
- 朗读用浏览器自带语音做占位；设备没有语音包时按阅读速度计时，流程不受影响。
