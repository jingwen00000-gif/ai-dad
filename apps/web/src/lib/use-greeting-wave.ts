"use client";

import { useEffect, useState } from "react";

/** 进入页面时先挥手打招呼，几秒后回到待机 */
export function useGreetingWave(ms = 2500): boolean {
  const [waving, setWaving] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setWaving(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return waving;
}
