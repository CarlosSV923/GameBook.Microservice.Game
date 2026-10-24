import {
  type ListFavoritesInput,
  type ListFavoritesUseCase,
} from '../ports/favorite-use-cases.ts';
import { FavoriteYearRangeInvalidError } from '../errors/favorite-errors.ts';
import type {
  FavoritePage,
  FavoriteRepository,
} from '../../domain/favorites/favorite-repository.ts';

export class ListFavoritesService implements ListFavoritesUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

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
