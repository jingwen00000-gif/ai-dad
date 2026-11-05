"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** 家长门：做一道乘法题才能离开孩子模式，防止孩子误入家长区 */
export function ParentGate({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  // 打开时就生成题目（组件每次打开都会重新挂载），避免先显示固定题目再闪变
  const [question] = useState(() => ({ a: 6 + Math.floor(Math.random() * 4), b: 6 + Math.floor(Math.random() * 4) }));
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(answer) === question.a * question.b) router.push("/parent");
    else {
      setError(true);
      setAnswer("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="grid size-11 place-items-center rounded-2xl bg-sky text-sky-foreground">
            <Lock className="size-5" />
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <h2 id="gate-title" className="mt-4 text-xl font-extrabold">
          Grown-ups only
        </h2>
        <p className="mt-1 text-muted-foreground">
          What is {question.a} × {question.b}?
        </p>
        <Input
          ref={inputRef}
          inputMode="numeric"
          aria-label="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))}
          className="mt-4"
          aria-invalid={error}
        />
        {error && <p className="mt-2 text-sm font-semibold text-destructive">Not quite — try again.</p>}
        <Button type="submit" className="mt-5 w-full">
          Continue to Parent Area
        </Button>
      </form>
    </div>
  );
}
