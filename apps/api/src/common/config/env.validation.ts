export interface Env {
  NODE_ENV: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  PORT: number;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  WX_APPID: string;
  WX_SECRET: string;
  /** 本地开发用：不请求微信，openid = "mock_" + code。生产环境禁止开启 */
  WX_MOCK_LOGIN: boolean;
  /** ElevenLabs API Key；不配置时语音接口返回 503 */
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_MODEL_ID: string;
  /** 生成的音频存放目录（开发用本地磁盘） */
  VOICE_STORAGE_DIR: string;
  /** 拼接音频播放链接用的对外地址 */
  PUBLIC_BASE_URL: string;
  VOICE_URL_TTL_SECONDS: number;
  /** 每个账号每天最多生成的字数（命中缓存不计） */
  VOICE_DAILY_CHAR_LIMIT: number;
}

function required(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`环境变量 ${key} 未设置`);
  }
  return value;
}

function positiveInt(config: Record<string, unknown>, key: string, fallback: number): number {
  const raw = config[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`环境变量 ${key} 必须是正整数`);
  return n;
}

export function validateEnv(config: Record<string, unknown>): Env {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const secret = required(config, 'JWT_ACCESS_SECRET');
  if (secret.length < 32) throw new Error('JWT_ACCESS_SECRET 至少 32 个字符');

  const mock = String(config.WX_MOCK_LOGIN ?? 'false').toLowerCase() === 'true';
  if (mock && nodeEnv === 'production') {
    throw new Error('生产环境禁止开启 WX_MOCK_LOGIN');
  }
  const wxAppid = String(config.WX_APPID ?? '');
  const wxSecret = String(config.WX_SECRET ?? '');
  if (!mock && (!wxAppid || !wxSecret)) {
    throw new Error('未开启 WX_MOCK_LOGIN 时必须设置 WX_APPID 和 WX_SECRET');
  }

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL: required(config, 'DATABASE_URL'),
    REDIS_URL: required(config, 'REDIS_URL'),
    PORT: positiveInt(config, 'PORT', 3000),
    JWT_ACCESS_SECRET: secret,
    JWT_ACCESS_TTL_SECONDS: positiveInt(config, 'JWT_ACCESS_TTL_SECONDS', 7200),
    JWT_REFRESH_TTL_SECONDS: positiveInt(config, 'JWT_REFRESH_TTL_SECONDS', 2592000),
    WX_APPID: wxAppid,
    WX_SECRET: wxSecret,
    WX_MOCK_LOGIN: mock,
    ELEVENLABS_API_KEY: String(config.ELEVENLABS_API_KEY ?? ''),
    ELEVENLABS_MODEL_ID: String(config.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'),
    VOICE_STORAGE_DIR: String(config.VOICE_STORAGE_DIR || './storage'),
    PUBLIC_BASE_URL: String(config.PUBLIC_BASE_URL || `http://localhost:${positiveInt(config, 'PORT', 3000)}`),
    VOICE_URL_TTL_SECONDS: positiveInt(config, 'VOICE_URL_TTL_SECONDS', 24 * 3600),
    VOICE_DAILY_CHAR_LIMIT: positiveInt(config, 'VOICE_DAILY_CHAR_LIMIT', 20000),
  };
}
