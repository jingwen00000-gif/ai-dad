import type { CapacitorConfig } from "@capacitor/cli";

/**
 * AI Dad iOS 外壳：把 Web 原型（单文件离线版）装进原生 App。
 * appId 是 App 的唯一标识；上架或用自己的开发者账号签名时，改成你自己的反向域名，如 com.yourname.aidad
 */
const config: CapacitorConfig = {
  appId: "com.aidad.prototype",
  appName: "AI Dad",
  webDir: "www",
  backgroundColor: "#fffaf0",
  ios: {
    // 网页铺满全屏（含刘海区域），由页面 CSS 的 safe-area 留白处理
    contentInset: "never",
    scrollEnabled: true,
  },
};

export default config;
