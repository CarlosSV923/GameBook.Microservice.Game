import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureSwagger } from './api/openapi/configure-swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  configureSwagger(app);
  await app.listen(config.get<string>('PORT') ?? '3002');
}
await bootstrap();
