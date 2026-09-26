import type { PrismaClient } from '../../../../src/infrastructure/persistence/prisma/generated/client.js';
import { Favorite } from '../../../../src/domain/favorites/favorite.js';
import { FavoriteAlreadyExistsError } from '../../../../src/application/errors/favorite-errors.js';
import { PrismaFavoriteRepository } from '../../../../src/infrastructure/persistence/prisma/prisma-favorite-repository.js';

describe('PrismaFavoriteRepository', () => {
  const favoriteDelegate = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  };
  const platformDelegate = { findMany: vi.fn() };
  const prisma = {
    favorite: favoriteDelegate,
    favoritePlatform: platformDelegate,
  } as unknown as PrismaClient;
  const repository = new PrismaFavoriteRepository(prisma);
  const favorite = Favorite.create({
    userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
    igdbId: 3498,
    name: 'Grand Example',
    released: new Date('2013-09-17T00:00:00.000Z'),
    imageUrl: 'https://media.example.test/games/3498.jpg',
    rating: 94.5,
    platforms: [
      { id: 6, name: 'PC' },
      { id: 48, name: 'PlayStation 4' },
    ],
  });

  beforeEach(() => vi.clearAllMocks());

  it('loads one favorite with only its own platforms and maps decimal ratings', async () => {
    favoriteDelegate.findUnique.mockResolvedValue({
      userId: favorite.userId,
      igdbId: favorite.igdbId,
      name: favorite.name,
      released: favorite.released,
      imageUrl: favorite.imageUrl,
      rating: { toString: () => '94.5' },
      platforms: [
        {
          userId: favorite.userId,
          igdbId: favorite.igdbId,
          platformId: 6,
          name: 'PC',
        },
      ],
    });

    await expect(
      repository.findByIdentity(favorite.userId, favorite.igdbId),
    ).resolves.toEqual(
      Favorite.rehydrate({
        ...favorite.toPersistence(),
        platforms: [{ id: 6, name: 'PC' }],
      }),
    );
    expect(favoriteDelegate.findUnique).toHaveBeenCalledWith({
      where: {
        userId_igdbId: { userId: favorite.userId, igdbId: favorite.igdbId },
      },
      include: { platforms: { orderBy: { platformId: 'asc' } } },
    });
  });

  it('creates the snapshot and its platforms in one Prisma operation', async () => {
    await repository.save(favorite);

    expect(favoriteDelegate.create).toHaveBeenCalledWith({
      data: {
        userId: favorite.userId,
        igdbId: favorite.igdbId,
        name: favorite.name,
        released: favorite.released,
        imageUrl: favorite.imageUrl,
        rating: favorite.rating,
        platforms: {
          create: [
            { platformId: 6, name: 'PC' },
            { platformId: 48, name: 'PlayStation 4' },
          ],
        },
      },
    });
  });

  it('updates an existing own snapshot and replaces its platforms atomically', async () => {
    favoriteDelegate.findUnique.mockResolvedValue({
      userId: favorite.userId,
      igdbId: favorite.igdbId,
      name: favorite.name,
      released: favorite.released,
      imageUrl: favorite.imageUrl,
      rating: { toString: () => '94.5' },
      platforms: [
        { platformId: 6, name: 'PC' },
        { platformId: 48, name: 'PlayStation 4' },
      ],
    });

    await expect(
      repository.updateSnapshot(favorite.userId, favorite.igdbId, {
        name: 'Updated Game',
        rating: null,
        platforms: [{ id: 130, name: 'Nintendo Switch' }],
      }),
    ).resolves.toEqual(
      Favorite.rehydrate({
        ...favorite.toPersistence(),
        name: 'Updated Game',
        rating: null,
        platforms: [{ id: 130, name: 'Nintendo Switch' }],
      }),
    );
    expect(favoriteDelegate.update).toHaveBeenCalledWith({
      where: {
        userId_igdbId: { userId: favorite.userId, igdbId: favorite.igdbId },
      },
      data: {
        name: 'Updated Game',
        released: favorite.released,
        imageUrl: favorite.imageUrl,
        rating: null,
        platforms: {
          deleteMany: {},
          create: [{ platformId: 130, name: 'Nintendo Switch' }],
        },
      },
    });
  });

  it('does not update a favorite owned by another user', async () => {
    favoriteDelegate.findUnique.mockResolvedValue(null);

    await expect(
      repository.updateSnapshot(favorite.userId, favorite.igdbId, {
        name: 'Updated Game',
      }),
    ).resolves.toBeNull();
    expect(favoriteDelegate.update).not.toHaveBeenCalled();
  });

  it('rejects an empty snapshot without writing to Prisma', async () => {
    favoriteDelegate.findUnique.mockResolvedValue({
      userId: favorite.userId,
      igdbId: favorite.igdbId,
      name: favorite.name,
      released: favorite.released,
      imageUrl: favorite.imageUrl,
      rating: { toString: () => '94.5' },
      platforms: [],
    });

    await expect(
      repository.updateSnapshot(favorite.userId, favorite.igdbId, {}),
    ).rejects.toMatchObject({ code: 'FAVORITE_SNAPSHOT_EMPTY' });
    expect(favoriteDelegate.update).not.toHaveBeenCalled();
  });

  it('maps a database uniqueness race to the duplicate error', async () => {
    favoriteDelegate.create.mockRejectedValue({ code: 'P2002' });

    await expect(repository.save(favorite)).rejects.toBeInstanceOf(
      FavoriteAlreadyExistsError,
    );
  });

  it('combines filters, uses an inclusive year range, stable ordering, and bounded pagination', async () => {
    favoriteDelegate.count.mockResolvedValue(21);
    favoriteDelegate.findMany.mockResolvedValue([]);

    await expect(
      repository.list(favorite.userId, {
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

    await repository.list(favorite.userId, {});

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
      repository.suggest(favorite.userId, {
        type: 'name',
        query: ' grand ',
        limit: 100,
      }),
    ).resolves.toEqual([
      { type: 'name', value: 'Grand Example' },
      { type: 'name', value: 'Grand Example 2' },
    ]);
    await expect(
      repository.suggest(favorite.userId, {
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

  it('returns whether deleting the own favorite affected a row', async () => {
    favoriteDelegate.deleteMany.mockResolvedValue({ count: 1 });

    await expect(
      repository.delete(favorite.userId, favorite.igdbId),
    ).resolves.toBe(true);
    expect(favoriteDelegate.deleteMany).toHaveBeenCalledWith({
      where: { userId: favorite.userId, igdbId: favorite.igdbId },
    });
  });
});
