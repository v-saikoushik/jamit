import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Remix, RemixDocument } from './schemas/remix.schema';
import { Song, SongDocument } from '../songs/schemas/song.schema';
import { AiService } from '../ai/ai.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { CreateRemixDto } from './dto/remix.dto';

@Injectable()
export class RemixesService {
  constructor(
    @InjectModel(Remix.name) private remixModel: Model<RemixDocument>,
    @InjectModel(Song.name) private songModel: Model<SongDocument>,
    private aiService: AiService,
    private playlistsService: PlaylistsService,
  ) {}

  async create(userId: string, dto: CreateRemixDto) {
    const vocalsSong = await this.songModel.findById(dto.vocalsSourceId);
    const instSong = await this.songModel.findById(dto.instrumentalsSourceId);

    if (!vocalsSong || !instSong) throw new NotFoundException('Source songs not found');
    if (!vocalsSong.isSeparated || !instSong.isSeparated) {
      throw new BadRequestException('Both songs must be separated first');
    }

    const outputName = `remix-${uuid()}.mp3`;
    const result = await this.aiService.createRemix(
      vocalsSong.vocalsPath || vocalsSong.filePath,
      instSong.instrumentalsPath || instSong.filePath,
      outputName,
    );

    const remix = new this.remixModel({
      title: dto.title,
      creator: userId,
      vocalsSource: dto.vocalsSourceId,
      instrumentalsSource: dto.instrumentalsSourceId,
      filePath: result.output_path,
      isPublic: dto.isPublic ?? true,
      shareId: uuid().slice(0, 8),
    });
    await remix.save();

    if (dto.playlistId) {
      await this.playlistsService.addRemix(dto.playlistId, userId, remix._id.toString());
    }

    return remix.populate('creator', 'displayName avatarUrl');
  }

  async findPublic(limit = 20) {
    return this.remixModel
      .find({ isPublic: true })
      .populate('creator', 'displayName avatarUrl')
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByUser(userId: string) {
    return this.remixModel
      .find({ creator: userId })
      .populate('vocalsSource instrumentalsSource', 'title artist')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByShareId(shareId: string) {
    const remix = await this.remixModel
      .findOne({ shareId })
      .populate('creator', 'displayName avatarUrl')
      .exec();
    if (!remix) throw new NotFoundException('Remix not found');
    return remix;
  }

  async like(remixId: string, userId: string) {
    const remix = await this.remixModel.findById(remixId);
    if (!remix) throw new NotFoundException('Remix not found');

    const alreadyLiked = remix.likedBy.some((id) => id.toString() === userId);
    if (alreadyLiked) {
      remix.likedBy = remix.likedBy.filter((id) => id.toString() !== userId);
      remix.likeCount = Math.max(0, remix.likeCount - 1);
    } else {
      remix.likedBy.push(userId as any);
      remix.likeCount += 1;
    }
    await remix.save();
    return remix;
  }

  async findById(id: string) {
    const remix = await this.remixModel
      .findById(id)
      .populate('creator', 'displayName avatarUrl')
      .exec();
    if (!remix) throw new NotFoundException('Remix not found');
    return remix;
  }
}
