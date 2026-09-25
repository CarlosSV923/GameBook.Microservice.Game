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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Favorite, type NewFavorite } from '../../domain/favorites/favorite.js';
import { DomainValidationError } from '../../domain/shared/domain-validation-error.js';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
} from '../../application/errors/favorite-errors.js';
import { CreateFavoriteService } from '../../application/use-cases/create-favorite.js';
import { DeleteFavoriteService } from '../../application/use-cases/delete-favorite.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/jwt-auth-guard.js';
import { CreateFavoriteDto, FavoriteIdParamDto } from './favorite.dto.js';

@Controller('v1/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly createFavorite: CreateFavoriteService,
    private readonly deleteFavorite: DeleteFavoriteService,
  ) {}

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
