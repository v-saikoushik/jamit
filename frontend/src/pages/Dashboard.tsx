import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, Sparkles } from 'lucide-react';
import { songsApi, remixApi } from '../lib/api';
import SongCard from '../components/ui/SongCard';
import RemixCard from '../components/ui/RemixCard';

export default function Dashboard() {
  const [songs, setSongs] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      songsApi.list(true).then((r) => r.data),
      remixApi.trending().then((r) => r.data),
    ])
      .then(([s, t]) => {
        setSongs(s);
        setTrending(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-jamit-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="fixed inset-0 pointer-events-none bg-jamit-glow -z-10" aria-hidden />
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Good evening</h1>
        <p className="text-jamit-muted">Remix, discover, and vibe with AI-powered music.</p>
        <div className="flex gap-4 mt-6">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-jamit-green text-black font-semibold hover:bg-jamit-green-hover transition-colors"
          >
            <Upload className="w-5 h-5" /> Upload Track
          </Link>
          <Link
            to="/discover"
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-jamit-green transition-colors"
          >
            <Sparkles className="w-5 h-5 text-jamit-green" /> Mood Discover
          </Link>
        </div>
      </motion.section>

      <section>
        <h2 className="text-xl font-bold mb-4">Your Library</h2>
        {songs.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {songs.map((s) => (
              <SongCard key={s._id} song={s} />
            ))}
          </div>
        ) : (
          <p className="text-jamit-muted">Upload your first track to get started.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Trending Remixes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trending.slice(0, 6).map((r: any) => (
            <RemixCard key={r._id} remix={r} />
          ))}
        </div>
        {!trending.length && <p className="text-jamit-muted">No public remixes yet. Create one in Remix Studio!</p>}
      </section>
    </div>
  );
}
