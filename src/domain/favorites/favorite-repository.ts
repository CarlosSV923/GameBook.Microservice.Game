import { Favorite } from './favorite.ts';

export interface FavoriteRepository {
  findByIdentity(userId: string, igdbId: number): Promise<Favorite | null>;
  create(favorite: Favorite): Promise<void>;
  save(favorite: Favorite): Promise<void>;
  delete(userId: string, igdbId: number): Promise<boolean>;
}
