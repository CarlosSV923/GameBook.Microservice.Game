import {
  BadRequestException,
  ConflictException,
  Controller,
  Inject,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  Favorite,
  type FavoriteSnapshotUpdate,
  type NewFavorite,
} from '../../domain/favorites/favorite.ts';
import type { FavoriteSuggestion } from '../../application/ports/favorite-read-model.ts';
import { DomainValidationError } from '../../domain/shared/domain-validation-error.ts';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  FavoriteYearRangeInvalidError,
} from '../../application/errors/favorite-errors.ts';
import {
  CREATE_FAVORITE_USE_CASE,
  DELETE_FAVORITE_USE_CASE,
  LIST_FAVORITES_USE_CASE,
  SUGGEST_FAVORITES_USE_CASE,
  UPDATE_FAVORITE_SNAPSHOT_USE_CASE,
} from '../../application/ports/dependency-tokens.ts';
import type {
  CreateFavoriteUseCase,
  DeleteFavoriteUseCase,
  ListFavoritesUseCase,
  SuggestFavoritesUseCase,
  UpdateFavoriteSnapshotUseCase,
} from '../../application/ports/favorite-use-cases.ts';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/jwt-auth-guard.ts';
import {
  CreateFavoriteDto,
  FavoriteIdParamDto,
  ListFavoritesQueryDto,
  SuggestFavoritesQueryDto,
  UpdateFavoriteSnapshotDto,
} from './favorite.dto.ts';
import {
  ApiCreateFavorite,
  ApiDeleteFavorite,
  ApiListFavorites,
  ApiSuggestFavorites,
  ApiUpdateFavoriteSnapshot,
} from './favorites.swagger.ts';

@Controller('v1/favorites')
@UseGuards(JwtAuthGuard)
@ApiTags('Favorites')
@ApiBearerAuth('BearerAuth')
export class FavoritesController {
  constructor(
    @Inject(CREATE_FAVORITE_USE_CASE)
    private readonly createFavorite: CreateFavoriteUseCase,
    @Inject(DELETE_FAVORITE_USE_CASE)
    private readonly deleteFavorite: DeleteFavoriteUseCase,
    @Inject(LIST_FAVORITES_USE_CASE)
    private readonly listFavorites: ListFavoritesUseCase,
    @Inject(SUGGEST_FAVORITES_USE_CASE)
    private readonly suggestFavorites: SuggestFavoritesUseCase,
    @Inject(UPDATE_FAVORITE_SNAPSHOT_USE_CASE)
    private readonly updateFavoriteSnapshot: UpdateFavoriteSnapshotUseCase,
  ) {}

  @Get('suggestions')
  @ApiSuggestFavorites()
  async suggest(
    @Req() request: AuthenticatedRequest,
    @Query() query: SuggestFavoritesQueryDto,
  ): Promise<FavoriteSuggestionResponse> {
    const items = await this.suggestFavorites.execute({
      userId: authenticatedUserId(request),
      type: query.type,
      query: query.q,
      limit: query.limit,
    });

    return {
      type: query.type,
      query: query.q,
      items,
    };
  }

