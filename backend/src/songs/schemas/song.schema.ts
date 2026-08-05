import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SongDocument = Song & Document;

export type SongSourceType = 'library' | 'uploaded' | 'trim' | 'merged' | 'stem' | 'remix';

@Schema({ timestamps: true })
export class Song {
  @Prop({ required: true })
  title: string;

  @Prop({ default: 'Unknown Artist' })
  artist: string;

  @Prop({ default: '' })
  originalName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ default: '' })
  storageKey: string;

  @Prop({
    type: String,
    enum: ['library', 'uploaded', 'trim', 'merged', 'stem', 'remix'],
    default: 'uploaded',
  })
  sourceType: string;

  @Prop({ type: Types.ObjectId, ref: 'Song' })
  sourceSongId: Types.ObjectId;

  @Prop({ default: '' })
  coverUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: 0 })
  duration: number;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: [String], default: [] })
  moodTags: string[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: '' })
  vocalsPath: string;

  @Prop({ default: '' })
  instrumentalsPath: string;

  @Prop({ default: false })
  isSeparated: boolean;

  @Prop({ default: 0 })
  playCount: number;
}

export const SongSchema = SchemaFactory.createForClass(Song);
