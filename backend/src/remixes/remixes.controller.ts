import { Controller, Get, Post, Param, Body, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { RemixesService } from './remixes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRemixDto } from './dto/remix.dto';

@ApiTags('remixes')
@Controller('remixes')
export class RemixesController {
  constructor(private remixesService: RemixesService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get trending public remixes' })
  trending() {
    return this.remixesService.findPublic();
  }

  @Get('share/:shareId')
  @ApiOperation({ summary: 'Get remix by share link' })
  getByShare(@Param('shareId') shareId: string) {
    return this.remixesService.findByShareId(shareId);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser('userId') userId: string) {
    return this.remixesService.findByUser(userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateRemixDto) {
    return this.remixesService.create(userId, dto);
  }

  @Post(':id/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.remixesService.like(id, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.remixesService.findById(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const remix = await this.remixesService.findById(id);
    const file = fs.createReadStream(remix.filePath);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${remix.title}.mp3"`,
    });
    return new StreamableFile(file);
  }

  @Get(':id/stream')
  async stream(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const remix = await this.remixesService.findById(id);
    const file = fs.createReadStream(remix.filePath);
    res.set({ 'Content-Type': 'audio/mpeg' });
    return new StreamableFile(file);
  }
}
