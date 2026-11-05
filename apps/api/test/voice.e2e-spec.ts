import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { ElevenLabsProvider } from '../src/voice/providers/elevenlabs.provider.js';

/** 假的 ElevenLabs：只认 ok_ 开头的 voiceId，返回固定的“mp3”字节并记录调用次数 */
class FakeElevenLabs {
  readonly name = 'elevenlabs' as const;
  calls = 0;
  isConfigured() {
    return true;
  }
  modelId() {
    return 'fake_model';
  }
  async getVoice(voiceId: string) {
    return voiceId.startsWith('ok_') ? { voiceId, name: 'Dad Voice' } : null;
  }
  async textToSpeech(text: string) {
    this.calls += 1;
    return { audio: Buffer.from(`ID3-fake-mp3:${text}`), contentType: 'audio/mpeg' };
  }
}

describe('Voice (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const fake = new FakeElevenLabs();
  const run = `e2e_voice_${Date.now()}`;
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const login = async (code: string) =>
    (await http().post('/auth/wx-login').send({ code }).expect(200)).body.accessToken as string;
  const addVoice = (t: string, body: Record<string, unknown>) =>
    http().post('/voice/profiles').set(auth(t)).send({ provider: 'elevenlabs', voiceName: 'Jerry Dad Voice', consent: true, ...body });
  /** 把返回的绝对链接变成测试服务器上的路径 */
  const pathOf = (url: string) => url.replace(/^https?:\/\/[^/]+/, '');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ElevenLabsProvider)
      .useValue(fake)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { wxOpenid: { startsWith: `mock_${run}` } } });
    await app?.close();
  });

  it('添加声音：需要本人同意、Voice ID 必须存在；第一个自动设为默认', async () => {
    const t = await login(`${run}_a`);
    await addVoice(t, { voiceId: 'ok_dad', consent: false }).expect(400);
    await addVoice(t, { voiceId: 'missing_voice' }).expect(400);
    await addVoice(t, { voiceId: 'bad id!' }).expect(400);

    const dad = await addVoice(t, { voiceId: 'ok_dad' }).expect(201);
    expect(dad.body).toMatchObject({ provider: 'elevenlabs', voiceId: 'ok_dad', relation: 'dad', isDefault: true });
    await addVoice(t, { voiceId: 'ok_dad' }).expect(409);

    const mum = await addVoice(t, { voiceId: 'ok_mum', voiceName: 'Mum Voice', relation: 'mum' }).expect(201);
    expect(mum.body.isDefault).toBe(false);

    const list = await http().get('/voice/profiles').set(auth(t)).expect(200);
    expect(list.body.map((p: any) => p.relation)).toEqual(['dad', 'mum']);

    await http().post(`/voice/profiles/${mum.body.id}/default`).set(auth(t)).expect(200);
    const after = await http().get('/voice/profiles').set(auth(t)).expect(200);
    expect(after.body[0]).toMatchObject({ relation: 'mum', isDefault: true });
    expect(after.body.filter((p: any) => p.isDefault)).toHaveLength(1);
  });

  it('生成 → 播放 → 再次生成命中缓存（不重复调用服务商）', async () => {
    const t = await login(`${run}_b`);
    const { body: profile } = await addVoice(t, { voiceId: 'ok_dad_b' }).expect(201);
    const before = fake.calls;

    const first = await http().post('/voice/generate').set(auth(t)).send({ text: '  Good   night Tom  ' }).expect(200);
    expect(first.body).toMatchObject({ cached: false, characters: 'Good night Tom'.length, voiceProfileId: profile.id });
    expect(first.body.audioUrl).toMatch(/\/voice\/audio\/[0-9a-f-]{36}\?exp=\d+&sig=/);

    const audio = await http().get(pathOf(first.body.audioUrl)).buffer(true).expect(200);
    expect(audio.headers['content-type']).toBe('audio/mpeg');
    expect(audio.headers['accept-ranges']).toBe('bytes');
    expect(Buffer.from(audio.body).toString()).toBe('ID3-fake-mp3:Good night Tom');

    const range = await http().get(pathOf(first.body.audioUrl)).set('Range', 'bytes=0-2').buffer(true).expect(206);
    expect(range.headers['content-range']).toMatch(/^bytes 0-2\/\d+$/);
    expect(Buffer.from(range.body).toString()).toBe('ID3');

    const second = await http().post('/voice/generate').set(auth(t)).send({ text: 'Good night Tom', voiceProfileId: profile.id }).expect(200);
    expect(second.body.cached).toBe(true);
    expect(fake.calls).toBe(before + 1);
  });

  it('音频链接：篡改或过期都拒绝', async () => {
    const t = await login(`${run}_c`);
    await addVoice(t, { voiceId: 'ok_dad_c' }).expect(201);
    const { body } = await http().post('/voice/generate').set(auth(t)).send({ text: 'Sweet dreams' }).expect(200);
    const url = new URL(body.audioUrl);
    const id = url.pathname.split('/').pop();
    await http().get(`/voice/audio/${id}?exp=${url.searchParams.get('exp')}&sig=forged`).expect(403);
    await http().get(`/voice/audio/${id}?exp=${Number(url.searchParams.get('exp')) + 1}&sig=${url.searchParams.get('sig')}`).expect(403);
    await http().get(`/voice/audio/${id}?exp=1&sig=${url.searchParams.get('sig')}`).expect(403);
  });

  it('不能用别人家的声音；没有声音时 404；未登录 401', async () => {
    const owner = await login(`${run}_d`);
    const { body: profile } = await addVoice(owner, { voiceId: 'ok_dad_d' }).expect(201);
    const other = await login(`${run}_e`);
    await http().post('/voice/generate').set(auth(other)).send({ text: 'hi', voiceProfileId: profile.id }).expect(404);
    await http().post('/voice/generate').set(auth(other)).send({ text: 'hi' }).expect(404);
    await http().delete(`/voice/profiles/${profile.id}`).set(auth(other)).expect(404);
    await http().post('/voice/generate').send({ text: 'hi' }).expect(401);
  });

  it('参数校验：空文字、超长文字、非法 profile id', async () => {
    const t = await login(`${run}_f`);
    await addVoice(t, { voiceId: 'ok_dad_f' }).expect(201);
    await http().post('/voice/generate').set(auth(t)).send({ text: '   ' }).expect(400);
    await http().post('/voice/generate').set(auth(t)).send({ text: 'a'.repeat(2501) }).expect(400);
    await http().post('/voice/generate').set(auth(t)).send({ text: 'hi', voiceProfileId: 'nope' }).expect(400);
  });

  it('每日额度用完 → 429；命中缓存不受影响', async () => {
    const t = await login(`${run}_g`);
    await addVoice(t, { voiceId: 'ok_dad_g' }).expect(201);
    await http().post('/voice/generate').set(auth(t)).send({ text: 'cached line' }).expect(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { wxOpenid: `mock_${run}_g` } });
    await app.get(RedisService).client.set(`voice:chars:${user.id}:${new Date().toISOString().slice(0, 10)}`, 20000);
    const res = await http().post('/voice/generate').set(auth(t)).send({ text: 'a brand new line' }).expect(429);
    expect(res.body.message).toContain('额度');
    const cached = await http().post('/voice/generate').set(auth(t)).send({ text: 'cached line' }).expect(200);
    expect(cached.body.cached).toBe(true);
  });

  it('删除声音：音频文件一起删除，默认声音转给下一个', async () => {
    const t = await login(`${run}_h`);
    const { body: dad } = await addVoice(t, { voiceId: 'ok_dad_h' }).expect(201);
    const { body: grandma } = await addVoice(t, { voiceId: 'ok_grandma_h', voiceName: 'Grandma', relation: 'grandma' }).expect(201);
    const { body: gen } = await http().post('/voice/generate').set(auth(t)).send({ text: 'Bye bye' }).expect(200);
    await http().delete(`/voice/profiles/${dad.id}`).set(auth(t)).expect(204);
    await http().get(pathOf(gen.audioUrl)).expect(404);
    const list = await http().get('/voice/profiles').set(auth(t)).expect(200);
    expect(list.body).toEqual([expect.objectContaining({ id: grandma.id, isDefault: true })]);
  });
});
