"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Volume2, VolumeX } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";
import type { AvatarState } from "@/lib/avatar";
import { dadReply, SUGGESTED_PROMPTS } from "@/lib/dad-replies";
import { useSpeech } from "@/lib/use-speech";
import { useSpeechInput } from "@/lib/use-speech-input";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function KidChat() {
  const child = useActiveChild();
  const messages = useAppStore((s) => s.chats[child.id]) ?? [];
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopSpeaking = useRef<(() => void) | null>(null);
  const speech = useSpeech();
  const [lang, setLang] = useState<"en-US" | "zh-CN">("en-US");
  // 孩子说话：识别中把文字实时显示在输入框，说完自动发送
  const mic = useSpeechInput({
    lang,
    onInterim: (text) => setDraft(text),
    onFinal: (text) => send(text),
  });

  // 虚拟形象状态：说话 > 思考 > 孩子在说 / 在打字时“听” > 待机
  const avatarState: AvatarState = speaking
    ? "talking"
    : thinking
      ? "thinking"
      : mic.listening || draft.trim()
        ? "listening"
        : "idle";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, thinking]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopSpeaking.current?.();
    },
    [],
  );

  const say = (text: string) => {
    stopSpeaking.current?.();
    if (!voiceOn) return;
    setSpeaking(true);
    stopSpeaking.current = speech.speak(text, () => setSpeaking(false));
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    if (voiceOn) speech.unlock(); // iOS：在点击里先解锁朗读
    stopSpeaking.current?.();
    setSpeaking(false);
    addChatMessage(child.id, "child", t);
    setDraft("");
    setThinking(true);
    // 假数据：模拟“思考”时间；正式版接流式大模型 + 爸爸声音
    timer.current = setTimeout(() => {
      const reply = dadReply(t, child);
      addChatMessage(child.id, "dad", reply);
      setThinking(false);
      say(reply);
    }, 1100);
  };

  const toggleVoice = () => {
    if (voiceOn) {
      stopSpeaking.current?.();
      setSpeaking(false);
    }
    setVoiceOn(!voiceOn);
  };

  return (
    <div className="chat-height mx-auto flex max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-card shadow-[0_10px_40px_rgba(47,111,237,0.12)]">
      <div className="flex items-center gap-3 border-b px-5 py-3">
        <DadAvatar className="size-16" state={avatarState} online />
        <div className="flex-1">
          <p className="text-lg font-extrabold">Dad</p>
          <p className="text-sm font-semibold text-success">
            {speaking ? "talking…" : thinking ? "thinking…" : mic.listening || draft.trim() ? "listening…" : "Online"}
          </p>
        </div>
        <button
          onClick={toggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "Mute Dad's voice" : "Turn on Dad's voice"}
          className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          {voiceOn ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
        <Bubble role="dad" name="Dad" text={`Hi ${child.nickname}! I'm Dad AI. Tell me anything — I'm all ears. 👂`} />
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} name={m.role === "dad" ? "Dad" : child.nickname} text={m.text} />
        ))}
        {thinking && (
          <div className="flex gap-1 px-2 py-3" aria-label="Dad is thinking">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="shrink-0 rounded-full border-2 border-border bg-background px-4 py-2 text-sm font-bold hover:border-primary"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {mic.error && (
        <div role="status" className="flex items-start gap-2 border-t bg-accent px-4 py-2 text-sm text-accent-foreground">
          <span className="flex-1">{mic.error}</span>
          <button type="button" onClick={mic.clearError} className="font-bold" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t bg-background/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (mic.listening) return mic.stop();
            stopSpeaking.current?.();
            setSpeaking(false);
            if (voiceOn) speech.unlock();
            mic.start();
          }}
          disabled={thinking}
          aria-pressed={mic.listening}
          aria-label={mic.listening ? "Stop and send" : "Talk to Dad"}
          className={cn(
            "relative flex h-12 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors disabled:opacity-50",
            mic.listening ? "bg-destructive text-white" : "bg-secondary text-secondary-foreground",
          )}
        >
          {mic.listening && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" aria-hidden />}
          <Mic className="relative size-5" />
          <span className="relative hidden sm:inline">{mic.listening ? "Listening…" : "Talk"}</span>
        </button>
        <button
          type="button"
          onClick={() => setLang(lang === "en-US" ? "zh-CN" : "en-US")}
          aria-label={lang === "en-US" ? "Voice language: English. Switch to Chinese" : "语音语言：中文，切换为英文"}
          className="h-12 shrink-0 rounded-full border-2 border-border px-3 text-sm font-extrabold text-muted-foreground"
        >
          {lang === "en-US" ? "EN" : "中"}
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={mic.listening ? "Listening…" : "Type to Dad…"}
          aria-label="Message to Dad"
          maxLength={200}
          className="h-12 min-w-0 flex-1 rounded-full border-2 border-input bg-card px-4 text-base outline-none focus-visible:border-ring"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim() || thinking}>
          <Send />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, name, text }: { role: "child" | "dad"; name: string; text: string }) {
  const isDad = role === "dad";
  return (
    <div className={cn("flex flex-col", isDad ? "items-start" : "items-end")}>
      <span className="mb-1 px-2 text-xs font-bold text-muted-foreground">{name}</span>
      <p
        className={cn(
          "max-w-[85%] rounded-3xl px-4 py-3 text-base leading-relaxed whitespace-pre-line sm:text-lg",
          isDad ? "rounded-tl-md bg-sky text-foreground" : "rounded-tr-md bg-secondary text-secondary-foreground",
        )}
      >
        {text}
      </p>
    </div>
  );
}
