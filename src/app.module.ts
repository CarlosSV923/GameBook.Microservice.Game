import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { FavoritesController } from './api/favorites/favorites.controller.js';
import { AUTH_USER_SESSION_CLIENT } from './application/ports/auth-user-session.js';
import { FAVORITE_REPOSITORY } from './application/ports/favorite-use-cases.js';
import { JWT_VERIFIER } from './application/ports/jwt-ports.js';
import { CreateFavoriteService } from './application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from './application/use-cases/delete-favorite.js';
import { ListFavoritesService } from './application/use-cases/list-favorites.js';
import { JwtAuthGuard } from './api/auth/jwt-auth-guard.js';
import { ApiExceptionFilter } from './api/http/api-exception.filter.js';
import { RequestIdMiddleware } from './api/http/request-id.js';
import { RequestLoggingMiddleware } from './api/http/request-logging.middleware.js';
import { createValidationPipe } from './api/http/validation-pipe.js';
import { validateGameEnvironment } from './infrastructure/config/game-runtime-config.js';
import { RsaJwtVerifier } from './infrastructure/cryptography/rsa-jwt.js';
import { AuthUserSessionClient } from './infrastructure/auth/auth-user-session-client.js';
import { PrismaFavoriteRepository } from './infrastructure/persistence/prisma/prisma-favorite-repository.js';
import { createPrismaClient } from './infrastructure/persistence/prisma/prisma-client.js';
import type { PrismaClient } from './infrastructure/persistence/prisma/generated/client.js';

const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateGameEnvironment,
    }),
    HttpModule,
  ],
  controllers: [FavoritesController],
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: (config: ConfigService): PrismaClient =>
        createPrismaClient(config.getOrThrow<string>('GAME_DATABASE_URL')),
      inject: [ConfigService],
    },
    {
      provide: JWT_VERIFIER,
      useFactory: (config: ConfigService) =>
        new RsaJwtVerifier(
          config.getOrThrow<string>('JWT_PUBLIC_KEY'),
          config.getOrThrow<string>('JWT_ISSUER'),
          config.getOrThrow<string>('JWT_AUDIENCE'),
        ),
      inject: [ConfigService],
    },
    {
      provide: AUTH_USER_SESSION_CLIENT,
      useFactory: (config: ConfigService, httpService: HttpService) =>
        new AuthUserSessionClient(
          config.getOrThrow<string>('AUTHUSER_URL'),
          httpService,
        ),
      inject: [ConfigService, HttpService],
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
    ListFavoritesService,
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
