import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Remix, RemixDocument } from '../remixes/schemas/remix.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Remix.name) private remixModel: Model<RemixDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getFeed(page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    const [remixes, total] = await Promise.all([
      this.remixModel
        .find({ isPublic: true })
        .populate('creator', 'displayName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.remixModel.countDocuments({ isPublic: true }),
    ]);
    return { remixes, total, page, pages: Math.ceil(total / limit) };
  }

  async saveRemix(userId: string, remixId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return null;
    const idx = user.savedRemixes.findIndex((id) => id.toString() === remixId);
    if (idx >= 0) {
      user.savedRemixes.splice(idx, 1);
    } else {
      user.savedRemixes.push(remixId as any);
    }
    await user.save();
    return { saved: idx < 0 };
  }

  async getSaved(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({ path: 'savedRemixes', populate: { path: 'creator', select: 'displayName avatarUrl' } });
    return user?.savedRemixes || [];
  }
}
