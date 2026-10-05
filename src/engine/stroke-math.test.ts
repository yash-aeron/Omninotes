import { describe, it, expect } from 'vitest';
import { generateStrokePath, getPenStrokeOptions, isPointNearStroke } from './stroke-math';
import type { Point, StrokeStyle, Stroke } from './types';

describe('stroke-math engine', () => {
  const samplePoints: Point[] = [
    { x: 10, y: 10, pressure: 0.2 },
    { x: 20, y: 30, pressure: 0.5 },
    { x: 40, y: 60, pressure: 0.8 },
    { x: 80, y: 100, pressure: 0.4 },
  ];

  const defaultStyle: StrokeStyle = {
    penType: 'ballpoint',
    color: '#000000',
    size: 4,
    opacity: 1,
    smoothing: 0.5,
    thinning: 0.15,
    streamline: 0.4,
  };

  it('generates non-empty SVG path data for valid stroke points', () => {
    const path = generateStrokePath(samplePoints, defaultStyle);
    expect(path).toBeDefined();
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('handles empty points gracefully', () => {
    const path = generateStrokePath([], defaultStyle);
    expect(path).toBe('');
  });

  it('adjusts stroke options per pen type (fountain, brush, highlighter)', () => {
    const fountainOpts = getPenStrokeOptions({ ...defaultStyle, penType: 'fountain' });
    const brushOpts = getPenStrokeOptions({ ...defaultStyle, penType: 'brush' });
    const highlighterOpts = getPenStrokeOptions({ ...defaultStyle, penType: 'highlighter' });

    expect(fountainOpts.thinning).toBeGreaterThan(0.5);
    expect(brushOpts.size).toBeGreaterThan(fountainOpts.size || 0);
    expect(highlighterOpts.thinning).toBe(0);
  });

  it('correctly detects when a point hits a stroke for eraser', () => {
    const stroke: Stroke = {
      id: 'test-stroke-1',
      points: samplePoints,
      style: defaultStyle,
      createdAt: Date.now(),
    };

    // Point close to (20, 30)
    expect(isPointNearStroke({ x: 21, y: 31 }, stroke, 5)).toBe(true);
    // Point far away
    expect(isPointNearStroke({ x: 500, y: 500 }, stroke, 5)).toBe(false);
  });
});
