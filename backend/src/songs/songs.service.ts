import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Song, SongDocument } from './schemas/song.schema';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import * as path from 'path';

@Injectable()
export class SongsService {
  constructor(
    @InjectModel(Song.name) private songModel: Model<SongDocument>,
    private aiService: AiService,
    private usersService: UsersService,
  ) {}

  async create(file: Express.Multer.File, userId: string, metadata: { title?: string; artist?: string }) {
    const song = new this.songModel({
      title: metadata.title || file.originalname.replace(/\.[^/.]+$/, ''),
      artist: metadata.artist || 'Unknown Artist',
      filePath: file.path,
      uploadedBy: userId,
    });
    return song.save();
  }

  async findAll(userId?: string) {
    const filter = userId ? { uploadedBy: userId } : { isPublic: true };
    return this.songModel.find(filter).populate('uploadedBy', 'displayName avatarUrl').sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    const song = await this.songModel.findById(id).populate('uploadedBy', 'displayName').exec();
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }

  async update(id: string, userId: string, data: Partial<Song>) {
    const song = await this.songModel.findById(id);
    if (!song) throw new NotFoundException('Song not found');
    if (song.uploadedBy.toString() !== userId) throw new ForbiddenException();
    return this.songModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string, userId: string) {
    const song = await this.songModel.findById(id);
    if (!song) throw new NotFoundException('Song not found');
    if (song.uploadedBy.toString() !== userId) throw new ForbiddenException();
    await this.songModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async separate(id: string, userId: string) {
    const song = await this.songModel.findById(id);
    if (!song) throw new NotFoundException('Song not found');
    if (song.uploadedBy.toString() !== userId) throw new ForbiddenException();

    const result = await this.aiService.separateAudio(song.filePath);
    song.vocalsPath = result.vocals_path;
    song.instrumentalsPath = result.instrumentals_path;
    song.isSeparated = true;
    await song.save();
    return song;
  }

  async recordPlay(id: string, userId: string) {
    await this.songModel.findByIdAndUpdate(id, { $inc: { playCount: 1 } });
    await this.usersService.addRecentlyPlayed(userId, id);
    return this.findById(id);
  }

  async findByMoodTags(tags: string[]) {
    return this.songModel
      .find({ moodTags: { $in: tags } })
      .sort({ playCount: -1 })
      .limit(20)
      .exec();
  }
}
