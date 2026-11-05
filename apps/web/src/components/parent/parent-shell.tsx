"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, BarChart3, Brain, LayoutDashboard, Settings, Smile, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARENT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const PARENT_NAV = [
  { href: "/parent", label: "Overview", icon: LayoutDashboard },
  { href: "/parent/children", label: "Children", icon: Baby },
  { href: "/parent/avatar", label: "Dad's Avatar", icon: Smile },
  { href: "/parent/memories", label: "Dad Memories", icon: Brain },
  { href: "/parent/reports", label: "Growth Reports", icon: BarChart3 },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];

export function ParentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/parent" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh md:flex">
      {/* 桌面侧边栏 */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">👨</span>
          AI Dad
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Parent navigation">
          {PARENT_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold",
                isActive(href) ? "bg-sky text-sky-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-accent p-4">
          <p className="text-sm font-bold text-accent-foreground">Hand the phone over?</p>
          <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
            <Link href="/kid/home">
              <Sparkles /> Enter Kid Mode
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 手机顶部 */}
        <header className="safe-top sticky top-0 z-30 border-b bg-card/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-extrabold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">👨</span>
              AI Dad
            </Link>
            <Button asChild size="sm" variant="secondary">
              <Link href="/kid/home">Kid Mode</Link>
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Parent navigation">
            {PARENT_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
                  isActive(href) ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <p className="sr-only">Signed in as {PARENT.name}</p>
          {children}
        </main>
      </div>
    </div>
  );
}
