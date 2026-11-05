"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Play, Search } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { personalize, SONGS, type Song } from "@/lib/songs";
import { useActiveChild } from "@/store/app-store";
import { cn } from "@/lib/utils";

const TILE_TONES = ["bg-coral-soft", "bg-sky", "bg-accent", "bg-mint-soft"];

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
      <section className="flex items-center gap-4">
        <DadAvatar className="size-20 shrink-0" />
        <div>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Sing with Dad 🎵</h1>
          <p className="text-muted-foreground">Pick a song!</p>
        </div>
      </section>

      <section>
        <label className="flex items-center gap-3 rounded-full bg-card px-5 shadow-soft focus-within:ring-4 focus-within:ring-ring/20">
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

    </div>
  );
}

function SongSection({ title, songs, name }: { title: string; songs: Song[]; name: string }) {
  if (songs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {songs.map((s, i) => (
          <Link
            key={s.id}
            href={`/kid/sing/${s.id}`}
            className={cn("kid-press relative flex min-h-40 flex-col rounded-[2rem] p-5 shadow-soft", TILE_TONES[i % TILE_TONES.length])}
          >
            <span className="text-5xl leading-none" aria-hidden>
              {s.emoji}
            </span>
            <span className="mt-3 pr-10 text-[1.05rem] leading-tight font-extrabold">{personalize(s.title, name)}</span>
            <span className="mt-1 text-xs font-bold opacity-70">{s.language === "Chinese" ? "中文" : "English"}</span>
            {/* 整张卡片就是链接，这里只是视觉上的“播放”提示，不再嵌套 button */}
            <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-white/90 text-primary shadow-soft" aria-hidden>
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
