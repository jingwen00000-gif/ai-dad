import type { AgeStage } from "./types";

/** 与后端 child_age_months() 规则一致：整月数，按北京时间 */
export function ageInMonths(birthday: string, now: Date = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(now);
  const [by, bm, bd] = birthday.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let months = (ty - by) * 12 + (tm - bm);
  if (td < bd) months -= 1;
  return months;
}

export function ageStage(months: number): AgeStage {
  if (months < 60) return "S1";
  if (months < 84) return "S2";
  if (months < 108) return "S3";
  return "S4";
}

export const STAGE_LABELS: Record<AgeStage, string> = {
  S1: "Sprout Camp",
  S2: "Explorer Camp",
  S3: "Discovery Camp",
  S4: "Adventure Camp",
};

export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

export function greeting(now: Date = new Date()): { text: string; emoji: string } {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 18) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

/** 两个城市的大圆距离（公里），用城市坐标计算，不需要精确定位 */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function localTime(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(now);
}
