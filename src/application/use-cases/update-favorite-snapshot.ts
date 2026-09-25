import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type UpdateFavoriteSnapshotInput,
  type UpdateFavoriteSnapshotUseCase,
} from '../ports/favorite-use-cases.js';
import { FavoriteNotFoundError } from '../errors/favorite-errors.js';
import type { Favorite } from '../../domain/favorites/favorite.js';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.js';

@Injectable()
export class UpdateFavoriteSnapshotService implements UpdateFavoriteSnapshotUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async execute(input: UpdateFavoriteSnapshotInput): Promise<Favorite> {
    const favorite = await this.favoriteRepository.updateSnapshot(
      input.userId,
      input.igdbId,
      input.snapshot,
    );

    if (!favorite) {
      throw new FavoriteNotFoundError();
    }

    return favorite;
  }
}
