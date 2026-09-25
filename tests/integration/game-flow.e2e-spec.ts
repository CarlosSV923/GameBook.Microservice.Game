import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { FAVORITE_REPOSITORY } from '../../src/application/ports/favorite-use-cases.js';
import { FavoriteAlreadyExistsError } from '../../src/application/errors/favorite-errors.js';
import type {
  FavoriteListFilters,
  FavoritePage,
  FavoriteRepository as FavoriteRepositoryPort,
  FavoriteSuggestion,
  FavoriteSuggestionQuery,
} from '../../src/domain/favorites/favorite-repository.js';
import {
  Favorite,
  type FavoriteSnapshotUpdate,
} from '../../src/domain/favorites/favorite.js';
import { configureSwagger } from '../../src/api/openapi/configure-swagger.js';

const userA = '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa';
const userB = '11111111-1111-4111-8111-111111111111';
const issuer = 'gamebook-authuser-test';
const audience = 'gamebook-game-test';
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const publicKeyPem = publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();

const originalEnvironment = {
  GAME_DATABASE_URL: process.env.GAME_DATABASE_URL,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  AUTHUSER_URL: process.env.AUTHUSER_URL,
};

class InMemoryFavoriteRepository implements FavoriteRepositoryPort {
  private readonly favorites = new Map<string, Favorite>();

  size(): number {
    return this.favorites.size;
  }

  clear(): void {
    this.favorites.clear();
  }

  findByIdentity(userId: string, igdbId: number): Promise<Favorite | null> {
    return Promise.resolve(this.favorites.get(key(userId, igdbId)) ?? null);
  }

  async save(favorite: Favorite): Promise<void> {
    const identity = key(favorite.userId, favorite.igdbId);
    if (this.favorites.has(identity)) {
      throw new FavoriteAlreadyExistsError();
    }

    this.favorites.set(identity, favorite);
  }

  async list(
    userId: string,
    filters: FavoriteListFilters,
  ): Promise<FavoritePage> {
    const matches = [...this.favorites.values()]
      .filter((favorite) => favorite.userId === userId)
      .filter((favorite) =>
        filters.name === undefined
          ? true
          : favorite.name
              .toLowerCase()
              .includes(filters.name.trim().toLowerCase()),
      )
      .filter((favorite) =>
        filters.platformId === undefined
          ? true
          : favorite.platforms.some(
              (platform) => platform.id === filters.platformId,
            ),
      )
      .filter((favorite) => matchesYear(favorite, filters))
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) || left.igdbId - right.igdbId,
      );
    const page = normalizePositive(filters.page, 1);
    const pageSize = Math.min(normalizePositive(filters.pageSize, 20), 1000);
    const start = (page - 1) * pageSize;

    return {
      items: matches.slice(start, start + pageSize),
      page,
      pageSize,
      total: matches.length,
      hasNext: start + pageSize < matches.length,
    };
  }

  async suggest(
    userId: string,
    query: FavoriteSuggestionQuery,
  ): Promise<readonly FavoriteSuggestion[]> {
    const normalized = query.query.trim().toLowerCase();
    const limit = Math.min(normalizePositive(query.limit, 10), 20);
    const own = [...this.favorites.values()].filter(
      (favorite) => favorite.userId === userId,
    );

    if (query.type === 'name') {
      return own
        .filter((favorite) => favorite.name.toLowerCase().includes(normalized))
        .map((favorite) => ({ type: 'name' as const, value: favorite.name }))
        .slice(0, limit);
    }

    return own
      .flatMap((favorite) =>
        favorite.platforms.map((platform) => ({
          type: 'platform' as const,
          value: platform.name,
          platformId: platform.id,
        })),
      )
      .filter((platform) => platform.value.toLowerCase().includes(normalized))
      .slice(0, limit);
  }

  async updateSnapshot(
    userId: string,
    igdbId: number,
    update: FavoriteSnapshotUpdate,
  ): Promise<Favorite | null> {
    const favorite = this.favorites.get(key(userId, igdbId));
    if (!favorite) {
      return null;
    }

    favorite.updateSnapshot(update);
    return favorite;
  }

  async delete(userId: string, igdbId: number): Promise<boolean> {
    return this.favorites.delete(key(userId, igdbId));
  }
}

