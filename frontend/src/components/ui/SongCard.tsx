import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePlayerStore, Track } from '../../store/playerStore';
import { songsApi } from '../../lib/api';

interface SongCardProps {
  song: {
    _id: string;
    title: string;
    artist: string;
    moodTags?: string[];
    playCount?: number;
    isSeparated?: boolean;
  };
}

export default function SongCard({ song }: SongCardProps) {
  const setTrack = usePlayerStore((s) => s.setTrack);

  const play = () => {
    const track: Track = {
      id: song._id,
      title: song.title,
      artist: song.artist,
      streamUrl: songsApi.streamUrl(song._id),
      type: 'song',
    };
    setTrack(track);
    songsApi.play(song._id).catch(() => {});
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group bg-jamit-card rounded-lg p-4 cursor-pointer hover:bg-jamit-hover transition-colors"
      onClick={play}
    >
      <div className="relative aspect-square rounded-md bg-jamit-hover mb-3 flex items-center justify-center">
        <span className="text-4xl text-jamit-green/60">♪</span>
        <button
          onClick={(e) => { e.stopPropagation(); play(); }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
        >
          <Play className="w-10 h-10 text-white fill-white" />
        </button>
      </div>
      <p className="font-medium text-sm truncate">{song.title}</p>
      <p className="text-xs text-jamit-muted truncate">{song.artist}</p>
      {song.moodTags?.length ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {song.moodTags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-jamit-green/10 text-jamit-green">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
