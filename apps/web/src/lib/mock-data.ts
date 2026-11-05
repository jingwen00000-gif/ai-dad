import type {
  Child,
  City,
  DadActivityDay,
  DadMemory,
  DadMessage,
  DadPresence,
  GrowthSnapshot,
  Interest,
  MemoryCategory,
  Report,
  Story,
} from "./types";

export const PARENT = { name: "Alex" };

export const INTERESTS: Interest[] = [
  { code: "dinosaur", name: "Dinosaur", nameZh: "恐龙", emoji: "🦖" },
  { code: "space", name: "Space", nameZh: "太空", emoji: "🚀" },
  { code: "fire_truck", name: "Fire Truck", nameZh: "消防车", emoji: "🚒" },
  { code: "robot", name: "Robot", nameZh: "机器人", emoji: "🤖" },
  { code: "ocean", name: "Ocean", nameZh: "海洋", emoji: "🐳" },
  { code: "panda", name: "Panda", nameZh: "熊猫", emoji: "🐼" },
  { code: "train", name: "Train", nameZh: "火车", emoji: "🚂" },
  { code: "magic", name: "Magic", nameZh: "魔法", emoji: "🪄" },
];

export const INTEREST_BY_CODE = Object.fromEntries(INTERESTS.map((i) => [i.code, i])) as Record<
  Interest["code"],
  Interest
>;

export const SEED_CHILDREN: Child[] = [
  { id: "c-leo", nickname: "Leo", birthday: "2020-08-12", gender: "boy", interests: ["dinosaur", "space", "fire_truck"] },
  { id: "c-mia", nickname: "Mia", birthday: "2022-03-03", gender: "girl", interests: ["panda", "ocean", "magic"] },
];

export const MEMORY_CATEGORIES: { value: MemoryCategory; label: string; emoji: string; hint: string }[] = [
  { value: "childhood", label: "My Childhood", emoji: "🧒", hint: "Games you played, things you were scared of, your first bike…" },
  { value: "work", label: "My Work", emoji: "💼", hint: "What you do all day, explained so a 5-year-old gets it." },
  { value: "family", label: "Family Stories", emoji: "🏡", hint: "Grandma's cooking, the day your kid was born, family trips." },
  { value: "lessons", label: "Life Lessons", emoji: "🌱", hint: "Something you learned the hard way and want to pass on." },
  { value: "letters", label: "Future Letters", emoji: "💌", hint: "A message for your child to hear when they're older." },
];

export const SEED_MEMORIES: DadMemory[] = [
  {
    id: "m-bike",
    category: "childhood",
    title: "My First Bike",
    content:
      "When I was 7 years old, I learned how to ride a bike in the alley behind Grandma's house. I fell down five times and scraped my knee. Grandpa held the back of the seat, then let go without telling me — and I rode all the way to the corner by myself.",
    createdAt: "2026-10-02T20:15:00+08:00",
  },
  {
    id: "m-work",
    category: "work",
    title: "What Dad Builds",
    content:
      "I build apps on computers. It's a bit like LEGO: you put small pieces together until they make something useful, and when it breaks you look for the piece that's wrong.",
    createdAt: "2026-10-10T21:40:00+08:00",
  },
  {
    id: "m-born",
    category: "family",
    title: "The Night Leo Was Born",
    content:
      "It was raining hard. I drove very slowly to the hospital. When I first held you, you grabbed my finger and didn't let go.",
    createdAt: "2026-10-18T22:05:00+08:00",
  },
];

const P = (...lines: string[]) => lines;

