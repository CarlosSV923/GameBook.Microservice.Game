import {
  type SuggestFavoritesInput,
  type SuggestFavoritesUseCase,
} from '../ports/favorite-use-cases.ts';
import type {
  FavoriteRepository,
  FavoriteSuggestion,
} from '../../domain/favorites/favorite-repository.ts';

export class SuggestFavoritesService implements SuggestFavoritesUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  execute(
    input: SuggestFavoritesInput,
  ): Promise<readonly FavoriteSuggestion[]> {
    const { userId, ...query } = input;
    return this.favoriteRepository.suggest(userId, query);
  }
}
