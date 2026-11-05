"use client";

import Link from "next/link";
import { Baby, BarChart3, Brain, Settings } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { formatAge, ageInMonths } from "@/lib/age";
import { CITY_BY_CODE, PARENT, REPORTS } from "@/lib/mock-data";
import { useMounted } from "@/lib/use-mounted";
import { useAppStore } from "@/store/app-store";

const QUICK = [
  { href: "/parent/children", label: "Children", icon: Baby, tone: "bg-sky text-sky-foreground" },
  { href: "/parent/memories", label: "Dad Memories", icon: Brain, tone: "bg-accent text-accent-foreground" },
  { href: "/parent/reports", label: "Growth Reports", icon: BarChart3, tone: "bg-sky text-sky-foreground" },
  { href: "/parent/settings", label: "Settings", icon: Settings, tone: "bg-muted text-foreground" },
];

export default function ParentHome() {
  const kids = useAppStore((s) => s.children);
  const memories = useAppStore((s) => s.dadMemories);
  const presence = useAppStore((s) => s.dadPresence);
  const city = CITY_BY_CODE[presence.cityCode];
  const mounted = useMounted();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome {PARENT.name} 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Kids see you in {city.name} {city.flag} ·{" "}
          <Link href="/parent/settings" className="font-bold text-primary hover:underline">
            update
          </Link>
        </p>
      </div>

      <Link
        href="/parent/avatar"
        className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-sky to-card p-5 transition-transform hover:-translate-y-0.5"
      >
        <DadAvatar className="size-20 shrink-0" state="waving" />
        <span className="flex-1">
          <span className="block text-lg font-extrabold">Make Dad&apos;s avatar look like you</span>
          <span className="block text-sm text-muted-foreground">Hair, glasses, beard, shirt — it waves, listens and talks.</span>
        </span>
        <span className="text-2xl text-primary" aria-hidden>›</span>
      </Link>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}>
              <Icon className="size-6" />
            </span>
            <span className="text-lg font-extrabold">{label}</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {kids.map((k) => {
          const r = REPORTS[k.id];
          return (
            <div key={k.id} className="rounded-3xl bg-card p-5">
              <p className="text-lg font-extrabold">
                {k.gender === "girl" ? "👧" : "👦"} {k.nickname}{" "}
                <span className="text-sm font-semibold text-muted-foreground">{mounted ? `· ${formatAge(ageInMonths(k.birthday))}` : ""}</span>
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Stories" value={r.storySessions} />
                <Stat label="Minutes" value={r.minutes} />
                <Stat label="Words" value={r.masteredWords} />
              </dl>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl bg-accent p-5">
        <p className="font-extrabold text-accent-foreground">🧠 {memories.length} memories in your vault</p>
        <p className="mt-1 text-sm">
          Stories can now include your real experiences — like &ldquo;{memories[0]?.title ?? "My First Bike"}&rdquo;.{" "}
          <Link href="/parent/memories" className="font-bold text-primary hover:underline">
            Add another →
          </Link>
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <dd className="text-2xl font-extrabold">{value}</dd>
      <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
    </div>
  );
}
