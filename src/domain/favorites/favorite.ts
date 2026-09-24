import { DomainValidationError } from '../shared/domain-validation-error.js';
import {
  FavoritePlatform,
  type FavoritePlatformInput,
  type FavoritePlatformPersistence,
} from './favorite-platform.js';

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_FAVORITE_NAME_LENGTH = 200;

export interface FavoriteSnapshotInput {
  readonly name: string;
  readonly released: Date | null;
  readonly imageUrl: string | null;
  readonly rating: number | null;
  readonly platforms: readonly FavoritePlatformInput[];
}

export interface FavoriteSnapshotUpdate extends Partial<FavoriteSnapshotInput> {}

export interface NewFavorite extends FavoriteSnapshotInput {
  readonly userId: string;
  readonly igdbId: number;
}

export interface FavoritePersistence extends FavoriteSnapshotInput {
  readonly userId: string;
  readonly igdbId: number;
  readonly platforms: readonly FavoritePlatformPersistence[];
}

interface FavoriteState {
  userId: string;
  igdbId: number;
  name: string;
  released: Date | null;
  imageUrl: string | null;
  rating: number | null;
  platforms: FavoritePlatform[];
}

export class Favorite {
  private constructor(private state: FavoriteState) {}

  static create(input: NewFavorite): Favorite {
    Favorite.assertValidUserId(input.userId);
    Favorite.assertValidIgdbId(input.igdbId);

    return new Favorite({
      userId: input.userId,
      igdbId: input.igdbId,
      ...Favorite.normalizeSnapshot(input),
    });
  }

  static rehydrate(input: FavoritePersistence): Favorite {
    return Favorite.create({
      ...input,
      platforms: input.platforms,
    });
  }

  get userId(): string {
    return this.state.userId;
  }

  get igdbId(): number {
    return this.state.igdbId;
  }

  get name(): string {
    return this.state.name;
  }

  get released(): Date | null {
    return this.state.released ? new Date(this.state.released) : null;
  }

  get imageUrl(): string | null {
    return this.state.imageUrl;
  }

  get rating(): number | null {
    return this.state.rating;
  }

  get platforms(): readonly FavoritePlatform[] {
    return [...this.state.platforms];
  }

  updateSnapshot(update: FavoriteSnapshotUpdate): void {
    if (Object.keys(update).length === 0) {
      throw new DomainValidationError(
        'FAVORITE_SNAPSHOT_EMPTY',
        'The favorite snapshot must contain at least one field.',
      );
    }

    const nextSnapshot: FavoriteSnapshotInput = {
      name: update.name ?? this.state.name,
      released:
        update.released === undefined ? this.state.released : update.released,
      imageUrl:
        update.imageUrl === undefined ? this.state.imageUrl : update.imageUrl,
      rating: update.rating === undefined ? this.state.rating : update.rating,
      platforms:
        update.platforms === undefined
          ? this.state.platforms.map((platform) => platform.toPersistence())
          : update.platforms,
    };

    Object.assign(this.state, Favorite.normalizeSnapshot(nextSnapshot));
  }

  toPersistence(): FavoritePersistence {
    return {
      userId: this.state.userId,
      igdbId: this.state.igdbId,
      name: this.state.name,
      released: this.released,
      imageUrl: this.state.imageUrl,
      rating: this.state.rating,
      platforms: this.state.platforms.map((platform) =>
        platform.toPersistence(),
      ),
    };
  }

  private static normalizeSnapshot(
    input: FavoriteSnapshotInput,
  ): Omit<FavoriteState, 'userId' | 'igdbId'> {
    const name = input.name.trim();

    if (name.length === 0 || name.length > MAX_FAVORITE_NAME_LENGTH) {
      throw new DomainValidationError(
        'FAVORITE_NAME_INVALID',
        'The favorite name is invalid.',
      );
    }

    const released = Favorite.normalizeReleased(input.released);
    const imageUrl = Favorite.normalizeImageUrl(input.imageUrl);
    const rating = Favorite.normalizeRating(input.rating);
    const platforms = input.platforms.map((platform) =>
      FavoritePlatform.create(platform),
    );

    if (
      new Set(platforms.map((platform) => platform.id)).size !==
      platforms.length
    ) {
      throw new DomainValidationError(
        'PLATFORM_DUPLICATE',
        'A favorite cannot contain the same platform more than once.',
      );
    }

    return { name, released, imageUrl, rating, platforms };
  }

  private static normalizeReleased(released: Date | null): Date | null {
    if (released === null) {
      return null;
    }

    if (!(released instanceof Date) || Number.isNaN(released.getTime())) {
      throw new DomainValidationError(
        'RELEASE_DATE_INVALID',
        'The release date is invalid.',
      );
    }

    return new Date(released);
  }

  private static normalizeImageUrl(imageUrl: string | null): string | null {
    if (imageUrl === null) {
      return null;
    }

    try {
      const url = new URL(imageUrl);

      if (url.protocol !== 'https:') {
        throw new Error('The image URL must use HTTPS.');
      }
    } catch {
      throw new DomainValidationError(
        'IMAGE_URL_INVALID',
        'The image URL is invalid.',
      );
    }

    return imageUrl;
  }

  private static normalizeRating(rating: number | null): number | null {
    if (
      rating !== null &&
      (!Number.isFinite(rating) || rating < 0 || rating > 100)
    ) {
      throw new DomainValidationError(
        'RATING_INVALID',
        'The rating must be between 0 and 100.',
      );
    }

    return rating;
  }

  private static assertValidUserId(userId: string): void {
    if (!USER_ID_PATTERN.test(userId)) {
      throw new DomainValidationError(
        'USER_ID_INVALID',
        'The user ID is invalid.',
      );
    }
  }

  private static assertValidIgdbId(igdbId: number): void {
    if (!Number.isSafeInteger(igdbId) || igdbId < 1) {
      throw new DomainValidationError(
        'IGDB_ID_INVALID',
        'The IGDB ID is invalid.',
      );
    }
  }
}
