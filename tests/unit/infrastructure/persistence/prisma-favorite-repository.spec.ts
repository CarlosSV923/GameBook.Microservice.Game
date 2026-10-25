import type { PrismaClient } from '../../../../src/infrastructure/persistence/prisma/generated/client.ts';
import { Favorite } from '../../../../src/domain/favorites/favorite.ts';
import { FavoriteAlreadyExistsError } from '../../../../src/application/errors/favorite-errors.ts';
import { PrismaFavoriteRepository } from '../../../../src/infrastructure/persistence/prisma/prisma-favorite-repository.ts';

describe('PrismaFavoriteRepository', () => {
  const favoriteDelegate = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
  const prisma = {
    favorite: favoriteDelegate,
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
    await repository.create(favorite);

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
      repository.save(
        Favorite.rehydrate({
          ...favorite.toPersistence(),
          name: 'Updated Game',
          rating: null,
          platforms: [{ id: 130, name: 'Nintendo Switch' }],
        }),
      ),
    ).resolves.toBeUndefined();
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

  it('maps a database uniqueness race to the duplicate error', async () => {
    favoriteDelegate.create.mockRejectedValue({ code: 'P2002' });

    await expect(repository.create(favorite)).rejects.toBeInstanceOf(
      FavoriteAlreadyExistsError,
    );
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
