import { describe, it, expect } from 'vitest';
import { analyzeHandwrittenInk } from './ocr-engine';
import type { Stroke } from './types';

describe('OCR and Ink Trajectory Engine', () => {
  it('returns empty analysis for empty strokes array', () => {
    const res = analyzeHandwrittenInk([]);
    expect(res.recognizedText).toBe('');
    expect(res.wordCount).toBe(0);
  });

  it('detects word when typical stroke pattern is provided', () => {
    // 5 strokes simulating "Hello"
    const mockStrokes: Stroke[] = [
      {
        id: 's1',
        points: [{ x: 10, y: 10, pressure: 0.5 }, { x: 10, y: 80, pressure: 0.5 }],
        style: { penType: 'ballpoint', color: '#000', size: 2, opacity: 1, smoothing: 0.5, thinning: 0, streamline: 0 },
        createdAt: 1,
      },
      {
        id: 's2',
        points: [{ x: 30, y: 10, pressure: 0.5 }, { x: 30, y: 80, pressure: 0.5 }],
        style: { penType: 'ballpoint', color: '#000', size: 2, opacity: 1, smoothing: 0.5, thinning: 0, streamline: 0 },
        createdAt: 2,
      },
      {
        id: 's3',
        points: [{ x: 10, y: 45, pressure: 0.5 }, { x: 30, y: 45, pressure: 0.5 }],
        style: { penType: 'ballpoint', color: '#000', size: 2, opacity: 1, smoothing: 0.5, thinning: 0, streamline: 0 },
        createdAt: 3,
      },
      {
        id: 's4',
        points: [{ x: 50, y: 20, pressure: 0.5 }, { x: 50, y: 70, pressure: 0.5 }],
        style: { penType: 'ballpoint', color: '#000', size: 2, opacity: 1, smoothing: 0.5, thinning: 0, streamline: 0 },
        createdAt: 4,
      },
      {
        id: 's5',
        points: [{ x: 70, y: 20, pressure: 0.5 }, { x: 70, y: 70, pressure: 0.5 }],
        style: { penType: 'ballpoint', color: '#000', size: 2, opacity: 1, smoothing: 0.5, thinning: 0, streamline: 0 },
        createdAt: 5,
      },
    ];

    const res = analyzeHandwrittenInk(mockStrokes);
    expect(res.recognizedText).toBe('Hello');
    expect(res.confidence).toBeGreaterThan(0.7);
  });
});
