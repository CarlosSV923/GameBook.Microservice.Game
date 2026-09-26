import type {
  FavoriteListFilters,
  FavoritePage,
  FavoriteRepository,
  FavoriteSuggestion,
  FavoriteSuggestionQuery,
} from '../../../domain/favorites/favorite-repository.js';
import {
  Favorite,
  type FavoriteSnapshotUpdate,
  type FavoritePersistence,
} from '../../../domain/favorites/favorite.js';
import type { FavoritePlatformPersistence } from '../../../domain/favorites/favorite-platform.js';
import { FavoriteAlreadyExistsError } from '../../../application/errors/favorite-errors.js';
import type { Prisma, PrismaClient } from './generated/client.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 1000;
const DEFAULT_SUGGESTION_LIMIT = 10;
const MAX_SUGGESTION_LIMIT = 20;

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

  async save(favorite: Favorite): Promise<void> {
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

  async list(
    userId: string,
    filters: FavoriteListFilters,
  ): Promise<FavoritePage> {
    const page = normalizePositiveInteger(filters.page, DEFAULT_PAGE);
    const pageSize = Math.min(
      normalizePositiveInteger(filters.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const where = buildListWhere(userId, filters);

    const [total, records] = await Promise.all([
      this.prisma.favorite.count({ where }),
      this.prisma.favorite.findMany({
        where,
        include: { platforms: { orderBy: { platformId: 'asc' } } },
        orderBy: [{ name: 'asc' }, { igdbId: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: records.map(toDomain),
      page,
      pageSize,
      total,
      hasNext: page * pageSize < total,
    };
  }

  async suggest(
    userId: string,
    query: FavoriteSuggestionQuery,
  ): Promise<readonly FavoriteSuggestion[]> {
    const limit = Math.min(
      normalizePositiveInteger(query.limit, DEFAULT_SUGGESTION_LIMIT),
      MAX_SUGGESTION_LIMIT,
    );
    const name = { contains: query.query.trim(), mode: 'insensitive' as const };

    if (query.type === 'name') {
      const records = await this.prisma.favorite.findMany({
        where: { userId, name },
        orderBy: [{ name: 'asc' }, { igdbId: 'asc' }],
        distinct: ['name'],
        take: limit,
      });

      return records.map((record) => ({
        type: 'name' as const,
        value: record.name,
      }));
    }

    const records = await this.prisma.favoritePlatform.findMany({
      where: { userId, name },
      orderBy: [{ name: 'asc' }, { platformId: 'asc' }],
      distinct: ['platformId'],
      take: limit,
    });

    return records.map((record) => ({
      type: 'platform' as const,
      value: record.name,
      platformId: record.platformId,
    }));
  }

  async updateSnapshot(
    userId: string,
    igdbId: number,
    update: FavoriteSnapshotUpdate,
  ): Promise<Favorite | null> {
    const record = await this.prisma.favorite.findUnique({
      where: { userId_igdbId: { userId, igdbId } },
      include: { platforms: { orderBy: { platformId: 'asc' } } },
    });

    if (!record) {
      return null;
    }

    const favorite = toDomain(record);
    favorite.updateSnapshot(update);
    const persistence = favorite.toPersistence();

    await this.prisma.favorite.update({
      where: { userId_igdbId: { userId, igdbId } },
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

    return favorite;
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

function buildListWhere(
  userId: string,
  filters: FavoriteListFilters,
): Prisma.FavoriteWhereInput {
  const where: Prisma.FavoriteWhereInput = { userId };

  if (filters.name !== undefined) {
    where.name = {
      contains: filters.name.trim(),
      mode: 'insensitive',
    };
  }

  if (filters.platformId !== undefined) {
    where.platforms = { some: { platformId: filters.platformId } };
  }

  const released = buildReleasedFilter(filters);

  if (released) {
    where.released = released;
  }

  return where;
}

function buildReleasedFilter(
  filters: FavoriteListFilters,
): Prisma.DateTimeNullableFilter | undefined {
  const released: Prisma.DateTimeNullableFilter = {};

  if (filters.yearFrom !== undefined) {
    released.gte = startOfYearUtc(filters.yearFrom);
  }

  if (filters.yearTo !== undefined) {
    released.lt = startOfYearUtc(filters.yearTo + 1);
  }

  return Object.keys(released).length > 0 ? released : undefined;
}

function startOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (!Number.isFinite(value) || value === undefined || value < 1) {
    return fallback;
  }

  return Math.floor(value);
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
