import {
  type UpdateFavoriteSnapshotInput,
  type UpdateFavoriteSnapshotUseCase,
} from '../ports/favorite-use-cases.ts';
import { FavoriteNotFoundError } from '../errors/favorite-errors.ts';
import type { Favorite } from '../../domain/favorites/favorite.ts';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.ts';

export class UpdateFavoriteSnapshotService implements UpdateFavoriteSnapshotUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(input: UpdateFavoriteSnapshotInput): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findByIdentity(
      input.userId,
      input.igdbId,
    );

    if (!favorite) {
      throw new FavoriteNotFoundError();
    }

    favorite.updateSnapshot(input.snapshot);
    await this.favoriteRepository.save(favorite);
    return favorite;
  }
}
