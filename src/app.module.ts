import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { FavoritesController } from './api/favorites/favorites.controller.js';
import { AUTH_USER_SESSION_CLIENT } from './application/ports/auth-user-session.js';
import { FAVORITE_REPOSITORY } from './application/ports/favorite-use-cases.js';
import { JWT_VERIFIER } from './application/ports/jwt-ports.js';
import { CreateFavoriteService } from './application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from './application/use-cases/delete-favorite.js';
import { JwtAuthGuard } from './api/auth/jwt-auth-guard.js';
import { ApiExceptionFilter } from './api/http/api-exception.filter.js';
import { RequestIdMiddleware } from './api/http/request-id.js';
import { RequestLoggingMiddleware } from './api/http/request-logging.middleware.js';
import { createValidationPipe } from './api/http/validation-pipe.js';
import {
  GAME_RUNTIME_CONFIG,
  type GameRuntimeConfig,
  loadGameRuntimeConfig,
} from './infrastructure/config/game-runtime-config.js';
import { RsaJwtVerifier } from './infrastructure/cryptography/rsa-jwt.js';
import { AuthUserSessionClient } from './infrastructure/auth/auth-user-session-client.js';
import { PrismaFavoriteRepository } from './infrastructure/persistence/prisma/prisma-favorite-repository.js';
import { createPrismaClient } from './infrastructure/persistence/prisma/prisma-client.js';
import type { PrismaClient } from './infrastructure/persistence/prisma/generated/client.js';

const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

@Module({
  imports: [HttpModule],
  controllers: [FavoritesController],
  providers: [
    {
      provide: GAME_RUNTIME_CONFIG,
      useFactory: loadGameRuntimeConfig,
    },
    {
      provide: PRISMA_CLIENT,
      useFactory: (config: GameRuntimeConfig): PrismaClient =>
        createPrismaClient(config.databaseUrl),
      inject: [GAME_RUNTIME_CONFIG],
    },
    {
      provide: JWT_VERIFIER,
      useFactory: (config: GameRuntimeConfig) =>
        new RsaJwtVerifier(
          config.jwtPublicKey,
          config.jwtIssuer,
          config.jwtAudience,
        ),
      inject: [GAME_RUNTIME_CONFIG],
    },
    {
      provide: AUTH_USER_SESSION_CLIENT,
      useFactory: (config: GameRuntimeConfig, httpService: HttpService) =>
        new AuthUserSessionClient(config.authUserUrl, httpService),
      inject: [GAME_RUNTIME_CONFIG, HttpService],
    },
    {
      provide: FAVORITE_REPOSITORY,
      useFactory: (prisma: PrismaClient) =>
        new PrismaFavoriteRepository(prisma),
      inject: [PRISMA_CLIENT],
    },
    JwtAuthGuard,
    CreateFavoriteService,
    DeleteFavoriteService,
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
