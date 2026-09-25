import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Favorite, type NewFavorite } from '../../domain/favorites/favorite.js';
import { DomainValidationError } from '../../domain/shared/domain-validation-error.js';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  FavoriteYearRangeInvalidError,
} from '../../application/errors/favorite-errors.js';
import { CreateFavoriteService } from '../../application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from '../../application/use-cases/delete-favorite.js';
import { ListFavoritesService } from '../../application/use-cases/list-favorites.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/jwt-auth-guard.js';
import {
  CreateFavoriteDto,
  FavoriteIdParamDto,
  ListFavoritesQueryDto,
} from './favorite.dto.js';

@Controller('v1/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly createFavorite: CreateFavoriteService,
    private readonly deleteFavorite: DeleteFavoriteService,
    private readonly listFavorites: ListFavoritesService,
  ) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFavoritesQueryDto,
  ): Promise<FavoritePageResponse> {
    try {
      const page = await this.listFavorites.execute({
        userId: authenticatedUserId(request),
        ...query,
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

  @Delete(':igdbId')
  @HttpCode(HttpStatus.NO_CONTENT)
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
