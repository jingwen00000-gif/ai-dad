import Link from "next/link";
import { Clock, Heart } from "lucide-react";
import type { Story } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 故事卡片：大封面 + 短标题。给不识字的孩子，封面图案就是主要信息 */
export function StoryCard({ story, liked, recommended }: { story: Story; liked?: boolean; recommended?: boolean }) {
  return (
    <Link href={`/kid/stories/${story.id}`} className="kid-press group flex flex-col overflow-hidden rounded-[2rem] bg-card shadow-soft">
      <div className={cn("relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br", story.cover)}>
        <span aria-hidden className="absolute -top-8 -left-8 size-28 rounded-full bg-white/15" />
        <span aria-hidden className="absolute -right-10 -bottom-10 size-36 rounded-full bg-white/10" />
        <span aria-hidden className="relative text-7xl drop-shadow-md transition-transform group-hover:scale-110 sm:text-8xl">
          {story.emoji}
        </span>
        {recommended && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-foreground">
            ⭐ For you
          </span>
        )}
        {story.dadMemoryId && (
          <span className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/90 text-lg" title="A real story from Dad">
            💙
          </span>
        )}
        {liked && <Heart className="absolute top-3 right-3 size-7 fill-white text-white drop-shadow" aria-label="Liked" />}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        <h3 className="text-base leading-tight font-extrabold sm:text-lg">{story.title}</h3>
        <span className="mt-auto flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <Clock className="size-3.5" /> {story.minutes} min
        </span>
      </div>
    </Link>
  );
}
