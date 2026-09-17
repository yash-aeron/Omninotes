import type { Point } from './types';

export type DetectedShapeType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'none';

export interface RecognizedShape {
  type: DetectedShapeType;
  confidence: number;
  replacementPoints: Point[];
}

/**
 * Calculate Euclidean distance between two points
 */
function dist(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate path length of points
 */
function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += dist(points[i], points[i + 1]);
  }
  return len;
}

/**
 * Detect geometric primitive from a raw stroke points array
 */
export function recognizeShape(points: Point[]): RecognizedShape {
  if (points.length < 8) {
    return { type: 'none', confidence: 0, replacementPoints: points };
  }

  const start = points[0];
  const end = points[points.length - 1];
  const totalLength = pathLength(points);
  const directDist = dist(start, end);

  // 1. Detect Straight Line
  // If direct distance is nearly equal to total path length
  if (directDist > 30 && directDist / totalLength > 0.93) {
    // Generate a perfectly straight line with interpolated pressure
    const numSteps = 12;
    const replacement: Point[] = [];
    const avgPressure = points.reduce((acc, p) => acc + p.pressure, 0) / points.length;

    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      replacement.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        pressure: avgPressure,
        time: start.time,
      });
    }

    return {
      type: 'line',
      confidence: directDist / totalLength,
      replacementPoints: replacement,
    };
  }

  // 2. Closed Shapes (Circle, Rectangle, Triangle)
  const isClosed = directDist < totalLength * 0.2 || directDist < 35;

  if (isClosed && totalLength > 60) {
    // Calculate Bounding Box and Center
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const radius = (width + height) / 4;
    const avgPressure = points.reduce((acc, p) => acc + p.pressure, 0) / points.length;

    // Check circularity: variance of distances from center
    let radiusDiffSum = 0;
    for (const p of points) {
      const d = dist(p, { x: centerX, y: centerY, pressure: 0 });
      radiusDiffSum += Math.abs(d - radius);
    }
    const avgRadiusDiff = radiusDiffSum / points.length;
    const circularity = avgRadiusDiff / radius;

    // Circle / Ellipse Detection
    if (circularity < 0.22 && Math.abs(width - height) / Math.max(width, height) < 0.35) {
      const replacement: Point[] = [];
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        replacement.push({
          x: centerX + Math.cos(theta) * radius,
          y: centerY + Math.sin(theta) * radius,
          pressure: avgPressure,
          time: start.time,
        });
      }
      return {
        type: 'circle',
        confidence: 1 - circularity,
        replacementPoints: replacement,
      };
    }

    // Rectangle / Square Detection
    // A rectangle has points clustering near the 4 bounding box edges
    let boxDeviationSum = 0;
    for (const p of points) {
      const dLeft = Math.abs(p.x - minX);
      const dRight = Math.abs(p.x - maxX);
      const dTop = Math.abs(p.y - minY);
      const dBottom = Math.abs(p.y - maxY);
      boxDeviationSum += Math.min(dLeft, dRight, dTop, dBottom);
    }
    const avgBoxDev = boxDeviationSum / points.length;
    const rectScore = avgBoxDev / Math.max(width, height);

    if (rectScore < 0.16) {
      // Build perfect rectangle path
      const replacement: Point[] = [];
      const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
        { x: minX, y: minY },
      ];

      for (let c = 0; c < 4; c++) {
        const c1 = corners[c];
        const c2 = corners[c + 1];
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          replacement.push({
            x: c1.x + (c2.x - c1.x) * t,
            y: c1.y + (c2.y - c1.y) * t,
            pressure: avgPressure,
            time: start.time,
          });
        }
      }
      replacement.push({ ...corners[0], pressure: avgPressure, time: start.time });

      return {
        type: 'rectangle',
        confidence: 1 - rectScore,
        replacementPoints: replacement,
      };
    }
  }

  return { type: 'none', confidence: 0, replacementPoints: points };
}
