"use client";

import { useState } from "react";
import { GROWTH, INTEREST_BY_CODE, REPORTS } from "@/lib/mock-data";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function ParentReports() {
  const kids = useAppStore((s) => s.children);
  const [childId, setChildId] = useState(kids[0].id);
  const child = kids.find((k) => k.id === childId) ?? kids[0];
  const r = REPORTS[child.id];
  const g = GROWTH[child.id];
  const maxMinutes = Math.max(...r.weeklyMinutes.map((d) => d.minutes));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Growth Reports</h1>
          <p className="mt-1 text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex gap-1 rounded-full bg-card p-1" role="tablist" aria-label="Child">
          {kids.map((k) => (
            <button
              key={k.id}
              role="tab"
              aria-selected={k.id === child.id}
              onClick={() => setChildId(k.id)}
              className={cn(
                "rounded-full px-4 py-1.5 font-bold",
                k.id === child.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {k.nickname}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 grid grid-cols-3 gap-3" aria-label="Overview">
        <Big label="Story Sessions" value={r.storySessions} />
        <Big label="Minutes" value={r.minutes} />
        <Big label="Mastered Words" value={r.masteredWords} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-card p-6">
          <h2 className="text-lg font-extrabold">Interest Ranking</h2>
          <ol className="mt-4 space-y-3">
            {r.interestRanking.map((it, i) => {
              const interest = INTEREST_BY_CODE[it.code];
              return (
                <li key={it.code} className="grid grid-cols-[1.5rem_8rem_1fr_2.5rem] items-center gap-2">
                  <span className="font-extrabold text-muted-foreground">{i + 1}</span>
                  <span className="truncate font-bold">
                    {interest.emoji} {interest.name}
                  </span>
                  <span className="h-3 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${it.score}%` }} />
                  </span>
                  <span className="text-right text-sm font-bold tabular-nums">{it.score}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-3xl bg-card p-6">
          <h2 className="text-lg font-extrabold">Reading Level Trend</h2>
          <div className="mt-4 flex h-40 items-stretch gap-6 border-b-2 px-2" role="img" aria-label={r.readingTrend.map((t) => `${t.month}: level ${t.level}`).join(", ")}>
            {r.readingTrend.map((t) => (
              // 柱子用百分比高度，所在列必须有确定高度（h-full），否则柱子高度为 0
              <div key={t.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-sm font-extrabold">Lv {t.level}</span>
                <span className="w-full max-w-16 rounded-t-xl bg-secondary" style={{ height: `${(t.level / 5) * 85}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-6 px-2">
            {r.readingTrend.map((t) => (
              <span key={t.month} className="flex-1 text-center text-sm font-bold text-muted-foreground">
                {t.month}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-card p-6">
          <h2 className="text-lg font-extrabold">This Week (minutes)</h2>
          <div className="mt-4 flex h-36 items-stretch gap-2" role="img" aria-label={r.weeklyMinutes.map((d) => `${d.day} ${d.minutes} minutes`).join(", ")}>
            {r.weeklyMinutes.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold tabular-nums">{d.minutes}</span>
                <span className="w-full rounded-t-lg bg-primary/80" style={{ height: `${(d.minutes / maxMinutes) * 75}%` }} />
                <span className="text-xs font-bold text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-accent p-6">
          <h2 className="text-lg font-extrabold text-accent-foreground">AI Observation</h2>
          <p className="mt-2 text-lg">{g.aiComment}</p>
          <p className="mt-4 text-sm font-bold text-accent-foreground">New words this week</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.weekWords.map((w) => (
              <span key={w} className="rounded-full bg-card px-3 py-1 font-bold capitalize">
                {w}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-card p-4 sm:p-6">
      <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{value}</p>
      <p className="text-xs font-bold text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