describe('Game authenticated favorite flow', () => {
  let app: INestApplication;
  let authUserServer: Server;
  let authUserPort: number;
  let authUserServerRunning = false;
  let sessionStatus = 200;
  let sessionUserId = userA;
  const repository = new InMemoryFavoriteRepository();

  beforeAll(async () => {
    authUserServer = createServer((_request, response) => {
      response.statusCode = sessionStatus;
      response.setHeader('content-type', 'application/json');
      response.end(
        sessionStatus === 200
          ? JSON.stringify({ user: { id: sessionUserId } })
          : JSON.stringify({ code: 'SESSION_REVOKED' }),
      );
    });

    await new Promise<void>((resolve, reject) => {
      authUserServer.once('error', reject);
      authUserServer.listen(0, '127.0.0.1', resolve);
    });
    const address = authUserServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('AuthUser test server did not expose a TCP address.');
    }
    authUserPort = (address as AddressInfo).port;
    authUserServerRunning = true;

    process.env.GAME_DATABASE_URL =
      'postgresql://runtime_user:runtime_password@localhost:5432/gamebook?schema=game';
    process.env.JWT_PUBLIC_KEY = publicKeyPem;
    process.env.JWT_ISSUER = issuer;
    process.env.JWT_AUDIENCE = audience;
    process.env.AUTHUSER_URL = `http://127.0.0.1:${authUserPort}`;

    const { AppModule } = await import('../../src/app.module.js');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FAVORITE_REPOSITORY)
      .useValue(repository)
      .compile();

    app = moduleFixture.createNestApplication();
    configureSwagger(app);
    await app.init();
  });

  beforeEach(() => {
    repository.clear();
    sessionStatus = 200;
    sessionUserId = userA;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (authUserServerRunning) {
      await new Promise<void>((resolve, reject) => {
        authUserServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name as keyof NodeJS.ProcessEnv];
      } else {
        process.env[name as keyof NodeJS.ProcessEnv] = value;
      }
    }
  });

  it('serves Swagger UI and an OpenAPI document with Bearer security', async () => {
    await request(app.getHttpServer()).get('/docs').redirects(1).expect(200);

    const response = await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200);

    expect(response.body.info).toMatchObject({
      title: 'GameBook Game API',
      version: '0.1.0',
    });
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.servers).toEqual([
      {
        url: 'http://localhost:3002',
        description: 'Local development server for GameBook.Microservice.Game.',
      },
    ]);
    expect(response.body.components.securitySchemes.BearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(response.body.paths['/v1/favorites'].get.operationId).toBe(
      'listFavorites',
    );
    expect(response.body.paths['/v1/favorites'].post.operationId).toBe(
      'createFavorite',
    );
    expect(
      response.body.paths['/v1/favorites/suggestions'].get.operationId,
    ).toBe('suggestFavorites');
    expect(
      response.body.paths['/v1/favorites/{igdbId}/snapshot'].patch.operationId,
    ).toBe('updateFavoriteSnapshot');
    expect(
      response.body.paths['/v1/favorites/{igdbId}'].delete.operationId,
    ).toBe('deleteFavorite');
    const protectedOperations = [
      ['/v1/favorites', 'get'],
      ['/v1/favorites', 'post'],
      ['/v1/favorites/suggestions', 'get'],
      ['/v1/favorites/{igdbId}/snapshot', 'patch'],
      ['/v1/favorites/{igdbId}', 'delete'],
    ] as const;
    for (const [path, method] of protectedOperations) {
      expect(response.body.paths[path][method].security).toEqual([
        { BearerAuth: [] },
      ]);
    }
    expect(JSON.stringify(response.body)).not.toMatch(
      /PRIVATE KEY|client_secret|access_token:|Bearer ey/u,
    );
  });

  it('accepts a valid JWT, persists a favorite, and isolates it by UUID', async () => {
    const tokenA = createToken(userA);
    const tokenB = createToken(userB);

    await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        igdbId: 3498,
        name: 'Example Game',
        rating: 94.5,
        platforms: [{ id: 6, name: 'PC' }],
      })
      .expect(201);

    sessionUserId = userB;
    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toEqual([]);
        expect(response.body.total).toBe(0);
      });

    sessionUserId = userA;
    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.items[0]).toMatchObject({
          igdbId: 3498,
          name: 'Example Game',
          rating: 94.5,
        });
        expect(response.body.total).toBe(1);
      });
  });

  it('rejects missing, manipulated, and expired JWTs before accessing favorites', async () => {
    const expired = createToken(userA, -1);
    const valid = createToken(userA);
    const [header, payload, signature] = valid.split('.');
    const manipulated = `${header}.${payload}.${
      signature.startsWith('a') ? 'b' : 'a'
    }${signature.slice(1)}`;

    for (const authorization of [
      undefined,
      `Bearer ${manipulated}`,
      `Bearer ${expired}`,
    ]) {
      const response = request(app.getHttpServer()).get('/v1/favorites');
      if (authorization) {
        response.set('Authorization', authorization);
      }

      await response.expect(401).expect((result) => {
        expect(['TOKEN_MISSING', 'TOKEN_INVALID', 'TOKEN_EXPIRED']).toContain(
          result.body.code,
        );
      });
    }

    expect(repository.size()).toBe(0);
  });

  it('rejects a revoked JWT with 401 and an unavailable AuthUser with 503', async () => {
    sessionStatus = 401;
    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${createToken(userA)}`)
      .expect(401)
      .expect((response) => {
        expect(response.body.code).toBe('SESSION_REVOKED');
      });

    await new Promise<void>((resolve, reject) => {
      authUserServer.close((error) => (error ? reject(error) : resolve()));
    });
    authUserServerRunning = false;
    await request(app.getHttpServer())
      .get('/v1/favorites')
      .set('Authorization', `Bearer ${createToken(userA)}`)
      .expect(503)
      .expect((response) => {
        expect(response.body.code).toBe('AUTHUSER_UNAVAILABLE');
      });

    expect(repository.size()).toBe(0);
  });
});

function key(userId: string, igdbId: number): string {
  return `${userId}:${igdbId}`;
}

function normalizePositive(
  value: number | undefined,
  fallback: number,
): number {
  return value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : fallback;
}

function matchesYear(
  favorite: Favorite,
  filters: FavoriteListFilters,
): boolean {
  const year = favorite.released?.getUTCFullYear();
  if (year === undefined) {
    return filters.yearFrom === undefined && filters.yearTo === undefined;
  }

  return (
    (filters.yearFrom === undefined || year >= filters.yearFrom) &&
    (filters.yearTo === undefined || year <= filters.yearTo)
  );
}

function createToken(userId: string, expirationOffset = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeSegment({ alg: 'RS256', typ: 'JWT' });
  const payload = encodeSegment({
    sub: userId,
    ver: 1,
    iat: now - 60,
    exp: now + expirationOffset,
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
