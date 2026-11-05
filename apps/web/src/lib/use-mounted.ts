"use client";

import { useEffect, useState } from "react";

/**
 * 页面在构建时预渲染，用的是构建那一刻的时间。跟“现在”有关的内容（年龄、问候语）
 * 要等到浏览器里挂载后再显示，否则会和预渲染结果不一致（React 水合错误）。
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
