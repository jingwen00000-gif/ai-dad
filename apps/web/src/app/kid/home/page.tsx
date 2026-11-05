"use client";

import Link from "next/link";
import { DadAvatar } from "@/components/dad-avatar";
import { useGreetingWave } from "@/lib/use-greeting-wave";
import { CITY_BY_CODE, HOME_CITY_CODE, INTEREST_BY_CODE, PRESENCE_STATUS, STORIES } from "@/lib/mock-data";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const FEATURES = [
  { href: "/kid/chat", emoji: "🎤", title: "Talk to Dad", sub: "Say hi, ask anything", tone: "bg-primary text-primary-foreground" },
  { href: "/kid/stories", emoji: "📚", title: "Hear a Story", sub: "Dad reads to you", tone: "bg-secondary text-secondary-foreground" },
  { href: "/kid/growth", emoji: "⭐", title: "My Growth", sub: "See how you grow", tone: "bg-card text-foreground" },
  { href: "/kid/sing", emoji: "🎵", title: "Dad Sings", sub: "Sing along together", tone: "bg-card text-foreground" },
  { href: "/kid/dad-location", emoji: "🌏", title: "Where's Dad?", sub: "See Dad's day", tone: "bg-card text-foreground" },
  { href: "/kid/growth#badges", emoji: "🏆", title: "My Badges", sub: "Collect them all", tone: "bg-card text-foreground" },
];

export default function KidHome() {
  const child = useActiveChild();
  const waving = useGreetingWave();
  const pick = STORIES.find((s) => child.interests.includes(s.theme)) ?? STORIES[0];
  const presence = useAppStore((s) => s.dadPresence);
  const dadCity = CITY_BY_CODE[presence.cityCode];
  const dadAway = dadCity && dadCity.code !== HOME_CITY_CODE;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-[0_10px_40px_rgba(47,111,237,0.12)] sm:p-10">
        <div aria-hidden className="absolute -top-16 -right-16 size-56 rounded-full bg-secondary/40" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <DadAvatar className="size-36 shrink-0 sm:size-44" state={waving ? "waving" : "idle"} online />
          <div>
            <p className="text-sm font-bold tracking-wide text-primary uppercase">Dad AI</p>
            <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Hi {child.nickname} 👋</h1>
            <p className="mt-2 text-xl text-muted-foreground">I&apos;m here today.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {child.interests.map((code) => (
                <span key={code} className="rounded-full bg-sky px-3 py-1 text-sm font-bold text-sky-foreground">
                  {INTEREST_BY_CODE[code].emoji} {INTEREST_BY_CODE[code].name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {dadAway && (
        <Link
          href="/kid/dad-location"
          className="flex items-center gap-4 rounded-3xl border-2 border-primary/20 bg-card p-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sky text-3xl" aria-hidden>
            {dadCity.flag}
          </span>
          <span className="flex-1">
            <span className="block text-lg font-extrabold">
              Dad is in {dadCity.name}, thinking about you ❤️
            </span>
            <span className="block text-sm font-semibold text-muted-foreground">
              {PRESENCE_STATUS[presence.status].emoji} {PRESENCE_STATUS[presence.status].label} · tap to see his day
            </span>
          </span>
          <span className="text-2xl text-primary" aria-hidden>›</span>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="What do you want to do?">
        {FEATURES.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className={cn(
              "flex min-h-36 flex-col justify-between rounded-3xl p-5 shadow-[0_6px_24px_rgba(29,43,79,0.08)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
              f.tone,
            )}
          >
            <span className="text-5xl" aria-hidden>
              {f.emoji}
            </span>
            <span>
              <span className="block text-lg leading-tight font-extrabold">{f.title}</span>
              <span className="block text-sm opacity-80">{f.sub}</span>
            </span>
          </Link>
        ))}
      </section>

      <Link
        href={`/kid/stories/${pick.id}`}
        className={cn("flex items-center gap-4 rounded-3xl bg-gradient-to-r p-5 text-white shadow-lg", pick.cover)}
      >
        <span className="text-5xl" aria-hidden>
          {pick.emoji}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold opacity-90">Tonight&apos;s pick for you</span>
          <span className="block text-xl font-extrabold">{pick.title}</span>
        </span>
        <span className="rounded-full bg-white/25 px-4 py-2 font-bold">Play ▶</span>
      </Link>
    </div>
  );
}
