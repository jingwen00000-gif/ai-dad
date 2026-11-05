import { validateEnv } from './env.validation.js';

const base = {
  DATABASE_URL: 'postgresql://localhost/x',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  WX_APPID: 'wx123',
  WX_SECRET: 'secret',
};

describe('validateEnv', () => {
  it('填充默认值', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_TTL_SECONDS).toBe(7200);
    expect(env.WX_MOCK_LOGIN).toBe(false);
  });

  it('缺少 DATABASE_URL 时报错', () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: '' })).toThrow('DATABASE_URL');
  });

  it('JWT 密钥过短时报错', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow('32');
  });

  it('TTL 非正整数时报错', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_TTL_SECONDS: '-1' })).toThrow('正整数');
  });

  it('微信配置可选（网页版不用微信登录）', () => {
    expect(() => validateEnv({ ...base, WX_APPID: '', WX_SECRET: '', NODE_ENV: 'production' })).not.toThrow();
  });

  it('CORS_ORIGINS 解析为列表，去掉结尾斜杠', () => {
    const env = validateEnv({ ...base, CORS_ORIGINS: 'https://a.github.io/, https://b.com' });
    expect(env.CORS_ORIGINS).toEqual(['https://a.github.io', 'https://b.com']);
  });

  it('开启 mock 时可以不配置微信', () => {
    const env = validateEnv({ ...base, WX_APPID: '', WX_SECRET: '', WX_MOCK_LOGIN: 'true' });
    expect(env.WX_MOCK_LOGIN).toBe(true);
  });

  it('生产环境禁止 mock 登录', () => {
    expect(() => validateEnv({ ...base, WX_MOCK_LOGIN: 'true', NODE_ENV: 'production' })).toThrow('生产环境');
  });
});
