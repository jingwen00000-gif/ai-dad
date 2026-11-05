/**
 * 年龄计算。规则与数据库函数 child_age_months() / child_age_stage() 一致：
 * 月龄 = 整月数，不足一个月不计（当月日期还没到生日那天就减一个月）。
 * “今天”按北京时间算，避免凌晨 0-8 点用 UTC 日期少算一天。
 */

export type AgeStage = 'S1' | 'S2' | 'S3' | 'S4';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 'YYYY-MM-DD' 是否为真实存在的日期（排除 2023-02-30 这类） */
export function isValidDateOnly(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toISOString().slice(0, 10) === value;
}

export function todayInShanghai(now: Date = new Date()): string {
  // en-CA 格式即 YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(now);
}

export function ageInMonths(birthday: string, today: string): number {
  const b = DATE_RE.exec(birthday);
  const t = DATE_RE.exec(today);
  if (!b || !t) throw new Error(`日期格式应为 YYYY-MM-DD：${birthday} / ${today}`);
  let months = (+t[1] - +b[1]) * 12 + (+t[2] - +b[2]);
  if (+t[3] < +b[3]) months -= 1;
  return months;
}

export function ageStage(ageMonths: number): AgeStage {
  if (ageMonths < 60) return 'S1';
  if (ageMonths < 84) return 'S2';
  if (ageMonths < 108) return 'S3';
  return 'S4';
}

/** Prisma 的 @db.Date 字段读出来是 UTC 零点的 Date */
export function dateOnlyFromDb(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateOnlyToDb(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
