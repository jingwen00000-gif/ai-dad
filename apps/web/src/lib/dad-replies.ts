import { INTEREST_BY_CODE } from "./mock-data";
import type { Child } from "./types";

/**
 * 原型用的规则回复。V1 正式版换成大模型（国产已备案模型），
 * 但身份原则不变：AI Dad 是“用爸爸声音的 AI 伙伴”，不冒充真爸爸。
 */
export function dadReply(input: string, child: Child): string {
  const text = input.toLowerCase();
  const name = child.nickname;
  const fav = child.interests[0] ? INTEREST_BY_CODE[child.interests[0]] : undefined;

  if (/(are you (real|really)|real dad|are you my dad|是真的爸爸|你是爸爸吗)/.test(text)) {
    return `Good question, ${name}! I'm Dad AI — I talk with Dad's voice and I know lots of his stories. The real Dad loves you more than anything, and he can't wait to hear about your day.`;
  }
  if (/(work|working|busy|上班|工作)/.test(text)) {
    return `Dad is at work today, buddy. He asked me to tell you he's thinking about you! Want to tell me something fun, so you can tell him tonight?`;
  }
  if (/(miss|想你|想爸爸)/.test(text)) {
    return `Dad misses you too, ${name}. 💙 How about we draw him a picture? You can show it to him when he gets home!`;
  }
  if (/(dino|恐龙|t-?rex)/.test(text)) {
    return `Roar! 🦖 Did you know the T-Rex had tiny arms but super strong legs? It could run as fast as a car in the city! What's your favorite dinosaur?`;
  }
  if (/(space|rocket|planet|moon|mars|太空|火箭)/.test(text)) {
    return `Whoosh! 🚀 Mars is called the red planet because its dirt is full of rust. Want to hear "Adventure To Mars" later?`;
  }
  if (/(story|故事)/.test(text)) {
    return `I'd love to tell you a story! Tap "Hear a Story" and pick one. ${fav ? `Maybe one about ${fav.emoji} ${fav.name.toLowerCase()}s?` : ""}`.trim();
  }
  if (/(sad|scared|afraid|难过|害怕)/.test(text)) {
    return `It's okay to feel that way, ${name}. Can you tell Mom or Dad about it too? Grown-ups who love you can help. I'm right here listening.`;
  }
  if (/^(hi|hello|hey|你好)/.test(text)) {
    return `Hi ${name}! 👋 I'm so happy to see you. What did you do today?`;
  }
  return fav
    ? `That's so interesting, ${name}! Tell me more. By the way… did you think about ${fav.emoji} ${fav.name.toLowerCase()}s today?`
    : `That's so interesting, ${name}! Tell me more?`;
}

export const SUGGESTED_PROMPTS = ["Dad, are you working?", "Tell me about dinosaurs!", "I miss you", "Are you the real Dad?"];
