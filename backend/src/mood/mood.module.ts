import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoodHistory, MoodHistorySchema } from './schemas/mood-history.schema';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { AiModule } from '../ai/ai.module';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MoodHistory.name, schema: MoodHistorySchema }]),
    AiModule,
    SongsModule,
  ],
  controllers: [MoodController],
  providers: [MoodService],
})
export class MoodModule {}
