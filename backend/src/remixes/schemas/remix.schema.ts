import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RemixDocument = Remix & Document;

@Schema({ timestamps: true })
export class Remix {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Song' })
  vocalsSource: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Song' })
  instrumentalsSource: Types.ObjectId;

  @Prop({ required: true })
  filePath: string;

  @Prop({ default: '' })
  coverUrl: string;

  @Prop({ default: 0 })
  duration: number;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ default: '' })
  shareId: string;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  moodTags: string[];
}

export const RemixSchema = SchemaFactory.createForClass(Remix);
