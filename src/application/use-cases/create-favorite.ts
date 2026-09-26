import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type CreateFavoriteUseCase,
} from '../ports/favorite-use-cases.js';
import { Favorite, type NewFavorite } from '../../domain/favorites/favorite.js';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.js';

@Injectable()
export class CreateFavoriteService implements CreateFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async execute(input: NewFavorite): Promise<Favorite> {
    const favorite = Favorite.create(input);
    await this.favoriteRepository.save(favorite);
    return favorite;
  }
}
