import type { Point, Stroke } from './types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Standard Ray-Casting algorithm: check if point (px, py) is inside polygon
 */
export function isPointInPolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a stroke is selected by a lasso polygon
 */
export function isStrokeInsideLasso(stroke: Stroke, lassoPolygon: Point[]): boolean {
  if (stroke.points.length === 0 || lassoPolygon.length < 3) return false;

  // If at least 30% of stroke points or the center is inside the polygon
  let insideCount = 0;
  for (const pt of stroke.points) {
    if (isPointInPolygon(pt.x, pt.y, lassoPolygon)) {
      insideCount++;
    }
  }

  return insideCount / stroke.points.length >= 0.25;
}

/**
 * Calculate the bounding box enclosing an array of strokes
 */
export function getStrokesBoundingBox(strokes: Stroke[]): BoundingBox | null {
  if (strokes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of strokes) {
    for (const p of s.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (minX === Infinity) return null;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Translate (move) strokes by offset dx, dy
 */
export function translateStrokes(strokes: Stroke[], dx: number, dy: number): Stroke[] {
  return strokes.map((s) => ({
    ...s,
    points: s.points.map((p) => ({
      ...p,
      x: p.x + dx,
      y: p.y + dy,
    })),
    pathData: undefined, // Will be recomputed by renderer
  }));
}
