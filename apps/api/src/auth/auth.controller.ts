import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { AuthUser } from '../common/auth/jwt-payload.js';
import { Public } from '../common/auth/public.decorator.js';
import { RefreshTokenDto, WxLoginDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 小程序启动时调用：wx.login() 的 code → access token + refresh token */
  @Public()
  @Post('wx-login')
  @HttpCode(HttpStatus.OK)
  wxLogin(@Body() dto: WxLoginDto) {
    return this.auth.wxLogin(dto.code);
  }

  /** access token 过期后调用。旧 refresh token 会立即作废，请保存新返回的一对 */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
