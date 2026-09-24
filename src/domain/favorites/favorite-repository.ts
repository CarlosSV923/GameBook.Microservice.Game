import { Favorite } from './favorite.js';

export interface FavoriteListFilters {
  readonly name?: string;
  readonly platformId?: number;
  readonly yearFrom?: number;
  readonly yearTo?: number;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface FavoritePage {
  readonly items: readonly Favorite[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasNext: boolean;
}

export interface FavoriteSuggestionQuery {
  readonly type: 'name' | 'platform';
  readonly query: string;
  readonly limit?: number;
}

export interface NameSuggestion {
  readonly type: 'name';
  readonly value: string;
}

export interface PlatformSuggestion {
  readonly type: 'platform';
  readonly value: string;
  readonly platformId: number;
}

export type FavoriteSuggestion = NameSuggestion | PlatformSuggestion;

export interface FavoriteRepository {
  findByIdentity(userId: string, igdbId: number): Promise<Favorite | null>;
  save(favorite: Favorite): Promise<void>;
  list(userId: string, filters: FavoriteListFilters): Promise<FavoritePage>;
  suggest(
    userId: string,
    query: FavoriteSuggestionQuery,
  ): Promise<readonly FavoriteSuggestion[]>;
  delete(userId: string, igdbId: number): Promise<boolean>;
}
