/**
 * Seed script — run: npm run seed
 * Requires MongoDB running locally
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jamit';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  displayName: String,
  avatarUrl: String,
  bio: String,
  moodTags: [String],
}, { timestamps: true });

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  filePath: String,
  uploadedBy: mongoose.Schema.Types.ObjectId,
  moodTags: [String],
  genres: [String],
  isPublic: Boolean,
  isSeparated: Boolean,
  playCount: Number,
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', userSchema);
  const Song = mongoose.model('Song', songSchema);

  await User.deleteMany({});
  await Song.deleteMany({});

  const password = await bcrypt.hash('password123', 10);
  const demoUser = await User.create({
    email: 'demo@jamit.app',
    password,
    displayName: 'Demo DJ',
    bio: 'Jamit demo account — explore AI remixing!',
    avatarUrl: '',
  });

  const moods = [
    { title: 'Midnight Drive', artist: 'Neon Waves', tags: ['chill', 'sad', 'night'] },
    { title: 'Electric Pulse', artist: 'Voltage', tags: ['energetic', 'happy', 'workout'] },
    { title: 'Rainy Afternoon', artist: 'Lo-Fi Collective', tags: ['calm', 'sad', 'focus'] },
    { title: 'Sunrise Run', artist: 'Beat Factory', tags: ['energetic', 'happy', 'motivated'] },
    { title: 'Deep Focus', artist: 'Ambient Minds', tags: ['calm', 'focus', 'neutral'] },
  ];

  for (const m of moods) {
    await Song.create({
      title: m.title,
      artist: m.artist,
      filePath: './uploads/sample-placeholder.mp3',
      uploadedBy: demoUser._id,
      moodTags: m.tags,
      genres: ['electronic', 'lo-fi'],
      isPublic: true,
      isSeparated: false,
      playCount: Math.floor(Math.random() * 500),
    });
  }

  console.log('Seed complete!');
  console.log('Login: demo@jamit.app / password123');
  await mongoose.disconnect();
}

seed().catch(console.error);
