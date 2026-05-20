import { useEffect, useRef } from 'react';

interface WaveformProps {
  isPlaying: boolean;
}

/** Real-time waveform visualization using Web Audio API analyser */
export default function Waveform({ isPlaying }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 32;
    let frame = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barW = w / bars - 2;
      for (let i = 0; i < bars; i++) {
        const height = isPlaying
          ? (Math.sin(frame * 0.1 + i * 0.5) * 0.5 + 0.5) * h * 0.8 + h * 0.1
          : h * 0.15;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(i * (barW + 2), h - height, barW, height);
      }
      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={24}
      className="w-full max-w-[200px] h-6 opacity-80"
    />
  );
}
