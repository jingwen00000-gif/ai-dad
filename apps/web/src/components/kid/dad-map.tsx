"use client";

import { useEffect, useState } from "react";
import type { City } from "@/lib/types";

const W = 400;
const H = 260;
const PAD = 60;

/**
 * 两城之间的“飞行航线”示意图（不是真地图）：
 * 按经纬度等距投影确定两点的相对位置，所以爸爸换城市时方向也会跟着变。
 */
export function DadMap({ from, to }: { from: City; to: City }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const minLng = Math.min(from.lng, to.lng);
  const maxLng = Math.max(from.lng, to.lng);
  const minLat = Math.min(from.lat, to.lat);
  const maxLat = Math.max(from.lat, to.lat);
  const project = (c: City) => ({
    x: PAD + ((c.lng - minLng) / (maxLng - minLng || 1)) * (W - PAD * 2),
    y: PAD + ((maxLat - c.lat) / (maxLat - minLat || 1)) * (H - PAD * 2),
  });
  const a = project(from);
  const b = project(to);
  // 弧线控制点：两点中点向一侧偏移
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * 70;
  const cy = my + (dx / len) * 70;
  const path = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  // 二次贝塞尔曲线 t=0.5 处
  const midX = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
  const midY = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Flight path from ${from.name} to ${to.name}`}>
      <defs>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#4A63E7" opacity="0.12" />
        </pattern>
      </defs>
      <rect width={W} height={H} rx="28" fill="#EEF1FF" />
      <rect width={W} height={H} rx="28" fill="url(#dots)" />

      <path d={path} fill="none" stroke="#4A63E7" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />

      {reduceMotion ? (
        <text x={midX} y={midY} fontSize="30" textAnchor="middle" dominantBaseline="central">
          ✈️
        </text>
      ) : (
        <text fontSize="30" textAnchor="middle" dominantBaseline="central">
          ✈️
          <animateMotion dur="6s" repeatCount="indefinite" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </text>
      )}

      {[
        { c: from, p: a, color: "#FFC93C", label: "You" },
        { c: to, p: b, color: "#4A63E7", label: "Dad" },
      ].map(({ c, p, color, label }) => (
        <g key={c.code}>
          <circle cx={p.x} cy={p.y} r="16" fill={color} opacity="0.25">
            {!reduceMotion && <animate attributeName="r" values="12;22;12" dur="2.4s" repeatCount="indefinite" />}
          </circle>
          <circle cx={p.x} cy={p.y} r="8" fill={color} stroke="#fff" strokeWidth="3" />
          <text x={p.x} y={p.y - 26} textAnchor="middle" fontSize="15" fontWeight="800" fill="#1D2B4F">
            {c.flag} {c.name}
          </text>
          <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="12" fontWeight="700" fill="#6B7390">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
