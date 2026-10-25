import type { FavoriteRepository } from '../../../domain/favorites/favorite-repository.ts';
import {
  Favorite,
  type FavoritePersistence,
} from '../../../domain/favorites/favorite.ts';
import type { FavoritePlatformPersistence } from '../../../domain/favorites/favorite-platform.ts';
import { FavoriteAlreadyExistsError } from '../../../application/errors/favorite-errors.ts';
import type { Prisma, PrismaClient } from './generated/client.ts';

type FavoriteWithPlatforms = Prisma.FavoriteGetPayload<{
  include: { platforms: true };
}>;

export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdentity(
    userId: string,
    igdbId: number,
  ): Promise<Favorite | null> {
    const record = await this.prisma.favorite.findUnique({
      where: { userId_igdbId: { userId, igdbId } },
      include: { platforms: { orderBy: { platformId: 'asc' } } },
    });

    return record ? toDomain(record) : null;
  }

  async create(favorite: Favorite): Promise<void> {
    const persistence = favorite.toPersistence();
    const platformData = persistence.platforms.map((platform) => ({
      platformId: platform.id,
      name: platform.name,
    }));

    try {
      await this.prisma.favorite.create({
        data: {
          userId: persistence.userId,
          igdbId: persistence.igdbId,
          name: persistence.name,
          released: persistence.released,
          imageUrl: persistence.imageUrl,
          rating: persistence.rating,
          platforms: { create: platformData },
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new FavoriteAlreadyExistsError();
      }

      throw error;
    }
  }

  async save(favorite: Favorite): Promise<void> {
    const persistence = favorite.toPersistence();

    await this.prisma.favorite.update({
      where: {
        userId_igdbId: {
          userId: persistence.userId,
          igdbId: persistence.igdbId,
        },
      },
      data: {
        name: persistence.name,
        released: persistence.released,
        imageUrl: persistence.imageUrl,
        rating: persistence.rating,
        platforms: {
          deleteMany: {},
          create: persistence.platforms.map((platform) => ({
            platformId: platform.id,
            name: platform.name,
          })),
        },
      },
    });
  }

  async delete(userId: string, igdbId: number): Promise<boolean> {
    const result = await this.prisma.favorite.deleteMany({
      where: { userId, igdbId },
    });

    return result.count === 1;
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function toDomain(record: FavoriteWithPlatforms): Favorite {
  const persistence: FavoritePersistence = {
    userId: record.userId,
    igdbId: record.igdbId,
    name: record.name,
    released: record.released,
    imageUrl: record.imageUrl,
    rating: record.rating === null ? null : Number(record.rating),
    platforms: record.platforms.map(
      (platform): FavoritePlatformPersistence => ({
        id: platform.platformId,
        name: platform.name,
      }),
    ),
  };

  return Favorite.rehydrate(persistence);
}
