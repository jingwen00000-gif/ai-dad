import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ElevenLabsProvider } from './elevenlabs.provider.js';
import type { VoiceProvider, VoiceProviderName } from './voice-provider.js';

/** 按名字取服务商实现。新增服务商：实现 VoiceProvider，在这里注册 */
@Injectable()
export class VoiceProviderRegistry {
  private readonly providers: Partial<Record<VoiceProviderName, VoiceProvider>>;

  constructor(elevenlabs: ElevenLabsProvider) {
    this.providers = { elevenlabs };
  }

  get(name: string): VoiceProvider {
    const provider = this.providers[name as VoiceProviderName];
    if (!provider) throw new BadRequestException(`暂不支持语音服务商：${name}`);
    if (!provider.isConfigured()) throw new ServiceUnavailableException(`语音服务 ${name} 尚未配置`);
    return provider;
  }
}
