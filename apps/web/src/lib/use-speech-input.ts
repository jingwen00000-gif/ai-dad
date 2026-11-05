"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 孩子说话 → 文字（浏览器自带语音识别）。
 * iPhone Safari：苹果的识别服务，大陆可用；安卓 Chrome：谷歌服务，大陆一般不可用。
 * 正式版改为录音上传后端，由国内语音识别服务转文字。
 */

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Please allow the microphone (Settings → Safari → Microphone).",
  "service-not-allowed": "Voice input isn't available here. Try Safari on iPhone, or type instead.",
  network: "Voice input needs the internet, or isn't available in this browser. Try typing.",
  "no-speech": "I didn't hear anything. Tap the mic and try again!",
  "audio-capture": "No microphone found.",
  unsupported: "This browser can't do voice input yet. Try Safari on iPhone, or type instead.",
};

export function useSpeechInput({
  lang,
  onFinal,
  onInterim,
}: {
  lang: string;
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const cbRef = useRef({ onFinal, onInterim });

  useEffect(() => {
    cbRef.current = { onFinal, onInterim };
  }, [onFinal, onInterim]);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => recRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognition();
    setError("");
    if (!Ctor) {
      setError(ERRORS.unsupported);
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false; // 说完一句自动结束
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      cbRef.current.onInterim?.((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] ?? ERRORS.unsupported);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) cbRef.current.onFinal(finalText.trim());
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError(ERRORS.unsupported);
    }
  }, [lang]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported, listening, error, clearError: () => setError(""), start, stop };
}
