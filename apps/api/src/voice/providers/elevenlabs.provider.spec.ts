import { BadRequestException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { ElevenLabsProvider } from './elevenlabs.provider.js';

const config = {
  get: (k: string) => ({ ELEVENLABS_API_KEY: 'test-key', ELEVENLABS_MODEL_ID: 'eleven_multilingual_v2' })[k],
} as unknown as ConfigService<any, true>;

function mockFetch(status: number, body: unknown, binary?: Uint8Array) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => (binary ?? new Uint8Array()).buffer,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('ElevenLabsProvider', () => {
  const provider = new ElevenLabsProvider(config);
  afterEach(() => vi.unstubAllGlobals());

  it('textToSpeech：调用正确的接口，带 API Key、模型和文字，返回 mp3', async () => {
    const fetchFn = mockFetch(200, null, new Uint8Array([0x49, 0x44, 0x33]));
    const res = await provider.textToSpeech('Good night Tom', 'JBFqnCBsd6RMkjVDRZzb');
    expect(res.contentType).toBe('audio/mpeg');
    expect([...res.audio]).toEqual([0x49, 0x44, 0x33]);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128');
    expect(init.method).toBe('POST');
    expect(init.headers['xi-api-key']).toBe('test-key');
    expect(JSON.parse(init.body)).toMatchObject({ text: 'Good night Tom', model_id: 'eleven_multilingual_v2' });
  });

  it('getVoice：存在返回名字，不存在返回 null', async () => {
    mockFetch(200, { voice_id: 'abc', name: 'Dad Voice' });
    await expect(provider.getVoice('abc')).resolves.toEqual({ voiceId: 'abc', name: 'Dad Voice' });
    mockFetch(404, { detail: 'not found' });
    await expect(provider.getVoice('nope')).resolves.toBeNull();
  });

  it.each([
    [401, ServiceUnavailableException],
    [500, ServiceUnavailableException],
    [422, BadRequestException],
  ])('HTTP %i → %o', async (status, type) => {
    mockFetch(status, { detail: 'x' });
    await expect(provider.textToSpeech('hi', 'v')).rejects.toBeInstanceOf(type);
  });

  it('429 → 429；网络异常 → 503', async () => {
    mockFetch(429, { detail: 'rate' });
    await expect(provider.textToSpeech('hi', 'v')).rejects.toSatisfy((e: unknown) => e instanceof HttpException && e.getStatus() === 429);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));
    await expect(provider.textToSpeech('hi', 'v')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
