import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  streamUrl: string;
  type: 'song' | 'remix';
  coverUrl?: string;
}

interface PlayerState {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (v: number) => void;
  setTime: (t: number) => void;
  setDuration: (d: number) => void;
  playNext: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  setTrack: (track) => set({ current: track, isPlaying: true, currentTime: 0 }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  playNext: () => {
    const { queue, current } = get();
    if (!queue.length) return;
    const idx = queue.findIndex((t) => t.id === current?.id);
    const next = queue[idx + 1] || queue[0];
    set({ current: next, isPlaying: true, currentTime: 0 });
  },
}));
