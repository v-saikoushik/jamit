import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';
import { CreatePlaylistDto, UpdatePlaylistDto } from './dto/playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(@InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>) {}

  async create(userId: string, dto: CreatePlaylistDto) {
    const playlist = new this.playlistModel({ ...dto, owner: userId });
    return playlist.save();
  }

  async findByUser(userId: string) {
    return this.playlistModel
      .find({ owner: userId })
      .populate('songs')
      .populate('remixes')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(id: string) {
    const playlist = await this.playlistModel
      .findById(id)
      .populate('songs')
      .populate('remixes')
      .populate('owner', 'displayName avatarUrl')
      .exec();
    if (!playlist) throw new NotFoundException('Playlist not found');
    return playlist;
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    const playlist = await this.playlistModel.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.owner.toString() !== userId) throw new ForbiddenException();
    return this.playlistModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async delete(id: string, userId: string) {
    const playlist = await this.playlistModel.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.owner.toString() !== userId) throw new ForbiddenException();
    await this.playlistModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async addSong(id: string, userId: string, songId: string) {
    const playlist = await this.ensureOwner(id, userId);
    if (!playlist.songs.includes(songId as any)) {
      playlist.songs.push(songId as any);
      await playlist.save();
    }
    return this.findById(id);
  }

  async addRemix(id: string, userId: string, remixId: string) {
    const playlist = await this.ensureOwner(id, userId);
    if (!playlist.remixes.includes(remixId as any)) {
      playlist.remixes.push(remixId as any);
      await playlist.save();
    }
    return this.findById(id);
  }

  private async ensureOwner(id: string, userId: string) {
    const playlist = await this.playlistModel.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.owner.toString() !== userId) throw new ForbiddenException();
    return playlist;
  }
}
