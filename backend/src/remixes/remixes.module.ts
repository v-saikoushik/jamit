import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Remix, RemixSchema } from './schemas/remix.schema';
import { Song, SongSchema } from '../songs/schemas/song.schema';
import { RemixesService } from './remixes.service';
import { RemixesController } from './remixes.controller';
import { AiModule } from '../ai/ai.module';
import { PlaylistsModule } from '../playlists/playlists.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Remix.name, schema: RemixSchema },
      { name: Song.name, schema: SongSchema },
    ]),
    AiModule,
    PlaylistsModule,
  ],
  controllers: [RemixesController],
  providers: [RemixesService],
  exports: [RemixesService],
})
export class RemixesModule {}