export const STORIES: Story[] = [
  {
    id: "dino-space",
    title: "Dinosaur Space Mission",
    emoji: "🦖",
    theme: "dinosaur",
    minutes: 4,
    cover: "from-sky-400 to-indigo-500",
    summary: "Rexy the little dinosaur flies a rocket to find a lost star.",
    paragraphs: P(
      "Rexy was a little green dinosaur who loved looking at the night sky. One night, he saw a tiny star fall down behind the mountain.",
      "\"That star is lost!\" said Rexy. \"I will help it go home.\" He built a shiny rocket out of tin cans and leaves. Whoosh!",
      "In space, everything floated. Rexy's tail floated. His snack floated. Even his hat floated away! He laughed and said, \"Space is so silly!\"",
      "Then he met Luna the moon rabbit. \"I can see the star's home,\" said Luna. \"It is the empty spot next to the Big Dipper.\"",
      "Rexy and Luna carried the little star together and put it back in its spot. It twinkled three times to say thank you.",
      "When Rexy landed, he looked up. The sky had one more bright star — and he knew it was his friend.",
    ),
    newWords: [
      { word: "rocket", zh: "火箭" },
      { word: "star", zh: "星星" },
      { word: "float", zh: "漂浮" },
    ],
    questions: [
      { id: "q1", prompt: "Who helped the dinosaur?", options: ["A fire truck", "Luna the moon rabbit", "A big whale"], answerIndex: 1 },
      { id: "q2", prompt: "What did Rexy build?", options: ["A rocket", "A boat", "A house"], answerIndex: 0, word: "rocket" },
      { id: "q3", prompt: "In space, things…", options: ["sleep", "float", "cry"], answerIndex: 1, word: "float" },
    ],
  },
  {
    id: "fire-truck-hero",
    title: "Fire Truck Hero",
    emoji: "🚒",
    theme: "fire_truck",
    minutes: 3,
    cover: "from-orange-400 to-red-500",
    summary: "Little Red the fire truck helps a kitten stuck in a tree.",
    paragraphs: P(
      "Little Red was the smallest fire truck at the station. The big trucks said, \"You are too small to help.\"",
      "One morning, a kitten got stuck at the top of a tall tree. \"Meow! Meow!\" The big trucks were too wide to drive into the narrow park.",
      "\"I can fit!\" said Little Red. Beep beep! He drove between the benches and stopped under the tree.",
      "He stretched his ladder up, up, up. The kitten climbed down onto it, step by step, and jumped into the firefighter's arms.",
      "Everyone cheered. That night, the big trucks said, \"Small trucks can be big heroes too.\"",
    ),
    newWords: [
      { word: "ladder", zh: "梯子" },
      { word: "kitten", zh: "小猫" },
      { word: "small", zh: "小的" },
    ],
    questions: [
      { id: "q1", prompt: "Who was stuck in the tree?", options: ["A puppy", "A kitten", "A bird"], answerIndex: 1, word: "kitten" },
      { id: "q2", prompt: "Why could Little Red help?", options: ["He was small", "He could fly", "He was very loud"], answerIndex: 0, word: "small" },
      { id: "q3", prompt: "What did Little Red use?", options: ["A rope", "A ladder", "A balloon"], answerIndex: 1, word: "ladder" },
    ],
  },
  {
    id: "mars-adventure",
    title: "Adventure To Mars",
    emoji: "🚀",
    theme: "space",
    minutes: 5,
    cover: "from-amber-400 to-rose-500",
    summary: "Captain Leo explores the red planet and finds a surprise.",
    paragraphs: P(
      "Captain Leo put on his helmet. \"Three, two, one — blast off!\" His spaceship zoomed toward Mars, the red planet.",
      "Mars was dusty and red, like a giant desert. Leo's boots made big footprints in the soft red sand.",
      "Leo used his rover to look for water. Beep… beep… BEEP! The rover found ice hiding under a big rock.",
      "\"Water ice!\" shouted Leo. \"Plants could grow here one day.\" He took a photo to show everyone back on Earth.",
      "Before he left, Leo planted a little flag. On it, he wrote: \"Hello, Mars. We will come back.\"",
    ),
    newWords: [
      { word: "planet", zh: "行星" },
      { word: "astronaut", zh: "宇航员" },
      { word: "ice", zh: "冰" },
    ],
    questions: [
      { id: "q1", prompt: "What color is Mars?", options: ["Blue", "Red", "Green"], answerIndex: 1 },
      { id: "q2", prompt: "What did the rover find?", options: ["Ice", "Candy", "A cat"], answerIndex: 0, word: "ice" },
      { id: "q3", prompt: "Mars is a…", options: ["planet", "fish", "tree"], answerIndex: 0, word: "planet" },
    ],
  },
  {
    id: "brave-panda",
    title: "Brave Little Panda",
    emoji: "🐼",
    theme: "panda",
    minutes: 4,
    cover: "from-emerald-400 to-teal-500",
    summary: "Bao the panda learns to ride a bike — just like Dad once did.",
    dadMemoryId: "m-bike",
    paragraphs: P(
      "Bao the little panda got a shiny new bike. But every time he tried to ride it, he wobbled and fell down. Bump!",
      "\"I can't do it,\" said Bao, rubbing his knee. His dad sat down next to him.",
      "\"When I was little, I fell down five times on my first bike,\" said Papa Panda. \"Your grandpa held the seat, and one day he let go — and I rode all by myself.\"",
      "Bao tried again. Papa Panda held the seat. Pedal, pedal, pedal… Bao didn't notice when Papa let go.",
      "\"I'm riding!\" Bao shouted, zooming to the bamboo forest. Being brave doesn't mean you never fall. It means you try again.",
    ),
    newWords: [
      { word: "bike", zh: "自行车" },
      { word: "brave", zh: "勇敢的" },
      { word: "again", zh: "再一次" },
    ],
    questions: [
      { id: "q1", prompt: "What did Bao learn to ride?", options: ["A horse", "A bike", "A train"], answerIndex: 1, word: "bike" },
      { id: "q2", prompt: "How many times did Papa Panda fall?", options: ["One", "Five", "Ten"], answerIndex: 1 },
      { id: "q3", prompt: "Being brave means…", options: ["Never falling", "Trying again", "Running away"], answerIndex: 1, word: "brave" },
    ],
  },
  {
    id: "ocean-lights",
    title: "The Glowing Ocean",
    emoji: "🐳",
    theme: "ocean",
    minutes: 3,
    cover: "from-cyan-400 to-blue-600",
    summary: "A sleepy whale finds tiny lights that guide her home.",
    paragraphs: P(
      "Wally the whale swam too far and the sea got dark. \"Which way is home?\" she wondered.",
      "Suddenly, tiny blue lights blinked around her. They were little sea creatures that glow in the dark.",
      "\"Follow us!\" they sparkled. Wally followed the blue lights through the deep, quiet water.",
      "Soon she saw her mom singing a soft whale song. Wally was home, sleepy and happy. Goodnight, ocean.",
    ),
    newWords: [
      { word: "whale", zh: "鲸鱼" },
      { word: "light", zh: "光" },
    ],
    questions: [
      { id: "q1", prompt: "Who was lost?", options: ["Wally the whale", "A crab", "A boat"], answerIndex: 0, word: "whale" },
      { id: "q2", prompt: "What color were the lights?", options: ["Red", "Blue", "Yellow"], answerIndex: 1, word: "light" },
    ],
  },
];

