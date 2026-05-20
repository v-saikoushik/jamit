import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, remixApi } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { Play } from 'lucide-react';

export default function ShareRemix() {
  const { shareId } = useParams();
  const [remix, setRemix] = useState<any>(null);
  const setTrack = usePlayerStore((s) => s.setTrack);

  useEffect(() => {
    if (shareId) {
      api.get(`/remixes/share/${shareId}`).then((r) => setRemix(r.data));
    }
  }, [shareId]);

  if (!remix) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jamit-black">
        <div className="w-8 h-8 border-2 border-jamit-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jamit-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-jamit-card rounded-2xl p-8 text-center border border-white/5">
        <h1 className="text-2xl font-bold mb-2">{remix.title}</h1>
        <p className="text-jamit-muted mb-6">by {remix.creator?.displayName || 'Anonymous'}</p>
        <button
          onClick={() =>
            setTrack({
              id: remix._id,
              title: remix.title,
              artist: remix.creator?.displayName || 'Unknown',
              streamUrl: remixApi.streamUrl(remix._id),
              type: 'remix',
            })
          }
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-jamit-green text-black font-semibold mb-4"
        >
          <Play className="w-5 h-5" /> Play Remix
        </button>
        <Link to="/login" className="block text-sm text-jamit-green hover:underline">
          Join Jamit to create your own remixes
        </Link>
      </div>
    </div>
  );
}
