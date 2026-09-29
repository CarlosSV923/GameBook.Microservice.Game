import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApplicationModule } from '../application/application.module.ts';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.ts';
import { JwtAuthGuard } from './auth/jwt-auth-guard.ts';
import { FavoritesController } from './favorites/favorites.controller.ts';
import { HealthController } from './health/health.controller.ts';
import { ApiExceptionFilter } from './http/api-exception.filter.ts';
import { RequestIdMiddleware } from './http/request-id.ts';
import { RequestLoggingMiddleware } from './http/request-logging.middleware.ts';
import { createValidationPipe } from './http/validation-pipe.ts';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [FavoritesController, HealthController],
  providers: [
    JwtAuthGuard,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
