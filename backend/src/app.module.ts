import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SongsModule } from './songs/songs.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { RemixesModule } from './remixes/remixes.module';
import { MoodModule } from './mood/mood.module';
import { CommunityModule } from './community/community.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/jamit',
    ),
    AuthModule,
    UsersModule,
    SongsModule,
    PlaylistsModule,
    RemixesModule,
    MoodModule,
    CommunityModule,
    AiModule,
  ],
})
export class AppModule {}
