import React, { useEffect, useRef } from 'react';
import { synthEngine } from '../audio/synthEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barColor?: string;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  barColor = '#ec4899',
  height = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakCapsRef = useRef<number[]>([]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = synthEngine.getAnalyserNode();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const numBars = 28;
    if (peakCapsRef.current.length !== numBars) {
      peakCapsRef.current = new Array(numBars).fill(0);
    }

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Subtle ambient standby flicker
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying ? 0 : Math.sin(Date.now() * 0.003 + i * 0.4) * 12 + 14;
        }
      }

      const barWidth = Math.max(2, (width / numBars) - 2);
      const step = Math.floor(bufferLength / numBars);

      for (let i = 0; i < numBars; i++) {
        let val = 0;
        for (let j = 0; j < step; j++) {
          val += dataArray[i * step + j] || 0;
        }
        val = val / step;

        const percent = Math.min(1, val / 255);
        const barHeight = Math.max(3, percent * (h - 8));
        const x = i * (barWidth + 2);
        const y = h - barHeight;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#7928ca');
        grad.addColorStop(0.5, barColor);
        grad.addColorStop(1, '#06b6d4');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak caps
        const peaks = peakCapsRef.current;
        if (barHeight > peaks[i]) {
          peaks[i] = barHeight;
        } else {
          peaks[i] = Math.max(0, peaks[i] - 0.7);
        }

        const capY = Math.max(0, h - peaks[i] - 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x, capY, barWidth, 1.5);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, barColor]);

  return (
    <div className="w-full relative rounded bg-purple-950/40 p-1.5 border border-purple-900/50 backdrop-blur-xs">
      <div className="flex items-center justify-between text-[10px] text-purple-300/80 uppercase font-mono-retro mb-1 px-1 tracking-wider">
        <span>EQ Spectrum // 60Hz</span>
        <span>16kHz</span>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full block rounded bg-black/60 shadow-inner"
      />
    </div>
  );
};
