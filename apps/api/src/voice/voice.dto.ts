import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { VOICE_PROVIDER_NAMES } from './providers/voice-provider.js';

export const RELATIONS = ['dad', 'mum', 'grandma', 'grandpa', 'other'] as const;
export const LANGUAGES = ['zh', 'en', 'multi'] as const;
/** 单次生成的最长文字。长故事由故事服务按段落分开生成 */
export const MAX_TEXT_LENGTH = 2500;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateVoiceProfileDto {
  @IsIn(VOICE_PROVIDER_NAMES)
  provider: string;

  /** 服务商的声音 ID，如 ElevenLabs 的 JBFqnCBsd6RMkjVDRZzb */
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,128}$/, { message: 'voiceId 格式不正确' })
  voiceId: string;

  @Transform(trim)
  @IsString()
  @Length(1, 60)
  voiceName: string;

  @IsOptional()
  @IsIn(RELATIONS)
  relation?: (typeof RELATIONS)[number];

  @IsOptional()
  @IsIn(LANGUAGES)
  language?: (typeof LANGUAGES)[number];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  /** 必须为 true：声音本人已同意克隆并用于给孩子讲故事、聊天 */
  @Equals(true, { message: '需要声音本人同意后才能添加' })
  consent: boolean;
}

export class GenerateVoiceDto {
  @Transform(trim)
  @IsString()
  @Length(1, MAX_TEXT_LENGTH, { message: `文字长度需在 1-${MAX_TEXT_LENGTH} 之间` })
  text: string;

  /** 用哪个家人的声音；不传则用默认声音 */
  @IsOptional()
  @IsUUID()
  voiceProfileId?: string;
}

export interface VoiceProfileResponse {
  id: string;
  provider: string;
  voiceId: string;
  voiceName: string;
  relation: string;
  language: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
}

export interface GenerateVoiceResponse {
  audioUrl: string;
  expiresAt: string;
  cached: boolean;
  characters: number;
  voiceProfileId: string;
}
