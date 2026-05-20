import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Song' }], default: [] })
  recentlyPlayed: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Playlist' }], default: [] })
  playlists: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Remix' }], default: [] })
  remixes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Remix' }], default: [] })
  likedRemixes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Remix' }], default: [] })
  savedRemixes: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
