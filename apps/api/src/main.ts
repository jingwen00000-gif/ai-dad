import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { Env } from './common/config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<Env, true>);
  // 部署在 Caddy 反向代理后面：信任一层代理，拿到真实的客户端 IP 和 https 协议
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  // 跨域：开发环境放开；生产环境只允许 CORS_ORIGINS 里的网页（小程序请求不受 CORS 限制）
  const origins = config.get('CORS_ORIGINS', { infer: true });
  if (config.get('NODE_ENV', { infer: true }) !== 'production') app.enableCors({ origin: true });
  else if (origins.length) app.enableCors({ origin: origins, maxAge: 600 });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
