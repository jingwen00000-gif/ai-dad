/**
 * 语音服务商接口。新增服务商（豆包、CosyVoice、OpenAI…）只需实现它并在 VoiceProviderRegistry 注册。
 * 缓存、存储、签名链接由 VoiceService 统一处理，服务商只负责“文字 → 音频”。
 */
export const VOICE_PROVIDER_NAMES = ['elevenlabs', 'doubao', 'cosyvoice', 'openai'] as const;
export type VoiceProviderName = (typeof VOICE_PROVIDER_NAMES)[number];

export interface ProviderVoice {
  voiceId: string;
  name: string;
}

export interface SynthesisResult {
  audio: Buffer;
  contentType: string;
}

export interface VoiceProvider {
  readonly name: VoiceProviderName;
  /** 是否已配置（如 API Key）。未配置时接口返回 503 */
  isConfigured(): boolean;
  /** 当前使用的语音模型，参与缓存键：换模型后会重新生成 */
  modelId(): string;
  /** 查询服务商账号里是否有这个声音；没有返回 null */
  getVoice(voiceId: string): Promise<ProviderVoice | null>;
  textToSpeech(text: string, voiceId: string): Promise<SynthesisResult>;
}
