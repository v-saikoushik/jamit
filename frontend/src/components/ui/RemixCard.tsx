import { motion } from 'framer-motion';
import { Play, Heart, Share2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePlayerStore, Track } from '../../store/playerStore';
import { remixApi } from '../../lib/api';

interface RemixCardProps {
  remix: {
    _id: string;
    title: string;
    likeCount?: number;
    shareId?: string;
    creator?: { displayName?: string };
  };
  onLike?: () => void;
}

export default function RemixCard({ remix, onLike }: RemixCardProps) {
  const setTrack = usePlayerStore((s) => s.setTrack);

  const play = () => {
    setTrack({
      id: remix._id,
      title: remix.title,
      artist: remix.creator?.displayName || 'Unknown',
      streamUrl: remixApi.streamUrl(remix._id),
      type: 'remix',
    });
  };

  const share = () => {
    const url = `${window.location.origin}/share/${remix.shareId}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-jamit-card rounded-xl p-4 border border-white/5"
    >
      <div
        className="aspect-video rounded-lg bg-gradient-to-br from-jamit-green/20 to-jamit-dark mb-3 flex items-center justify-center cursor-pointer group"
        onClick={play}
      >
        <Play className="w-12 h-12 text-jamit-green opacity-80 group-hover:scale-110 transition-transform" />
      </div>
      <h3 className="font-semibold truncate">{remix.title}</h3>
      <p className="text-sm text-jamit-muted">by {remix.creator?.displayName || 'Anonymous'}</p>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={() => { remixApi.like(remix._id); onLike?.(); }} className="flex items-center gap-1 text-sm text-jamit-muted hover:text-jamit-green">
          <Heart className="w-4 h-4" /> {remix.likeCount || 0}
        </button>
        <button onClick={share} className="text-jamit-muted hover:text-white">
          <Share2 className="w-4 h-4" />
        </button>
        <a href={remixApi.downloadUrl(remix._id)} download className="text-jamit-muted hover:text-white">
          <Download className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
