import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { AuthUser } from '../common/auth/jwt-payload.js';
import { Public } from '../common/auth/public.decorator.js';
import { CreateVoiceProfileDto, GenerateVoiceDto } from './voice.dto.js';
import { VoiceService } from './voice.service.js';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Get('profiles')
  list(@CurrentUser() user: AuthUser) {
    return this.voice.listProfiles(user.userId);
  }

  /** 添加家人的声音（保存服务商的 Voice ID） */
  @Post('profiles')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVoiceProfileDto) {
    return this.voice.createProfile(user.userId, dto);
  }

  @Post('profiles/:id/default')
  @HttpCode(HttpStatus.OK)
  setDefault(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.voice.setDefault(user.userId, id);
  }

  @Delete('profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.voice.deleteProfile(user.userId, id);
  }

  /** 文字 → 家人声音的 mp3。返回带签名、会过期的播放链接 */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateVoiceDto) {
    return this.voice.synthesize(user.userId, dto);
  }

  /**
   * 播放音频。公开接口（<audio> 无法带登录凭证），靠链接里的签名和过期时间保护。
   * 支持 Range 请求：iPhone Safari 播放音频必须用到。
   */
  @Public()
  @Get('audio/:id')
  async audio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    const { data, contentType } = await this.voice.readAudio(id, Number(exp), sig);
    const expiresIn = Math.max(0, Number(exp) - Math.floor(Date.now() / 1000));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', `private, max-age=${expiresIn}`);

    const match = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    if (range && !match) throw new BadRequestException('不支持的 Range');
    if (match) {
      const size = data.length;
      let start = match[1] === '' ? size - Number(match[2]) : Number(match[1]);
      let end = match[1] === '' || match[2] === '' ? size - 1 : Number(match[2]);
      start = Math.max(0, start);
      end = Math.min(end, size - 1);
      if (start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${size}`);
        return res.end();
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      return res.end(data.subarray(start, end + 1));
    }
    res.setHeader('Content-Length', String(data.length));
    return res.end(data);
  }
}
