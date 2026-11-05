import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  // 小程序请求不受 CORS 限制；仅开发环境为 H5 预览放开跨域
  if (process.env.NODE_ENV !== 'production') app.enableCors({ origin: true });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
