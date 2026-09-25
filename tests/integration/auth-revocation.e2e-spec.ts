import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/api/auth/jwt-auth-guard.js';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { FavoritesController } from '../../src/api/favorites/favorites.controller.js';
import { CreateFavoriteService } from '../../src/application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from '../../src/application/use-cases/delete-favorite.js';
import { ListFavoritesService } from '../../src/application/use-cases/list-favorites.js';
import { SuggestFavoritesService } from '../../src/application/use-cases/suggest-favorites.js';
import { UpdateFavoriteSnapshotService } from '../../src/application/use-cases/update-favorite-snapshot.js';
import { AuthUserSessionClient } from '../../src/infrastructure/auth/auth-user-session-client.js';
import { RsaJwtVerifier } from '../../src/infrastructure/cryptography/rsa-jwt.js';
import {
  AUTH_USER_SESSION_CLIENT,
  type AuthUserSessionClient as AuthUserSessionClientPort,
} from '../../src/application/ports/auth-user-session.js';
import { JWT_VERIFIER } from '../../src/application/ports/jwt-ports.js';

const userId = '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa';
const issuer = 'gamebook-authuser-test';
const audience = 'gamebook-game-test';
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const publicKeyPem = publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();

describe('Game JWT and AuthUser session integration', () => {
  let app: INestApplication;
  let authUserServer: Server;
  let authUserUrl: string;
  let sessionStatus = HttpStatus.OK;
  let sessionBody: unknown = { user: { id: userId } };
  let receivedAuthorization: string | undefined;
  const createFavorite = { execute: vi.fn() };
  const deleteFavorite = { execute: vi.fn() };
  const listFavorites = { execute: vi.fn() };
  const suggestFavorites = { execute: vi.fn() };
  const updateFavoriteSnapshot = { execute: vi.fn() };

  beforeAll(async () => {
    authUserServer = createServer((incomingMessage, response) => {
      if (incomingMessage.url !== '/v1/auth/session') {
        response.statusCode = HttpStatus.NOT_FOUND;
        response.end();
        return;
      }

      receivedAuthorization = incomingMessage.headers.authorization;
      response.statusCode = sessionStatus;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(sessionBody));
    });

    await new Promise<void>((resolve, reject) => {
      authUserServer.once('error', reject);
      authUserServer.listen(0, '127.0.0.1', resolve);
    });

    const address = authUserServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('AuthUser test server did not expose a TCP address.');
    }

    authUserUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  beforeEach(async () => {
    sessionStatus = HttpStatus.OK;
    sessionBody = { user: { id: userId } };
    receivedAuthorization = undefined;
    vi.clearAllMocks();
    listFavorites.execute.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      hasNext: false,
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [FavoritesController],
      providers: [
        { provide: CreateFavoriteService, useValue: createFavorite },
        { provide: DeleteFavoriteService, useValue: deleteFavorite },
        { provide: ListFavoritesService, useValue: listFavorites },
        { provide: SuggestFavoritesService, useValue: suggestFavorites },
        {
          provide: UpdateFavoriteSnapshotService,
          useValue: updateFavoriteSnapshot,
        },
        {
          provide: JWT_VERIFIER,
          useValue: new RsaJwtVerifier(publicKeyPem, issuer, audience),
        },
        {
          provide: AUTH_USER_SESSION_CLIENT,
          useFactory: (httpService: HttpService): AuthUserSessionClientPort =>
            new AuthUserSessionClient(authUserUrl, httpService),
          inject: [HttpService],
        },
        JwtAuthGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      authUserServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('validates the local signature, forwards the same Bearer token, and authorizes the route', async () => {
    const token = createToken();

    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
      .expect({
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        hasNext: false,
      });

    expect(receivedAuthorization).toBe(`Bearer ${token}`);
    expect(listFavorites.execute).toHaveBeenCalledWith({ userId });
  });

  it('rejects missing or locally invalid tokens without calling AuthUser', async () => {
    await request(app.getHttpServer())
      .get('/v1/favorites')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'TOKEN_MISSING' });
      });

    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', 'Bearer manipulated-token')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'TOKEN_INVALID' });
      });

    expect(receivedAuthorization).toBeUndefined();
    expect(listFavorites.execute).not.toHaveBeenCalled();
  });

  it('returns 401 for a token revoked by AuthUser and does not execute the use case', async () => {
    sessionStatus = HttpStatus.UNAUTHORIZED;
    sessionBody = { code: 'SESSION_REVOKED' };

    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'SESSION_REVOKED' });
      });

    expect(listFavorites.execute).not.toHaveBeenCalled();
  });

  it('returns 503 when AuthUser cannot confirm the session and fails closed', async () => {
    sessionStatus = HttpStatus.SERVICE_UNAVAILABLE;
    sessionBody = {};

    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(HttpStatus.SERVICE_UNAVAILABLE)
      .expect((response) => {
        expect(response.body).toMatchObject({ code: 'AUTHUSER_UNAVAILABLE' });
      });

    expect(listFavorites.execute).not.toHaveBeenCalled();
  });
});

function createToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeSegment({ alg: 'RS256', typ: 'JWT' });
  const payload = encodeSegment({
    sub: userId,
    ver: 1,
    iat: now - 60,
    exp: now + 3600,
    iss: issuer,
    aud: audience,
  });
  const signingInput = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .end()
    .sign(privateKey)
    .toString('base64url');

  return `${signingInput}.${signature}`;
}

function encodeSegment(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
