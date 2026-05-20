import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Public remix feed' })
  feed(@Query('page') page?: string) {
    return this.communityService.getFeed(parseInt(page || '1', 10));
  }

  @Post('save/:remixId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  save(@Param('remixId') remixId: string, @CurrentUser('userId') userId: string) {
    return this.communityService.saveRemix(userId, remixId);
  }

  @Get('saved')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  saved(@CurrentUser('userId') userId: string) {
    return this.communityService.getSaved(userId);
  }
}
