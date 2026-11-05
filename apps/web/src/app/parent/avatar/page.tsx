"use client";

import { useEffect, useRef, useState } from "react";
import { Box, RotateCcw, Trash2, Upload, Volume2 } from "lucide-react";
import { DadAvatar } from "@/components/dad-avatar";
import { Button } from "@/components/ui/button";
import {
  BEARDS,
  DEFAULT_LOOK,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  SHIRTS,
  SKIN,
  type AvatarState,
  type DadLook,
} from "@/lib/avatar";
import { useSpeech } from "@/lib/use-speech";
import { deleteVrm, MAX_VRM_BYTES, saveVrm } from "@/lib/vrm-store";
import { useActiveChild, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const ACTIONS: { state: AvatarState; label: string; emoji: string }[] = [
  { state: "idle", label: "Idle", emoji: "🙂" },
  { state: "waving", label: "Wave", emoji: "👋" },
  { state: "listening", label: "Listen", emoji: "👂" },
  { state: "thinking", label: "Think", emoji: "🤔" },
  { state: "talking", label: "Talk", emoji: "💬" },
  { state: "happy", label: "Happy", emoji: "😄" },
];

export default function DadAvatarStudio() {
  const look = useAppStore((s) => s.dadLook);
  const setDadLook = useAppStore((s) => s.setDadLook);
  const mode = useAppStore((s) => s.avatarMode);
  const setAvatarMode = useAppStore((s) => s.setAvatarMode);
  const vrm = useAppStore((s) => s.vrm);
  const show3d = mode === "3d" && Boolean(vrm);
  const child = useActiveChild();
  const speech = useSpeech();
  const [state, setState] = useState<AvatarState>("waving");
  const [saying, setSaying] = useState(false);

  // 进页面先挥手，再回到待机
  useEffect(() => {
    const t = setTimeout(() => setState((s) => (s === "waving" ? "idle" : s)), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!saying) return;
    setState("talking");
    return speech.speak(`Hi ${child.nickname}! It's Dad. I love you, and I'll see you soon!`, () => {
      setSaying(false);
      setState("happy");
    });
  }, [saying, speech, child.nickname]);

  const pick = (patch: Partial<DadLook>) => {
    setDadLook(patch);
    setState("happy");
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Dad&apos;s Avatar 🧑‍🎨</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Make the avatar look like you. Your kids see it on every screen — it blinks, breathes, waves, listens and moves its
        mouth when it talks.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* 预览 */}
        <section className="h-fit rounded-3xl bg-card p-6 lg:sticky lg:top-6">
          <div className="rounded-3xl bg-gradient-to-b from-sky to-background p-6">
            {show3d ? (
              <DadAvatar className="mx-auto block size-56 sm:size-64" state={state} variant="3d" />
            ) : (
              <DadAvatar className="mx-auto block size-56 sm:size-64" state={state} look={look} />
            )}
          </div>
          <p className="mt-4 text-sm font-bold text-muted-foreground">Try an action</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.state}
                onClick={() => {
                  speech.stop();
                  setSaying(false);
                  setState(a.state);
                }}
                aria-pressed={state === a.state}
                className={cn(
                  "rounded-2xl border-2 px-2 py-2 text-sm font-bold",
                  state === a.state ? "border-primary bg-sky text-sky-foreground" : "border-border hover:bg-muted",
                )}
              >
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              speech.unlock();
              setSaying(true);
            }}
            disabled={saying}
          >
            <Volume2 /> {saying ? "Talking…" : `Say hi to ${child.nickname}`}
          </Button>
        </section>

        {/* 外观选项 */}
        <section className="flex flex-col gap-5 rounded-3xl bg-card p-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Avatar type">
            {(
              [
                { value: "2d", label: "2D Cartoon", sub: "Pick hair, glasses, beard" },
                { value: "3d", label: "3D Avatar", sub: "Upload from VRoid Studio" },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={mode === o.value}
                onClick={() => setAvatarMode(o.value)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-left",
                  mode === o.value ? "bg-card shadow-sm" : "text-muted-foreground hover:bg-card/60",
                )}
              >
                <span className="block font-extrabold">{o.label}</span>
                <span className="block text-xs">{o.sub}</span>
              </button>
            ))}
          </div>

          {mode === "3d" ? <Vrm3dPanel /> : <TwoDOptions look={look} pick={pick} onReset={() => setDadLook(DEFAULT_LOOK)} />}
        </section>
      </div>
    </div>
  );
}

