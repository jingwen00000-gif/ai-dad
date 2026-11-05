import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import type { Env } from '../common/config/env.validation.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import type { VoiceAudio, VoiceProfile } from '../generated/prisma/client.js';
import { AUDIO_STORAGE, type AudioStorage } from './storage/audio-storage.js';
import { VoiceProviderRegistry } from './providers/voice-provider.registry.js';
import { AudioUrlSigner } from './signed-url.js';
import type {
  CreateVoiceProfileDto,
  GenerateVoiceDto,
  GenerateVoiceResponse,
  VoiceProfileResponse,
} from './voice.dto.js';

/**
 * 家人声音 + 文字转语音。故事、聊天都通过 synthesize() 拿到可播放的 mp3 链接。
 */
@Injectable()
export class VoiceService {
  private readonly signer: AudioUrlSigner;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly providers: VoiceProviderRegistry,
    private readonly config: ConfigService<Env, true>,
    @Inject(AUDIO_STORAGE) private readonly storage: AudioStorage,
  ) {
    this.signer = new AudioUrlSigner(config.get('JWT_ACCESS_SECRET', { infer: true }));
  }

  // ---------- 声音档案 ----------

  async listProfiles(userId: string): Promise<VoiceProfileResponse[]> {
    const rows = await this.prisma.voiceProfile.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map(toProfileResponse);
  }

  async createProfile(userId: string, dto: CreateVoiceProfileDto): Promise<VoiceProfileResponse> {
    const provider = this.providers.get(dto.provider);
    // 确认这个声音确实在我们的服务商账号里，避免存进无效 ID
    const voice = await provider.getVoice(dto.voiceId);
    if (!voice) throw new BadRequestException('在语音服务商账号里找不到这个声音，请检查 Voice ID');

    const existing = await this.prisma.voiceProfile.count({ where: { userId } });
    const makeDefault = dto.isDefault === true || existing === 0;

    try {
      const profile = await this.prisma.$transaction(async (tx) => {
        if (makeDefault) await tx.voiceProfile.updateMany({ where: { userId }, data: { isDefault: false } });
        return tx.voiceProfile.create({
          data: {
            userId,
            provider: dto.provider,
            voiceId: dto.voiceId,
            voiceName: dto.voiceName,
            relation: dto.relation ?? 'dad',
            language: dto.language ?? 'multi',
            isDefault: makeDefault,
            consentAt: new Date(),
          },
        });
      });
      return toProfileResponse(profile);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') throw new ConflictException('这个声音已经添加过了');
      throw err;
    }
  }

  async setDefault(userId: string, id: string): Promise<VoiceProfileResponse> {
    await this.findOwned(userId, id);
    const [, profile] = await this.prisma.$transaction([
      this.prisma.voiceProfile.updateMany({ where: { userId }, data: { isDefault: false } }),
      this.prisma.voiceProfile.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return toProfileResponse(profile);
  }

  /** 删除声音档案，同时删除它生成过的音频文件 */
  async deleteProfile(userId: string, id: string): Promise<void> {
    const profile = await this.findOwned(userId, id);
    const audio = await this.prisma.voiceAudio.findMany({ where: { voiceProfileId: id }, select: { storageKey: true } });
    await this.prisma.voiceProfile.delete({ where: { id } });
    await Promise.all(audio.map((a) => this.storage.delete(a.storageKey)));
    if (profile.isDefault) {
      const next = await this.prisma.voiceProfile.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (next) await this.prisma.voiceProfile.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  // ---------- 文字转语音 ----------

  /** 故事、聊天共用：生成（或取缓存）并返回带签名的 mp3 链接 */
  async synthesize(userId: string, dto: GenerateVoiceDto): Promise<GenerateVoiceResponse> {
    const profile = dto.voiceProfileId
      ? await this.findOwned(userId, dto.voiceProfileId)
      : await this.prisma.voiceProfile.findFirst({ where: { userId, isDefault: true } });
    if (!profile) throw new NotFoundException('还没有设置家人的声音');
    if (profile.status !== 'active') throw new ForbiddenException('这个声音已停用');

    const text = dto.text.replace(/\s+/g, ' ').trim();
    const provider = this.providers.get(profile.provider);
    const textHash = createHash('sha256')
      .update([profile.provider, provider.modelId(), profile.voiceId, text].join('\u0000'))
      .digest('hex');

    const cached = await this.prisma.voiceAudio.findUnique({
      where: { voiceProfileId_textHash: { voiceProfileId: profile.id, textHash } },
    });
    if (cached && (await this.storage.get(cached.storageKey))) {
      return this.response(cached, profile.id, true);
    }

    await this.consumeQuota(userId, text.length);
    const { audio, contentType } = await provider.textToSpeech(text, profile.voiceId);
    const storageKey = `voice/${profile.id}/${textHash}.mp3`;
    await this.storage.put(storageKey, audio, contentType);

    const row = await this.prisma.voiceAudio.upsert({
      where: { voiceProfileId_textHash: { voiceProfileId: profile.id, textHash } },
      create: {
        voiceProfileId: profile.id,
        textHash,
        storageKey,
        contentType,
        bytes: audio.length,
        characters: text.length,
        model: provider.modelId(),
      },
      update: { storageKey, bytes: audio.length, contentType },
    });
    return this.response(row, profile.id, false);
  }

  /** 播放：校验签名后返回音频内容 */
  async readAudio(id: string, exp: number, sig: string): Promise<{ data: Buffer; contentType: string }> {
    if (!this.signer.verify(id, exp, sig)) throw new ForbiddenException('音频链接无效或已过期');
    const row = await this.prisma.voiceAudio.findUnique({ where: { id } });
    const data = row && (await this.storage.get(row.storageKey));
    if (!row || !data) throw new NotFoundException('音频不存在');
    return { data, contentType: row.contentType };
  }

  // ---------- 内部 ----------

  private async findOwned(userId: string, id: string): Promise<VoiceProfile> {
    const profile = await this.prisma.voiceProfile.findFirst({ where: { id, userId } });
    if (!profile) throw new NotFoundException('声音不存在');
    return profile;
  }

  /** 每个账号每天的生成字数上限（只算新生成的，命中缓存不算），控制费用 */
  private async consumeQuota(userId: string, characters: number): Promise<void> {
    const limit = this.config.get('VOICE_DAILY_CHAR_LIMIT', { infer: true });
    const key = `voice:chars:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const used = await this.redis.client.incrby(key, characters);
    if (used === characters) await this.redis.client.expire(key, 2 * 24 * 3600);
    if (used > limit) {
      await this.redis.client.decrby(key, characters);
      throw new HttpException(`今天的语音生成额度已用完（每天 ${limit} 字）`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private response(row: VoiceAudio, voiceProfileId: string, cached: boolean): GenerateVoiceResponse {
    const ttl = this.config.get('VOICE_URL_TTL_SECONDS', { infer: true });
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const base = this.config.get('PUBLIC_BASE_URL', { infer: true }).replace(/\/+$/, '');
    const sig = this.signer.sign(row.id, exp);
    return {
      audioUrl: `${base}/voice/audio/${row.id}?exp=${exp}&sig=${sig}`,
      expiresAt: new Date(exp * 1000).toISOString(),
      cached,
      characters: row.characters,
      voiceProfileId,
    };
  }
}

function toProfileResponse(p: VoiceProfile): VoiceProfileResponse {
  return {
    id: p.id,
    provider: p.provider,
    voiceId: p.voiceId,
    voiceName: p.voiceName,
    relation: p.relation,
    language: p.language,
    isDefault: p.isDefault,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}
