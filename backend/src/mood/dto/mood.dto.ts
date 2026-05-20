import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoodQueryDto {
  @ApiProperty({ example: 'I feel sad and want calm music' })
  @IsString()
  @MinLength(3)
  text: string;
}
