import type { INestApplication } from '@nestjs/common';
import { configureSwagger } from '../openapi/configure-swagger.js';
import { createCorsOptions } from './cors-options.js';

export function configureHttpApplication(
  application: INestApplication,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  application.enableCors(createCorsOptions(environment));
  configureSwagger(application);
}
