import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.ts';
import { CreateFavoriteService } from './use-cases/create-favorite.ts';
import { DeleteFavoriteService } from './use-cases/delete-favorite.ts';
import { ListFavoritesService } from './use-cases/list-favorites.ts';
import { SuggestFavoritesService } from './use-cases/suggest-favorites.ts';
import { UpdateFavoriteSnapshotService } from './use-cases/update-favorite-snapshot.ts';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateFavoriteService,
    DeleteFavoriteService,
    ListFavoritesService,
    SuggestFavoritesService,
    UpdateFavoriteSnapshotService,
  ],
  exports: [
    CreateFavoriteService,
    DeleteFavoriteService,
    ListFavoritesService,
    SuggestFavoritesService,
    UpdateFavoriteSnapshotService,
  ],
})
export class ApplicationModule {}
