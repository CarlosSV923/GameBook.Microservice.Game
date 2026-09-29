import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  type CreateFavoriteUseCase,
} from '../ports/favorite-use-cases.ts';
import { Favorite, type NewFavorite } from '../../domain/favorites/favorite.ts';
import type { FavoriteRepository } from '../../domain/favorites/favorite-repository.ts';

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
