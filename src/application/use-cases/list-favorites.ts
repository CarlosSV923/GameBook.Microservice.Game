import {
  type ListFavoritesInput,
  type ListFavoritesUseCase,
} from '../ports/favorite-use-cases.ts';
import { FavoriteYearRangeInvalidError } from '../errors/favorite-errors.ts';
import type {
  FavoriteReadModel,
  FavoritePage,
} from '../ports/favorite-read-model.ts';

export class ListFavoritesService implements ListFavoritesUseCase {
  constructor(private readonly favoriteReadModel: FavoriteReadModel) {}

  async execute(input: ListFavoritesInput): Promise<FavoritePage> {
    if (
      input.yearFrom !== undefined &&
      input.yearTo !== undefined &&
      input.yearFrom > input.yearTo
    ) {
      throw new FavoriteYearRangeInvalidError();
    }

    const { userId, ...filters } = input;
    return this.favoriteReadModel.list(userId, filters);
  }
}
