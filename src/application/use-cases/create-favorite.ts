import { type CreateFavoriteUseCase } from '../ports/favorite-use-cases.ts';
import { Favorite, type NewFavorite } from '../../domain/favorites/favorite.ts';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.ts';

export class CreateFavoriteService implements CreateFavoriteUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(input: NewFavorite): Promise<Favorite> {
    const favorite = Favorite.create(input);
    await this.favoriteRepository.create(favorite);
    return favorite;
  }
}
