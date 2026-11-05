import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ChildrenModule } from './children/children.module.js';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard.js';
import { validateEnv } from './common/config/env.validation.js';
import { HealthController } from './common/health/health.controller.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { GrowthModule } from './growth/growth.module.js';
import { InterestsModule } from './interests/interests.module.js';
import { MemoriesModule } from './memories/memories.module.js';
import { StoriesModule } from './stories/stories.module.js';
import { VoiceModule } from './voice/voice.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ChildrenModule,
    InterestsModule,
    StoriesModule,
    ChatModule,
    MemoriesModule,
    GrowthModule,
    VoiceModule,
  ],
  controllers: [HealthController],
  // 默认所有接口都需要登录；公开接口用 @Public() 标注
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
