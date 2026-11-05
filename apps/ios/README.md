# apps/ios — AI Dad iPhone App（Capacitor 原生外壳）

把 Web 原型（`apps/web` 的单文件离线版）装进一个原生 iOS App：有自己的图标和启动图，全屏、离线可用。
**编译和安装必须在 Mac + Xcode 上进行。**

## 第一次装到自己的 iPhone（免费 Apple ID 即可）

1. Mac 上从 App Store 安装 **Xcode**，打开一次，同意协议。
2. 在仓库根目录：

```bash
pnpm install
```

```bash
pnpm --filter @cgo/ios sync
```

```bash
pnpm --filter @cgo/ios open
```

3. Xcode 打开后，左侧点 **App** → 中间选 **Signing & Capabilities**：
   - **Team**：选你的 Apple ID（没有就点 Add Account 登录，免费的 Personal Team 就行）
   - **Bundle Identifier**：改成独一无二的，例如 `com.你的名字.aidad`
4. iPhone 用数据线连 Mac，顶部设备列表选你的 iPhone，点 ▶ 运行。
5. 第一次在 iPhone 上要：
   - 设置 → 隐私与安全性 → **开发者模式** 打开（会重启）
   - 设置 → 通用 → **VPN与设备管理** → 信任你的开发者证书

> 免费 Apple ID 装的 App **7 天后会失效**，需要重新连 Mac 运行一次。
> 付费开发者账号（99 美元/年）可以用 **TestFlight** 发给家人，每个版本有效 90 天，不用数据线。

## 改了原型之后

```bash
pnpm --filter @cgo/ios sync
```

然后在 Xcode 里重新点 ▶。（`sync` 会重新打包 Web 原型并拷进 iOS 工程。）

## 上架 App Store 之前要知道

- 现在的 App 只是原型外壳 + 假数据，按 App Store 审核规则 4.2（功能过少的网页套壳）**大概率被拒**。接上真实后端、语音等原生能力后再提交。
- 中国区 App Store 的生成式 AI 类 App 需要提供备案信息。
- 面向儿童的 App 有额外的隐私和第三方 SDK 要求。

## 目录

| 路径 | 说明 |
|---|---|
| `capacitor.config.ts` | App 名称、Bundle ID、Web 目录 |
| `www/index.html` | 由 `pnpm web` 从 `apps/web` 生成，不要手改 |
| `ios/App/` | Xcode 工程（Swift Package Manager，不需要 CocoaPods） |
| `ios/App/App/Assets.xcassets/` | App 图标（1024×1024）和启动图 |
