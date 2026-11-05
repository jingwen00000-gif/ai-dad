import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 音频链接签名：<audio src> 不能带登录凭证，所以给链接加上过期时间和 HMAC 签名，
 * 拿到链接的人在有效期内可以播放，过期或被篡改即失效。
 */
export class AudioUrlSigner {
  private readonly key: Buffer;

  constructor(secret: string) {
    // 从主密钥派生，不与 JWT 共用同一个密钥
    this.key = createHash('sha256').update(`voice-audio-url:${secret}`).digest();
  }

  sign(audioId: string, expiresAt: number): string {
    return createHmac('sha256', this.key).update(`${audioId}.${expiresAt}`).digest('base64url');
  }

  verify(audioId: string, expiresAt: number, signature: string, now = Date.now()): boolean {
    if (!Number.isFinite(expiresAt) || expiresAt * 1000 < now) return false;
    const expected = Buffer.from(this.sign(audioId, expiresAt));
    const given = Buffer.from(signature ?? '');
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}
