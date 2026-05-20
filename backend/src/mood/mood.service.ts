import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoodHistory, MoodHistoryDocument } from './schemas/mood-history.schema';
import { AiService } from '../ai/ai.service';
import { SongsService } from '../songs/songs.service';

@Injectable()
export class MoodService {
  constructor(
    @InjectModel(MoodHistory.name) private moodModel: Model<MoodHistoryDocument>,
    private aiService: AiService,
    private songsService: SongsService,
  ) {}

  async detectAndRecommend(userId: string, text: string) {
    const moodResult = await this.aiService.detectMood(text);
    const mood = moodResult.mood || 'neutral';
    const tags = moodResult.tags || [mood];

    const songs = await this.songsService.findByMoodTags(tags);
    const aiRecs = await this.aiService.getRecommendations(
      mood,
      songs.map((s) => s._id.toString()),
    );

    const recommendedIds = aiRecs.recommended_ids || songs.map((s) => s._id.toString());

    await this.moodModel.create({
      user: userId,
      inputText: text,
      detectedMood: mood,
      recommendedSongIds: recommendedIds,
      confidence: moodResult.confidence || 0.8,
    });

    return {
      mood,
      tags,
      confidence: moodResult.confidence,
      message: moodResult.message,
      songs: songs.length ? songs : await this.songsService.findAll(),
      recommendedIds,
    };
  }

  async getHistory(userId: string) {
    return this.moodModel.find({ user: userId }).sort({ createdAt: -1 }).limit(20).exec();
  }
}
