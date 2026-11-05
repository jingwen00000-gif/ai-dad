"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mic, Music2, Play, Search } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { personalize, SONGS, type Song } from "@/lib/songs";
import { useActiveChild } from "@/store/app-store";

export default function SingPage() {
  const child = useActiveChild();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SONGS.filter((s) => personalize(s.title, child.nickname).toLowerCase().includes(q));
  }, [search, child.nickname]);

  const special = filtered.filter((s) => s.category === "special");
  const english = filtered.filter((s) => s.category === "classic" && s.language === "English");
  const chinese = filtered.filter((s) => s.category === "classic" && s.language === "Chinese");
  // 今晚推荐：专属歌优先，再补经典
  const favorites = [...special, ...filtered.filter((s) => s.category === "classic")].slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[2rem] bg-card p-6 text-center shadow-[0_10px_40px_rgba(47,111,237,0.12)] sm:p-8">
        <DadAvatar className="mx-auto size-32" />
        <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">Dad Sings For You 🎵</h1>
        <p className="mt-2 text-lg text-muted-foreground">Sing along with Dad, anytime.</p>
        <label className="mx-auto mt-6 flex max-w-xl items-center gap-3 rounded-full border-2 border-input bg-background px-5 focus-within:border-ring">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <span className="sr-only">Search songs</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs…"
            className="h-12 w-full bg-transparent text-base outline-none"
          />
        </label>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed p-10 text-center text-lg text-muted-foreground">
          No songs found. Try &ldquo;star&rdquo; or &ldquo;老虎&rdquo;.
        </p>
      ) : (
        <>
          {!search && <SongSection title="⭐ Tonight's Favorites" songs={favorites} name={child.nickname} />}
          <SongSection title="❤️ Dad's Special Songs" songs={special} name={child.nickname} />
          <SongSection title="🇬🇧 English Songs" songs={english} name={child.nickname} />
          <SongSection title="🇨🇳 中文儿歌" songs={chinese} name={child.nickname} />
        </>
      )}

      <section className="rounded-3xl bg-card p-6">
        <p className="flex items-center gap-2 font-extrabold">
          <Music2 className="size-5" /> How songs will play
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-full bg-sky px-4 py-2 text-sky-foreground">
            <Mic className="mr-1 inline size-4" /> Dad&apos;s own recording
          </span>
          <span className="rounded-full bg-accent px-4 py-2 text-accent-foreground">❤️ Personalized lyrics with your name</span>
          <span className="rounded-full bg-muted px-4 py-2">🎵 Sing-along lyrics</span>
        </div>
      </section>
    </div>
  );
}

function SongSection({ title, songs, name }: { title: string; songs: Song[]; name: string }) {
  if (songs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 text-2xl font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {songs.map((s) => (
          <Link
            key={s.id}
            href={`/kid/sing/${s.id}`}
            className="group flex flex-col rounded-3xl bg-card p-5 shadow-[0_6px_24px_rgba(29,43,79,0.06)] transition-transform hover:-translate-y-1"
          >
            <span className="text-4xl" aria-hidden>
              {s.emoji}
            </span>
            <span className="mt-3 leading-tight font-extrabold">{personalize(s.title, name)}</span>
            <span className="mt-1 text-sm text-muted-foreground">{s.language === "Chinese" ? "中文" : "English"}</span>
            {/* 整张卡片就是链接，这里只是视觉上的“播放”提示，不再嵌套 button */}
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              <Play className="size-4" /> Play
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
