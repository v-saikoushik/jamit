import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaylistDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdatePlaylistDto extends CreatePlaylistDto {}

export class AddToPlaylistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  songId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remixId?: string;
}
