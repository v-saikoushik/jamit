import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MoodHistoryDocument = MoodHistory & Document;

@Schema({ timestamps: true })
export class MoodHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  inputText: string;

  @Prop({ required: true })
  detectedMood: string;

  @Prop({ type: [String], default: [] })
  recommendedSongIds: string[];

  @Prop({ default: 0 })
  confidence: number;
}

export const MoodHistorySchema = SchemaFactory.createForClass(MoodHistory);
