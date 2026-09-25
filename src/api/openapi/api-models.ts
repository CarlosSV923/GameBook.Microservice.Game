import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiSchema({ name: 'ErrorDetail' })
export class ErrorDetailModel {
  @ApiProperty({ example: 'yearFrom' })
  field!: string;

  @ApiProperty({ example: 'YEAR_RANGE_INVALID' })
  reason!: string;
}

@ApiSchema({ name: 'ErrorResponse' })
export class ErrorResponseModel {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Request validation failed.' })
  message!: string;

  @ApiPropertyOptional({ example: 'req_game_fictitious' })
  requestId?: string;

  @ApiPropertyOptional({ type: [ErrorDetailModel] })
  details?: ErrorDetailModel[];
}

@ApiSchema({ name: 'Platform' })
export class FavoritePlatformModel {
  @ApiProperty({ example: 6, minimum: 1 })
  id!: number;

  @ApiProperty({ example: 'PC', minLength: 1, maxLength: 120 })
  name!: string;
}

@ApiSchema({ name: 'Favorite' })
export class FavoriteModel {
  @ApiProperty({ example: 3498, minimum: 1 })
  igdbId!: number;

  @ApiProperty({ example: 'Example Game', minLength: 1, maxLength: 200 })
  name!: string;

  @ApiProperty({ example: '2013-09-17', format: 'date', nullable: true })
  released!: string | null;

  @ApiProperty({
    example: 'https://media.example.test/games/3498.jpg',
    format: 'uri',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({ example: 94.5, minimum: 0, maximum: 100, nullable: true })
  rating!: number | null;

  @ApiProperty({ type: [FavoritePlatformModel] })
  platforms!: FavoritePlatformModel[];
}

@ApiSchema({ name: 'FavoritePage' })
export class FavoritePageModel {
  @ApiProperty({ type: [FavoriteModel] })
  items!: FavoriteModel[];

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 1000 })
  pageSize!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}

@ApiSchema({ name: 'NameSuggestion' })
export class NameSuggestionModel {
  @ApiProperty({ enum: ['name'], example: 'name' })
  type!: 'name';

  @ApiProperty({ example: 'Example Game', minLength: 1, maxLength: 200 })
  value!: string;
}

@ApiSchema({ name: 'PlatformSuggestion' })
export class PlatformSuggestionModel {
  @ApiProperty({ enum: ['platform'], example: 'platform' })
  type!: 'platform';

  @ApiProperty({ example: 'PC', minLength: 1, maxLength: 120 })
  value!: string;

  @ApiProperty({ example: 6, minimum: 1 })
  platformId!: number;
}

@ApiExtraModels(NameSuggestionModel, PlatformSuggestionModel)
@ApiSchema({ name: 'SuggestionPage' })
export class SuggestionPageModel {
  @ApiProperty({ enum: ['name', 'platform'], example: 'name' })
  type!: 'name' | 'platform';

  @ApiProperty({ example: 'grand', minLength: 1, maxLength: 100 })
  query!: string;

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(NameSuggestionModel) },
        { $ref: getSchemaPath(PlatformSuggestionModel) },
      ],
    },
    maxItems: 20,
  })
  items!: Array<NameSuggestionModel | PlatformSuggestionModel>;
}
