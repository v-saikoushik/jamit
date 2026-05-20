import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MoodService } from './mood.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MoodQueryDto } from './dto/mood.dto';

@ApiTags('mood')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mood')
export class MoodController {
  constructor(private moodService: MoodService) {}

  @Post('recommend')
  @ApiOperation({ summary: 'Detect mood and get song recommendations' })
  recommend(@CurrentUser('userId') userId: string, @Body() dto: MoodQueryDto) {
    return this.moodService.detectAndRecommend(userId, dto.text);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get mood query history' })
  history(@CurrentUser('userId') userId: string) {
    return this.moodService.getHistory(userId);
  }
}
