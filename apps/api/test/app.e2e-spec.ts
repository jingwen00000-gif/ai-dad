import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

// 需要 .env 中 WX_MOCK_LOGIN=true：openid = "mock_" + code
describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const run = `e2e_${Date.now()}`;
  const http = () => request(app.getHttpServer());

  async function login(code: string) {
    const res = await http().post('/auth/wx-login').send({ code }).expect(200);
    return res.body as { accessToken: string; refreshToken: string; isNewUser: boolean };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { wxOpenid: { startsWith: `mock_${run}` } } });
    await app?.close();
  });

  it('GET /health → 数据库和 Redis 都可用', async () => {
    const res = await http().get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up', redis: 'up' });
  });

  describe('微信登录', () => {
    it('首次登录自动注册并创建家长设置；再次登录不是新用户', async () => {
      const first = await login(`${run}_a`);
      expect(first.isNewUser).toBe(true);
      expect(first.accessToken).toBeTruthy();
      expect(first.refreshToken).toBeTruthy();

      const user = await prisma.user.findUniqueOrThrow({
        where: { wxOpenid: `mock_${run}_a` },
        include: { parentSettings: true },
      });
      expect(user.parentSettings?.dailyMinutesLimit).toBe(30);

      const second = await login(`${run}_a`);
      expect(second.isNewUser).toBe(false);
    });

    it('缺少 code → 400', async () => {
      await http().post('/auth/wx-login').send({}).expect(400);
    });

    it('GET /auth/me：无 token 401，有 token 200', async () => {
      await http().get('/auth/me').expect(401);
      const { accessToken } = await login(`${run}_a`);
      const res = await http().get('/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('refresh token 轮换：新的可用，旧的立即作废', async () => {
      const { refreshToken } = await login(`${run}_a`);
      const res = await http().post('/auth/refresh').send({ refreshToken }).expect(200);
      expect(res.body.refreshToken).not.toBe(refreshToken);
      await http().post('/auth/refresh').send({ refreshToken }).expect(401);
      await http().post('/auth/refresh').send({ refreshToken: res.body.refreshToken }).expect(200);
    });

    it('退出登录后 refresh token 失效', async () => {
      const { refreshToken } = await login(`${run}_a`);
      await http().post('/auth/logout').send({ refreshToken }).expect(204);
      await http().post('/auth/refresh').send({ refreshToken }).expect(401);
    });

    it('被禁用的账号不能登录', async () => {
      await login(`${run}_disabled`);
      await prisma.user.update({ where: { wxOpenid: `mock_${run}_disabled` }, data: { status: 'disabled' } });
      await http().post('/auth/wx-login').send({ code: `${run}_disabled` }).expect(403);
    });
  });

  describe('孩子档案', () => {
    let token: string;
    let otherToken: string;
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    beforeAll(async () => {
      token = (await login(`${run}_parent`)).accessToken;
      otherToken = (await login(`${run}_other`)).accessToken;
    });

    it('创建 → 列表 → 编辑 → 删除', async () => {
      const created = await http()
        .post('/children')
        .set(auth(token))
        .send({ nickname: '  小宝  ', birthday: '2021-03-10', gender: 'boy' })
        .expect(201);
      expect(created.body).toMatchObject({ nickname: '小宝', birthday: '2021-03-10', gender: 'boy' });
      expect(created.body.ageStage).toMatch(/^S[1-4]$/);
      expect(created.body.ageYears).toBe(Math.floor(created.body.ageMonths / 12));

      const growth = await prisma.growthProfile.findUnique({ where: { childId: created.body.id } });
      expect(growth?.englishLevel).toBe(0);

      const list = await http().get('/children').set(auth(token)).expect(200);
      expect(list.body).toHaveLength(1);

      const updated = await http()
        .patch(`/children/${created.body.id}`)
        .set(auth(token))
        .send({ nickname: '大宝' })
        .expect(200);
      expect(updated.body.nickname).toBe('大宝');
      expect(updated.body.birthday).toBe('2021-03-10');

      await http().delete(`/children/${created.body.id}`).set(auth(token)).expect(204);
      await http().get(`/children/${created.body.id}`).set(auth(token)).expect(404);
      expect((await http().get('/children').set(auth(token)).expect(200)).body).toHaveLength(0);
    });

    it('别的家长看不到、改不了、删不掉（404）', async () => {
      const { body } = await http()
        .post('/children')
        .set(auth(token))
        .send({ nickname: '二宝', birthday: '2019-06-01' })
        .expect(201);
      await http().get(`/children/${body.id}`).set(auth(otherToken)).expect(404);
      await http().patch(`/children/${body.id}`).set(auth(otherToken)).send({ nickname: 'x' }).expect(404);
      await http().delete(`/children/${body.id}`).set(auth(otherToken)).expect(404);
      expect((await http().get('/children').set(auth(otherToken)).expect(200)).body).toHaveLength(0);
    });

    it.each([
      [{ nickname: '', birthday: '2021-03-10' }, '空昵称'],
      [{ nickname: '一二三四五六七八九十一二三四五六七八九十一', birthday: '2021-03-10' }, '昵称超过 20 字'],
      [{ nickname: '小宝', birthday: '2021-02-30' }, '不存在的日期'],
      [{ nickname: '小宝', birthday: '2099-01-01' }, '未来的生日'],
      [{ nickname: '小宝', birthday: '2005-01-01' }, '超过 14 岁'],
      [{ nickname: '小宝', birthday: '2021-03-10', gender: 'other' }, '非法性别'],
      [{ nickname: '小宝', birthday: '2021-03-10', avatarUrl: 'http://x.com/a.png' }, '非 https 头像'],
    ])('参数校验 400：%j（%s）', async (payload, _reason) => {
      await http().post('/children').set(auth(token)).send(payload).expect(400);
    });

    it('非法 id → 400；未登录 → 401', async () => {
      await http().get('/children/not-a-uuid').set(auth(token)).expect(400);
      await http().get('/children').expect(401);
    });

    it('最多 5 个孩子', async () => {
      const t = (await login(`${run}_many`)).accessToken;
      for (let i = 0; i < 5; i++) {
        await http().post('/children').set(auth(t)).send({ nickname: `宝${i}`, birthday: '2020-01-01' }).expect(201);
      }
      await http().post('/children').set(auth(t)).send({ nickname: '宝6', birthday: '2020-01-01' }).expect(400);
    });
  });

  describe('兴趣', () => {
    let token: string;
    let childId: string;
    let tagIds: Record<string, string>;
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    beforeAll(async () => {
      token = (await login(`${run}_interest`)).accessToken;
      childId = (
        await http().post('/children').set(auth(token)).send({ nickname: '兴趣宝', birthday: '2021-03-10' }).expect(201)
      ).body.id;
      const catalog = await http().get('/interests').set(auth(token)).expect(200);
      tagIds = Object.fromEntries(
        catalog.body.flatMap((c: any) => c.tags.map((t: any) => [t.code, t.id])),
      );
      if (!tagIds.dinosaur) throw new Error('兴趣字典为空：请先执行 pnpm db:seed');
    });

    it('兴趣字典：按分类分组，包含恐龙、消防车、机器人、太空', async () => {
      const res = await http().get('/interests').set(auth(token)).expect(200);
      const codes = res.body.flatMap((c: any) => c.tags.map((t: any) => t.code));
      expect(codes).toEqual(expect.arrayContaining(['dinosaur', 'fire_truck', 'robot', 'space']));
      expect(res.body[0]).toMatchObject({ code: expect.any(String), nameZh: expect.any(String) });
      await http().get('/interests').expect(401);
    });

    it('保存 → 读取 → 孩子档案里带上兴趣', async () => {
      const picked = [tagIds.dinosaur, tagIds.fire_truck, tagIds.robot, tagIds.space];
      const saved = await http().put(`/children/${childId}/interests`).set(auth(token)).send({ tagIds: picked }).expect(200);
      expect(saved.body.map((i: any) => i.code).sort()).toEqual(['dinosaur', 'fire_truck', 'robot', 'space']);
      expect(saved.body[0]).toMatchObject({ weight: 3, source: 'parent', status: 'stable' });

      const listed = await http().get(`/children/${childId}/interests`).set(auth(token)).expect(200);
      expect(listed.body).toHaveLength(4);

      const child = await http().get(`/children/${childId}`).set(auth(token)).expect(200);
      expect(child.body.interests.map((i: any) => i.code).sort()).toEqual(['dinosaur', 'fire_truck', 'robot', 'space']);
    });

    it('整体替换：取消的删除，新增的加上，保留的不动权重', async () => {
      await http().put(`/children/${childId}/interests`).set(auth(token)).send({ tagIds: [tagIds.dinosaur, tagIds.space] }).expect(200);
      // 模拟以后行为信号把“恐龙”的权重调高
      await prisma.childInterest.updateMany({ where: { childId, tagId: tagIds.dinosaur }, data: { weight: 7.5 } });

      const res = await http()
        .put(`/children/${childId}/interests`)
        .set(auth(token))
        .send({ tagIds: [tagIds.dinosaur, tagIds.ocean] })
        .expect(200);
      expect(res.body.map((i: any) => i.code)).toEqual(['dinosaur', 'ocean']); // 按权重排序
      expect(res.body[0].weight).toBe(7.5);
      expect(res.body[1].weight).toBe(3);
    });

    it('清空兴趣', async () => {
      const res = await http().put(`/children/${childId}/interests`).set(auth(token)).send({ tagIds: [] }).expect(200);
      expect(res.body).toEqual([]);
    });

    it('别的家长不能读写这个孩子的兴趣（404）', async () => {
      const other = (await login(`${run}_interest_other`)).accessToken;
      await http().get(`/children/${childId}/interests`).set(auth(other)).expect(404);
      await http().put(`/children/${childId}/interests`).set(auth(other)).send({ tagIds: [tagIds.robot] }).expect(404);
    });

    it.each([
      [{ tagIds: ['00000000-0000-4000-8000-000000000000'] }, '不存在的标签'],
      [{ tagIds: ['not-a-uuid'] }, '非法 id'],
      [{ tagIds: 'dinosaur' }, '不是数组'],
      [{}, '缺少 tagIds'],
    ])('参数校验 400：%j（%s）', async (payload, _reason) => {
      await http().put(`/children/${childId}/interests`).set(auth(token)).send(payload).expect(400);
    });

    it('重复 id 和超过 8 个都是 400', async () => {
      await http().put(`/children/${childId}/interests`).set(auth(token)).send({ tagIds: [tagIds.robot, tagIds.robot] }).expect(400);
      const nine = Object.values(tagIds).slice(0, 9);
      expect(nine).toHaveLength(9);
      await http().put(`/children/${childId}/interests`).set(auth(token)).send({ tagIds: nine }).expect(400);
    });

    it('已删除的孩子不能再设置兴趣', async () => {
      const { body } = await http().post('/children').set(auth(token)).send({ nickname: '删掉', birthday: '2020-05-05' }).expect(201);
      await http().delete(`/children/${body.id}`).set(auth(token)).expect(204);
      await http().put(`/children/${body.id}/interests`).set(auth(token)).send({ tagIds: [tagIds.robot] }).expect(404);
    });
  });
});
