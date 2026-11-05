import { INTEREST_BY_CODE } from "./mock-data";
import type { Child } from "./types";

/**
 * 原型用的规则回复（中英双语）。孩子用中文说，就用中文回；用英文说，就用英文回。
 * V1 正式版换成大模型（国产已备案模型），但两条原则不变：
 *   1. 跟随孩子的语言；
 *   2. AI Dad 是“用爸爸声音的 AI 伙伴”，不冒充真爸爸。
 */

export type ChatLang = "en-US" | "zh-CN";

const HAS_CHINESE = /[㐀-鿿]/;

export function detectLang(text: string): ChatLang {
  return HAS_CHINESE.test(text) ? "zh-CN" : "en-US";
}

type Rule = { match: RegExp; en: (c: Ctx) => string; zh: (c: Ctx) => string };
type Ctx = { name: string; favEn?: string; favZh?: string; favEmoji?: string };

const RULES: Rule[] = [
  {
    match: /(are you (real|really)|real dad|are you my dad|真的爸爸|真爸爸|你是爸爸吗|你是真的吗|你是谁)/,
    en: (c) =>
      `Good question, ${c.name}! I'm Dad AI — I talk with Dad's voice and I know lots of his stories. The real Dad loves you more than anything, and he can't wait to hear about your day.`,
    zh: (c) =>
      `问得好，${c.name}！我是 AI 爸爸，用爸爸的声音陪你聊天，还知道好多爸爸的故事。真正的爸爸最爱你了，他特别想听你讲今天发生的事。`,
  },
  {
    match: /(work|working|busy|上班|工作|在忙|忙吗)/,
    en: () => `Dad is at work today, buddy. He asked me to tell you he's thinking about you! Want to tell me something fun, so you can tell him tonight?`,
    zh: (c) => `爸爸今天在上班哦，${c.name}。他让我告诉你：他一直在想你！要不要先跟我说件开心的事，晚上再讲给爸爸听？`,
  },
  {
    match: /(miss|想你|想爸爸|好想)/,
    en: (c) => `Dad misses you too, ${c.name}. 💙 How about we draw him a picture? You can show it to him when he gets home!`,
    zh: (c) => `爸爸也好想你，${c.name}！💙 我们给爸爸画一幅画好不好？等爸爸回来就拿给他看！`,
  },
  {
    match: /(dino|t-?rex|恐龙|霸王龙)/,
    en: () => `Roar! 🦖 Did you know the T-Rex had tiny arms but super strong legs? It could run as fast as a car in the city! What's your favorite dinosaur?`,
    zh: () => `嗷呜！🦖 你知道吗？霸王龙的手臂很短，可是腿特别有力气，跑得跟城市里的汽车一样快！你最喜欢哪种恐龙呀？`,
  },
  {
    match: /(space|rocket|planet|moon|mars|star|太空|火箭|星球|月亮|火星|星星)/,
    en: () => `Whoosh! 🚀 Mars is called the red planet because its dirt is full of rust. Want to hear "Adventure To Mars" later?`,
    zh: () => `嗖！🚀 火星被叫作“红色星球”，因为它的泥土里有好多铁锈。等会儿要不要听《火星大冒险》的故事？`,
  },
  {
    match: /(story|故事)/,
    en: (c) => `I'd love to tell you a story! Tap "Stories" and pick one.${c.favEn ? ` Maybe one about ${c.favEmoji} ${c.favEn.toLowerCase()}s?` : ""}`,
    zh: (c) => `好呀，我最喜欢讲故事了！点下面的「Stories」挑一个吧。${c.favZh ? `要不要听一个关于${c.favEmoji}${c.favZh}的故事？` : ""}`,
  },
  {
    match: /(sad|scared|afraid|cry|难过|害怕|伤心|哭|怕)/,
    en: (c) => `It's okay to feel that way, ${c.name}. Can you tell Mom or Dad about it too? Grown-ups who love you can help. I'm right here listening.`,
    zh: (c) => `有这种感觉没关系的，${c.name}。也跟妈妈或爸爸说说好吗？爱你的大人都会帮你的。我在这里听你说。`,
  },
  {
    match: /^(hi|hello|hey|你好|嗨|哈喽|爸爸好|爸爸)/,
    en: (c) => `Hi ${c.name}! 👋 I'm so happy to see you. What did you do today?`,
    zh: (c) => `${c.name}你好呀！👋 见到你真开心。今天做了什么好玩的事？`,
  },
];

export function dadReply(input: string, child: Child): string {
  const text = input.toLowerCase().trim();
  const lang = detectLang(input);
  const fav = child.interests[0] ? INTEREST_BY_CODE[child.interests[0]] : undefined;
  const ctx: Ctx = { name: child.nickname, favEn: fav?.name, favZh: fav?.nameZh, favEmoji: fav?.emoji };

  const rule = RULES.find((r) => r.match.test(text));
  if (rule) return lang === "zh-CN" ? rule.zh(ctx) : rule.en(ctx);

  if (lang === "zh-CN") {
    return fav
      ? `真有意思，${ctx.name}！再多跟我说一点吧。对了，今天有没有想到${fav.emoji}${fav.nameZh}呀？`
      : `真有意思，${ctx.name}！再多跟我说一点吧？`;
  }
  return fav
    ? `That's so interesting, ${ctx.name}! Tell me more. By the way… did you think about ${fav.emoji} ${fav.name.toLowerCase()}s today?`
    : `That's so interesting, ${ctx.name}! Tell me more?`;
}

export function chatGreeting(name: string, lang: ChatLang): string {
  return lang === "zh-CN"
    ? `${name}你好！我是 AI 爸爸。想跟我说什么都可以哦 👂`
    : `Hi ${name}! I'm Dad AI. Tell me anything — I'm all ears. 👂`;
}

export const SUGGESTED_PROMPTS: Record<ChatLang, string[]> = {
  "en-US": ["Dad, are you working?", "Tell me about dinosaurs!", "I miss you", "Are you the real Dad?"],
  "zh-CN": ["爸爸在上班吗？", "给我讲讲恐龙吧！", "我想你了", "你是真的爸爸吗？"],
};
