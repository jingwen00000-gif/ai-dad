"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, Mic, Send, Volume2, VolumeX, X } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import type { AvatarState } from "@/lib/avatar";
import { chatGreeting, dadReply, detectLang, SUGGESTED_PROMPTS } from "@/lib/dad-replies";
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
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopSpeaking = useRef<(() => void) | null>(null);
  const speech = useSpeech();
  const lang = useAppStore((s) => s.chatLang);
  const setLang = useAppStore((s) => s.setChatLang);
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
    // 孩子用哪种语言说/打字，语音识别就跟着切换，下次直接用
    if (detectLang(t) !== lang) setLang(detectLang(t));
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

  const zh = lang === "zh-CN";
  const status = speaking
    ? zh ? "爸爸在说话" : "Dad is talking"
    : thinking
      ? zh ? "想一想…" : "Thinking…"
      : mic.listening
        ? zh ? "我在听…" : "Listening…"
        : zh ? "点麦克风说话" : "Tap the mic to talk";

  const tapMic = () => {
    if (mic.listening) return mic.stop();
    stopSpeaking.current?.();
    setSpeaking(false);
    if (voiceOn) speech.unlock();
    mic.start();
  };

  return (
    <div className="chat-height mx-auto flex max-w-2xl flex-col">
      {/* 爸爸 + 状态（横排，给对话留出空间） */}
      <div className="flex items-center gap-3 pb-3">
        <span className={cn("clay-glow shrink-0", (speaking || mic.listening) && "is-active")}>
          <DadAvatar className="block size-20 sm:size-24" state={avatarState} online />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <span className="text-xl font-extrabold">Dad</span>
          <span
            className={cn(
              "rounded-full px-3.5 py-1 text-sm font-extrabold",
              mic.listening ? "clay-coral" : speaking ? "clay-indigo" : "clay text-foreground",
            )}
            aria-live="polite"
          >
            {status}
          </span>
        </div>
        <button
          onClick={toggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "Mute Dad's voice" : "Turn on Dad's voice"}
          className="kid-press clay grid size-12 shrink-0 place-items-center rounded-full text-muted-foreground"
        >
          {voiceOn ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
        </button>
      </div>

      {/* 对话 */}
      <div className="clay flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem]">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          <Bubble role="dad" name="Dad" text={chatGreeting(child.nickname, lang)} />
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} name={m.role === "dad" ? "Dad" : child.nickname} text={m.text} />
          ))}
          {/* 孩子说话时，实时显示听到的内容（淡色气泡） */}
          {mic.listening && !typing && draft.trim() && (
            <div className="flex flex-col items-end opacity-60" data-testid="live-transcript">
              <p className="clay-cream max-w-[88%] rounded-[1.75rem] rounded-tr-md px-5 py-3.5 text-lg leading-relaxed">
                {draft}…
              </p>
            </div>
          )}
          {thinking && (
            <div className="flex gap-1.5 px-3 py-3" aria-label="Dad is thinking">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-3 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {SUGGESTED_PROMPTS[lang].map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="kid-press clay-sky rounded-2xl px-3 py-3 text-left text-[0.95rem] leading-snug font-bold"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {mic.error && (
          <div role="status" className="flex items-start gap-2 bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">
            <span className="flex-1">{mic.error}</span>
            <button type="button" onClick={mic.clearError} className="font-bold" aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 打字（需要时才展开） */}
      {typing && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={zh ? "跟爸爸说…" : "Type to Dad…"}
            aria-label="Message to Dad"
            maxLength={200}
            className="clay-inset h-14 min-w-0 flex-1 rounded-full px-5 text-lg outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || thinking}
            className="kid-press clay-indigo grid size-14 shrink-0 place-items-center rounded-full disabled:opacity-50"
          >
            <Send className="size-6" />
          </button>
        </form>
      )}

      {/* 大麦克风：最主要的操作 */}
      <div className="flex items-center justify-center gap-6 pt-3">
        <button
          type="button"
          onClick={() => setTyping((v) => !v)}
          aria-pressed={typing}
          aria-label={typing ? "Hide keyboard" : "Type a message"}
          className="kid-press clay grid size-14 place-items-center rounded-full text-muted-foreground"
        >
          {typing ? <X className="size-6" /> : <Keyboard className="size-6" />}
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={tapMic}
            disabled={thinking}
            aria-pressed={mic.listening}
            aria-label={mic.listening ? "Stop and send" : "Talk to Dad"}
            className={cn(
              "kid-press relative grid size-20 place-items-center rounded-full disabled:opacity-50",
              mic.listening ? "clay-coral" : "clay-sun",
            )}
          >
            {mic.listening && <span className="absolute inset-0 animate-ping rounded-full bg-coral/40" aria-hidden />}
            <Mic className="relative size-10" strokeWidth={2.4} />
          </button>
          <span className="text-xs font-extrabold text-muted-foreground">
            {mic.listening ? (zh ? "说完点一下" : "Tap to send") : zh ? "点我说话" : "Tap to talk"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLang(lang === "en-US" ? "zh-CN" : "en-US")}
          aria-label={lang === "en-US" ? "Voice language: English. Switch to Chinese" : "语音语言：中文，切换为英文"}
          className="kid-press clay grid size-14 place-items-center rounded-full text-lg font-extrabold text-muted-foreground"
        >
          {lang === "en-US" ? "EN" : "中"}
        </button>
      </div>
    </div>
  );
}

function Bubble({ role, name, text }: { role: "child" | "dad"; name: string; text: string }) {
  const isDad = role === "dad";
  return (
    <div className={cn("flex flex-col", isDad ? "items-start" : "items-end")}>
      <span className="mb-1 px-3 text-xs font-bold text-muted-foreground">{name}</span>
      <p
        className={cn(
          "max-w-[88%] rounded-[1.75rem] px-5 py-3.5 text-lg leading-relaxed whitespace-pre-line",
          isDad ? "clay-sky rounded-tl-md" : "clay-cream rounded-tr-md",
        )}
      >
        {text}
      </p>
    </div>
  );
}
