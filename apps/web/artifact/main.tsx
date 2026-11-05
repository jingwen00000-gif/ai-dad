/**
 * 单文件在线版入口：复用 src/ 里的所有页面组件，用迷你路由按路径渲染。
 * 构建：pnpm --filter @cgo/web build:artifact
 */
import * as React from "react";
import { createRoot } from "react-dom/client";
import { usePathname } from "./router";
import { StoreHydrator } from "@/components/store-hydrator";
import { KidShell } from "@/components/kid/kid-shell";
import { ParentShell } from "@/components/parent/parent-shell";
import { StoryPlayer } from "@/components/kid/story-player";
import { SongPlayer } from "@/components/kid/song-player";
import { STORY_BY_ID } from "@/lib/mock-data";
import { SONG_BY_ID } from "@/lib/songs";
import Landing from "@/app/page";
import NotFound from "@/app/not-found";
import KidHome from "@/app/kid/home/page";
import KidChat from "@/app/kid/chat/page";
import KidStories from "@/app/kid/stories/page";
import KidGrowth from "@/app/kid/growth/page";
import DadLocation from "@/app/kid/dad-location/page";
import Sing from "@/app/kid/sing/page";
import ParentHome from "@/app/parent/page";
import ParentChildren from "@/app/parent/children/page";
import ParentMemories from "@/app/parent/memories/page";
import ParentReports from "@/app/parent/reports/page";
import ParentSettings from "@/app/parent/settings/page";
import ParentAvatar from "@/app/parent/avatar/page";

const KID: Record<string, React.ComponentType> = {
  home: KidHome,
  chat: KidChat,
  stories: KidStories,
  growth: KidGrowth,
  "dad-location": DadLocation,
  sing: Sing,
};

const PARENT: Record<string, React.ComponentType> = {
  "": ParentHome,
  children: ParentChildren,
  memories: ParentMemories,
  reports: ParentReports,
  settings: ParentSettings,
  avatar: ParentAvatar,
};

function resolve(path: string): React.ReactNode {
  const [area, section = "", id, extra] = path.split("/").filter(Boolean);
  if (!area) return <Landing />;

  if (area === "kid" && !extra) {
    let page: React.ReactNode = null;
    if (section === "stories" && id) page = STORY_BY_ID[id] ? <StoryPlayer story={STORY_BY_ID[id]} /> : null;
    else if (section === "sing" && id) page = SONG_BY_ID[id] ? <SongPlayer song={SONG_BY_ID[id]} /> : null;
    else if (!id && KID[section]) page = React.createElement(KID[section]);
    if (page) return <KidShell>{page}</KidShell>;
  }

  if (area === "parent" && !id && PARENT[section]) {
    return <ParentShell>{React.createElement(PARENT[section])}</ParentShell>;
  }

  return <NotFound />;
}

function App() {
  const path = usePathname();
  return (
    <>
      <StoreHydrator />
      {/* key：换页时重置页面内部状态（如故事播放进度） */}
      <React.Fragment key={path}>{resolve(path)}</React.Fragment>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
