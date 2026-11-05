"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";
import { personalize, type Song } from "@/lib/songs";
import { useActiveChild } from "@/store/app-store";
import { cn } from "@/lib/utils";

const LINE_MS = 3000;

/**
 * 跟唱播放器（原型）：歌词按节拍逐行高亮。
 * 正式版播放爸爸自己录的音频（克隆声音只能说话、不能唱歌），歌词时间轴随录音一起保存。
 */
export function SongPlayer({ song }: { song: Song }) {
  const child = useActiveChild();
  const [line, setLine] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const lines = song.lyrics.map((l) => personalize(l, child.nickname));
  const done = !playing && line >= lines.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (line + 1 < lines.length) setLine(line + 1);
      else setPlaying(false);
    }, line < 0 ? 300 : LINE_MS);
    return () => clearTimeout(t);
  }, [playing, line, lines.length]);

  const start = () => {
    if (done) setLine(-1);
    setPlaying(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/kid/sing" className="mb-4 inline-flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> All songs
      </Link>

      <section className="clay rounded-[2rem] p-6 text-center sm:p-8">
        <DadAvatar className="mx-auto size-28" state={playing ? "talking" : done ? "happy" : "idle"} />
        <h1 className="mt-4 text-3xl font-extrabold">
          {song.emoji} {personalize(song.title, child.nickname)}
        </h1>

        <ol className="mt-6 space-y-2 text-xl sm:text-2xl" aria-live="polite">
          {lines.map((l, i) => (
            <li
              key={i}
              className={cn(
                "rounded-2xl px-4 py-2 font-bold transition-all",
                i === line ? "clay-sun scale-105" : i < line ? "text-muted-foreground" : "",
              )}
            >
              {l}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex justify-center">
          {playing ? (
            <Button size="lg" variant="claySun" onClick={() => setPlaying(false)}>
              <Pause /> Pause
            </Button>
          ) : (
            <Button size="lg" variant="clay" onClick={start}>
              {done ? <RotateCcw /> : <Play />} {done ? "Sing again" : line >= 0 ? "Keep singing" : "Sing along"}
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          🎙 Dad hasn&apos;t recorded this one yet — lyrics only for now.
        </p>
      </section>
    </div>
  );
}
