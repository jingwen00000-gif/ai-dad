import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/kid/story-player";
import { STORIES, STORY_BY_ID } from "@/lib/mock-data";

export function generateStaticParams() {
  return STORIES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: STORY_BY_ID[id] ? `${STORY_BY_ID[id].title} · AI Dad` : "Story · AI Dad" };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = STORY_BY_ID[id];
  if (!story) notFound();
  return <StoryPlayer story={story} />;
}