export const STORY_BY_ID = Object.fromEntries(STORIES.map((s) => [s.id, s])) as Record<string, Story>;

export const GROWTH: Record<string, GrowthSnapshot> = {
  "c-leo": {
    readingStars: 4,
    englishLevel: 3,
    wordsLearned: 128,
    weekWords: ["rocket", "planet", "astronaut"],
    aiComment: "Leo is becoming more confident. This week he started answering in full English sentences and asked 6 \"why\" questions about space.",
    badges: [
      { id: "b1", emoji: "📚", name: "Story Explorer", description: "Finished 10 stories", earned: true },
      { id: "b2", emoji: "🚀", name: "Space Cadet", description: "Learned 3 space words", earned: true },
      { id: "b3", emoji: "🔥", name: "7-Day Streak", description: "Listened 7 days in a row", earned: true },
      { id: "b4", emoji: "🧠", name: "Quiz Champ", description: "Got 20 answers right", earned: false },
      { id: "b5", emoji: "🗣️", name: "Chatterbox", description: "Talked with Dad 30 times", earned: false },
      { id: "b6", emoji: "🌟", name: "Word Wizard", description: "Mastered 150 words", earned: false },
    ],
  },
  "c-mia": {
    readingStars: 2,
    englishLevel: 1,
    wordsLearned: 34,
    weekWords: ["panda", "blue", "moon"],
    aiComment: "Mia loves repeating sound words like \"splash\" and \"whoosh\". She is ready for slightly longer bedtime stories.",
    badges: [
      { id: "b1", emoji: "📚", name: "Story Explorer", description: "Finished 10 stories", earned: true },
      { id: "b2", emoji: "🐼", name: "Panda Pal", description: "Heard 3 panda stories", earned: true },
      { id: "b3", emoji: "🔥", name: "7-Day Streak", description: "Listened 7 days in a row", earned: false },
      { id: "b4", emoji: "🧠", name: "Quiz Champ", description: "Got 20 answers right", earned: false },
    ],
  },
};

