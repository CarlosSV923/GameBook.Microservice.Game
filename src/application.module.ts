import { Module } from '@nestjs/common';
import {
  CREATE_FAVORITE_USE_CASE,
  DELETE_FAVORITE_USE_CASE,
  FAVORITE_READ_MODEL,
  FAVORITE_REPOSITORY,
  LIST_FAVORITES_USE_CASE,
  SUGGEST_FAVORITES_USE_CASE,
  UPDATE_FAVORITE_SNAPSHOT_USE_CASE,
} from './application/ports/dependency-tokens.ts';
import type { FavoriteRepository } from './domain/favorites/favorite-repository.ts';
import type { FavoriteReadModel } from './application/ports/favorite-read-model.ts';
import { InfrastructureModule } from './infrastructure/infrastructure.module.ts';
import { CreateFavoriteService } from './application/use-cases/create-favorite.ts';
import { DeleteFavoriteService } from './application/use-cases/delete-favorite.ts';
import { ListFavoritesService } from './application/use-cases/list-favorites.ts';
import { SuggestFavoritesService } from './application/use-cases/suggest-favorites.ts';
import { UpdateFavoriteSnapshotService } from './application/use-cases/update-favorite-snapshot.ts';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: CREATE_FAVORITE_USE_CASE,
      useFactory: (repository: FavoriteRepository) =>
        new CreateFavoriteService(repository),
      inject: [FAVORITE_REPOSITORY],
    },
    {
      provide: DELETE_FAVORITE_USE_CASE,
      useFactory: (repository: FavoriteRepository) =>
        new DeleteFavoriteService(repository),
      inject: [FAVORITE_REPOSITORY],
    },
    {
      provide: LIST_FAVORITES_USE_CASE,
      useFactory: (readModel: FavoriteReadModel) =>
        new ListFavoritesService(readModel),
      inject: [FAVORITE_READ_MODEL],
    },
    {
      provide: SUGGEST_FAVORITES_USE_CASE,
      useFactory: (readModel: FavoriteReadModel) =>
        new SuggestFavoritesService(readModel),
      inject: [FAVORITE_READ_MODEL],
    },
    {
      provide: UPDATE_FAVORITE_SNAPSHOT_USE_CASE,
      useFactory: (repository: FavoriteRepository) =>
        new UpdateFavoriteSnapshotService(repository),
      inject: [FAVORITE_REPOSITORY],
    },
  ],
  exports: [
    CREATE_FAVORITE_USE_CASE,
    DELETE_FAVORITE_USE_CASE,
    LIST_FAVORITES_USE_CASE,
    SUGGEST_FAVORITES_USE_CASE,
    UPDATE_FAVORITE_SNAPSHOT_USE_CASE,
  ],
})
export class ApplicationModule {}
