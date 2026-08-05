import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  Disc3,
  Download,
  Headphones,
  Layers3,
  ListOrdered,
  Music4,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { songsApi, remixApi } from '../lib/api';
import StudioWaveformPlaceholder from '../components/remix/StudioWaveformPlaceholder';
import { usePlayerStore } from '../store/playerStore';

type SourceType = 'library' | 'uploaded' | 'trim' | 'merged' | 'remix';

interface StudioTrack {
  id: string;
  name: string;
  artist: string;
  sourceType: SourceType;
  sourceSongId?: string;
  audioUrl: string;
  duration?: number;
}

interface LibrarySong {
  _id: string;
  title: string;
  artist: string;
  uploadedBy?: { displayName?: string };
  isSeparated?: boolean;
  vocalsPath?: string;
  instrumentalsPath?: string;
  sourceType?: string;
}

interface RemixResult {
  _id: string;
  title: string;
  creator?: { displayName?: string };
}

const SOURCE_LABELS: Record<SourceType, string> = {
  library: 'Library',
  uploaded: 'Uploaded',
  trim: 'Trim',
  merged: 'Merged',
  remix: 'Remix',
};

export default function RemixStudio() {
  const [library, setLibrary] = useState<LibrarySong[]>([]);
  const [workspace, setWorkspace] = useState<StudioTrack[]>([]);
  const [mergedIds, setMergedIds] = useState<string[]>([]);
  const [mergedOrder, setMergedOrder] = useState<string[]>([]);
  const [trimTrackId, setTrimTrackId] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [separating, setSeparating] = useState<Record<string, boolean>>({});
  const [createdRemix, setCreatedRemix] = useState<RemixResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setTrack = usePlayerStore((state) => state.setTrack);

  useEffect(() => {
    songsApi
      .list(true)
      .then((response) => setLibrary(response.data))
      .catch(() => toast.error('Could not load your library'));
  }, []);

  const addToWorkspace = (song: LibrarySong) => {
    if (workspace.some((t) => t.id === song._id)) {
      toast.error('Track already in workspace');
      return;
    }
    const track: StudioTrack = {
      id: song._id,
      name: song.title,
      artist: song.artist || 'Unknown Artist',
      sourceType: (song.sourceType as SourceType) || 'library',
      audioUrl: songsApi.streamUrl(song._id),
    };
    setWorkspace((prev) => [...prev, track]);
    toast.success(`Added "${song.title}" to workspace`);
  };

  const removeFromWorkspace = (id: string) => {
    setWorkspace((prev) => prev.filter((t) => t.id !== id));
    setMergedIds((prev) => prev.filter((mid) => mid !== id));
    setMergedOrder((prev) => prev.filter((mid) => mid !== id));
    if (trimTrackId === id) setTrimTrackId('');
  };

  const playTrack = (track: StudioTrack) => {
    setTrack({
      id: track.id,
      title: track.name,
      artist: track.artist,
      streamUrl: track.audioUrl,
      type: 'clip',
    });
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Select an audio file to upload');
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    if (uploadTitle) fd.append('title', uploadTitle);
    try {
      const { data } = await songsApi.upload(fd);
      setLibrary((prev) => [data, ...prev]);
      const track: StudioTrack = {
        id: data._id,
        name: data.title,
        artist: data.artist || 'Unknown Artist',
        sourceType: 'uploaded',
        audioUrl: songsApi.streamUrl(data._id),
      };
      setWorkspace((prev) => [...prev, track]);
      setUploadFile(null);
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Track uploaded and added to workspace');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeparate = async (song: LibrarySong) => {
    setSeparating((prev) => ({ ...prev, [song._id]: true }));
    try {
      const { data } = await songsApi.separate(song._id);
      setLibrary((prev) => prev.map((s) => (s._id === song._id ? data : s)));
      toast.success('Stems separated! Vocals + instrumentals ready.');
    } catch {
      toast.error('Separation failed — ensure AI service is running');
    } finally {
      setSeparating((prev) => ({ ...prev, [song._id]: false }));
    }
  };

  const playbackError = (e: any, fallback: string) =>
    e.response?.data?.message || e.response?.data?.detail || fallback;

  const handleTrim = async () => {
    if (!trimTrackId) {
      toast.error('Select a track to trim');
      return;
    }
    if (trimStart < 0) {
      toast.error('Trim start must be zero or greater');
      return;
    }
    if (trimEnd <= trimStart) {
      toast.error('Trim end must be greater than start');
      return;
    }
    setLoading(true);
    try {
      const { data } = await songsApi.trim(trimTrackId, {
        startTime: trimStart,
        endTime: trimEnd,
      });
      const track: StudioTrack = {
        id: data._id,
        name: data.title,
        artist: data.artist || 'Unknown Artist',
        sourceType: 'trim',
        sourceSongId: trimTrackId,
        audioUrl: songsApi.streamUrl(data._id),
        duration: trimEnd - trimStart,
      };
      setWorkspace((prev) => [...prev, track]);
      toast.success('Trimmed clip created and added to workspace');
    } catch (e: any) {
      toast.error(playbackError(e, 'Trim failed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMerge = (id: string) => {
    setMergedIds((prev) => {
      if (prev.includes(id)) {
        setMergedOrder((ord) => ord.filter((o) => o !== id));
        return prev.filter((p) => p !== id);
      }
      setMergedOrder((ord) => [...ord, id]);
      return [...prev, id];
    });
  };

  const moveMerge = (index: number, dir: -1 | 1) => {
    setMergedOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleMerge = async () => {
    if (mergedOrder.length < 2) {
      toast.error('Select at least two tracks to merge');
      return;
    }
    setLoading(true);
    try {
      const { data } = await songsApi.merge({
        songIds: mergedOrder,
        outputName: title || undefined,
      });
      const track: StudioTrack = {
        id: data._id,
        name: data.title,
        artist: data.artist || 'Remix Studio',
        sourceType: 'merged',
        audioUrl: songsApi.streamUrl(data._id),
      };
      setWorkspace((prev) => [...prev, track]);
      setMergedIds([]);
      setMergedOrder([]);
      toast.success('Tracks merged and added to workspace');
    } catch (e: any) {
      toast.error(playbackError(e, 'Merge failed'));
    } finally {
      setLoading(false);
    }
  };

  const createRemix = async (vocalsSong?: LibrarySong, instSong?: LibrarySong) => {
    if (!vocalsSong || !instSong || !title) {
      toast.error('Select vocals + instrumentals sources and a title');
      return;
    }
    setLoading(true);
    try {
      const response = await remixApi.create({
        title,
        vocalsSourceId: vocalsSong._id,
        instrumentalsSourceId: instSong._id,
        isPublic: true,
      });
      setCreatedRemix(response.data);
      const track: StudioTrack = {
        id: response.data._id,
        name: response.data.title,
        artist: response.data.creator?.displayName || 'You',
        sourceType: 'remix',
        audioUrl: remixApi.streamUrl(response.data._id),
      };
      setWorkspace((prev) => [...prev, track]);
      toast.success('Remix created!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Remix failed');
    } finally {
      setLoading(false);
    }
  };

  const separated = library.filter((s) => s.isSeparated);
  const selectedTrimTrack = useMemo(
    () => workspace.find((t) => t.id === trimTrackId) || null,
    [workspace, trimTrackId],
  );
  const mergedTracks = mergedOrder
    .map((id) => workspace.find((t) => t.id === id))
    .filter(Boolean) as StudioTrack[];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-jamit-card via-[#12161f] to-black px-6 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.3),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-jamit-muted">
              <Sparkles className="h-4 w-4 text-jamit-green" />
              Remix Studio
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-jamit-green/15 text-jamit-green md:flex">
                <Disc3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  Build edits in a darker, louder studio.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-jamit-muted md:text-base">
                  Add tracks from your library or upload new ones, trim sections with FFmpeg,
                  merge clips in your chosen order, and preview every result before exporting.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Library Tracks" value={String(library.length).padStart(2, '0')} hint="Available to add" />
            <MetricCard label="Workspace Tracks" value={String(workspace.length).padStart(2, '0')} hint="Ready to edit" />
            <MetricCard label="Export State" value={createdRemix ? 'Ready' : 'Draft'} hint={createdRemix ? 'Preview or download' : 'Create remix first'} />
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel
              icon={Upload}
              eyebrow="Add Track"
              title="Your library"
              description="Bring existing songs from your library straight into the studio."
            >
              <div className="space-y-3">
                {library.length === 0 && (
                  <p className="text-sm text-jamit-muted">No songs in your library yet. Upload one below.</p>
                )}
                {library.map((song) => (
                  <div
                    key={song._id}
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                      <p className="truncate text-xs text-jamit-muted">
                        {song.artist} {song.isSeparated ? '• stems ready' : ''}
                      </p>
                    </div>
<div className="flex shrink-0 items-center gap-2">
                      {song.isSeparated && (
                        <>
                          <button
                            onClick={() => {
                              if (!song.vocalsPath) {
                                toast.error('Vocals stem not available');
                                return;
                              }
                              setTrack({
                                id: song._id,
                                title: `${song.title} (Vocals)`,
                                artist: song.artist,
                                streamUrl: songsApi.stemStreamUrl(song._id, 'vocals'),
                                type: 'clip',
                              });
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            <Headphones className="mr-1 inline h-3.5 w-3.5" />
                            Vocals
                          </button>
                          <button
                            onClick={() => {
                              if (!song.instrumentalsPath) {
                                toast.error('Instrumentals stem not available');
                                return;
                              }
                              setTrack({
                                id: song._id,
                                title: `${song.title} (Instrumentals)`,
                                artist: song.artist,
                                streamUrl: songsApi.stemStreamUrl(song._id, 'instrumentals'),
                                type: 'clip',
                              });
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            <Headphones className="mr-1 inline h-3.5 w-3.5" />
                            Inst.
                          </button>
                        </>
                      )}
                      {!song.isSeparated && (
                        <button
                          onClick={() => handleSeparate(song)}
                          disabled={!!separating[song._id]}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          <Wand2 className="mr-1 inline h-3.5 w-3.5" />
                          {separating[song._id] ? 'Separating...' : 'Separate'}
                        </button>
                      )}
                      <button
                        onClick={() => addToWorkspace(song)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-jamit-green px-3 py-1.5 text-xs font-semibold text-black hover:bg-jamit-green-hover"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              icon={Upload}
              eyebrow="Upload New"
              title="Drop new ideas"
              description="Upload an MP3/WAV and it will be saved and added to your workspace instantly."
            >
              <div className="space-y-4">
                <div
                  className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-center cursor-pointer hover:border-jamit-green/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.mpeg"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="mx-auto mb-2 h-8 w-8 text-jamit-green" />
                  <p className="text-sm text-jamit-muted">
                    {uploadFile ? uploadFile.name : 'Click to choose an MP3/WAV file'}
                  </p>
                </div>
                <input
                  placeholder="Title (optional)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-jamit-muted focus:border-jamit-green"
                />
                <button
                  onClick={handleUpload}
                  disabled={loading || !uploadFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {loading ? 'Uploading...' : 'Upload & Add to Workspace'}
                </button>
              </div>
            </Panel>
          </section>

          <Panel
            icon={Music4}
            eyebrow="Workspace"
            title="Studio tracks"
            description="Every track and clip you add appears here. Click play to preview, or remove a track."
          >
            {workspace.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
                <p className="text-sm text-jamit-muted">
                  No tracks yet. Add one from your library or upload a new file.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        onClick={() => playTrack(track)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jamit-green/15 text-jamit-green hover:bg-jamit-green/25"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{track.name}</p>
                        <p className="truncate text-xs text-jamit-muted">
                          {track.artist} • <span className="text-jamit-accent">{SOURCE_LABELS[track.sourceType]}</span>
                          {track.duration ? ` • ${formatSecs(track.duration)}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWorkspace(track.id)}
                      className="shrink-0 rounded-full p-2 text-jamit-muted hover:bg-white/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <section className="grid gap-6 xl:grid-cols-2">
            <Panel
              icon={Scissors}
              eyebrow="Trim"
              title="Edit window"
              description="Select a workspace track, choose start/end in seconds, then trim with FFmpeg."
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-jamit-muted">Track to trim</label>
                  <select
                    value={trimTrackId}
                    onChange={(e) => setTrimTrackId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-jamit-green"
                  >
                    <option value="">Select workspace track...</option>
                    {workspace.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({SOURCE_LABELS[t.sourceType]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-jamit-muted">Start (seconds)</span>
                    <span className="font-semibold text-white">{trimStart}s</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-jamit-green"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-jamit-muted">End (seconds)</span>
                    <span className="font-semibold text-white">{trimEnd}s</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-jamit-green"
                  />
                </div>

                <StudioWaveformPlaceholder
                  label="Trim preview"
                  sublabel={selectedTrimTrack ? `Trimming: ${selectedTrimTrack.name}` : 'Select a track to trim'}
                  startPercent={Math.min(90, (trimStart / (trimEnd || 1)) * 100)}
                  endPercent={100}
                  cursorPercent={Math.min(90, (trimStart / (trimEnd || 1)) * 100)}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <TrimChip label="In" value={`${trimStart}s`} />
                  <TrimChip label="Out" value={`${trimEnd}s`} />
                  <TrimChip label="Range" value={`${Math.max(0, trimEnd - trimStart)}s`} />
                </div>

                <button
                  onClick={handleTrim}
                  disabled={loading || !trimTrackId}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-jamit-green px-5 py-3 text-sm font-semibold text-black transition hover:bg-jamit-green-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Scissors className="h-4 w-4" />
                  {loading ? 'Trimming...' : 'Trim Clip'}
                </button>
              </div>
            </Panel>

            <div className="space-y-6">
              <Panel
                icon={Layers3}
                eyebrow="Merge"
                title="Merge tracks"
                description="Select two or more tracks, then arrange their order before merging them with FFmpeg."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    {workspace.map((t) => (
                      <label
                        key={t.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                          mergedIds.includes(t.id)
                            ? 'border-jamit-green bg-jamit-green/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="min-w-0 truncate text-sm font-semibold text-white">{t.name}</span>
                        <input
                          type="checkbox"
                          checked={mergedIds.includes(t.id)}
                          onChange={() => toggleMerge(t.id)}
                          className="h-4 w-4 accent-jamit-green"
                        />
                      </label>
                    ))}
                    {workspace.length === 0 && (
                      <p className="text-sm text-jamit-muted">Add tracks to the workspace first.</p>
                    )}
                  </div>

                  {mergedTracks.length > 0 && (
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-jamit-muted">
                        <ListOrdered className="h-3.5 w-3.5" /> Merge order
                      </p>
                      <div className="space-y-1.5">
                        {mergedTracks.map((t, index) => (
                          <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                            <span className="truncate text-sm text-white">
                              <span className="mr-2 text-jamit-muted">{index + 1}.</span>
                              {t.name}
                            </span>
                            <div className="flex shrink-0 gap-1">
                              <button
                                onClick={() => moveMerge(index, -1)}
                                disabled={index === 0}
                                className="rounded-full px-2 py-0.5 text-xs text-jamit-muted hover:bg-white/10 disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveMerge(index, 1)}
                                disabled={index === mergedTracks.length - 1}
                                className="rounded-full px-2 py-0.5 text-xs text-jamit-muted hover:bg-white/10 disabled:opacity-30"
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleMerge}
                    disabled={loading || mergedOrder.length < 2}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-jamit-accent px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Layers3 className="h-4 w-4" />
                    {loading ? 'Merging...' : `Merge ${mergedOrder.length} Track${mergedOrder.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </Panel>
            </div>
          </section>

          <Panel
            icon={Disc3}
            eyebrow="Export"
            title="Save the take"
            description="Create a remix from separated vocals + instrumentals, then preview or download."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <VoiceTrackPicker
                label="Vocals source"
                songs={separated}
                onPlay={(song) =>
                  song.vocalsPath
                    ? setTrack({
                        id: song._id,
                        title: `${song.title} (Vocals)`,
                        artist: song.artist,
                        streamUrl: songsApi.stemStreamUrl(song._id, 'vocals'),
                        type: 'clip',
                      })
                    : toast.error('Vocals stem not available')
                }
              />
              <VoiceTrackPicker
                label="Instrumentals source"
                songs={separated}
                onPlay={(song) =>
                  song.instrumentalsPath
                    ? setTrack({
                        id: song._id,
                        title: `${song.title} (Instrumentals)`,
                        artist: song.artist,
                        streamUrl: songsApi.stemStreamUrl(song._id, 'instrumentals'),
                        type: 'clip',
                      })
                    : toast.error('Instrumentals stem not available')
                }
              />
            </div>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Remix title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-jamit-muted focus:border-jamit-green"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => {
                    const v = separated[0];
                    const i = separated[1] || separated[0];
                    createRemix(v, i);
                  }}
                  disabled={loading || separated.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-jamit-green px-5 py-3 text-sm font-semibold text-black transition hover:bg-jamit-green-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Disc3 className="h-4 w-4" />
                  {loading ? 'Creating...' : 'Create & Save Remix'}
                </button>

                <button
                  onClick={() => {
                    if (!createdRemix) {
                      toast.error('Create a remix first to preview');
                      return;
                    }
                    setTrack({
                      id: createdRemix._id,
                      title: createdRemix.title,
                      artist: createdRemix.creator?.displayName || 'You',
                      streamUrl: remixApi.streamUrl(createdRemix._id),
                      type: 'remix',
                    });
                  }}
                  disabled={!createdRemix}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Preview Export
                </button>

                <a
                  href={createdRemix ? remixApi.downloadUrl(createdRemix._id) : undefined}
                  download
                  onClick={(event) => {
                    if (!createdRemix) {
                      event.preventDefault();
                      toast.error('Create a remix first to enable export');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/40 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Export MP3
                </a>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel
            icon={Clock3}
            eyebrow="Timeline"
            title="Session sequence"
            description="From add to export, here is the edit path."
          >
            <div className="space-y-4">
              <SequenceStep step="01" title="Add" text="Add library tracks or upload new files into the workspace." />
              <SequenceStep step="02" title="Trim" text="Select a track and cut a valid section with FFmpeg." />
              <SequenceStep step="03" title="Merge" text="Choose two or more tracks and arrange their order before merging." />
              <SequenceStep step="04" title="Preview" text="Audition any track, clip, or the finished remix in the player." />
              <SequenceStep step="05" title="Export" text="Create, save, and download the remix using the current API." />
            </div>
          </Panel>

          <Panel
            icon={Headphones}
            eyebrow="Monitor"
            title="Session monitor"
            description="Preview tracks and exported results in the global player."
          >
            <div className="space-y-3">
              {workspace.slice(0, 5).map((track) => (
                <PreviewButton
                  key={track.id}
                  label={`${track.name} — ${track.artist}`}
                  sublabel={SOURCE_LABELS[track.sourceType]}
                  onClick={() => playTrack(track)}
                />
              ))}
              {workspace.length === 0 && (
                <p className="text-sm text-jamit-muted">Nothing to preview yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Disc3;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-white/10 bg-jamit-card/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jamit-muted">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-jamit-muted">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-jamit-green">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/25 px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-jamit-muted">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-jamit-muted">{hint}</p>
    </div>
  );
}

function TrimChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-jamit-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function VoiceTrackPicker({
  label,
  songs,
  onPlay,
}: {
  label: string;
  songs: LibrarySong[];
  onPlay: (song: LibrarySong) => void;
}) {
  const [selected, setSelected] = useState('');
  const pick = songs.find((s) => s._id === selected) || null;
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-jamit-muted">{label}</p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-jamit-green"
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {songs.map((s) => (
          <option key={s._id} value={s._id}>
            {s.title} - {s.artist}
          </option>
        ))}
      </select>
      <button
        onClick={() => pick && onPlay(pick)}
        disabled={!pick}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        Preview {label}
      </button>
    </div>
  );
}

function PreviewButton({
  label,
  sublabel,
  onClick,
}: {
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-jamit-green/15 text-jamit-green">
          <Play className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-jamit-muted">{sublabel}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-jamit-muted" />
    </button>
  );
}

function SequenceStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white">
        {step}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-jamit-muted">{text}</p>
      </div>
    </div>
  );
}

function formatSecs(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
