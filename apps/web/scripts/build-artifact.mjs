// 把 Web 原型打包成一个自包含的 HTML（JS、CSS 全部内联），用于发布在线预览。
// 用法：pnpm --filter @cgo/web build:artifact   → 输出 dist-artifact/ai-dad.html
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist-artifact");
mkdirSync(out, { recursive: true });

// 1) Tailwind：扫描 src/ 和 artifact/ 里用到的类，生成精简 CSS
execFileSync(resolve(root, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", `${out}/app.css`, "--minify"], {
  cwd: root,
  stdio: "inherit",
});

// 2) esbuild：打包 React + 所有页面；next/link、next/navigation 换成迷你路由
const result = await build({
  entryPoints: [resolve(root, "artifact/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  write: false,
  tsconfig: resolve(root, "tsconfig.json"),
  alias: {
    "next/link": resolve(root, "artifact/router.tsx"),
    "next/navigation": resolve(root, "artifact/router.tsx"),
  },
  define: { "process.env.NODE_ENV": '"production"' },
  logOverride: { "unsupported-directive": "silent" },
  legalComments: "none",
});
const js = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
const css = readFileSync(`${out}/app.css`, "utf8").replaceAll("</style", "<\\/style");

// 3) 拼成一个页面（发布时外层会自动加上 <!doctype html><head><body>）
const html = `<title>AI Dad</title>
<meta name="description" content="AI Dad web prototype — sample data">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(`${out}/ai-dad.html`, html);
console.log(`dist-artifact/ai-dad.html  ${(html.length / 1024).toFixed(0)} KB`);

// 4) 离线版：自带完整的 <!doctype html> 外壳，双击即可在浏览器打开（不需要联网）
const offlineHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>AI Dad</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync(`${out}/ai-dad-offline.html`, offlineHtml);
console.log(`dist-artifact/ai-dad-offline.html  ${(offlineHtml.length / 1024).toFixed(0)} KB`);

// 5) PWA 版（dist-pwa/）：放到任意 https 网址后，手机浏览器「添加到主屏幕」即成桌面 App，可离线使用。
//    全部用相对路径，放在子目录（如 GitHub Pages 的 /repo/）也能用。
const pwa = resolve(root, "dist-pwa");
rmSync(pwa, { recursive: true, force: true });
mkdirSync(pwa, { recursive: true });
cpSync(resolve(root, "public/icons"), `${pwa}/icons`, { recursive: true });

const version = createHash("sha256").update(js + css).digest("hex").slice(0, 10);
const precache = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];

writeFileSync(
  `${pwa}/manifest.webmanifest`,
  JSON.stringify(
    {
      name: "AI Dad",
      short_name: "AI Dad",
      description: "Always here. Even when Dad is away.",
      lang: "en",
      start_url: "./",
      scope: "./",
      display: "standalone",
      orientation: "portrait",
      background_color: "#FFFAF0",
      theme_color: "#E8F0FF",
      icons: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  ),
);

// 页面用网络优先（有网时总拿到最新版），没网时用缓存；其他文件缓存优先
writeFileSync(
  `${pwa}/sw.js`,
  `const CACHE = "ai-dad-${version}";
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("index.html", copy));
          return res;
        })
        .catch(() => caches.match("index.html")),
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
`,
);

const pwaHtml = offlineHtml
  .replace(
    "<title>AI Dad</title>",
    `<title>AI Dad</title>
<meta name="theme-color" content="#E8F0FF">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="AI Dad">
<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
  )
  .replace(
    "</body>",
    `<script>
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
</script>
</body>`,
  );
writeFileSync(`${pwa}/index.html`, pwaHtml);
console.log(`dist-pwa/  (version ${version})`);
