import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { moodApi } from '../lib/api';
import SongCard from '../components/ui/SongCard';

export default function Recommendations() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await moodApi.recommend(text);
      setResult(data);
      toast.success(`Mood: ${data.mood}`);
    } catch {
      toast.error('Recommendation failed');
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      setText(e.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const presets = [
    'I feel sad and want calm music',
    'I want energetic workout songs',
    'Something romantic for a date night',
    'Help me focus while studying',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-jamit-green" />
        <h1 className="text-3xl font-bold">Mood Discover</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setText(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-jamit-card border border-white/10 hover:border-jamit-green/50 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="How are you feeling? e.g. I feel sad..."
          className="flex-1 px-4 py-3 rounded-full bg-jamit-card border border-white/10 focus:border-jamit-green outline-none"
        />
        <button
          onClick={startVoice}
          className={`p-3 rounded-full border ${listening ? 'border-jamit-green text-jamit-green animate-pulse' : 'border-white/20 hover:border-jamit-green'}`}
          title="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="p-3 rounded-full bg-jamit-green text-black hover:bg-jamit-green-hover disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-jamit-card rounded-xl p-6 border border-jamit-green/30"
          >
            <p className="text-jamit-green font-semibold capitalize">Detected: {result.mood}</p>
            <p className="text-sm text-jamit-muted mt-1">{result.message}</p>
            <p className="text-xs text-jamit-muted mt-2">
              Confidence: {Math.round((result.confidence || 0) * 100)}% · Tags: {result.tags?.join(', ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {result?.songs?.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Recommended for you</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.songs.map((s: any) => (
              <SongCard key={s._id} song={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
