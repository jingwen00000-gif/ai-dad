"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ageInMonths, ageStage, formatAge, STAGE_LABELS } from "@/lib/age";
import { INTEREST_BY_CODE, INTERESTS } from "@/lib/mock-data";
import type { Child, InterestCode } from "@/lib/types";
import { useMounted } from "@/lib/use-mounted";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export default function ParentChildren() {
  const kids = useAppStore((s) => s.children);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Children</h1>
      <p className="mt-1 text-muted-foreground">Age and interests decide how Dad AI talks and which stories it tells.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {kids.map((k) =>
          editing === k.id ? (
            <EditChild key={k.id} child={k} onDone={() => setEditing(null)} />
          ) : (
            <ChildCard key={k.id} child={k} onEdit={() => setEditing(k.id)} />
          ),
        )}
      </div>
    </div>
  );
}

function ChildCard({ child, onEdit }: { child: Child; onEdit: () => void }) {
  const months = ageInMonths(child.birthday);
  const mounted = useMounted();
  return (
    <div className="flex flex-col rounded-3xl bg-card p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-sky text-4xl" aria-hidden>
          {child.gender === "girl" ? "👧" : "👦"}
        </span>
        <div>
          <h2 className="text-2xl font-extrabold">{child.nickname}</h2>
          <p className="font-semibold text-muted-foreground">
            {mounted ? `${formatAge(months)} · ${STAGE_LABELS[ageStage(months)]}` : "\u00a0"}
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm font-bold text-muted-foreground">Interests</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {child.interests.length ? (
          child.interests.map((code) => (
            <span key={code} className="rounded-full bg-accent px-3 py-1.5 font-bold text-accent-foreground">
              {INTEREST_BY_CODE[code].emoji} {INTEREST_BY_CODE[code].name}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">None yet</span>
        )}
      </div>
      <Button variant="outline" className="mt-6 self-start" onClick={onEdit}>
        <Pencil /> Edit Profile
      </Button>
    </div>
  );
}

function EditChild({ child, onDone }: { child: Child; onDone: () => void }) {
  const updateChild = useAppStore((s) => s.updateChild);
  const [nickname, setNickname] = useState(child.nickname);
  const [birthday, setBirthday] = useState(child.birthday);
  const [interests, setInterests] = useState<InterestCode[]>(child.interests);

  const toggle = (code: InterestCode) =>
    setInterests((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));

  return (
    <form
      className="rounded-3xl border-2 border-primary bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nickname.trim() || !birthday) return;
        updateChild(child.id, { nickname: nickname.trim(), birthday, interests });
        onDone();
      }}
    >
      <h2 className="text-xl font-extrabold">Edit {child.nickname}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`name-${child.id}`}>Nickname</Label>
          <Input id={`name-${child.id}`} value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`bday-${child.id}`}>Birthday</Label>
          <Input id={`bday-${child.id}`} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </div>
      </div>
      <p className="mt-5 text-sm font-bold">Interests</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {INTERESTS.map((i) => {
          const on = interests.includes(i.code);
          return (
            <button
              type="button"
              key={i.code}
              aria-pressed={on}
              onClick={() => toggle(i.code)}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 font-bold",
                on ? "border-primary bg-sky text-sky-foreground" : "border-border",
              )}
            >
              {i.emoji} {i.name}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
