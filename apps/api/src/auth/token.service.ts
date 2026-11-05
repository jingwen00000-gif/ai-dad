import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../common/config/env.validation.js';
import type { JwtPayload } from '../common/auth/jwt-payload.js';
import { RedisService } from '../common/redis/redis.service.js';

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

/**
 * access token：JWT，短期（默认 2 小时），无状态校验。
 * refresh token：随机串，Redis 只存它的 SHA-256；每次刷新都轮换（旧的立即作废），可随时吊销。
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(userId: string): Promise<TokenPair> {
    const accessTtl = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
    const refreshTtl = this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true });

    const accessToken = await this.jwt.signAsync({ sub: userId } satisfies JwtPayload);
    const refreshToken = randomBytes(32).toString('base64url');
    await this.redis.client.set(this.key(refreshToken), userId, 'EX', refreshTtl);

    return {
      accessToken,
      accessTokenExpiresIn: accessTtl,
      refreshToken,
      refreshTokenExpiresIn: refreshTtl,
    };
  }

  /** 消费一个 refresh token（原子 GETDEL），返回它所属的用户。用过的 token 不能再用 */
  async consume(refreshToken: string): Promise<string> {
    const userId = await this.redis.client.getdel(this.key(refreshToken));
    if (!userId) throw new UnauthorizedException('登录已失效，请重新登录');
    return userId;
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.redis.client.del(this.key(refreshToken));
  }

  private key(refreshToken: string): string {
    return `auth:rt:${createHash('sha256').update(refreshToken).digest('hex')}`;
  }
}
