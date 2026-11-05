"use client";

import { Progress } from "@/components/ui/progress";
import { GROWTH } from "@/lib/mock-data";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function KidGrowth() {
  const child = useActiveChild();
  const growth = GROWTH[child.id];
  const events = useAppStore((s) => s.learningEvents);

  // 本次演示中新答对的单词（来自故事问答写入的 learning_events）
  const learnedNow = Array.from(
    new Set(
      events
        .filter((e) => e.childId === child.id && e.signal === "quiz_correct" && e.refId.split(":")[2])
        .map((e) => e.refId.split(":")[2]),
    ),
  ).filter((w) => !growth.weekWords.includes(w));
  const weekWords = [...learnedNow, ...growth.weekWords];
  const words = growth.wordsLearned + learnedNow.length;
  const englishPct = Math.round((growth.englishLevel / 6) * 100);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{child.nickname}&apos;s Journey 🌱</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl bg-card p-6">
          <p className="font-bold text-muted-foreground">Reading Level</p>
          <p className="mt-2 text-4xl tracking-wider" aria-label={`${growth.readingStars} out of 5 stars`}>
            <span className="text-secondary drop-shadow-[0_1px_0_rgba(90,61,0,0.25)]">{"★".repeat(growth.readingStars)}</span>
            <span className="text-border">{"★".repeat(5 - growth.readingStars)}</span>
          </p>
        </section>
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="font-bold opacity-90">Words Learned</p>
          <p className="mt-1 text-5xl font-extrabold">{words}</p>
          {learnedNow.length > 0 && <p className="mt-1 text-sm font-bold">+{learnedNow.length} just now! 🎉</p>}
        </section>
        <section className="rounded-3xl bg-card p-6">
          <p className="font-bold text-muted-foreground">English Level</p>
          <p className="mt-1 text-3xl font-extrabold">Level {growth.englishLevel}</p>
          <Progress value={englishPct} className="mt-3" indicatorClassName="bg-secondary" aria-label="English level progress" />
        </section>
      </div>

      <section className="rounded-3xl bg-card p-6">
        <h2 className="text-xl font-extrabold">New this week</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {weekWords.map((w) => (
            <span key={w} className="rounded-full bg-sky px-4 py-2 text-lg font-extrabold text-sky-foreground capitalize">
              {w}
            </span>
          ))}
        </div>
      </section>

      <section className="flex gap-4 rounded-3xl bg-accent p-6">
        <span className="text-4xl" aria-hidden>
          💬
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-accent-foreground">Dad AI says</h2>
          <p className="mt-1 text-lg">{growth.aiComment}</p>
        </div>
      </section>

      <section id="badges" className="scroll-mt-24 rounded-3xl bg-card p-6">
        <h2 className="text-xl font-extrabold">My Badges 🏆</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {growth.badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "flex flex-col items-center rounded-3xl border-2 p-4 text-center",
                b.earned ? "border-secondary bg-secondary/15" : "border-dashed border-border opacity-60",
              )}
            >
              <span className={cn("text-5xl", !b.earned && "grayscale")} aria-hidden>
                {b.earned ? b.emoji : "🔒"}
              </span>
              <p className="mt-2 font-extrabold">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
