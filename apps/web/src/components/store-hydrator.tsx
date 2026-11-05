"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

/** 客户端挂载后再从 localStorage 恢复状态（store 设置了 skipHydration） */
export function StoreHydrator() {
  useEffect(() => {
    try {
      void useAppStore.persist.rehydrate();
    } catch {
      // 隐私模式等情况下 localStorage 不可用：继续使用假数据初始值
    }
  }, []);
  return null;
}
