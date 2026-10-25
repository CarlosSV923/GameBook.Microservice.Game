import {
  type SuggestFavoritesInput,
  type SuggestFavoritesUseCase,
} from '../ports/favorite-use-cases.ts';
import type {
  FavoriteReadModel,
  FavoriteSuggestion,
} from '../ports/favorite-read-model.ts';

export class SuggestFavoritesService implements SuggestFavoritesUseCase {
  constructor(private readonly favoriteReadModel: FavoriteReadModel) {}

  execute(
    input: SuggestFavoritesInput,
  ): Promise<readonly FavoriteSuggestion[]> {
    const { userId, ...query } = input;
    return this.favoriteReadModel.suggest(userId, query);
  }
}
