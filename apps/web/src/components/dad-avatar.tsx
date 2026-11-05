"use client";

import { lazy, Suspense, useEffect, useId, useState } from "react";
import { DEFAULT_LOOK, HAIR_COLORS, SHIRTS, SKIN, type AvatarState, type DadLook } from "@/lib/avatar";
import { loadVrm } from "@/lib/vrm-store";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

// three.js 体积较大：只有家长选了 3D 形象时才加载
const DadAvatar3D = lazy(() => import("./dad-avatar-3d"));

type AvatarProps = {
  className?: string;
  state?: AvatarState;
  /** 旧接口：mood="talking" 等同于 state="talking" */
  mood?: "happy" | "talking";
  online?: boolean;
  /** 传入时强制用 2D 并使用这个外观（编辑器预览用） */
  look?: DadLook;
  /** auto：跟随家长的设置；2d / 3d：强制 */
  variant?: "auto" | "2d" | "3d";
};

/**
 * AI 爸爸虚拟形象。家长在 /parent/avatar 选择 2D 卡通（可调外观）或上传 3D 模型（VRM）。
 * 3D 加载失败或设备不支持 WebGL 时自动退回 2D。
 */
export function DadAvatar(props: AvatarProps) {
  const mode = useAppStore((s) => s.avatarMode);
  const vrm = useAppStore((s) => s.vrm);
  const variant = props.variant ?? "auto";
  const want3d = Boolean(vrm) && !props.look && (variant === "3d" || (variant === "auto" && mode === "3d"));
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [failed, setFailed] = useState(false);
  // 3D 模型加载需要一点时间：加载完成后先挥手打招呼，免得错过页面开头的问候
  const [greeting, setGreeting] = useState(false);
  const version = want3d ? (vrm?.version ?? null) : null;

  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => setGreeting(false), 2200);
    return () => clearTimeout(t);
  }, [greeting]);

  useEffect(() => {
    if (version === null) return;
    let alive = true;
    setFailed(false);
    loadVrm(version).then((d) => {
      if (!alive) return;
      if (d) setData(d);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const requested: AvatarState = props.state ?? (props.mood === "talking" ? "talking" : "idle");
  const state: AvatarState = greeting && requested === "idle" ? "waving" : requested;
  if (!want3d || failed || !data) return <DadAvatar2D {...props} />;

  return (
    <div className={cn("relative inline-block", props.className)} data-avatar-state={state} data-avatar-kind="3d">
      <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-primary bg-sky">
        <Suspense fallback={null}>
          <DadAvatar3D data={data} state={state} onError={() => setFailed(true)} onReady={() => setGreeting(true)} />
        </Suspense>
      </div>
      {state === "thinking" && (
        <svg viewBox="0 0 30 30" className="absolute -top-[6%] -right-[6%] w-[24%]" aria-hidden>
          <g className="dad-think" fill="#fff" stroke="#2F6FED" strokeWidth="1.5">
            <circle cx="6" cy="24" r="2.5" />
            <circle cx="13" cy="16" r="3.5" />
            <circle cx="22" cy="7" r="5" />
          </g>
        </svg>
      )}
      {props.online && <span className="absolute right-[6%] bottom-[6%] size-[22%] rounded-full border-[3px] border-white bg-success" />}
    </div>
  );
}

/**
 * 会动的 AI 爸爸虚拟形象（纯 SVG + CSS 动画，离线可用，不依赖任何服务）。
 *
 * 状态：
 *   idle 呼吸、眨眼、轻微摆头 · waving 挥手 · listening 歪头听 ·
 *   thinking 眼睛往上看 + 思考泡泡 · talking 口型开合 · happy 眯眼大笑
 *
 * 外观默认读取家长在 /parent/avatar 里的设置；也可以通过 look 传入（编辑器预览用）。
 */
function DadAvatar2D({ className, state, mood, online = false, look }: AvatarProps) {
  const savedLook = useAppStore((s) => s.dadLook);
  const l = look ?? savedLook ?? DEFAULT_LOOK;
  const s: AvatarState = state ?? (mood === "talking" ? "talking" : "idle");
  const mouth = useMouth(s === "talking");
  const uid = useId().replace(/:/g, "");

  const skin = SKIN[l.skin];
  const hair = HAIR_COLORS[l.hairColor].color;
  const shirt = SHIRTS[l.shirt];
  const happyEyes = s === "happy" || s === "waving";

  return (
    <div className={cn("relative inline-block", className)} data-avatar-state={s}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`Dad AI, ${s}`} className="dad-avatar h-full w-full overflow-visible">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <circle cx="60" cy="60" r="56" />
          </clipPath>
        </defs>

        <circle cx="60" cy="60" r="58" fill="#E8F0FF" />

        <g clipPath={`url(#clip-${uid})`}>
          <g className={cn("dad-figure", s === "happy" && "dad-bounce")}>
            {/* 挥手的手臂（不挥手时放下，藏在身体后面） */}
            <g className={cn("dad-arm", s === "waving" && "dad-arm-wave")}>
              <path d="M86 104 L99 74" stroke={shirt.color} strokeWidth="13" strokeLinecap="round" fill="none" />
              <circle cx="100" cy="69" r="7" fill={skin.face} />
            </g>

            {/* 身体 */}
            <path d="M16 124 C 18 98, 36 83, 60 83 C 84 83, 102 98, 104 124 Z" fill={shirt.color} />
            <path d="M50 83 L60 95 L70 83" fill={shirt.collar} />
            <rect x="52" y="70" width="16" height="15" rx="6" fill={skin.shade} />

            {/* 头部 */}
            <g className={cn("dad-head", s === "listening" && "dad-head-tilt", s === "thinking" && "dad-head-up")}>
              <ellipse cx="34" cy="56" rx="5" ry="7" fill={skin.shade} />
              <ellipse cx="86" cy="56" rx="5" ry="7" fill={skin.shade} />
              <ellipse cx="60" cy="54" rx="26" ry="28" fill={skin.face} />

              <Beard kind={l.beard} color={hair} />
              <Hair style={l.hairStyle} color={hair} />

              {/* 眉毛 */}
              <g className={cn("dad-brows", (s === "thinking" || happyEyes) && "dad-brows-up")}>
                <path d="M41 43 q6 -3 12 0" stroke={hair} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                <path d="M67 43 q6 -3 12 0" stroke={hair} strokeWidth="2.6" strokeLinecap="round" fill="none" />
              </g>

              {/* 眼睛 */}
              {happyEyes ? (
                <g stroke="#1D2B4F" strokeWidth="2.6" strokeLinecap="round" fill="none">
                  <path d="M44 55 q3.5 -4 7 0" />
                  <path d="M69 55 q3.5 -4 7 0" />
                </g>
              ) : (
                <g className="dad-eyes">
                  <g transform={s === "thinking" ? "translate(1.5 -2)" : undefined}>
                    <circle cx="47.5" cy="54" r="2.7" fill="#1D2B4F" />
                    <circle cx="72.5" cy="54" r="2.7" fill="#1D2B4F" />
                    <circle cx="48.4" cy="53" r="0.8" fill="#fff" />
                    <circle cx="73.4" cy="53" r="0.8" fill="#fff" />
                  </g>
                </g>
              )}

              <Glasses kind={l.glasses} />

              {/* 鼻子、腮红 */}
              <path d="M60 57 q-2.5 4 0 5.5" stroke={skin.shade} strokeWidth="2" strokeLinecap="round" fill="none" />
              {l.beard !== "full" && (
                <>
                  <circle cx="42" cy="66" r="4" fill="#FFB3A0" opacity="0.55" />
                  <circle cx="78" cy="66" r="4" fill="#FFB3A0" opacity="0.55" />
                </>
              )}
              {/* 络腮胡时嘴巴周围留出皮肤，口型才看得清 */}
              {l.beard === "full" && <ellipse cx="60" cy="69.5" rx="9.5" ry="6" fill={skin.face} />}
              {l.beard === "mustache" && (
                <path d="M50 65 C 54 61.5, 58 62.5, 60 64.5 C 62 62.5, 66 61.5, 70 65 C 66 67.5, 62 66.5, 60 65.5 C 58 66.5, 54 67.5, 50 65 Z" fill={hair} />
              )}

              <Mouth state={s} open={mouth} />
            </g>
          </g>
        </g>

        <circle cx="60" cy="60" r="57" fill="none" stroke="#2F6FED" strokeWidth="4" />

        {/* 思考泡泡 */}
        {s === "thinking" && (
          <g className="dad-think" fill="#fff" stroke="#2F6FED" strokeWidth="1.5">
            <circle cx="92" cy="26" r="2.5" />
            <circle cx="99" cy="18" r="3.5" />
            <circle cx="108" cy="8" r="5" />
          </g>
        )}
      </svg>
      {online && <span className="absolute right-[6%] bottom-[6%] size-[22%] rounded-full border-[3px] border-white bg-success" />}
    </div>
  );
}

/** 说话时的口型开合（0~1），模拟音节节奏；减少动态效果时固定半开 */
function useMouth(talking: boolean): number {
  const [open, setOpen] = useState(0);
  useEffect(() => {
    if (!talking) {
      setOpen(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(0.5);
      return;
    }
    let target = 0.6;
    let value = 0;
    let last = 0;
    let raf = 0;
    const tick = (t: number) => {
      if (t - last > 110) {
        // 偶尔闭嘴停顿，像在换气 / 断词
        target = Math.random() < 0.18 ? 0.05 : 0.25 + Math.random() * 0.75;
        last = t;
      }
      value += (target - value) * 0.35;
      setOpen(value);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [talking]);
  return open;
}

function Mouth({ state, open }: { state: AvatarState; open: number }) {
  const lip = "#B5473A";
  switch (state) {
    case "talking":
      return (
        <g>
          <ellipse cx="60" cy="70" rx={5 + open * 2} ry={1.2 + open * 5} fill={lip} />
          {open > 0.45 && <ellipse cx="60" cy={71.5 + open * 2} rx={3} ry={open * 1.6} fill="#F08A80" />}
        </g>
      );
    case "happy":
    case "waving":
      return (
        <g>
          <path d="M48.5 66 Q60 79 71.5 66 Z" fill={lip} />
          <path d="M51 66.5 Q60 69 69 66.5 L68 68 Q60 70.5 52 68 Z" fill="#fff" />
        </g>
      );
    case "thinking":
      return <path d="M54 70.5 q4 1 9 -1.5" stroke={lip} strokeWidth="2.6" strokeLinecap="round" fill="none" />;
    case "listening":
      return <path d="M53.5 68 c3 3 10 3 13 0" stroke={lip} strokeWidth="2.8" strokeLinecap="round" fill="none" />;
    default:
      return <path d="M50 67 c4 6 16 6 20 0" stroke={lip} strokeWidth="3" strokeLinecap="round" fill="none" />;
  }
}

function Hair({ style, color }: { style: DadLook["hairStyle"]; color: string }) {
  switch (style) {
    case "short":
      return <path d="M34 48c-1-17 12-27 27-27 16 0 27 9 26 26-6-8-15-12-27-12-11 0-20 5-26 13z" fill={color} />;
    case "side":
      return (
        <path
          d="M33 50 C 30 30, 45 20, 62 21 C 79 22, 90 33, 87 50 C 84 40, 76 33, 64 31 C 56 37, 44 38, 38 35 C 35 40, 34 45, 33 50 Z"
          fill={color}
        />
      );
    case "curly":
      return (
        <g fill={color}>
          {[
            [37, 41, 6.5],
            [42, 32, 7.5],
            [51, 26, 8],
            [61, 24, 8],
            [71, 26, 8],
            [79, 32, 7.5],
            [84, 41, 6.5],
            [34, 49, 4.5],
            [86, 49, 4.5],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case "buzz":
      return <path d="M35 47c0-15 11-24 25-24s25 9 25 24c-6-7-15-10-25-10s-19 3-25 10z" fill={color} opacity="0.6" />;
    case "bald":
      return (
        <g fill={color} opacity="0.8">
          <ellipse cx="36" cy="49" rx="3" ry="6" />
          <ellipse cx="84" cy="49" rx="3" ry="6" />
        </g>
      );
  }
}

function Beard({ kind, color }: { kind: DadLook["beard"]; color: string }) {
  if (kind === "stubble") {
    return (
      <path
        d="M36 62 C 38 78, 50 84, 60 84 C 70 84, 82 78, 84 62 C 80 72, 72 76, 60 76 C 48 76, 40 72, 36 62 Z"
        fill={color}
        opacity="0.22"
      />
    );
  }
  if (kind === "full") {
    return (
      <path
        d="M35 58 C 36 80, 48 88, 60 88 C 72 88, 84 80, 85 58 C 81 66, 75 72, 67 73 C 64 64, 56 64, 53 73 C 45 72, 39 66, 35 58 Z"
        fill={color}
      />
    );
  }
  return null;
}

function Glasses({ kind }: { kind: DadLook["glasses"] }) {
  if (kind === "none") return null;
  return (
    <g fill="none" stroke="#1D2B4F" strokeWidth="2.4">
      {kind === "square" ? (
        <>
          <rect x="39" y="47" width="17" height="13" rx="5" />
          <rect x="64" y="47" width="17" height="13" rx="5" />
        </>
      ) : (
        <>
          <circle cx="47.5" cy="54" r="8" />
          <circle cx="72.5" cy="54" r="8" />
        </>
      )}
      <path d="M56 53 h8" />
    </g>
  );
}