function TwoDOptions({
  look,
  pick,
  onReset,
}: {
  look: DadLook;
  pick: (patch: Partial<DadLook>) => void;
  onReset: () => void;
}) {
  return (
    <>
          <OptionGroup label="Skin">
            {Object.entries(SKIN).map(([value, s]) => (
              <Swatch key={value} color={s.face} label={s.label} selected={look.skin === value} onClick={() => pick({ skin: value as DadLook["skin"] })} />
            ))}
          </OptionGroup>
          <OptionGroup label="Hair style">
            {HAIR_STYLES.map((h) => (
              <Chip key={h.value} label={h.label} selected={look.hairStyle === h.value} onClick={() => pick({ hairStyle: h.value })} />
            ))}
          </OptionGroup>
          <OptionGroup label="Hair color">
            {Object.entries(HAIR_COLORS).map(([value, h]) => (
              <Swatch key={value} color={h.color} label={h.label} selected={look.hairColor === value} onClick={() => pick({ hairColor: value as DadLook["hairColor"] })} />
            ))}
          </OptionGroup>
          <OptionGroup label="Glasses">
            {GLASSES.map((g) => (
              <Chip key={g.value} label={g.label} selected={look.glasses === g.value} onClick={() => pick({ glasses: g.value })} />
            ))}
          </OptionGroup>
          <OptionGroup label="Beard">
            {BEARDS.map((b) => (
              <Chip key={b.value} label={b.label} selected={look.beard === b.value} onClick={() => pick({ beard: b.value })} />
            ))}
          </OptionGroup>
          <OptionGroup label="Shirt">
            {Object.entries(SHIRTS).map(([value, s]) => (
              <Swatch key={value} color={s.color} label={s.label} selected={look.shirt === value} onClick={() => pick({ shirt: value as DadLook["shirt"] })} />
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button variant="outline" onClick={onReset}>
              <RotateCcw /> Reset look
            </Button>
            <p className="text-sm text-muted-foreground">Saved automatically.</p>
          </div>
    </>
  );
}

/** 3D：上传 VRoid Studio 导出的 .vrm 文件（只存在这台设备上） */
function Vrm3dPanel() {
  const vrm = useAppStore((s) => s.vrm);
  const setVrm = useAppStore((s) => s.setVrm);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!/\.vrm$/i.test(file.name)) return setError("Please choose a .vrm file exported from VRoid Studio.");
    if (file.size > MAX_VRM_BYTES) return setError("This file is over 60 MB. In VRoid Studio, lower the texture size when exporting.");
    setBusy(true);
    try {
      // 先试着解析一遍，确认是有效的 VRM，再保存
      const { parseVrm } = await import("@/components/dad-avatar-3d");
      const { VRMUtils } = await import("@pixiv/three-vrm");
      const parsed = await parseVrm(await file.arrayBuffer());
      const meta = parsed.meta as { name?: string; title?: string } | undefined;
      VRMUtils.deepDispose(parsed.scene);
      await saveVrm(file);
      setVrm({ name: meta?.name || meta?.title || file.name.replace(/\.vrm$/i, ""), bytes: file.size });
    } catch {
      setError("We couldn't open this file. Make sure it's a VRM exported from VRoid Studio.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // 先改设置（立即回到 2D），再在后台删除文件，避免中途离开页面导致状态不一致
  const remove = () => {
    setVrm(null);
    void deleteVrm().catch(() => undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      {vrm ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-success/40 bg-success/5 p-4">
          <Box className="size-8 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">{vrm.name}</p>
            <p className="text-sm text-muted-foreground">{(vrm.bytes / 1024 / 1024).toFixed(1)} MB · kids see this 3D avatar</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Remove 3D avatar" onClick={remove}>
            <Trash2 />
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed p-5 text-center">
          <Box className="mx-auto size-10 text-primary" />
          <p className="mt-2 font-extrabold">No 3D avatar yet</p>
          <p className="text-sm text-muted-foreground">Until you upload one, kids see the 2D cartoon.</p>
        </div>
      )}

      <input
        ref={inputRef}
        id="vrm-file"
        type="file"
        accept=".vrm"
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload /> {busy ? "Checking file…" : vrm ? "Replace .vrm file" : "Upload .vrm file"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-2xl bg-sky p-4 text-sm">
        <p className="font-extrabold text-sky-foreground">Make a 3D you in VRoid Studio (free)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Download VRoid Studio from vroid.com (Windows or Mac).</li>
          <li>Create a new male model and adjust face, hair, glasses and clothes to look like you.</li>
          <li>Click Export → Export as VRM, then upload the .vrm file here.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          The file stays on this device. When accounts are connected it will sync to your kids&apos; devices.
        </p>
      </div>
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border-2 px-4 py-2 text-sm font-bold",
        selected ? "border-primary bg-sky text-sky-foreground" : "border-border hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function Swatch({ color, label, selected, onClick }: { color: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-full border-2",
        selected ? "border-primary ring-4 ring-primary/20" : "border-border",
      )}
    >
      <span className="size-7 rounded-full border border-black/10" style={{ background: color }} />
    </button>
  );
}
