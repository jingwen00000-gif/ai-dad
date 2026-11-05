import { Module } from '@nestjs/common';
import { ChildrenController } from './children.controller.js';
import { ChildrenService } from './children.service.js';

/** 孩子档案：增删改查。年龄（月龄 / 阶段）每次读取时实时计算 */
@Module({
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
