import type { Stroke } from './types';

export interface TimeLapseState {
  isPlaying: boolean;
  progress: number; // 0.0 to 1.0
  speed: number;    // 1, 2, 5, 10
  currentStrokeCount: number;
  totalStrokeCount: number;
}

export function getTimeLapseSlice(strokes: Stroke[], progress: number): Stroke[] {
  if (strokes.length === 0 || progress <= 0) return [];
  if (progress >= 1.0) return strokes;

  const count = Math.ceil(strokes.length * progress);
  return strokes.slice(0, count);
}
