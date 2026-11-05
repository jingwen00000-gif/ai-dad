"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { useGreetingWave } from "@/lib/use-greeting-wave";
import { DadMap } from "@/components/kid/dad-map";
import { Button } from "@/components/ui/button";
import { distanceKm, localTime } from "@/lib/age";
import { CITY_BY_CODE, DAD_JOURNEY, HOME_CITY_CODE, PRESENCE_STATUS } from "@/lib/mock-data";
import { useSpeech } from "@/lib/use-speech";
import { useActiveChild, useAppStore } from "@/store/app-store";

/** 客户端每 30 秒刷新一次的“现在”，首屏服务端渲染时为 null（避免时间不一致） */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function DadLocationPage() {
  const child = useActiveChild();
  const presence = useAppStore((s) => s.dadPresence);
  const message = useAppStore((s) => s.dadMessages.find((m) => m.childId === child.id));
  const now = useNow();
  const speech = useSpeech();
  const [playing, setPlaying] = useState(false);
  const waving = useGreetingWave(3000);

  const home = CITY_BY_CODE[HOME_CITY_CODE];
  const dadCity = CITY_BY_CODE[presence.cityCode] ?? home;
  const together = dadCity.code === home.code;
  const km = distanceKm(home, dadCity);
  const flightHours = Math.max(1, Math.round(km / 850));
  const status = PRESENCE_STATUS[presence.status];

  useEffect(() => {
    if (!playing || !message) return;
    return speech.speak(message.text, () => setPlaying(false));
  }, [playing, message, speech]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {/* 头部 */}
      <section className="rounded-[2rem] bg-card p-6 text-center shadow-[0_10px_40px_rgba(47,111,237,0.12)] sm:p-8">
        <DadAvatar className="mx-auto size-32" state={playing ? "talking" : waving ? "waving" : "idle"} online />
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          {together ? "Dad is home with you 🏠" : `Dad is in ${dadCity.name} ${dadCity.flag}`}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {together ? "Go give him a big hug!" : `${km.toLocaleString("en-US")} km away, but always close ❤️`}
        </p>
      </section>

      {/* 状态卡片 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Dad right now">
        <StatusCard emoji="📍" label="City" value={dadCity.name} />
        <StatusCard
          emoji="⏰"
          label="Dad's time"
          value={now ? localTime(dadCity.timezone, now) : "—"}
          sub={now && !together ? `Your time ${localTime(home.timezone, now)}` : undefined}
        />
        <StatusCard emoji={presence.weather.emoji} label="Weather" value={presence.weather.label} />
        <StatusCard emoji={status.emoji} label="Right now" value={status.label.replace("Dad is ", "")} />
      </section>

      {/* 地图 */}
      {!together && (
        <section className="rounded-[2rem] bg-card p-5 sm:p-8">
          <h2 className="text-2xl font-extrabold">Dad Around The World</h2>
          <div className="mt-4">
            <DadMap from={home} to={dadCity} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-extrabold">
              {home.name} → {dadCity.name} · {km.toLocaleString("en-US")} km
            </p>
            <p className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
              ✈️ About {flightHours} hours by plane
            </p>
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* 爸爸留言 */}
        <section className="rounded-[2rem] bg-secondary/30 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">Message From Dad 💌</h2>
          {message ? (
            <>
              <p className="mt-4 rounded-3xl bg-card p-5 text-lg leading-8 whitespace-pre-line">{message.text}</p>
              <Button
                className="mt-5"
                onClick={() => {
                  speech.unlock();
                  setPlaying((p) => !p);
                }}
                aria-pressed={playing}
              >
                {playing ? <Pause /> : <Play />} {playing ? "Pause" : "Listen in Dad's Voice"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Preview voice · Dad wrote this himself</p>
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">No message yet today. Maybe send Dad one first? 😊</p>
          )}
        </section>

        {/* 爸爸的今天：只展示真实事件 */}
        <section className="rounded-[2rem] bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">Today Dad</h2>
          <ul className="mt-4 space-y-3">
            {DAD_JOURNEY[0].items.map((it) => (
              <li key={it.text} className="flex items-center gap-3 text-lg">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky text-xl">{it.emoji}</span>
                <span className="font-semibold">{it.text}</span>
                <span className="ml-auto text-success" aria-label="done">
                  ✔
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 时间线 */}
      <section className="rounded-[2rem] bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold">Dad Journey</h2>
        <ol className="mt-5 space-y-6 border-l-4 border-sky pl-6">
          {DAD_JOURNEY.map((day) => {
            const city = CITY_BY_CODE[day.cityCode];
            return (
              <li key={day.date} className="relative">
                <span className="absolute top-1 -left-[2.05rem] size-4 rounded-full border-4 border-card bg-primary" />
                <p className="font-extrabold">
                  {new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  <span className="ml-2 font-bold text-muted-foreground">
                    📍 {city.name} {city.flag}
                  </span>
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {day.items.map((it) => (
                    <li key={it.text} className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
                      {it.emoji} {it.text}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function StatusCard({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-[0_6px_24px_rgba(29,43,79,0.06)]">
      <p className="text-sm font-bold text-muted-foreground">
        <span aria-hidden>{emoji}</span> {label}
      </p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      {sub && <p className="text-xs font-semibold text-muted-foreground">{sub}</p>}
    </div>
  );
}
