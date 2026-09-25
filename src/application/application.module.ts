import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.js';
import { CreateFavoriteService } from './use-cases/create-favorite.js';
import { DeleteFavoriteService } from './use-cases/delete-favorite.js';
import { ListFavoritesService } from './use-cases/list-favorites.js';
import { SuggestFavoritesService } from './use-cases/suggest-favorites.js';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateFavoriteService,
    DeleteFavoriteService,
    ListFavoritesService,
    SuggestFavoritesService,
  ],
  exports: [
    CreateFavoriteService,
    DeleteFavoriteService,
    ListFavoritesService,
    SuggestFavoritesService,
  ],
})
export class ApplicationModule {}
