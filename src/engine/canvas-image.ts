import type { PageMetadata, Stroke } from './types';
import { generateStrokePath } from './stroke-math';

export interface RenderOptions {
  maxWidth?: number;
  maxHeight?: number;
  cropToContent?: boolean;
  highContrastForOcr?: boolean;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
}

/**
 * Calculates the bounding box of all strokes on the page.
 */
export function getStrokesBoundingBox(strokes: Stroke[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (strokes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const pt of stroke.points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  if (minX === Infinity) return null;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Renders page strokes and content to an HTML canvas and returns a Base64 data URL.
 */
export function renderPageToCanvas(
  page: PageMetadata,
  options: RenderOptions = {}
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const pageW = page.width || 800;
  const pageH = page.height || 1100;

  // Determine export dimensions and viewport
  let sourceX = 0;
  let sourceY = 0;
  let contentW = pageW;
  let contentH = pageH;

  const bbox = getStrokesBoundingBox(page.strokes);

  if (options.cropToContent && bbox && bbox.width > 20 && bbox.height > 20) {
    const pad = 40;
    sourceX = Math.max(0, bbox.minX - pad);
    sourceY = Math.max(0, bbox.minY - pad);
    contentW = Math.min(pageW - sourceX, bbox.width + pad * 2);
    contentH = Math.min(pageH - sourceY, bbox.height + pad * 2);
  }

  // Scale down if exceeds max bounds
  const maxWidth = options.maxWidth || 1200;
  const maxHeight = options.maxHeight || 1600;
  const scale = Math.min(1, maxWidth / contentW, maxHeight / contentH);

  canvas.width = Math.round(contentW * scale);
  canvas.height = Math.round(contentH * scale);

  ctx.scale(scale, scale);
  ctx.translate(-sourceX, -sourceY);

  // Background - high contrast crisp white paper for optimal OCR/Vision accuracy
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(sourceX, sourceY, contentW, contentH);

  // Render highlighters first
  const highlighters = page.strokes.filter((s) => s.style.penType === 'highlighter');
  for (const s of highlighters) {
    const pathString = s.pathData || generateStrokePath(s.points, s.style);
    if (!pathString) continue;
    try {
      const path = new Path2D(pathString);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = options.highContrastForOcr ? '#E2E8F0' : s.style.color || '#FACC15';
      ctx.fill(path);
    } catch {
      // Path parsing fallback
    }
  }

  // Render ink strokes
  const regularStrokes = page.strokes.filter((s) => s.style.penType !== 'highlighter');
  for (const s of regularStrokes) {
    const pathString = s.pathData || generateStrokePath(s.points, s.style);
    if (!pathString) continue;
    try {
      const path = new Path2D(pathString);
      ctx.globalAlpha = s.style.opacity || 1;
      ctx.fillStyle = options.highContrastForOcr ? '#111827' : s.style.color || '#111827';
      ctx.fill(path);
    } catch {
      // Fallback: draw line segments if Path2D is not supported
      ctx.strokeStyle = options.highContrastForOcr ? '#111827' : s.style.color || '#111827';
      ctx.lineWidth = s.style.size || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      s.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }
  }

  // Render typed text blocks if any
  ctx.globalAlpha = 1;
  for (const tb of page.textBlocks || []) {
    ctx.fillStyle = '#111827';
    ctx.font = `${tb.fontSize || 16}px sans-serif`;
    ctx.fillText(tb.text, tb.x, tb.y + (tb.fontSize || 16));
  }

  return canvas;
}

/**
 * Returns clean Base64 string of page canvas (without data:image prefix, ready for Ollama API)
 */
export function renderPageToBase64(
  page: PageMetadata,
  options: RenderOptions = {}
): string {
  const canvas = renderPageToCanvas(page, options);
  if (!canvas) return '';

  const format = options.format || 'image/jpeg';
  const quality = options.quality ?? 0.88;
  const dataUrl = canvas.toDataURL(format, quality);

  // Return base64 payload without header
  const commaIdx = dataUrl.indexOf(',');
  return commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
}
