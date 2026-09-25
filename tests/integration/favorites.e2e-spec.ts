import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ApiExceptionFilter } from '../../src/api/http/api-exception.filter.js';
import { createValidationPipe } from '../../src/api/http/validation-pipe.js';
import { RequestIdMiddleware } from '../../src/api/http/request-id.js';
import { JwtAuthGuard } from '../../src/api/auth/jwt-auth-guard.js';
import { FavoritesController } from '../../src/api/favorites/favorites.controller.js';
import { CreateFavoriteService } from '../../src/application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from '../../src/application/use-cases/delete-favorite.js';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
} from '../../src/application/errors/favorite-errors.js';
import { Favorite } from '../../src/domain/favorites/favorite.js';

const userId = '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa';
describe('Favorites HTTP API', () => {
  let app: INestApplication;
  const createFavorite = { execute: vi.fn() };
  const deleteFavorite = { execute: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: CreateFavoriteService, useValue: createFavorite },
        { provide: DeleteFavoriteService, useValue: deleteFavorite },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = { userId, claims: {} };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    const requestIdMiddleware = new RequestIdMiddleware();
    app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a favorite using the authenticated subject, never a body user ID', async () => {
    const favorite = Favorite.create({
      userId,
      igdbId: 3498,
      name: 'Example Game',
      released: new Date('2013-09-17T00:00:00.000Z'),
      imageUrl: null,
      rating: null,
      platforms: [],
    });
    createFavorite.execute.mockResolvedValue(favorite);

    await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('x-request-id', 'req_create_favorite')
      .send({
        igdbId: 3498,
        name: 'Example Game',
      })
      .expect(201)
      .expect('x-request-id', 'req_create_favorite')
      .expect({
        igdbId: 3498,
        name: 'Example Game',
        released: '2013-09-17',
        imageUrl: null,
        rating: null,
        platforms: [],
      });

    expect(createFavorite.execute).toHaveBeenCalledWith({
      userId,
      igdbId: 3498,
      name: 'Example Game',
      released: null,
      imageUrl: null,
      rating: null,
      platforms: [],
    });
  });

  it('rejects a client-supplied user ID instead of using it as ownership', async () => {
    await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('x-request-id', 'req_body_user_id')
      .send({
        userId: '11111111-1111-4111-8111-111111111111',
        igdbId: 3498,
        name: 'Example Game',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'VALIDATION_ERROR',
          requestId: 'req_body_user_id',
        });
      });
    expect(createFavorite.execute).not.toHaveBeenCalled();
  });

  it('returns 409 when concurrent uniqueness reports a duplicate', async () => {
    createFavorite.execute.mockRejectedValue(new FavoriteAlreadyExistsError());

    await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('x-request-id', 'req_duplicate_favorite')
      .send({ igdbId: 3498, name: 'Example Game' })
      .expect(409)
      .expect({
        code: 'FAVORITE_ALREADY_EXISTS',
        message: 'The game is already in your favorites.',
        requestId: 'req_duplicate_favorite',
      });
  });

  it('deletes only the favorite addressed by the authenticated subject and IGDB ID', async () => {
    deleteFavorite.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/v1/favorites/3498')
      .set('x-request-id', 'req_delete_favorite')
      .expect(204)
      .expect('x-request-id', 'req_delete_favorite');

    expect(deleteFavorite.execute).toHaveBeenCalledWith({
      userId,
      igdbId: 3498,
    });
  });

  it('returns 404 when that subject does not own the requested favorite', async () => {
    deleteFavorite.execute.mockRejectedValue(new FavoriteNotFoundError());

    await request(app.getHttpServer())
      .delete('/v1/favorites/3498')
      .set('x-request-id', 'req_missing_favorite')
      .expect(404)
      .expect({
        code: 'FAVORITE_NOT_FOUND',
        message: 'Favorite not found.',
        requestId: 'req_missing_favorite',
      });
  });
});
