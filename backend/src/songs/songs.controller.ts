import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, Query, Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { Response } from 'express';
import * as fs from 'fs';
import { SongsService } from './songs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateSongDto } from './dto/song.dto';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a song' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
      }),
      fileFilter: (_, file, cb) => {
        const allowed = ['.mp3', '.wav', '.mpeg'];
        const ext = extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
    @Body('title') title?: string,
    @Body('artist') artist?: string,
  ) {
    return this.songsService.create(file, userId, { title, artist });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser('userId') userId: string, @Query('mine') mine?: string) {
    return this.songsService.findAll(mine === 'true' ? userId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsService.findById(id);
  }

  @Get(':id/stream')
  async stream(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const song = await this.songsService.findById(id);
    const file = fs.createReadStream(song.filePath);
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Disposition': `inline; filename="${song.title}.mp3"` });
    return new StreamableFile(file);
  }

  @Post(':id/play')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  play(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.songsService.recordPlay(id, userId);
  }

  @Post(':id/separate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  separate(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.songsService.separate(id, userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() dto: UpdateSongDto) {
    return this.songsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.songsService.delete(id, userId);
  }
}