export const REPORTS: Record<string, Report> = {
  "c-leo": {
    storySessions: 42,
    minutes: 210,
    masteredWords: 127,
    interestRanking: [
      { code: "space", score: 92 },
      { code: "dinosaur", score: 78 },
      { code: "fire_truck", score: 55 },
      { code: "robot", score: 21 },
    ],
    readingTrend: [
      { month: "Aug", level: 2 },
      { month: "Sep", level: 3 },
      { month: "Oct", level: 4 },
    ],
    weeklyMinutes: [
      { day: "Mon", minutes: 25 },
      { day: "Tue", minutes: 32 },
      { day: "Wed", minutes: 18 },
      { day: "Thu", minutes: 40 },
      { day: "Fri", minutes: 28 },
      { day: "Sat", minutes: 45 },
      { day: "Sun", minutes: 22 },
    ],
  },
  "c-mia": {
    storySessions: 19,
    minutes: 88,
    masteredWords: 30,
    interestRanking: [
      { code: "panda", score: 81 },
      { code: "ocean", score: 64 },
      { code: "magic", score: 40 },
    ],
    readingTrend: [
      { month: "Aug", level: 1 },
      { month: "Sep", level: 1 },
      { month: "Oct", level: 2 },
    ],
    weeklyMinutes: [
      { day: "Mon", minutes: 10 },
      { day: "Tue", minutes: 15 },
      { day: "Wed", minutes: 12 },
      { day: "Thu", minutes: 8 },
      { day: "Fri", minutes: 14 },
      { day: "Sat", minutes: 20 },
      { day: "Sun", minutes: 9 },
    ],
  },
};


export const HOME_CITY_CODE = "shanghai";

export const CITIES: City[] = [
  { code: "shanghai", name: "Shanghai", country: "China", flag: "🇨🇳", timezone: "Asia/Shanghai", lat: 31.2304, lng: 121.4737 },
  { code: "beijing", name: "Beijing", country: "China", flag: "🇨🇳", timezone: "Asia/Shanghai", lat: 39.9042, lng: 116.4074 },
  { code: "sydney", name: "Sydney", country: "Australia", flag: "🇦🇺", timezone: "Australia/Sydney", lat: -33.8688, lng: 151.2093 },
  { code: "melbourne", name: "Melbourne", country: "Australia", flag: "🇦🇺", timezone: "Australia/Melbourne", lat: -37.8136, lng: 144.9631 },
  { code: "singapore", name: "Singapore", country: "Singapore", flag: "🇸🇬", timezone: "Asia/Singapore", lat: 1.3521, lng: 103.8198 },
  { code: "london", name: "London", country: "UK", flag: "🇬🇧", timezone: "Europe/London", lat: 51.5072, lng: -0.1276 },
  { code: "new_york", name: "New York", country: "USA", flag: "🇺🇸", timezone: "America/New_York", lat: 40.7128, lng: -74.006 },
];

export const CITY_BY_CODE = Object.fromEntries(CITIES.map((c) => [c.code, c])) as Record<string, City>;

export const SEED_PRESENCE: DadPresence = {
  cityCode: "sydney",
  status: "working",
  weather: { emoji: "☀️", label: "Sunny" },
};

export const PRESENCE_STATUS: Record<DadPresence["status"], { emoji: string; label: string }> = {
  working: { emoji: "🟢", label: "Dad is working" },
  resting: { emoji: "😴", label: "Dad is resting" },
  traveling: { emoji: "✈️", label: "Dad is traveling" },
  home: { emoji: "🏠", label: "Dad is home" },
};

export const SEED_DAD_MESSAGES: DadMessage[] = [
  {
    id: "dm-tom-1",
    childId: "c-leo",
    text: "Hi Leo 👋\nToday I worked in Sydney. When I saw a fire truck, I remembered how much you love them.\nI can't wait to hear what you learned today.\nLove,\nDad ❤️",
    createdAt: "2026-11-05T12:30:00+08:00",
  },
  {
    id: "dm-lily-1",
    childId: "c-mia",
    text: "Hi Mia 🌸\nI saw a big koala sleeping in a tree today. It looked just like you at nap time!\nGive Mom a hug from me.\nLove,\nDad ❤️",
    createdAt: "2026-11-05T12:35:00+08:00",
  },
];

/** 爸爸的真实动态（正式版来自 dad_activity：爸爸听了故事、发了留言等系统事件 + 爸爸手动记录） */
export const DAD_JOURNEY: DadActivityDay[] = [
  {
    date: "2026-11-05",
    cityCode: "sydney",
    items: [
      { emoji: "🧯", text: "Worked on fire protection projects" },
      { emoji: "🥪", text: "Had lunch by the harbour" },
      { emoji: "🎧", text: "Listened to your last story" },
      { emoji: "💌", text: "Sent you a message" },
    ],
  },
  {
    date: "2026-11-04",
    cityCode: "sydney",
    items: [
      { emoji: "🎤", text: "Recorded a bedtime story for you" },
      { emoji: "📚", text: "Read your growth report" },
    ],
  },
  {
    date: "2026-11-02",
    cityCode: "singapore",
    items: [
      { emoji: "✈️", text: "Flew from Singapore to Sydney" },
      { emoji: "📸", text: "Took a photo of a big plane for you" },
    ],
  },
];
