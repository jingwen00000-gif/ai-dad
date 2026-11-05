import Link from "next/link";
import { Clock, Heart } from "lucide-react";
import type { Story } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StoryCard({ story, liked, recommended }: { story: Story; liked?: boolean; recommended?: boolean }) {
  return (
    <Link
      href={`/kid/stories/${story.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-[0_6px_24px_rgba(29,43,79,0.08)] transition-transform hover:-translate-y-0.5"
    >
      <div className={cn("relative grid h-32 place-items-center bg-gradient-to-br text-6xl", story.cover)}>
        <span aria-hidden className="transition-transform group-hover:scale-110">
          {story.emoji}
        </span>
        {recommended && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-foreground">
            For you
          </span>
        )}
        {liked && <Heart className="absolute top-3 right-3 size-6 fill-white text-white" aria-label="Liked" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg leading-tight font-extrabold">{story.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{story.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {story.minutes} min
          </span>
          {story.dadMemoryId && <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">💙 From Dad&apos;s life</span>}
        </div>
      </div>
    </Link>
  );
}
