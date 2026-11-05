/**
 * 前后端共享的取值类型，与 infra/sql/*.sql 中的 CHECK 约束保持一致。
 * 修改数据库取值时，同步修改这里。
 */

export const AGE_STAGES = ['S1', 'S2', 'S3', 'S4'] as const;
export type AgeStage = (typeof AGE_STAGES)[number];

export const GENDERS = ['boy', 'girl', 'unspecified'] as const;
export type Gender = (typeof GENDERS)[number];

export const STORY_MODES = ['bedtime', 'adventure', 'knowledge', 'interactive', 'bilingual'] as const;
export type StoryMode = (typeof STORY_MODES)[number];

export const STORY_STATUSES = ['generating', 'ready', 'failed', 'blocked'] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const INTEREST_STATUSES = ['emerging', 'stable', 'fading'] as const;
export type InterestStatus = (typeof INTEREST_STATUSES)[number];

export const INTEREST_SOURCES = ['parent', 'child', 'inferred'] as const;
export type InterestSource = (typeof INTEREST_SOURCES)[number];

export const MESSAGE_ROLES = ['child', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const VOCAB_STATES = ['exposed', 'recognized', 'produced', 'mastered'] as const;
export type VocabState = (typeof VOCAB_STATES)[number];

export const MEMORY_CATEGORIES = [
  'like', 'dislike', 'fear', 'learned', 'recent_topic', 'fact', 'wish', 'milestone', 'episode',
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const GROWTH_DIMENSIONS = ['english', 'chinese', 'knowledge', 'confidence'] as const;
export type GrowthDimension = (typeof GROWTH_DIMENSIONS)[number];

/** 与数据库函数 child_age_stage() 相同的规则，供前端离线显示 */
export function ageStageFromMonths(ageMonths: number): AgeStage {
  if (ageMonths < 60) return 'S1';
  if (ageMonths < 84) return 'S2';
  if (ageMonths < 108) return 'S3';
  return 'S4';
}
