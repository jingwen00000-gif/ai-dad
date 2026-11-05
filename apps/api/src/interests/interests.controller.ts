import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { AuthUser } from '../common/auth/jwt-payload.js';
import { SetChildInterestsDto } from './interests.dto.js';
import { InterestsService } from './interests.service.js';

@Controller()
export class InterestsController {
  constructor(private readonly interests: InterestsService) {}

  /** 兴趣字典（分类 + 标签） */
  @Get('interests')
  catalog() {
    return this.interests.catalog();
  }

  @Get('children/:childId/interests')
  list(@CurrentUser() user: AuthUser, @Param('childId', ParseUUIDPipe) childId: string) {
    return this.interests.listForChild(user.userId, childId);
  }

  /** 保存家长勾选的兴趣（整体替换） */
  @Put('children/:childId/interests')
  set(
    @CurrentUser() user: AuthUser,
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: SetChildInterestsDto,
  ) {
    return this.interests.setForChild(user.userId, childId, dto.tagIds);
  }
}
