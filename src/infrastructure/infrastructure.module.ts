import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_USER_SESSION_CLIENT } from '../application/ports/auth-user-session.ts';
import { FAVORITE_REPOSITORY } from '../application/ports/favorite-use-cases.ts';
import { JWT_VERIFIER } from '../application/ports/jwt-ports.ts';
import { AuthUserSessionClient } from './auth/auth-user-session-client.ts';
import { validateGameEnvironment } from './config/game-runtime-config.ts';
import { RsaJwtVerifier } from './cryptography/rsa-jwt.ts';
import { createPrismaClient } from './persistence/prisma/prisma-client.ts';
import { PrismaFavoriteRepository } from './persistence/prisma/prisma-favorite-repository.ts';
import type { PrismaClient } from './persistence/prisma/generated/client.ts';

const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateGameEnvironment,
    }),
    HttpModule,
  ],
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
  ],
  exports: [AUTH_USER_SESSION_CLIENT, FAVORITE_REPOSITORY, JWT_VERIFIER],
})
export class InfrastructureModule {}
