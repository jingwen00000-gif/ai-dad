import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TokenPair, TokenService } from './token.service.js';
import { WxService } from './wx.service.js';

export interface MeResponse {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wx: WxService,
    private readonly tokens: TokenService,
  ) {}

  /** 微信登录：首次登录自动注册（同时创建家长设置） */
  async wxLogin(code: string): Promise<TokenPair & { isNewUser: boolean }> {
    const session = await this.wx.code2Session(code);
    const now = new Date();

    const existing = await this.prisma.user.findUnique({ where: { wxOpenid: session.openid } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: now, ...(session.unionid ? { wxUnionid: session.unionid } : {}) },
        })
      : await this.prisma.user.upsert({
          // upsert 防止同一 openid 并发首次登录时撞唯一约束
          where: { wxOpenid: session.openid },
          create: {
            wxOpenid: session.openid,
            wxUnionid: session.unionid,
            lastLoginAt: now,
            parentSettings: { create: {} },
          },
          update: { lastLoginAt: now },
        });

    this.assertActive(user.status);
    return { ...(await this.tokens.issue(user.id)), isNewUser: !existing };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const userId = await this.tokens.consume(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('登录已失效，请重新登录');
    this.assertActive(user.status);
    return this.tokens.issue(user.id);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('账号不存在');
    this.assertActive(user.status);
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private assertActive(status: string) {
    if (status !== 'active') throw new ForbiddenException('账号不可用');
  }
}
