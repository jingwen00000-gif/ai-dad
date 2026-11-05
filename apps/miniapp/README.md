# apps/miniapp — AI爸爸 微信小程序（Taro 4 + React + TypeScript）

## 已完成（Sprint 1-2）

- 启动即静默微信登录（`wx.login` → 后端 `/auth/wx-login`），token 存本地
- access token 过期自动用 refresh token 换新；refresh 也失效则自动重新登录（并发请求只登录 / 刷新一次）
- 首页：孩子列表（年龄如「5岁10个月 · 探索营」），空状态，最多 5 个孩子
- 添加 / 编辑 / 删除孩子：昵称、生日（日期选择器）、性别
- 兴趣选择（`pages/child-interests`）：新建孩子后直接进入；编辑页「兴趣爱好」入口；首页卡片显示兴趣

代码：`src/services/http.ts`（登录与请求）、`src/services/children.ts`、`src/pages/index`、`src/pages/child-edit`。

## 在微信开发者工具里跑起来

1. 先启动后端（仓库根目录 README）。
2. 用自己的小程序 AppID：改 `project.config.json` 的 `appid`（现在是 `touristappid` 游客模式，拿不到真实 openid）。
3. 后端 `apps/api/.env` 里设 `WX_MOCK_LOGIN=false`，并填 `WX_APPID`、`WX_SECRET`（小程序后台 → 开发管理 → 开发设置）。
4. 编译：

```bash
pnpm --filter @cgo/miniapp dev:weapp
```

5. 微信开发者工具导入 `apps/miniapp` 目录。在「详情 → 本地设置」勾选 **不校验合法域名**（才能访问 `http://localhost:3000`）。

真机预览：手机访问不到电脑的 localhost。把 `.env.development` 的 `TARO_APP_API_BASE` 改成电脑的局域网 IP（如 `http://192.168.1.8:3000`），手机和电脑连同一个 Wi-Fi，并在真机调试里打开「不校验合法域名」。正式发布必须用已备案的 https 域名，并加入小程序后台 request 合法域名。

## 浏览器里预览（不需要 AppID）

后端保持 `WX_MOCK_LOGIN=true`，然后：

```bash
cd apps/miniapp
npx taro build --type h5 --mode development --watch
```

用任意静态服务器打开 `apps/miniapp/dist`（如 `python3 -m http.server 10086 -d dist`）。H5 没有 `wx.login`，会用浏览器本地的开发 code 登录。
