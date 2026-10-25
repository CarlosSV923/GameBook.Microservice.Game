import type { PrismaClient } from '../../../../src/infrastructure/persistence/prisma/generated/client.ts';
import { Favorite } from '../../../../src/domain/favorites/favorite.ts';
import { PrismaFavoriteReadModel } from '../../../../src/infrastructure/persistence/prisma/prisma-favorite-read-model.ts';

describe('PrismaFavoriteReadModel', () => {
  const favoriteDelegate = {
    count: vi.fn(),
    findMany: vi.fn(),
  };
  const platformDelegate = { findMany: vi.fn() };
  const prisma = {
    favorite: favoriteDelegate,
    favoritePlatform: platformDelegate,
  } as unknown as PrismaClient;
  const readModel = new PrismaFavoriteReadModel(prisma);
  const favorite = Favorite.create({
    userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    igdbId: 3498,
    name: 'Grand Example',
    released: new Date('2013-09-17T00:00:00.000Z'),
    imageUrl: 'https://media.example.test/games/3498.jpg',
    rating: 94.5,
    platforms: [{ id: 6, name: 'PC' }],
  });

  beforeEach(() => vi.clearAllMocks());

  it('combines filters, uses an inclusive year range, stable ordering, and bounded pagination', async () => {
    favoriteDelegate.count.mockResolvedValue(21);
    favoriteDelegate.findMany.mockResolvedValue([]);

    await expect(
      readModel.list(favorite.userId, {
        name: '  grand ',
        platformId: 6,
        yearFrom: 2013,
        yearTo: 2020,
        page: 2,
        pageSize: 5000,
      }),
    ).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 1000,
      total: 21,
      hasNext: false,
    });

    const expectedWhere = {
      userId: favorite.userId,
      name: { contains: 'grand', mode: 'insensitive' },
      platforms: { some: { platformId: 6 } },
      released: {
        gte: new Date('2013-01-01T00:00:00.000Z'),
        lt: new Date('2021-01-01T00:00:00.000Z'),
      },
    };
    expect(favoriteDelegate.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
    expect(favoriteDelegate.findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      include: { platforms: { orderBy: { platformId: 'asc' } } },
      orderBy: [{ name: 'asc' }, { igdbId: 'asc' }],
      skip: 1000,
      take: 1000,
    });
  });

  it('does not add an empty release condition when no year filter is provided', async () => {
    favoriteDelegate.count.mockResolvedValue(0);
    favoriteDelegate.findMany.mockResolvedValue([]);

    await readModel.list(favorite.userId, {});

    expect(favoriteDelegate.count).toHaveBeenCalledWith({
      where: { userId: favorite.userId },
    });
  });

  it('suggests names and platforms only from the requested user with bounded limits', async () => {
    favoriteDelegate.findMany.mockResolvedValue([
      { name: 'Grand Example' },
      { name: 'Grand Example 2' },
    ]);
    platformDelegate.findMany.mockResolvedValue([
      { name: 'PC', platformId: 6 },
    ]);

    await expect(
      readModel.suggest(favorite.userId, {
        type: 'name',
        query: ' grand ',
        limit: 100,
      }),
    ).resolves.toEqual([
      { type: 'name', value: 'Grand Example' },
      { type: 'name', value: 'Grand Example 2' },
    ]);
    await expect(
      readModel.suggest(favorite.userId, {
        type: 'platform',
        query: ' pc ',
        limit: 100,
      }),
    ).resolves.toEqual([{ type: 'platform', value: 'PC', platformId: 6 }]);

    expect(favoriteDelegate.findMany).toHaveBeenCalledWith({
      where: {
        userId: favorite.userId,
        name: { contains: 'grand', mode: 'insensitive' },
      },
      orderBy: [{ name: 'asc' }, { igdbId: 'asc' }],
      distinct: ['name'],
      take: 20,
    });
    expect(platformDelegate.findMany).toHaveBeenCalledWith({
      where: {
        userId: favorite.userId,
        name: { contains: 'pc', mode: 'insensitive' },
      },
      orderBy: [{ name: 'asc' }, { platformId: 'asc' }],
      distinct: ['platformId'],
      take: 20,
    });
  });
});