  @Get()
  @ApiListFavorites()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFavoritesQueryDto,
  ): Promise<FavoritePageResponse> {
    try {
      const page = await this.listFavorites.execute({
        userId: authenticatedUserId(request),
        name: query.name,
        platformId: query.platformId,
        yearFrom: query.yearFrom,
        yearTo: query.yearTo,
        page: query.page,
        pageSize: query.pageSize,
      });

      return {
        items: page.items.map(toResponse),
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        hasNext: page.hasNext,
      };
    } catch (error) {
      throw mapFavoriteError(error);
    }
  }

  @Post()
  @ApiCreateFavorite()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateFavoriteDto,
  ): Promise<FavoriteResponse> {
    try {
      const favorite = await this.createFavorite.execute(
        toNewFavorite(request, body),
      );
      return toResponse(favorite);
    } catch (error) {
      throw mapFavoriteError(error);
    }
  }

  @Patch(':igdbId/snapshot')
  @ApiUpdateFavoriteSnapshot()
  async updateSnapshot(
    @Req() request: AuthenticatedRequest,
    @Param() params: FavoriteIdParamDto,
    @Body() body: UpdateFavoriteSnapshotDto,
  ): Promise<FavoriteResponse> {
    try {
      const favorite = await this.updateFavoriteSnapshot.execute({
        userId: authenticatedUserId(request),
        igdbId: params.igdbId,
        snapshot: toSnapshotUpdate(body),
      });
      return toResponse(favorite);
    } catch (error) {
      throw mapFavoriteError(error);
    }
  }

  @Delete(':igdbId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteFavorite()
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param() params: FavoriteIdParamDto,
  ): Promise<void> {
    try {
      await this.deleteFavorite.execute({
        userId: authenticatedUserId(request),
        igdbId: params.igdbId,
      });
    } catch (error) {
      throw mapFavoriteError(error);
    }
  }
}

type FavoriteResponse = {
  igdbId: number;
  name: string;
  released: string | null;
  imageUrl: string | null;
  rating: number | null;
  platforms: Array<{ id: number; name: string }>;
};

type FavoritePageResponse = {
  items: FavoriteResponse[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
};

type FavoriteSuggestionResponse = {
  type: 'name' | 'platform';
  query: string;
  items: readonly FavoriteSuggestion[];
};

function toNewFavorite(
  request: AuthenticatedRequest,
  body: CreateFavoriteDto,
): NewFavorite {
  return {
    userId: authenticatedUserId(request),
    igdbId: body.igdbId,
    name: body.name,
    released: body.released ? new Date(`${body.released}T00:00:00.000Z`) : null,
    imageUrl: body.imageUrl ?? null,
    rating: body.rating ?? null,
    platforms: body.platforms ?? [],
  };
}

function toSnapshotUpdate(
  body: UpdateFavoriteSnapshotDto,
): FavoriteSnapshotUpdate {
  const update: {
    name?: string;
    released?: Date | null;
    imageUrl?: string | null;
    rating?: number | null;
    platforms?: Array<{ id: number; name: string }>;
  } = {};

  if (body.name !== undefined) {
    update.name = body.name;
  }

  if (body.released !== undefined) {
    update.released = body.released
      ? new Date(`${body.released}T00:00:00.000Z`)
      : null;
  }

  if (body.imageUrl !== undefined) {
    update.imageUrl = body.imageUrl;
  }

  if (body.rating !== undefined) {
    update.rating = body.rating;
  }

  if (body.platforms !== undefined) {
    update.platforms = body.platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
    }));
  }

  return update;
}

function authenticatedUserId(
  request: Request & { user?: { userId: string } },
): string {
  const userId = request.user?.userId;

  if (!userId) {
    throw new BadRequestException({ code: 'VALIDATION_ERROR' });
  }

  return userId;
}

function toResponse(favorite: Favorite): FavoriteResponse {
  return {
    igdbId: favorite.igdbId,
    name: favorite.name,
    released: favorite.released?.toISOString().slice(0, 10) ?? null,
    imageUrl: favorite.imageUrl,
    rating: favorite.rating,
    platforms: favorite.platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
    })),
  };
}

function mapFavoriteError(error: unknown): Error {
  if (error instanceof FavoriteAlreadyExistsError) {
    return new ConflictException({ code: 'FAVORITE_ALREADY_EXISTS' });
  }

  if (error instanceof FavoriteNotFoundError) {
    return new NotFoundException({ code: 'FAVORITE_NOT_FOUND' });
  }

  if (error instanceof FavoriteYearRangeInvalidError) {
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      details: [{ field: 'yearFrom', reason: 'YEAR_RANGE_INVALID' }],
    });
  }

  if (error instanceof DomainValidationError) {
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      details: [{ field: 'favorite', reason: error.code }],
    });
  }

  return error instanceof Error
    ? error
    : new Error('Unexpected favorite error.');
}
