import { useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import Waveform from './Waveform';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    current, isPlaying, volume, currentTime, duration,
    togglePlay, setPlaying, setVolume, setTime, setDuration, playNext,
  } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.streamUrl;
    if (isPlaying) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [current, isPlaying, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) setTime(audio.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setTime(t);
  };

  if (!current) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-jamit-dark border-t border-white/5 px-4 py-3 z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={playNext}
      />
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 w-48 md:w-64">
          <div className="w-12 h-12 rounded bg-jamit-card flex items-center justify-center shrink-0">
            <span className="text-jamit-green text-lg">♪</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{current.title}</p>
            <p className="text-xs text-jamit-muted truncate">{current.artist}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-jamit-muted hover:text-white">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-jamit-muted w-10">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 accent-jamit-green cursor-pointer"
            />
            <span className="text-xs text-jamit-muted w-10">{formatTime(duration)}</span>
          </div>
          <Waveform isPlaying={isPlaying} />
        </div>

        <div className="hidden md:flex items-center gap-2 w-32">
          {volume > 0 ? <Volume2 className="w-4 h-4 text-jamit-muted" /> : <VolumeX className="w-4 h-4" />}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-jamit-green"
          />
        </div>
      </div>
    </footer>
  );
}

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
