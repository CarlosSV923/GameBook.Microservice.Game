import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type SuggestFavoritesInput,
  type SuggestFavoritesUseCase,
} from '../ports/favorite-use-cases.ts';
import type {
  FavoriteRepository,
  FavoriteSuggestion,
} from '../../domain/favorites/favorite-repository.ts';

@Injectable()
export class SuggestFavoritesService implements SuggestFavoritesUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  execute(
    input: SuggestFavoritesInput,
  ): Promise<readonly FavoriteSuggestion[]> {
    const { userId, ...query } = input;
    return this.favoriteRepository.suggest(userId, query);
  }
}
