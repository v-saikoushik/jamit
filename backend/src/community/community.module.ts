import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Remix, RemixSchema } from '../remixes/schemas/remix.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Remix.name, schema: RemixSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
