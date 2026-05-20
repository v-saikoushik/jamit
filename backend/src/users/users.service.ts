import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>) {
    const user = new this.userModel(data);
    return user.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  async updateProfile(id: string, data: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async addRecentlyPlayed(userId: string, songId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { recentlyPlayed: songId },
    });
    return this.userModel.findByIdAndUpdate(
      userId,
      { $push: { recentlyPlayed: { $each: [songId], $position: 0, $slice: 20 } } },
      { new: true },
    ).select('-password');
  }

  async getProfile(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .populate('playlists')
      .populate('remixes')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
