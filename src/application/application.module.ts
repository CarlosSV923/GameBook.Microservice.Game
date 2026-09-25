import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.js';
import { CreateFavoriteService } from './use-cases/create-favorite.js';
import { DeleteFavoriteService } from './use-cases/delete-favorite.js';
import { ListFavoritesService } from './use-cases/list-favorites.js';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateFavoriteService,
    DeleteFavoriteService,
    ListFavoritesService,
  ],
  exports: [CreateFavoriteService, DeleteFavoriteService, ListFavoritesService],
})
export class ApplicationModule {}
