"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOOK, type DadLook } from "@/lib/avatar";
import { SEED_CHILDREN, SEED_DAD_MESSAGES, SEED_MEMORIES, SEED_PRESENCE } from "@/lib/mock-data";
import type { ChatMessage, Child, DadMemory, DadMessage, DadPresence, LearningEvent } from "@/lib/types";

/**
 * 原型阶段的全部状态（假数据驱动，存浏览器 localStorage）。
 * 接后端时，把各 action 换成 API 调用即可，页面不需要改。
 */
interface AppState {
  activeChildId: string;
  children: Child[];
  dadMemories: DadMemory[];
  chats: Record<string, ChatMessage[]>;
  likes: Record<string, boolean>; // `${childId}:${storyId}`
  learningEvents: LearningEvent[];
  dadPresence: DadPresence;
  dadMessages: DadMessage[];
  dadLook: DadLook;
  /** 孩子看到的爸爸形象：2D 卡通，或家长上传的 3D（VRM） */
  avatarMode: "2d" | "3d";
  /** 3D 形象文件的元信息（文件本体在 IndexedDB）；version 变化时重新加载 */
  vrm: { version: number; name: string; bytes: number } | null;

  setActiveChild: (id: string) => void;
  updateChild: (id: string, patch: Partial<Omit<Child, "id">>) => void;
  addMemory: (memory: Omit<DadMemory, "id" | "createdAt">) => void;
  deleteMemory: (id: string) => void;
  addChatMessage: (childId: string, role: ChatMessage["role"], text: string) => void;
  toggleLike: (childId: string, storyId: string) => void;
  recordEvent: (event: Omit<LearningEvent, "id" | "occurredAt">) => void;
  setPresence: (patch: Partial<DadPresence>) => void;
  /** 爸爸给某个孩子写新留言（最新一条显示在孩子的 Where's Dad 页面） */
  sendDadMessage: (childId: string, text: string) => void;
  setDadLook: (patch: Partial<DadLook>) => void;
  setAvatarMode: (mode: "2d" | "3d") => void;
  setVrm: (vrm: { name: string; bytes: number } | null) => void;
  resetDemo: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initial = {
  activeChildId: SEED_CHILDREN[0].id,
  children: SEED_CHILDREN,
  dadMemories: SEED_MEMORIES,
  chats: {} as Record<string, ChatMessage[]>,
  likes: {} as Record<string, boolean>,
  learningEvents: [] as LearningEvent[],
  dadPresence: SEED_PRESENCE,
  dadMessages: SEED_DAD_MESSAGES,
  dadLook: DEFAULT_LOOK,
  avatarMode: "2d" as "2d" | "3d",
  vrm: null as { version: number; name: string; bytes: number } | null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,

      setActiveChild: (id) => set({ activeChildId: id }),

      updateChild: (id, patch) =>
        set((s) => ({ children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addMemory: (memory) =>
        set((s) => ({
          dadMemories: [{ ...memory, id: `m-${uid()}`, createdAt: new Date().toISOString() }, ...s.dadMemories],
        })),

      deleteMemory: (id) => set((s) => ({ dadMemories: s.dadMemories.filter((m) => m.id !== id) })),

      addChatMessage: (childId, role, text) =>
        set((s) => ({
          chats: {
            ...s.chats,
            [childId]: [...(s.chats[childId] ?? []), { id: uid(), role, text, at: new Date().toISOString() }],
          },
        })),

      toggleLike: (childId, storyId) =>
        set((s) => {
          const key = `${childId}:${storyId}`;
          return { likes: { ...s.likes, [key]: !s.likes[key] } };
        }),

      recordEvent: (event) =>
        set((s) => ({
          learningEvents: [...s.learningEvents, { ...event, id: uid(), occurredAt: new Date().toISOString() }],
        })),

      setPresence: (patch) => set((s) => ({ dadPresence: { ...s.dadPresence, ...patch } })),

      sendDadMessage: (childId, text) =>
        set((s) => ({
          dadMessages: [{ id: `dm-${uid()}`, childId, text, createdAt: new Date().toISOString() }, ...s.dadMessages],
        })),

      setDadLook: (patch) => set((s) => ({ dadLook: { ...s.dadLook, ...patch } })),

      setAvatarMode: (avatarMode) => set({ avatarMode }),

      setVrm: (vrm) =>
        set((s) => ({
          vrm: vrm ? { ...vrm, version: (s.vrm?.version ?? 0) + 1 } : null,
          avatarMode: vrm ? "3d" : "2d",
        })),

      resetDemo: () => set(initial),
    }),
    {
      name: "ai-dad-demo-v2", // 演示数据换了名字（Leo / Mia / Alex），换存储名让旧设备也从新数据开始
      storage: createJSONStorage(() => localStorage),
      // 由 <StoreHydrator /> 在客户端挂载后再读 localStorage，避免 SSR 水合不一致
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...p, dadLook: { ...DEFAULT_LOOK, ...(p.dadLook ?? {}) } };
      },
      partialize: ({
        activeChildId,
        children,
        dadMemories,
        chats,
        likes,
        learningEvents,
        dadPresence,
        dadMessages,
        dadLook,
        avatarMode,
        vrm,
      }) => ({
        activeChildId,
        children,
        dadMemories,
        chats,
        likes,
        learningEvents,
        dadPresence,
        dadMessages,
        dadLook,
        avatarMode,
        vrm,
      }),
    },
  ),
);

export function useActiveChild(): Child {
  return useAppStore((s) => s.children.find((c) => c.id === s.activeChildId) ?? s.children[0]);
}
