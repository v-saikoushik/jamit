import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Disc3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { songsApi, remixApi } from '../lib/api';

export default function RemixStudio() {
  const [songs, setSongs] = useState<any[]>([]);
  const [vocalsId, setVocalsId] = useState('');
  const [instId, setInstId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    songsApi.list(true).then((r) => setSongs(r.data.filter((s: any) => s.isSeparated)));
  }, []);

  const createRemix = async () => {
    if (!vocalsId || !instId || !title) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await remixApi.create({
        title,
        vocalsSourceId: vocalsId,
        instrumentalsSourceId: instId,
        isPublic: true,
      });
      toast.success('Remix created!');
      setTitle('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Remix failed');
    } finally {
      setLoading(false);
    }
  };

  const separated = songs.filter((s) => s.isSeparated);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Disc3 className="w-8 h-8 text-jamit-green" />
        <h1 className="text-3xl font-bold">Remix Studio</h1>
      </div>
      <p className="text-jamit-muted">
        Combine vocals from one track with instrumentals from another. Both songs must be stem-separated first.
      </p>

      {separated.length < 2 ? (
        <div className="bg-jamit-card rounded-xl p-6 border border-white/5">
          <p className="text-jamit-muted">
            Upload and separate at least 2 tracks in the Upload page to start remixing.
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-jamit-card rounded-xl p-6 border border-white/5">
          <div>
            <label className="text-sm text-jamit-muted">Vocals source</label>
            <select
              value={vocalsId}
              onChange={(e) => setVocalsId(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-lg bg-jamit-hover border border-white/10"
            >
              <option value="">Select track...</option>
              {separated.map((s) => (
                <option key={s._id} value={s._id}>{s.title} — {s.artist}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-jamit-muted">Instrumentals source</label>
            <select
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-lg bg-jamit-hover border border-white/10"
            >
              <option value="">Select track...</option>
              {separated.map((s) => (
                <option key={s._id} value={s._id}>{s.title} — {s.artist}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Remix title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-jamit-hover border border-white/10"
          />
          <button
            onClick={createRemix}
            disabled={loading}
            className="w-full py-3 rounded-full bg-jamit-green text-black font-semibold hover:bg-jamit-green-hover disabled:opacity-50"
          >
            {loading ? 'Creating remix...' : 'Create & Save Remix'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
