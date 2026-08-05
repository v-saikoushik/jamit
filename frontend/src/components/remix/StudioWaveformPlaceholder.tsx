interface StudioWaveformPlaceholderProps {
  accent?: string;
  label?: string;
  sublabel?: string;
  startPercent?: number;
  endPercent?: number;
  cursorPercent?: number;
  bars?: number[];
}

const DEFAULT_BARS = [
  28, 42, 34, 58, 52, 68, 46, 62, 40, 56, 72, 48,
  36, 54, 66, 44, 60, 38, 50, 70, 46, 64, 42, 58,
  74, 52, 34, 48, 66, 40, 62, 46, 56, 72, 44, 60,
];

/** Decorative waveform placeholder for the Remix Studio timeline. */
export default function StudioWaveformPlaceholder({
  accent = 'from-jamit-green to-jamit-accent',
  label = 'Waveform Preview',
  sublabel = 'Visual placeholder for selected source audio',
  startPercent = 16,
  endPercent = 72,
  cursorPercent = 46,
  bars = DEFAULT_BARS,
}: StudioWaveformPlaceholderProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-jamit-muted">{sublabel}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-jamit-muted">
          Placeholder
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-white/5 bg-gradient-to-b from-white/5 to-transparent px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/5" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:48px_100%]" />

        <div className="relative flex h-28 items-end gap-1">
          {bars.map((bar, index) => (
            <div
              key={`${bar}-${index}`}
              className={`flex-1 rounded-full bg-gradient-to-t ${accent} opacity-80`}
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>

        <div
          className="absolute inset-y-4 rounded-2xl border border-jamit-green/50 bg-jamit-green/10"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(8, endPercent - startPercent)}%`,
          }}
        />
        <div
          className="absolute inset-y-3 w-px bg-white shadow-[0_0_18px_rgba(255,255,255,0.8)]"
          style={{ left: `${cursorPercent}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-jamit-muted">
        <span>00:00</span>
        <span>00:30</span>
        <span>01:00</span>
        <span>01:30</span>
      </div>
    </div>
  );
}
