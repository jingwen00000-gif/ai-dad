import { notFound } from "next/navigation";
import { SongPlayer } from "@/components/kid/song-player";
import { SONG_BY_ID, SONGS } from "@/lib/songs";

export function generateStaticParams() {
  return SONGS.map((s) => ({ id: s.id }));
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = SONG_BY_ID[id];
  if (!song) notFound();
  return <SongPlayer song={song} />;
}
