import { Favorite } from '../../../../src/domain/favorites/favorite.js';
import type { FavoriteRepository } from '../../../../src/domain/favorites/favorite-repository.js';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  FavoriteYearRangeInvalidError,
} from '../../../../src/application/errors/favorite-errors.js';
import { CreateFavoriteService } from '../../../../src/application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from '../../../../src/application/use-cases/delete-favorite.js';
import { ListFavoritesService } from '../../../../src/application/use-cases/list-favorites.js';
import { SuggestFavoritesService } from '../../../../src/application/use-cases/suggest-favorites.js';

const favoriteInput = {
  userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  igdbId: 3498,
  name: 'Example Game',
  released: new Date('2013-09-17T00:00:00.000Z'),
  imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/example.jpg',
  rating: 94.5,
  platforms: [{ id: 6, name: 'PC' }],
};

describe('favorite use cases', () => {
  it('creates a favorite for the authenticated subject', async () => {
    const repository = createRepository();
    const service = new CreateFavoriteService(repository);

    await expect(service.execute(favoriteInput)).resolves.toEqual(
      Favorite.create(favoriteInput),
    );
    expect(repository.save).toHaveBeenCalledWith(expect.any(Favorite));
  });

  it('preserves the duplicate error from the concurrent-safe repository', async () => {
    const repository = createRepository();
    repository.save.mockRejectedValue(new FavoriteAlreadyExistsError());
    const service = new CreateFavoriteService(repository);

    await expect(service.execute(favoriteInput)).rejects.toBeInstanceOf(
      FavoriteAlreadyExistsError,
    );
  });

  it('deletes only the authenticated subject and requested IGDB ID', async () => {
    const repository = createRepository();
    repository.delete.mockResolvedValue(true);
    const service = new DeleteFavoriteService(repository);

    await expect(
      service.execute({
        userId: favoriteInput.userId,
        igdbId: favoriteInput.igdbId,
      }),
    ).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(
      favoriteInput.userId,
      favoriteInput.igdbId,
    );
  });

  it('reports a missing own favorite without probing another user', async () => {
    const repository = createRepository();
    repository.delete.mockResolvedValue(false);
    const service = new DeleteFavoriteService(repository);

    await expect(
      service.execute({
        userId: favoriteInput.userId,
        igdbId: favoriteInput.igdbId,
      }),
    ).rejects.toBeInstanceOf(FavoriteNotFoundError);
    expect(repository.delete).toHaveBeenCalledWith(
      favoriteInput.userId,
      favoriteInput.igdbId,
    );
  });

  it('lists only the authenticated subject with the requested filters', async () => {
    const repository = createRepository();
    repository.list.mockResolvedValue({
      items: [Favorite.create(favoriteInput)],
      page: 2,
      pageSize: 20,
      total: 21,
      hasNext: false,
    });
    const service = new ListFavoritesService(repository);

    await expect(
      service.execute({
        userId: favoriteInput.userId,
        name: ' grand ',
        platformId: 6,
        yearFrom: 2013,
        yearTo: 2020,
        page: 2,
        pageSize: 20,
      }),
    ).resolves.toMatchObject({ page: 2, total: 21 });
    expect(repository.list).toHaveBeenCalledWith(favoriteInput.userId, {
      name: ' grand ',
      platformId: 6,
      yearFrom: 2013,
      yearTo: 2020,
      page: 2,
      pageSize: 20,
    });
  });

  it('rejects an inverted year range before querying the repository', async () => {
    const repository = createRepository();
    const service = new ListFavoritesService(repository);

    await expect(
      service.execute({
        userId: favoriteInput.userId,
        yearFrom: 2020,
        yearTo: 2013,
      }),
    ).rejects.toBeInstanceOf(FavoriteYearRangeInvalidError);
    expect(repository.list).not.toHaveBeenCalled();
  });

  it('suggests only the authenticated subject with the requested query', async () => {
    const repository = createRepository();
    repository.suggest.mockResolvedValue([
      { type: 'name', value: 'Grand Example' },
    ]);
    const service = new SuggestFavoritesService(repository);

    await expect(
      service.execute({
        userId: favoriteInput.userId,
        type: 'name',
        query: 'grand',
        limit: 20,
      }),
    ).resolves.toEqual([{ type: 'name', value: 'Grand Example' }]);
    expect(repository.suggest).toHaveBeenCalledWith(favoriteInput.userId, {
      type: 'name',
      query: 'grand',
      limit: 20,
    });
  });
});

function createRepository(): FavoriteRepository & {
  save: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  suggest: ReturnType<typeof vi.fn>;
} {
  return {
    findByIdentity: vi.fn(),
    save: vi.fn(),
    list: vi.fn(),
    suggest: vi.fn(),
    delete: vi.fn(),
  } as unknown as FavoriteRepository & {
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    suggest: ReturnType<typeof vi.fn>;
  };
}
