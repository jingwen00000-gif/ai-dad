/**
 * 前端领域类型。命名与数据库表对应，接后端时只需替换数据来源：
 * Child → children，Story → stories，StorySession → story_sessions，
 * LearningEvent → learning_events，DadMemory → dad_memories（待建表）。
 */

export type Gender = "boy" | "girl" | "unspecified";
export type AgeStage = "S1" | "S2" | "S3" | "S4";

export type InterestCode =
  | "dinosaur"
  | "space"
  | "fire_truck"
  | "robot"
  | "ocean"
  | "panda"
  | "train"
  | "magic";

export interface Interest {
  code: InterestCode;
  name: string;
  nameZh: string;
  emoji: string;
}

export interface Child {
  id: string;
  nickname: string;
  birthday: string; // YYYY-MM-DD
  gender: Gender;
  interests: InterestCode[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** 这道题考查的英文单词，答对计入 child_vocab */
  word?: string;
}

export interface Story {
  id: string;
  title: string;
  emoji: string;
  theme: InterestCode;
  minutes: number;
  /** 卡片背景渐变（Tailwind 类） */
  cover: string;
  summary: string;
  paragraphs: string[];
  newWords: { word: string; zh: string }[];
  questions: QuizQuestion[];
  /** 故事里引用了爸爸的哪段真实经历（Dad Memory Vault） */
  dadMemoryId?: string;
}

export type MemoryCategory = "childhood" | "work" | "family" | "lessons" | "letters";

export interface DadMemory {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "child" | "dad";
  text: string;
  at: string;
}

export interface LearningEvent {
  id: string;
  childId: string;
  dimension: "english" | "chinese" | "knowledge" | "confidence";
  signal: "quiz_correct" | "quiz_wrong" | "story_completed";
  value: number;
  refId: string;
  occurredAt: string;
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface GrowthSnapshot {
  readingStars: number; // 1-5
  englishLevel: number; // E0-E6
  wordsLearned: number;
  weekWords: string[];
  aiComment: string;
  badges: Badge[];
}

export interface Report {
  storySessions: number;
  minutes: number;
  masteredWords: number;
  interestRanking: { code: InterestCode; score: number }[];
  readingTrend: { month: string; level: number }[];
  weeklyMinutes: { day: string; minutes: number }[];
}

/** 城市字典（固定数据）。爸爸只选城市，不上传精确定位 */
export interface City {
  code: string;
  name: string;
  country: string;
  flag: string;
  timezone: string;
  lat: number;
  lng: number;
}

/** 对应 dad_presence：爸爸手动设置的所在城市和状态 */
export interface DadPresence {
  cityCode: string;
  status: "working" | "resting" | "traveling" | "home";
  weather: { emoji: string; label: string };
}

/** 对应 dad_messages：爸爸本人写给孩子的留言（AI 只负责用爸爸声音朗读） */
export interface DadMessage {
  id: string;
  childId: string;
  text: string;
  createdAt: string;
}

/** 对应 dad_activity：爸爸真实做过的事，只记录真实事件，不由 AI 生成 */
export interface DadActivityDay {
  date: string; // YYYY-MM-DD
  cityCode: string;
  items: { emoji: string; text: string }[];
}
