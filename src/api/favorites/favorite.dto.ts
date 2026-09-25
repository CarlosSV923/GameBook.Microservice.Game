import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
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

export class FavoritePlatformDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class CreateFavoriteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  igdbId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  released?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string | null;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  rating?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique((platform: FavoritePlatformDto) => platform.id)
  @Type(() => FavoritePlatformDto)
  platforms?: FavoritePlatformDto[];
}

export class FavoriteIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  igdbId!: number;
}

export class ListFavoritesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  platformId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  yearFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  yearTo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize?: number;
}
