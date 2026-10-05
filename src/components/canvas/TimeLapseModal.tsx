import React from 'react';
import { Play, Pause, RotateCcw, X, FastForward } from 'lucide-react';

interface TimeLapseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  progress: number;
  speed: number;
  currentStrokeIndex: number;
  totalStrokes: number;
  onTogglePlay: () => void;
  onSeek: (newProgress: number) => void;
  onCycleSpeed: () => void;
  onReset: () => void;
}

export const TimeLapseModal: React.FC<TimeLapseModalProps> = ({
  isOpen,
  onClose,
  isPlaying,
  progress,
  speed,
  currentStrokeIndex,
  totalStrokes,
  onTogglePlay,
  onSeek,
  onCycleSpeed,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 text-xs select-none">
      {/* Title & Info */}
      <div className="flex items-center gap-2 pr-2 border-r border-gray-800">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-semibold text-gray-200">Time-Lapse Replay</span>
      </div>

      {/* Controls: Reset, Play/Pause, Speed */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Restart from beginning"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={onTogglePlay}
          className="p-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm transition-all font-semibold"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={onCycleSpeed}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold transition-colors"
          title="Change playback speed"
        >
          <FastForward size={13} />
          <span>{speed}x</span>
        </button>
      </div>

      {/* Scrubber slider */}
      <div className="flex items-center gap-2.5 w-64">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={progress}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-white cursor-pointer"
        />
        <span className="font-mono text-zinc-400 w-12 text-right">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Stroke count */}
      <span className="text-gray-400 font-mono border-l border-gray-800 pl-3">
        {currentStrokeIndex} / {totalStrokes}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ml-1"
        title="Exit Replay Mode"
      >
        <X size={16} />
      </button>
    </div>
  );
};
