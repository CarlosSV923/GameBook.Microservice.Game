import type { INestApplication } from '@nestjs/common';
import { configureSwagger } from '../openapi/configure-swagger.ts';
import { createCorsOptions } from './cors-options.ts';

export function configureHttpApplication(
  application: INestApplication,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  application.enableCors(createCorsOptions(environment));
  configureSwagger(application);
}
