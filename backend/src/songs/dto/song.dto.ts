import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrimSongDto {
  @ApiProperty({ description: 'Trim start in seconds' })
  @IsNumber()
  @Min(0)
  startTime: number;

  @ApiProperty({ description: 'Trim end in seconds' })
  @IsNumber()
  endTime: number;
}

export class MergeSongsDto {
  @ApiProperty({ description: 'Ordered song/clip IDs to concatenate' })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  songIds: string[];

  @ApiPropertyOptional({ description: 'Optional output name' })
  @IsOptional()
  @IsString()
  outputName?: string;
}

export class UpdateSongDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  artist?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  genres?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  moodTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
