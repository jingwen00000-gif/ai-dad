"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Globe2, Home, Lock, MessageCircle, X } from "lucide-react";
import { useActiveChild, useAppStore } from "@/store/app-store";
import type { Child } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ParentGate } from "./parent-gate";

/**
 * 孩子区外框（为 3~8 岁设计）：
 * - 底部 4 个大图标导航，图标放在彩色圆底里，文字只做辅助
 * - 左上角是当前孩子的大头像，点开选“谁在玩”（不再把切换按钮放在顶栏，避免误触）
 * - 右上角小锁：家长入口（需答题）
 */
const NAV = [
  { href: "/kid/home", label: "Home", icon: Home, tone: "bg-primary text-primary-foreground" },
  { href: "/kid/chat", label: "Talk", icon: MessageCircle, tone: "bg-secondary text-secondary-foreground" },
  { href: "/kid/stories", label: "Stories", icon: BookOpen, tone: "bg-coral text-white" },
  { href: "/kid/dad-location", label: "Dad", icon: Globe2, tone: "bg-mint text-white" },
];

export function childEmoji(child: Pick<Child, "gender">) {
  return child.gender === "girl" ? "👧" : child.gender === "boy" ? "👦" : "🧒";
}

export function KidShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const child = useActiveChild();
  const [gateOpen, setGateOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/kid/home" && pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_60%_at_50%_0%,var(--sky)_0%,var(--background)_60%)]">
      <header className="safe-top sticky top-0 z-30 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center justify-between gap-3 px-4">
          <button
            onClick={() => setPickerOpen(true)}
            className="kid-press flex items-center gap-2.5 rounded-full bg-card py-1.5 pr-4 pl-1.5 shadow-soft"
            aria-label={`${child.nickname} is playing. Change who is playing`}
          >
            <span className="grid size-11 place-items-center rounded-full bg-accent text-2xl" aria-hidden>
              {childEmoji(child)}
            </span>
            <span className="text-lg font-extrabold">{child.nickname}</span>
          </button>

          <nav className="hidden items-center gap-1 rounded-full bg-card p-1.5 shadow-soft md:flex" aria-label="Kid navigation">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 font-bold transition-colors",
                  isActive(href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-5" /> {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setGateOpen(true)}
            aria-label="Parents"
            className="grid size-11 place-items-center rounded-full text-muted-foreground/70 hover:bg-card"
          >
            <Lock className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-3 pb-36 md:pb-12">{children}</main>

      {/* 手机底部导航：大图标 + 彩色圆底 */}
      <nav
        aria-label="Kid navigation"
        className="fixed inset-x-3 bottom-3 z-30 rounded-[2rem] bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-4 px-2 py-2">
          {NAV.map(({ href, label, icon: Icon, tone }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className="kid-press flex flex-col items-center gap-1 py-1" aria-current={active ? "page" : undefined}>
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl transition-all",
                    active ? cn(tone, "shadow-soft") : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-6" strokeWidth={2.4} />
                </span>
                <span className={cn("text-xs font-extrabold", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {pickerOpen && <ChildPicker onClose={() => setPickerOpen(false)} />}
      {gateOpen && <ParentGate open onClose={() => setGateOpen(false)} />}
    </div>
  );
}

/** “谁在玩？”——大头像选择孩子 */
function ChildPicker({ onClose }: { onClose: () => void }) {
  const kids = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/30 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[2rem] bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between">
          <h2 id="picker-title" className="text-2xl font-extrabold">
            Who&apos;s playing?
          </h2>
          <button onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full hover:bg-muted">
            <X className="size-6" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => {
                setActiveChild(k.id);
                onClose();
              }}
              aria-pressed={k.id === activeId}
              className={cn(
                "kid-press flex flex-col items-center gap-2 rounded-3xl border-[3px] p-5",
                k.id === activeId ? "border-primary bg-sky" : "border-transparent bg-muted",
              )}
            >
              <span className="grid size-20 place-items-center rounded-full bg-card text-5xl shadow-soft" aria-hidden>
                {childEmoji(k)}
              </span>
              <span className="text-xl font-extrabold">{k.nickname}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
