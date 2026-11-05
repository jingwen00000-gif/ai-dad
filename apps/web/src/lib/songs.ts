/**
 * 儿歌曲库（原型）。
 * license：上线前每首都要确认版权。public_domain = 公有领域；original = 我们原创；
 * 有版权的歌（如 You Are My Sunshine、数鸭子）需要授权后才能用爸爸的声音演唱，暂不收录。
 */
export type SongLanguage = "English" | "Chinese";
export type SongCategory = "classic" | "special";

export interface Song {
  id: string;
  title: string;
  language: SongLanguage;
  category: SongCategory;
  emoji: string;
  license: "public_domain" | "original";
  /** 歌词，{name} 会替换成孩子的昵称 */
  lyrics: string[];
}

export const SONGS: Song[] = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    language: "English",
    category: "classic",
    emoji: "⭐",
    license: "public_domain",
    lyrics: [
      "Twinkle, twinkle, little star,",
      "How I wonder what you are!",
      "Up above the world so high,",
      "Like a diamond in the sky.",
      "Twinkle, twinkle, little star,",
      "How I wonder what you are!",
    ],
  },
  {
    id: "row-boat",
    title: "Row, Row, Row Your Boat",
    language: "English",
    category: "classic",
    emoji: "🚣",
    license: "public_domain",
    lyrics: ["Row, row, row your boat,", "Gently down the stream.", "Merrily, merrily, merrily, merrily,", "Life is but a dream."],
  },
  {
    id: "abc-song",
    title: "ABC Song",
    language: "English",
    category: "classic",
    emoji: "🔤",
    license: "public_domain",
    lyrics: ["A B C D E F G,", "H I J K L M N O P,", "Q R S, T U V,", "W X, Y and Z.", "Now I know my ABCs,", "Next time won't you sing with me?"],
  },
  {
    id: "bus",
    title: "The Wheels On The Bus",
    language: "English",
    category: "classic",
    emoji: "🚌",
    license: "public_domain",
    lyrics: [
      "The wheels on the bus go round and round,",
      "Round and round, round and round.",
      "The wheels on the bus go round and round,",
      "All through the town!",
    ],
  },
  {
    id: "baa-baa",
    title: "Baa Baa Black Sheep",
    language: "English",
    category: "classic",
    emoji: "🐑",
    license: "public_domain",
    lyrics: [
      "Baa, baa, black sheep, have you any wool?",
      "Yes sir, yes sir, three bags full.",
      "One for the master, one for the dame,",
      "And one for the little boy who lives down the lane.",
    ],
  },
  {
    id: "xiaoxingxing",
    title: "小星星",
    language: "Chinese",
    category: "classic",
    emoji: "⭐",
    license: "public_domain",
    lyrics: ["一闪一闪亮晶晶，", "满天都是小星星。", "挂在天上放光明，", "好像许多小眼睛。"],
  },
  {
    id: "liangzhilaohu",
    title: "两只老虎",
    language: "Chinese",
    category: "classic",
    emoji: "🐯",
    license: "public_domain",
    lyrics: ["两只老虎，两只老虎，", "跑得快，跑得快。", "一只没有耳朵，一只没有尾巴，", "真奇怪，真奇怪。"],
  },
  {
    id: "goodnight",
    title: "Goodnight {name}",
    language: "English",
    category: "special",
    emoji: "🌙",
    license: "original",
    lyrics: [
      "Goodnight {name}, the moon is high,",
      "The stars are winking in the sky.",
      "Close your eyes and dream so deep,",
      "Dad is here while you're asleep.",
    ],
  },
  {
    id: "daddy-loves-you",
    title: "Daddy Loves You",
    language: "English",
    category: "special",
    emoji: "❤️",
    license: "original",
    lyrics: [
      "When you laugh and when you play,",
      "Daddy loves you every day.",
      "Near or far, in rain or sun,",
      "{name}, you're my special one.",
    ],
  },
  {
    id: "sydney-song",
    title: "Sydney Goodnight Song",
    language: "English",
    category: "special",
    emoji: "🇦🇺",
    license: "original",
    lyrics: [
      "Across the sea where koalas sleep,",
      "The harbour lights are shining deep.",
      "I look up at the moon and see",
      "{name} is looking back at me.",
    ],
  },
  {
    id: "wanan",
    title: "晚安歌",
    language: "Chinese",
    category: "special",
    emoji: "🧸",
    license: "original",
    lyrics: ["小月亮，弯弯笑，", "{name}乖乖睡觉觉。", "爸爸在远方想着你，", "梦里我们一起跑。"],
  },
];

export const SONG_BY_ID = Object.fromEntries(SONGS.map((s) => [s.id, s])) as Record<string, Song>;

export function personalize(text: string, name: string): string {
  return text.replaceAll("{name}", name);
}
