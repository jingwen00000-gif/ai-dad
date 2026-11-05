"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import type { AvatarState } from "@/lib/avatar";
import { CITY_BY_CODE, HOME_CITY_CODE } from "@/lib/mock-data";
import { useGreetingWave } from "@/lib/use-greeting-wave";
import { useSpeech } from "@/lib/use-speech";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

/**
 * 孩子首页（为不识字的小朋友设计）：
 * 一个可以点的大爸爸 + 一个“跟爸爸说话”大按钮 + 四个大方块。文字很少，靠图标和颜色区分。
 */
export default function KidHome() {
  const child = useActiveChild();
  const lang = useAppStore((s) => s.chatLang);
  const presence = useAppStore((s) => s.dadPresence);
  const waving = useGreetingWave();
  const speech = useSpeech();
  const [saying, setSaying] = useState(false);
  const [cheer, setCheer] = useState(false);

  const zh = lang === "zh-CN";
  const dadCity = CITY_BY_CODE[presence.cityCode];
  const dadAway = Boolean(dadCity) && dadCity.code !== HOME_CITY_CODE;

  // 点一下爸爸：爸爸开口打招呼
  useEffect(() => {
    if (!saying) return;
    const line = zh
      ? `${child.nickname}你好！AI 爸爸今天也在哦。点下面的大按钮，跟我说话吧！`
      : `Hi ${child.nickname}! Dad AI is here today. Tap the big button to talk to me!`;
    return speech.speak(line, () => {
      setSaying(false);
      setCheer(true);
    });
  }, [saying, speech, zh, child.nickname]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(false), 1500);
    return () => clearTimeout(t);
  }, [cheer]);

  const state: AvatarState = saying ? "talking" : cheer ? "happy" : waving ? "waving" : "idle";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-center text-[1.85rem] leading-tight font-extrabold tracking-tight">
        {zh ? `${child.nickname}，你好！` : `Hi, ${child.nickname}!`}
      </h1>

      {/* 可以点的大爸爸 */}
      <div className="relative mx-auto">
        <button
          onClick={() => {
            speech.unlock();
            setSaying(true);
          }}
          disabled={saying}
          aria-label={zh ? "点爸爸，听爸爸打招呼" : "Tap Dad to hear hello"}
          className="kid-press block rounded-full"
        >
          <DadAvatar className="size-40 drop-shadow-xl sm:size-56" state={state} online />
        </button>
        <span
          className={cn(
            "absolute -top-1 -right-6 rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-sm font-extrabold shadow-soft transition-opacity sm:-right-10",
            saying && "opacity-0",
          )}
        >
          {zh ? "点我一下！" : "Tap me!"}
        </span>
      </div>

      {/* 跟爸爸说话：最大的按钮 */}
      <Link
        href="/kid/chat"
        className="kid-press flex h-20 items-center gap-4 rounded-[2rem] bg-primary pr-6 pl-3 text-primary-foreground shadow-lift"
      >
        <span className="grid size-14 place-items-center rounded-full bg-white/20">
          <Mic className="size-7" strokeWidth={2.5} />
        </span>
        <span className="flex-1 text-2xl font-extrabold">{zh ? "跟爸爸说话" : "Talk to Dad"}</span>
        <span className="text-3xl" aria-hidden>
          💬
        </span>
      </Link>

      {/* 四个大方块 */}
      <div className="grid grid-cols-2 gap-4">
        <Tile href="/kid/stories" emoji="📚" label={zh ? "听故事" : "Stories"} className="bg-secondary text-secondary-foreground" />
        <Tile href="/kid/sing" emoji="🎵" label={zh ? "唱儿歌" : "Songs"} className="bg-coral text-white" />
        <Tile
          href="/kid/dad-location"
          emoji={dadAway ? dadCity.flag : "🏠"}
          label={zh ? "爸爸在哪" : "Where's Dad"}
          sub={dadAway ? dadCity.name : undefined}
          className="bg-mint text-white"
        />
        <Tile href="/kid/growth" emoji="⭐" label={zh ? "我的星星" : "My Stars"} className="bg-card text-foreground" />
      </div>
    </div>
  );
}

function Tile({
  href,
  emoji,
  label,
  sub,
  className,
}: {
  href: string;
  emoji: string;
  label: string;
  sub?: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "kid-press relative flex aspect-[1/0.78] flex-col justify-between overflow-hidden rounded-[2rem] p-4 shadow-soft sm:p-5",
        className,
      )}
    >
      <span aria-hidden className="absolute -top-6 -right-6 size-24 rounded-full bg-white/15" />
      <span className="relative text-5xl leading-none drop-shadow-sm" aria-hidden>
        {emoji}
      </span>
      <span className="relative">
        <span className="block text-xl leading-tight font-extrabold">{label}</span>
        {sub && <span className="block text-sm font-bold opacity-85">{sub}</span>}
      </span>
    </Link>
  );
}
