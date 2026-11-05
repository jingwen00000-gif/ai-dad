import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../common/config/env.validation.js';

export interface WxSession {
  openid: string;
  unionid?: string;
}

interface Code2SessionResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

const CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session';

/**
 * 微信小程序登录：wx.login() 拿到的 code 换 openid。
 * session_key 不落库（新版手机号接口不需要它），减少敏感数据。
 */
@Injectable()
export class WxService {
  private readonly logger = new Logger(WxService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async code2Session(code: string): Promise<WxSession> {
    if (this.config.get('WX_MOCK_LOGIN', { infer: true })) {
      return { openid: `mock_${code}` };
    }

    const url = new URL(CODE2SESSION_URL);
    url.searchParams.set('appid', this.config.get('WX_APPID', { infer: true }));
    url.searchParams.set('secret', this.config.get('WX_SECRET', { infer: true }));
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    let body: Code2SessionResponse;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = (await res.json()) as Code2SessionResponse;
    } catch (err) {
      this.logger.error(`code2Session 请求失败: ${(err as Error).message}`);
      throw new ServiceUnavailableException('微信服务暂时不可用，请稍后再试');
    }

    if (body.errcode) {
      // 40029 code 无效；40163 code 已被使用；45011 频率限制
      if (body.errcode === 40029 || body.errcode === 40163) {
        throw new UnauthorizedException('登录码无效或已使用，请重新登录');
      }
      if (body.errcode === 45011) {
        throw new HttpException('登录太频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
      }
      this.logger.error(`code2Session 错误 ${body.errcode}: ${body.errmsg}`);
      throw new ServiceUnavailableException('微信登录失败，请稍后再试');
    }
    if (!body.openid) {
      throw new ServiceUnavailableException('微信登录失败，请稍后再试');
    }
    return { openid: body.openid, unionid: body.unionid || undefined };
  }
}
