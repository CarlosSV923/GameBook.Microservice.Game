import {
  type DeleteFavoriteInput,
  type DeleteFavoriteUseCase,
} from '../ports/favorite-use-cases.ts';
import { FavoriteNotFoundError } from '../errors/favorite-errors.ts';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.ts';

export class DeleteFavoriteService implements DeleteFavoriteUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(input: DeleteFavoriteInput): Promise<void> {
    const deleted = await this.favoriteRepository.delete(
      input.userId,
      input.igdbId,
    );

    if (!deleted) {
      throw new FavoriteNotFoundError();
    }
  }
}
