import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.ts';
import { configureHttpApplication } from './api/http/configure-http-application.ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  configureHttpApplication(app);
  await app.listen(config.get<string>('PORT') ?? '3002');
}
await bootstrap();
