import { Module } from '@nestjs/common';
import { ChildrenModule } from '../children/children.module.js';
import { InterestsController } from './interests.controller.js';
import { InterestsService } from './interests.service.js';

/** 兴趣体系：兴趣字典 + 孩子的兴趣（Sprint 2：家长勾选；以后由行为信号调整权重） */
@Module({
  imports: [ChildrenModule],
  controllers: [InterestsController],
  providers: [InterestsService],
  exports: [InterestsService],
})
export class InterestsModule {}
