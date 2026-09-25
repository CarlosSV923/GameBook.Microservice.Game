import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type DeleteFavoriteInput,
  type DeleteFavoriteUseCase,
} from '../ports/favorite-use-cases.js';
import { FavoriteNotFoundError } from '../errors/favorite-errors.js';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.js';

@Injectable()
export class DeleteFavoriteService implements DeleteFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

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
