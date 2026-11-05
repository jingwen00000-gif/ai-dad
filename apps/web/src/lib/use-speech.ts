"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * 朗读占位：浏览器自带 speechSynthesis。
 * 不支持（或无可用语音）时退化为按文字长度计时，保证“读完 → 下一段”的流程照常走。
 * 接 ElevenLabs 后，把 speak() 换成播放爸爸声音的音频即可。
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return useMemo(
    () => ({
      supported,
      /** 读一段文字，读完调用 onEnd。返回取消函数（给 useEffect 清理用） */
      speak(raw: string, onEnd: () => void): () => void {
        // 去掉表情符号，避免被读成“笑脸”之类
        const text = raw.replace(/\p{Extended_Pictographic}|\uFE0F/gu, "").trim();
        let cancelled = false;
        const done = () => {
          if (!cancelled) onEnd();
        };
        const fallbackMs = Math.min(9000, 1500 + text.length * 45);

        if (!supported) {
          const t = setTimeout(done, fallbackMs);
          return () => {
            cancelled = true;
            clearTimeout(t);
          };
        }

        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.9;
        u.pitch = 0.9;
        // 有些环境（无语音包）既不报错也不触发 onend：用计时兜底
        let guard = setTimeout(done, fallbackMs * 2);
        u.onend = () => {
          clearTimeout(guard);
          done();
        };
        u.onerror = (e) => {
          clearTimeout(guard);
          // 我们自己 cancel 引起的中断不处理；其他失败（如设备没有语音包会立刻报错）
          // 退回按阅读速度计时，否则整篇故事会一闪而过
          if (e.error === "canceled" || e.error === "interrupted") return;
          guard = setTimeout(done, fallbackMs);
        };
        synth.speak(u);
        return () => {
          cancelled = true;
          clearTimeout(guard);
          synth.cancel();
        };
      },
      /** iOS 要求第一次朗读发生在用户点击里：在点击处理函数中先调用一次 */
      unlock() {
        if (supported) {
          try {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
          } catch {
            // 忽略
          }
        }
      },
      stop() {
        if (supported) window.speechSynthesis.cancel();
      },
    }),
    [supported],
  );
}
