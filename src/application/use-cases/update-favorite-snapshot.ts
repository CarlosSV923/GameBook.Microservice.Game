import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type UpdateFavoriteSnapshotInput,
  type UpdateFavoriteSnapshotUseCase,
} from '../ports/favorite-use-cases.ts';
import { FavoriteNotFoundError } from '../errors/favorite-errors.ts';
import type { Favorite } from '../../domain/favorites/favorite.ts';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.ts';

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
