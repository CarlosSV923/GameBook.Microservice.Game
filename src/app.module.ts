import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ApiExceptionFilter } from './api/http/api-exception.filter.js';
import { RequestIdMiddleware } from './api/http/request-id.js';
import { RequestLoggingMiddleware } from './api/http/request-logging.middleware.js';
import { createValidationPipe } from './api/http/validation-pipe.js';
import {
  GAME_RUNTIME_CONFIG,
  loadGameRuntimeConfig,
} from './infrastructure/config/game-runtime-config.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: GAME_RUNTIME_CONFIG,
      useFactory: loadGameRuntimeConfig,
    },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
