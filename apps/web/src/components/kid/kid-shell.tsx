"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Globe2, Home, Lock, MessageCircle, Music, Star } from "lucide-react";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { ParentGate } from "./parent-gate";

const NAV: { href: string; label: string; icon: typeof Home; desktopOnly?: boolean }[] = [
  { href: "/kid/home", label: "Home", icon: Home },
  { href: "/kid/chat", label: "Talk", icon: MessageCircle },
  { href: "/kid/stories", label: "Stories", icon: BookOpen },
  { href: "/kid/sing", label: "Sing", icon: Music, desktopOnly: true },
  { href: "/kid/dad-location", label: "Dad", icon: Globe2 },
  { href: "/kid/growth", label: "Growth", icon: Star },
];

export function KidShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const child = useActiveChild();
  const kids = useAppStore((s) => s.children);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const [gateOpen, setGateOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/kid/home" && pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-sky via-background to-background">
      <header className="safe-top sticky top-0 z-30 border-b border-transparent bg-sky/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/kid/home" className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">👨</span>
            <span className="hidden sm:inline">AI Dad</span>
          </Link>

          {/* 谁在听：切换孩子 */}
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm" role="radiogroup" aria-label="Who is listening?">
            {kids.map((k) => (
              <button
                key={k.id}
                role="radio"
                aria-checked={k.id === child.id}
                onClick={() => setActiveChild(k.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-bold transition-colors",
                  k.id === child.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {k.gender === "girl" ? "👧" : "👦"} {k.nickname}
              </button>
            ))}
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Kid navigation">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold",
                  isActive(href) ? "bg-primary text-primary-foreground" : "hover:bg-card",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setGateOpen(true)}
            aria-label="Parents"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-card"
          >
            <Lock className="size-4" />
            <span className="hidden sm:inline">Parents</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:pb-10">{children}</main>

      {/* 手机底部导航 */}
      <nav
        aria-label="Kid navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.filter((n) => !n.desktopOnly).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-bold",
                isActive(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {gateOpen && <ParentGate open onClose={() => setGateOpen(false)} />}
    </div>
  );
}
