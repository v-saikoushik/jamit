import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePlaylistDto, UpdatePlaylistDto, AddToPlaylistDto } from './dto/playlist.dto';

@ApiTags('playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(userId, dto);
  }

  @Get()
  findMine(@CurrentUser('userId') userId: string) {
    return this.playlistsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playlistsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() dto: UpdatePlaylistDto) {
    return this.playlistsService.update(id, userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.playlistsService.delete(id, userId);
  }

  @Post(':id/add')
  addItem(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() dto: AddToPlaylistDto) {
    if (dto.songId) return this.playlistsService.addSong(id, userId, dto.songId);
    if (dto.remixId) return this.playlistsService.addRemix(id, userId, dto.remixId);
    return { message: 'Provide songId or remixId' };
  }
}
