import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type ListFavoritesInput,
  type ListFavoritesUseCase,
} from '../ports/favorite-use-cases.js';
import { FavoriteYearRangeInvalidError } from '../errors/favorite-errors.js';
import type {
  FavoritePage,
  FavoriteRepository,
} from '../../domain/favorites/favorite-repository.js';

@Injectable()
export class ListFavoritesService implements ListFavoritesUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async execute(input: ListFavoritesInput): Promise<FavoritePage> {
    if (
      input.yearFrom !== undefined &&
      input.yearTo !== undefined &&
      input.yearFrom > input.yearTo
    ) {
      throw new FavoriteYearRangeInvalidError();
    }

    const { userId, ...filters } = input;
    return this.favoriteRepository.list(userId, filters);
  }
}
