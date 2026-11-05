import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../common/config/env.validation.js';
import type { ProviderVoice, SynthesisResult, VoiceProvider } from './voice-provider.js';

const API = 'https://api.elevenlabs.io/v1';

@Injectable()
export class ElevenLabsProvider implements VoiceProvider {
  readonly name = 'elevenlabs' as const;
  private readonly logger = new Logger(ElevenLabsProvider.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('ELEVENLABS_API_KEY', { infer: true }));
  }

  modelId(): string {
    return this.config.get('ELEVENLABS_MODEL_ID', { infer: true });
  }

  async getVoice(voiceId: string): Promise<ProviderVoice | null> {
    const res = await this.request(`/voices/${encodeURIComponent(voiceId)}`, { method: 'GET' });
    if (res.status === 404 || res.status === 400) return null;
    await this.assertOk(res, 'getVoice');
    const body = (await res.json()) as { voice_id: string; name: string };
    return { voiceId: body.voice_id, name: body.name };
  }

  async textToSpeech(text: string, voiceId: string): Promise<SynthesisResult> {
    const res = await this.request(
      `/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text,
          model_id: this.modelId(),
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      },
      60_000,
    );
    await this.assertOk(res, 'textToSpeech');
    return { audio: Buffer.from(await res.arrayBuffer()), contentType: 'audio/mpeg' };
  }

  private async request(path: string, init: RequestInit, timeoutMs = 15_000): Promise<Response> {
    try {
      return await fetch(`${API}${path}`, {
        ...init,
        headers: { ...(init.headers as Record<string, string>), 'xi-api-key': this.config.get('ELEVENLABS_API_KEY', { infer: true }) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      this.logger.error(`ElevenLabs 请求失败: ${(err as Error).message}`);
      throw new ServiceUnavailableException('语音服务暂时不可用，请稍后再试');
    }
  }

  private async assertOk(res: Response, op: string): Promise<void> {
    if (res.ok) return;
    const detail = await res.text().catch(() => '');
    this.logger.error(`ElevenLabs ${op} 失败 ${res.status}: ${detail.slice(0, 300)}`);
    if (res.status === 401 || res.status === 403) {
      throw new ServiceUnavailableException('语音服务配置有误（API Key 无效或没有权限）');
    }
    if (res.status === 429) throw new HttpException('语音生成太频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    if (res.status === 400 || res.status === 404 || res.status === 422) {
      throw new BadRequestException('语音生成失败：声音不存在或文字不受支持');
    }
    throw new ServiceUnavailableException('语音服务暂时不可用，请稍后再试');
  }
}
