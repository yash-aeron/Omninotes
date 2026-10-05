import { getStroke } from 'perfect-freehand';
import type { StrokeOptions } from 'perfect-freehand';
import type { Point, Stroke, StrokeStyle } from './types';

/**
 * Configure perfect-freehand options tailored to each specific pen physical behavior
 */
export function getPenStrokeOptions(style: StrokeStyle): StrokeOptions {
  const baseSize = style.size;

  switch (style.penType) {
    case 'ballpoint':
      return {
        size: baseSize,
        thinning: 0.15,
        smoothing: 0.5,
        streamline: 0.4,
        simulatePressure: false,
        last: true,
      };

    case 'fountain':
      return {
        size: baseSize * 1.1,
        thinning: 0.65,
        smoothing: 0.65,
        streamline: 0.5,
        simulatePressure: false,
        start: {
          cap: true,
          taper: 4,
        },
        end: {
          cap: true,
          taper: 8,
        },
        last: true,
      };

    case 'calligraphy':
      return {
        size: baseSize * 1.3,
        thinning: -0.25, // Reverse thinning to mimic chisel angle
        smoothing: 0.3,
        streamline: 0.35,
        simulatePressure: false,
        last: true,
      };

    case 'brush':
      return {
        size: baseSize * 1.6,
        thinning: 0.85,
        smoothing: 0.7,
        streamline: 0.6,
        simulatePressure: false,
        start: {
          cap: true,
          taper: 12,
        },
        end: {
          cap: true,
          taper: 18,
        },
        last: true,
      };

    case 'highlighter':
      return {
        size: Math.max(baseSize * 3.2, 18),
        thinning: 0,
        smoothing: 0.8,
        streamline: 0.75,
        simulatePressure: false,
        last: true,
      };

    case 'eraser':
    default:
      return {
        size: baseSize * 2,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: false,
        last: true,
      };
  }
}

/**
 * Convert an array of outline points into a smooth SVG bezier path
 */
export function getSvgPathFromStrokeOutline(strokeOutline: number[][], closed: boolean = true): string {
  const len = strokeOutline.length;
  if (len === 0) return '';
  if (len === 1) {
    const [x, y] = strokeOutline[0];
    return `M ${x} ${y} m -1, 0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0`;
  }

  const d = strokeOutline.reduce(
    (acc: (string | number)[], [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...strokeOutline[0], 'Q']
  );

  if (closed) {
    d.push('Z');
  }

  return d.join(' ');
}

/**
 * Generate a complete SVG path string from raw captured stylus points
 */
export function generateStrokePath(points: Point[], style: StrokeStyle): string {
  if (points.length === 0) return '';
  
  // Format points as [x, y, pressure] for perfect-freehand
  const inputPoints = points.map((p) => [
    p.x,
    p.y,
    p.pressure > 0 ? p.pressure : 0.5,
  ]);

  const options = getPenStrokeOptions(style);
  const outline = getStroke(inputPoints, options);
  return getSvgPathFromStrokeOutline(outline);
}

/**
 * Check if a point hits a stroke (bounding box + distance test for eraser)
 */
export function isPointNearStroke(point: { x: number; y: number }, stroke: Stroke, radius: number = 10): boolean {
  for (const pt of stroke.points) {
    const dx = pt.x - point.x;
    const dy = pt.y - point.y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius + stroke.style.size / 2) {
      return true;
    }
  }
  return false;
}
