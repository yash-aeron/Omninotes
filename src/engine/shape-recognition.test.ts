import { describe, it, expect } from 'vitest';
import { recognizeShape } from './shape-recognition';
import type { Point } from './types';

describe('shape-recognition engine', () => {
  it('correctly identifies a straight line', () => {
    // Generate slightly noisy straight horizontal line
    const points: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      points.push({
        x: 10 + i * 10,
        y: 50 + (Math.sin(i) * 0.5), // slight jitter
        pressure: 0.5,
      });
    }

    const recognized = recognizeShape(points);
    expect(recognized.type).toBe('line');
    expect(recognized.confidence).toBeGreaterThan(0.9);
    expect(recognized.replacementPoints.length).toBeGreaterThan(5);
  });

  it('correctly identifies a drawn circle', () => {
    const points: Point[] = [];
    const cx = 100;
    const cy = 100;
    const r = 50;
    for (let i = 0; i <= 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        pressure: 0.5,
      });
    }

    const recognized = recognizeShape(points);
    expect(recognized.type).toBe('circle');
    expect(recognized.confidence).toBeGreaterThan(0.8);
  });

  it('returns none for irregular cursive handwriting', () => {
    const points: Point[] = [
      { x: 10, y: 10, pressure: 0.4 },
      { x: 20, y: 50, pressure: 0.6 },
      { x: 40, y: 10, pressure: 0.3 },
      { x: 60, y: 80, pressure: 0.7 },
      { x: 80, y: 20, pressure: 0.5 },
      { x: 100, y: 90, pressure: 0.8 },
      { x: 120, y: 10, pressure: 0.4 },
      { x: 140, y: 70, pressure: 0.6 },
      { x: 160, y: 30, pressure: 0.5 },
    ];

    const recognized = recognizeShape(points);
    expect(recognized.type).toBe('none');
  });
});
