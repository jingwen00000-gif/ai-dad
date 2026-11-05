import Link from "next/link";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <DadAvatar className="mx-auto size-32" />
        <h1 className="mt-4 text-3xl font-extrabold">Oops, this page got lost 🧭</h1>
        <p className="mt-2 text-muted-foreground">Let&apos;s go back home together.</p>
        <Button asChild className="mt-6">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </main>
  );
}
