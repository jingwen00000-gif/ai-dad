import Link from "next/link";
import { BookOpen, Mic, Sparkles } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* 背景装饰 */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-secondary/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-primary/20 blur-3xl" />

      <div className="safe-top-8 relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-8 sm:px-8">
        <header className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">👨</span>
          AI Dad
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-10 py-10 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
              <Sparkles className="size-4" /> Dad&apos;s voice · Dad&apos;s stories
            </p>
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-6xl">
              Always Here.
              <br />
              <span className="text-primary">Even When Dad Is Away.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground md:max-w-lg">
              An AI buddy that talks in Dad&apos;s voice, tells stories from Dad&apos;s real life, and grows with your
              child.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild size="lg">
                <Link href="/parent">Parent Login</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/kid/home">Enter Kid Mode</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Demo build · sample data, no sign-in needed</p>
          </div>

          <div className="relative flex-1">
            <div className="relative mx-auto w-64 sm:w-80">
              <DadAvatar className="w-full drop-shadow-xl" online />
              <div className="absolute -left-6 top-6 hidden rotate-[-6deg] rounded-2xl bg-card px-4 py-2 text-sm font-bold shadow-lg sm:block">
                <Mic className="mr-1 inline size-4 text-primary" /> &ldquo;Hi buddy!&rdquo;
              </div>
              <div className="absolute -right-4 bottom-10 hidden rotate-[5deg] rounded-2xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-lg sm:block">
                <BookOpen className="mr-1 inline size-4" /> Story time
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
