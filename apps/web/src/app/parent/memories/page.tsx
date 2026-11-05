"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEMORY_CATEGORIES, STORIES } from "@/lib/mock-data";
import type { MemoryCategory } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function DadMemoryVault() {
  const memories = useAppStore((s) => s.dadMemories);
  const addMemory = useAppStore((s) => s.addMemory);
  const deleteMemory = useAppStore((s) => s.deleteMemory);

  const [filter, setFilter] = useState<MemoryCategory | "all">("all");
  const [category, setCategory] = useState<MemoryCategory>("childhood");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  const shown = filter === "all" ? memories : memories.filter((m) => m.category === filter);
  const hint = MEMORY_CATEGORIES.find((c) => c.value === category)?.hint;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addMemory({ category, title: title.trim(), content: content.trim() });
    setTitle("");
    setContent("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Dad Memory Vault 🧠</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Your real stories, in your own words. Dad AI weaves them into bedtime stories — so your kids hear about{" "}
        <em>you</em>, not a made-up dad.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="h-fit rounded-3xl bg-card p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-extrabold">Add a memory</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {MEMORY_CATEGORIES.map((c) => (
              <button
                type="button"
                role="radio"
                aria-checked={category === c.value}
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-sm font-bold",
                  category === c.value ? "border-primary bg-sky text-sky-foreground" : "border-border",
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          <div className="mt-4 grid gap-2">
            <Label htmlFor="m-title">Title</Label>
            <Input id="m-title" placeholder="My First Bike" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-2">
            <Label htmlFor="m-content">Your memory</Label>
            <Textarea
              id="m-content"
              placeholder="When I was 7 years old, I learned how to ride a bike…"
              value={content}
              maxLength={1500}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-5 w-full" disabled={!title.trim() || !content.trim()}>
            <Plus /> Save to vault
          </Button>
          {saved && <p className="mt-3 text-center font-bold text-success">Saved! Future stories can use it. 💙</p>}
        </form>

        {/* min-w-0：否则横向滚动的分类条会把网格列撑宽，手机上整页横向溢出 */}
        <div className="min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
            {[{ value: "all" as const, label: "All", emoji: "✨" }, ...MEMORY_CATEGORIES].map((c) => (
              <button
                key={c.value}
                onClick={() => setFilter(c.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-bold",
                  filter === c.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            {shown.length === 0 && (
              <p className="rounded-3xl border-2 border-dashed p-8 text-center text-muted-foreground">
                Nothing here yet. Your first memory in this category could become a favorite story.
              </p>
            )}
            {shown.map((m) => {
              const cat = MEMORY_CATEGORIES.find((c) => c.value === m.category)!;
              const usedIn = STORIES.filter((s) => s.dadMemoryId === m.id);
              return (
                <article key={m.id} className="rounded-3xl bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
                        {cat.emoji} {cat.label}
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold">{m.title}</h3>
                    </div>
                    <button
                      onClick={() => deleteMemory(m.id)}
                      aria-label={`Delete ${m.title}`}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                  <p className="mt-2 leading-relaxed whitespace-pre-line text-foreground/90">{m.content}</p>
                  {usedIn.length > 0 && (
                    <p className="mt-3 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
                      📚 Used in “{usedIn[0].title}”
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
