import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApplicationModule } from '../application/application.module.js';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.js';
import { JwtAuthGuard } from './auth/jwt-auth-guard.js';
import { FavoritesController } from './favorites/favorites.controller.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';
import { RequestIdMiddleware } from './http/request-id.js';
import { RequestLoggingMiddleware } from './http/request-logging.middleware.js';
import { createValidationPipe } from './http/validation-pipe.js';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [FavoritesController],
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
