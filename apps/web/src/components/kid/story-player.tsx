"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Pause, Play, RotateCcw } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSpeech } from "@/lib/use-speech";
import type { Story } from "@/lib/types";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

/**
 * 故事播放器。
 * 原型用浏览器自带朗读（speechSynthesis）逐段读，当前段落高亮；
 * 接 ElevenLabs 后换成爸爸克隆声音的音频，界面不变。
 */
export function StoryPlayer({ story }: { story: Story }) {
  const child = useActiveChild();
  const liked = useAppStore((s) => Boolean(s.likes[`${child.id}:${story.id}`]));
  const toggleLike = useAppStore((s) => s.toggleLike);
  const recordEvent = useAppStore((s) => s.recordEvent);

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const speech = useSpeech();

  const total = story.paragraphs.length;
  const progress = finished ? 100 : Math.round((current / total) * 100);

  const finish = useCallback(() => {
    setPlaying(false);
    setFinished(true);
    recordEvent({ childId: child.id, dimension: "chinese", signal: "story_completed", value: 1, refId: story.id });
  }, [child.id, recordEvent, story.id]);

  // 播放：读当前段，读完自动下一段
  useEffect(() => {
    if (!playing) return;
    paragraphRefs.current[current]?.scrollIntoView({ behavior: "smooth", block: "center" });
    return speech.speak(story.paragraphs[current], () => {
      if (current + 1 < total) setCurrent(current + 1);
      else finish();
    });
  }, [playing, current, total, story.paragraphs, speech, finish]);

  const restart = () => {
    setFinished(false);
    setCurrent(0);
    setPlaying(true);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/kid/stories" className="mb-4 inline-flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> All stories
      </Link>

      <header className={cn("flex items-center gap-4 rounded-[2rem] bg-gradient-to-br p-6 text-white", story.cover)}>
        <span className="text-6xl" aria-hidden>
          {story.emoji}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">{story.title}</h1>
          <p className="mt-1 opacity-90">
            {story.minutes} min · read by Dad
            {story.dadMemoryId && " · 💙 includes a real story from Dad"}
          </p>
        </div>
      </header>

      <article className="mt-5 space-y-4 rounded-[2rem] bg-card p-6 text-lg leading-relaxed sm:p-8 sm:text-xl">
        {story.paragraphs.map((p, i) => (
          <p
            key={i}
            ref={(el) => {
              paragraphRefs.current[i] = el;
            }}
            className={cn(
              "rounded-2xl px-3 py-2 transition-colors",
              (playing || current > 0) && !finished && i === current && "bg-accent",
              !finished && (playing || current > 0) && i < current && "text-muted-foreground",
            )}
          >
            {p}
          </p>
        ))}

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <span className="text-sm font-bold text-muted-foreground">New words:</span>
          {story.newWords.map((w) => (
            <span key={w.word} className="rounded-full bg-sky px-3 py-1 text-sm font-bold text-sky-foreground">
              {w.word} · {w.zh}
            </span>
          ))}
        </div>
      </article>

      {/* 播放控制条 */}
      <div className="sticky bottom-[calc(7rem+env(safe-area-inset-bottom))] z-20 mt-5 rounded-[2rem] bg-card p-4 shadow-lift md:bottom-4">
        <Progress value={progress} aria-label="Story progress" />
        <div className="mt-3 flex items-center gap-3">
          <DadAvatar className="size-14 shrink-0" state={playing ? "talking" : finished ? "happy" : "idle"} />
          {finished ? (
            <Button
              onClick={() => {
                speech.unlock();
                restart();
              }}
              variant="outline"
              size="lg" className="flex-1"
            >
              <RotateCcw /> Play again
            </Button>
          ) : playing ? (
            <Button
              // 停止朗读由播放 effect 的清理函数负责
              onClick={() => setPlaying(false)}
              variant="secondary"
              size="lg" className="flex-1"
            >
              <Pause /> Pause
            </Button>
          ) : (
            <Button
              onClick={() => {
                speech.unlock();
                setPlaying(true);
              }}
              size="lg" className="flex-1"
            >
              <Play /> {current === 0 ? "Play Dad Voice" : "Keep listening"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-14"
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
            onClick={() => toggleLike(child.id, story.id)}
          >
            <Heart className={cn(liked && "fill-destructive text-destructive")} />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {speech.supported
            ? "Preview voice · Dad's own voice arrives with voice cloning"
            : "Reading along · Dad's own voice arrives with voice cloning"}
          {!finished && (
            <>
              {" · "}
              <button className="font-bold text-primary underline-offset-2 hover:underline" onClick={finish}>
                I read it myself → quiz
              </button>
            </>
          )}
        </p>
      </div>

      {finished && <StoryQuiz story={story} />}
    </div>
  );
}

function StoryQuiz({ story }: { story: Story }) {
  const child = useActiveChild();
  const recordEvent = useAppStore((s) => s.recordEvent);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const done = index >= story.questions.length;
  const q = story.questions[index];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === q.answerIndex;
    if (correct) setScore((s) => s + 1);
    // 写入 learning_events（原型存在本地）
    recordEvent({
      childId: child.id,
      dimension: q.word ? "english" : "knowledge",
      signal: correct ? "quiz_correct" : "quiz_wrong",
      value: correct ? 1 : 0,
      refId: `${story.id}:${q.id}${q.word ? `:${q.word}` : ""}`,
    });
  };

  return (
    <section ref={ref} className="mt-6 scroll-mt-24 rounded-[2rem] bg-card p-6 sm:p-8" aria-live="polite">
      {done ? (
        <div className="text-center">
          <p className="text-6xl">{score === story.questions.length ? "🏆" : "⭐"}</p>
          <h2 className="mt-3 text-2xl font-extrabold">
            {score} / {story.questions.length} right!
          </h2>
          <p className="mt-1 text-muted-foreground">
            {score === story.questions.length ? "Wow, you were listening really well!" : "Great try! Dad is proud of you."}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/kid/stories">Another story</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/kid/growth">See my growth</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-extrabold tracking-wide text-primary uppercase">
            Question {index + 1} of {story.questions.length}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">{q.prompt}</h2>
          <div className="mt-5 grid gap-3">
            {q.options.map((opt, i) => {
              const state =
                picked === null ? "idle" : i === q.answerIndex ? "correct" : i === picked ? "wrong" : "dim";
              return (
                <button
                  key={opt}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 p-4 text-left text-lg font-bold transition-colors",
                    state === "idle" && "border-border hover:border-primary hover:bg-sky",
                    state === "correct" && "border-success bg-success/10",
                    state === "wrong" && "border-destructive bg-destructive/10",
                    state === "dim" && "border-border opacity-50",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-extrabold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {state === "correct" && <span className="ml-auto">✅</span>}
                  {state === "wrong" && <span className="ml-auto">❌</span>}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="font-bold">
                {picked === q.answerIndex ? "Great job! 🎉" : "Good try! The answer is highlighted."}
              </p>
              <Button
                onClick={() => {
                  setIndex(index + 1);
                  setPicked(null);
                }}
              >
                {index + 1 < story.questions.length ? "Next" : "Finish"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
