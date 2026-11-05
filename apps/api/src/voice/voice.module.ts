import { Module } from '@nestjs/common';
import { ElevenLabsProvider } from './providers/elevenlabs.provider.js';
import { VoiceProviderRegistry } from './providers/voice-provider.registry.js';
import { AUDIO_STORAGE, LocalDiskAudioStorage } from './storage/audio-storage.js';
import { VoiceController } from './voice.controller.js';
import { VoiceService } from './voice.service.js';

/**
 * 家人声音模块。故事、聊天模块 import 本模块后注入 VoiceService，调用 synthesize()。
 */
@Module({
  controllers: [VoiceController],
  providers: [
    VoiceService,
    ElevenLabsProvider,
    VoiceProviderRegistry,
    { provide: AUDIO_STORAGE, useClass: LocalDiskAudioStorage },
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
