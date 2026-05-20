import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { songsApi } from '../lib/api';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [separating, setSeparating] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return toast.error('Select a file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    if (artist) fd.append('artist', artist);
    try {
      const { data } = await songsApi.upload(fd);
      toast.success('Track uploaded!');
      setUploaded((prev) => [data, ...prev]);
      setFile(null);
      setTitle('');
      setArtist('');
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeparate = async (id: string) => {
    setSeparating(id);
    try {
      const { data } = await songsApi.separate(id);
      toast.success('Stems separated! Vocals + instrumentals ready.');
      setUploaded((prev) => prev.map((s) => (s._id === id ? data : s)));
    } catch {
      toast.error('Separation failed — ensure AI service is running');
    } finally {
      setSeparating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Upload Music</h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-jamit-green/50 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <UploadIcon className="w-12 h-12 mx-auto text-jamit-green mb-4" />
        <p className="text-jamit-muted">{file ? file.name : 'Drop MP3/WAV or click to browse'}</p>
      </motion.div>

      <div className="space-y-3">
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-jamit-card border border-white/10 outline-none focus:border-jamit-green"
        />
        <input
          placeholder="Artist (optional)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-jamit-card border border-white/10 outline-none focus:border-jamit-green"
        />
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full py-3 rounded-full bg-jamit-green text-black font-semibold hover:bg-jamit-green-hover disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Track'}
        </button>
      </div>

      {uploaded.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">AI Stem Separation</h2>
          <div className="space-y-2">
            {uploaded.map((s) => (
              <div key={s._id} className="flex items-center justify-between bg-jamit-card rounded-lg p-4">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-jamit-muted">
                    {s.isSeparated ? '✓ Separated (vocals + instrumentals)' : 'Not separated yet'}
                  </p>
                </div>
                {!s.isSeparated && (
                  <button
                    onClick={() => handleSeparate(s._id)}
                    disabled={separating === s._id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-jamit-green/20 text-jamit-green hover:bg-jamit-green/30 text-sm"
                  >
                    <Wand2 className="w-4 h-4" />
                    {separating === s._id ? 'Processing...' : 'Separate Stems'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
