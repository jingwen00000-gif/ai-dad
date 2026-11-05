import { IsString, Length } from 'class-validator';

export class WxLoginDto {
  /** wx.login() 返回的 code，5 分钟有效、只能用一次 */
  @IsString()
  @Length(1, 128)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  @Length(20, 200)
  refreshToken: string;
}
