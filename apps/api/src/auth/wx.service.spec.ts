import { HttpException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { WxService } from './wx.service.js';

function service(mock = false) {
  const values: Record<string, unknown> = { WX_MOCK_LOGIN: mock, WX_APPID: 'wxappid', WX_SECRET: 'wxsecret' };
  const config = { get: (k: string) => values[k] } as unknown as ConfigService<any, true>;
  return new WxService(config);
}

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 502, json: async () => body });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('WxService.code2Session', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('成功：返回 openid / unionid，并带上 appid、secret、code', async () => {
    const fetchFn = mockFetch({ openid: 'o1', unionid: 'u1', session_key: 'sk' });
    await expect(service().code2Session('CODE')).resolves.toEqual({ openid: 'o1', unionid: 'u1' });
    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.searchParams.get('appid')).toBe('wxappid');
    expect(url.searchParams.get('js_code')).toBe('CODE');
    expect(url.searchParams.get('grant_type')).toBe('authorization_code');
  });

  it('code 无效（40029）→ 401', async () => {
    mockFetch({ errcode: 40029, errmsg: 'invalid code' });
    await expect(service().code2Session('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('频率限制（45011）→ 429', async () => {
    mockFetch({ errcode: 45011, errmsg: 'rate limit' });
    await expect(service().code2Session('x')).rejects.toSatisfy(
      (e: unknown) => e instanceof HttpException && e.getStatus() === 429,
    );
  });

  it('其他错误码 / HTTP 失败 / 网络异常 → 503', async () => {
    mockFetch({ errcode: -1, errmsg: 'system busy' });
    await expect(service().code2Session('x')).rejects.toBeInstanceOf(ServiceUnavailableException);
    mockFetch({}, false);
    await expect(service().code2Session('x')).rejects.toBeInstanceOf(ServiceUnavailableException);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));
    await expect(service().code2Session('x')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('mock 模式不请求微信', async () => {
    const fetchFn = mockFetch({});
    await expect(service(true).code2Session('dad')).resolves.toEqual({ openid: 'mock_dad' });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
