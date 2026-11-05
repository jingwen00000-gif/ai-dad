"use client";

import { StoryCard } from "@/components/kid/story-card";
import { greeting } from "@/lib/age";
import { useMounted } from "@/lib/use-mounted";
import { STORIES } from "@/lib/mock-data";
import { useActiveChild, useAppStore } from "@/store/app-store";

export default function KidStories() {
  const child = useActiveChild();
  const likes = useAppStore((s) => s.likes);
  // 问候语跟随当前时间：挂载后再算，避免与构建时预渲染的结果不一致
  const mounted = useMounted();
  const hello = mounted ? greeting() : { text: "Hi", emoji: "👋" };

  // 推荐：命中孩子兴趣的排前面（正式版由推荐引擎按 story_sessions 打分）
  const sorted = [...STORIES].sort(
    (a, b) => Number(child.interests.includes(b.theme)) - Number(child.interests.includes(a.theme)),
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        {hello.text} {child.nickname} {hello.emoji}
      </h1>
      <p className="mt-1 text-lg text-muted-foreground">Which story should Dad read?</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            liked={likes[`${child.id}:${s.id}`]}
            recommended={child.interests.includes(s.theme)}
          />
        ))}
      </div>
    </div>
  );
}
