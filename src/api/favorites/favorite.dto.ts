import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

@ApiSchema({ name: 'Platform' })
export class FavoritePlatformDto {
  @ApiProperty({ example: 6, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({ example: 'PC', minLength: 1, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

@ApiSchema({ name: 'FavoriteCreate' })
export class CreateFavoriteDto {
  @ApiProperty({ example: 3498, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  igdbId!: number;

  @ApiProperty({ example: 'Example Game', minLength: 1, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    example: '2013-09-17',
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  released?: string | null;

  @ApiPropertyOptional({
    example: 'https://media.example.test/games/3498.jpg',
    format: 'uri',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 94.5,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  rating?: number | null;

  @ApiPropertyOptional({ type: [FavoritePlatformDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique((platform: FavoritePlatformDto) => platform.id)
  @Type(() => FavoritePlatformDto)
  platforms?: FavoritePlatformDto[];
}

@ApiSchema({ name: 'FavoriteIdPath' })
export class FavoriteIdParamDto {
  @ApiProperty({ example: 3498, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  igdbId!: number;
}

@ApiSchema({ name: 'ListFavoritesQuery' })
export class ListFavoritesQueryDto {
  @ApiPropertyOptional({ example: 'grand', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 6, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  platformId?: number;

  @ApiPropertyOptional({ example: 2013, minimum: 1, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  yearFrom?: number;

  @ApiPropertyOptional({ example: 2020, minimum: 1, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  yearTo?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 1000, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize?: number;
}

@ApiSchema({ name: 'SuggestFavoritesQuery' })
export class SuggestFavoritesQueryDto {
  @ApiProperty({ enum: ['name', 'platform'], example: 'name' })
  @IsIn(['name', 'platform'])
  type!: 'name' | 'platform';

  @ApiProperty({ example: 'grand', minLength: 1, maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q!: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 20, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

@ApiSchema({ name: 'FavoriteSnapshotUpdate' })
export class UpdateFavoriteSnapshotDto {
  @ApiPropertyOptional({
    example: 'Example Game',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: '2013-09-17',
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  released?: string | null;

  @ApiPropertyOptional({
    example: 'https://media.example.test/games/3498.jpg',
    format: 'uri',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 94.5,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  rating?: number | null;

  @ApiPropertyOptional({ type: [FavoritePlatformDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique((platform: FavoritePlatformDto) => platform.id)
  @Type(() => FavoritePlatformDto)
  platforms?: FavoritePlatformDto[];
}
