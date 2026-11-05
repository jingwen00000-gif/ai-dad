import type { AgeStage, Gender } from '../services/children'

export const STAGE_NAMES: Record<AgeStage, string> = {
  S1: '萌芽营',
  S2: '探索营',
  S3: '求知营',
  S4: '冒险营',
}

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'boy', label: '男孩' },
  { value: 'girl', label: '女孩' },
  { value: 'unspecified', label: '不透露' },
]

/** 67 个月 → "5岁7个月" */
export function formatAge(ageMonths: number): string {
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12
  if (years === 0) return `${months}个月`
  return months === 0 ? `${years}岁` : `${years}岁${months}个月`
}

export function avatarEmoji(gender: Gender): string {
  return gender === 'boy' ? '👦' : gender === 'girl' ? '👧' : '🧒'
}

/** 北京时间的今天 YYYY-MM-DD，用作生日选择器的上限 */
export function todayString(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}
