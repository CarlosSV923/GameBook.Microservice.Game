import {
  Favorite,
  type FavoriteSnapshotUpdate,
  type NewFavorite,
} from '../../domain/favorites/favorite.js';
import {
  type FavoriteListFilters,
  type FavoritePage,
  type FavoriteRepository,
  type FavoriteSuggestion,
  type FavoriteSuggestionQuery,
} from '../../domain/favorites/favorite-repository.js';

export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');

export interface CreateFavoriteUseCase {
  execute(input: NewFavorite): Promise<Favorite>;
}

export interface ListFavoritesInput extends FavoriteListFilters {
  readonly userId: string;
}

export interface ListFavoritesUseCase {
  execute(input: ListFavoritesInput): Promise<FavoritePage>;
}

export interface SuggestFavoritesInput extends FavoriteSuggestionQuery {
  readonly userId: string;
}

export interface SuggestFavoritesUseCase {
  execute(input: SuggestFavoritesInput): Promise<readonly FavoriteSuggestion[]>;
}

export interface UpdateFavoriteSnapshotInput {
  readonly userId: string;
  readonly igdbId: number;
  readonly snapshot: FavoriteSnapshotUpdate;
}

export interface UpdateFavoriteSnapshotUseCase {
  execute(input: UpdateFavoriteSnapshotInput): Promise<Favorite>;
}

export interface DeleteFavoriteInput {
  readonly userId: string;
  readonly igdbId: number;
}

export interface DeleteFavoriteUseCase {
  execute(input: DeleteFavoriteInput): Promise<void>;
}

export type FavoriteUseCaseDependencies = {
  readonly favoriteRepository: FavoriteRepository;
};
