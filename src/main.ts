import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureHttpApplication } from './api/http/configure-http-application.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  configureHttpApplication(app);
  await app.listen(config.get<string>('PORT') ?? '3002');
}
await bootstrap();
