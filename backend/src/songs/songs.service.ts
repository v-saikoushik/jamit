import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
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
      originalName: file.originalname,
      storageKey: path.basename(file.filename || file.path),
      sourceType: 'uploaded',
      uploadedBy: userId,
    });
    return song.save();
  }

  async trimAudio(id: string, userId: string, startTime: number, endTime: number) {
    const song = await this.songModel.findById(id);
    if (!song) throw new NotFoundException('Song not found');
    if (song.uploadedBy.toString() !== userId) throw new ForbiddenException();

    if (!Number.isFinite(startTime) || startTime < 0) {
      throw new BadRequestException('Trim start must be a non-negative number');
    }
    if (!Number.isFinite(endTime) || endTime <= startTime) {
      throw new BadRequestException('Trim end must be greater than start');
    }

    const duration = endTime - startTime;
    const outputName = `trim-${uuid()}.mp3`;
    const result = await this.aiService.trimAudio(song.filePath, outputName, startTime, duration);

    const clip = new this.songModel({
      title: `${song.title} (trim ${startTime}-${endTime}s)`,
      artist: song.artist,
      filePath: result.output_path,
      originalName: `${song.title}-trim.mp3`,
      storageKey: path.basename(result.output_path),
      sourceType: 'trim',
      sourceSongId: song._id,
      uploadedBy: userId,
      duration,
    });
    return clip.save();
  }

  async mergeAudio(userId: string, songIds: string[], outputName?: string) {
    if (!songIds || songIds.length < 2) {
      throw new BadRequestException('At least two tracks are required to merge');
    }

    const songs = await this.songModel.find({ _id: { $in: songIds } });
    if (songs.length !== songIds.length) throw new NotFoundException('One or more source tracks not found');

    const ordered = songIds.map((sid) => songs.find((s) => s._id.toString() === sid));
    for (const s of ordered) {
      if (!s) throw new NotFoundException('Source track not found');
      if (s.uploadedBy.toString() !== userId) throw new ForbiddenException();
    }

    const inputPaths = ordered.map((s) => s!.filePath);
    const safeName = `merge-${uuid()}.mp3`;
    const result = await this.aiService.mergeAudio(inputPaths, safeName);

    const clip = new this.songModel({
      title: outputName?.trim() || `Merged (${songIds.length} tracks)`,
      artist: 'Remix Studio',
      filePath: result.output_path,
      originalName: `${outputName?.trim() || 'merged'}.mp3`,
      storageKey: path.basename(result.output_path),
      sourceType: 'merged',
      uploadedBy: userId,
    });
    return clip.save();
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
