import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import {
  CreateFavoriteDto,
  UpdateFavoriteSnapshotDto,
} from './favorite.dto.ts';
import {
  ErrorResponseModel,
  FavoriteModel,
  FavoritePageModel,
  SuggestionPageModel,
} from '../openapi/api-models.ts';

type FavoriteErrorOptions = {
  includeBadRequest?: boolean;
  afterUnauthorized?: ApiResponseOptions[];
};

export function ApiFavoriteErrors(
  options: FavoriteErrorOptions = {},
): MethodDecorator {
  const responses: ApiResponseOptions[] = [];

  if (options.includeBadRequest ?? true) {
    responses.push({ status: 400, type: ErrorResponseModel });
  }

  responses.push({ status: 401, type: ErrorResponseModel });
  responses.push(...(options.afterUnauthorized ?? []));
  responses.push({ status: 503, type: ErrorResponseModel });
  responses.push({ status: 500, type: ErrorResponseModel });

  return applyDecorators(...responses.map((response) => ApiResponse(response)));
}

export function ApiSuggestFavorites(): MethodDecorator {
  return applyDecorators(
    ApiTags('Suggestions'),
    ApiOperation({
      operationId: 'suggestFavorites',
      summary: 'Suggest own favorite names or platforms',
      description:
        'Searches all favorites owned by the authenticated UUID, not only the currently visible page.',
    }),
    ApiQuery({
      name: 'type',
      enum: ['name', 'platform'],
      required: true,
      description: 'Favorite field to search.',
    }),
    ApiQuery({
      name: 'q',
      required: true,
      minLength: 1,
      maxLength: 100,
      description: 'Trimmed partial text.',
      example: 'grand',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 20,
      example: 10,
    }),
    ApiResponse({ status: 200, type: SuggestionPageModel }),
    ApiFavoriteErrors(),
  );
}

export function ApiListFavorites(): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: 'listFavorites',
      summary: 'List and filter own favorites',
      description:
        'Returns only favorites owned by the validated JWT subject. Name, platform and release-year filters combine with AND.',
    }),
    ApiQuery({
      name: 'name',
      required: false,
      maxLength: 100,
      example: 'grand',
    }),
    ApiQuery({
      name: 'platformId',
      required: false,
      type: Number,
      minimum: 1,
      example: 6,
    }),
    ApiQuery({
      name: 'yearFrom',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 9999,
      example: 2013,
    }),
    ApiQuery({
      name: 'yearTo',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 9999,
      example: 2020,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      default: 1,
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 1000,
      default: 20,
      example: 20,
    }),
    ApiResponse({ status: 200, type: FavoritePageModel }),
    ApiFavoriteErrors(),
  );
}

export function ApiCreateFavorite(): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: 'createFavorite',
      summary: 'Save an own favorite',
      description:
        'Creates a favorite owned by the validated JWT subject; a client-supplied user ID is never accepted.',
    }),
    ApiBody({ type: CreateFavoriteDto }),
    ApiResponse({ status: 201, type: FavoriteModel }),
    ApiFavoriteErrors({
      afterUnauthorized: [{ status: 409, type: ErrorResponseModel }],
    }),
  );
}

export function ApiUpdateFavoriteSnapshot(): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: 'updateFavoriteSnapshot',
      summary: 'Update an own favorite snapshot',
      description:
        'Updates only an existing favorite owned by the validated JWT subject after a successful IGDB detail request.',
    }),
    ApiParam({
      name: 'igdbId',
      schema: { type: 'integer', format: 'int32', minimum: 1 },
      example: 3498,
      description: 'IGDB game identifier.',
    }),
    ApiBody({ type: UpdateFavoriteSnapshotDto }),
    ApiResponse({ status: 200, type: FavoriteModel }),
    ApiFavoriteErrors({
      afterUnauthorized: [{ status: 404, type: ErrorResponseModel }],
    }),
  );
}

export function ApiDeleteFavorite(): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: 'deleteFavorite',
      summary: 'Delete an own favorite',
      description:
        'Deletes only the favorite owned by the validated JWT subject and addressed by the IGDB identifier.',
    }),
    ApiParam({
      name: 'igdbId',
      schema: { type: 'integer', format: 'int32', minimum: 1 },
      example: 3498,
      description: 'IGDB game identifier.',
    }),
    ApiResponse({
      status: 204,
      description: 'Favorite deleted; no response body.',
    }),
    ApiFavoriteErrors({
      includeBadRequest: false,
      afterUnauthorized: [{ status: 404, type: ErrorResponseModel }],
    }),
  );
}
