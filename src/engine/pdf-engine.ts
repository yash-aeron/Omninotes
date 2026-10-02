import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PageMetadata, CanvasLayer, PdfBackground } from './types';

// Configure pdfjs worker for Vite & Electron environments
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || './pdf.worker.min.mjs';
}

export interface PdfPageData {
  pageNumber: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  dataUrl: string;
  text?: string;
}

export interface PdfImportResult {
  title: string;
  totalPages: number;
  pages: PdfPageData[];
}

export interface PdfParseOptions {
  maxPages?: number;
  baseTargetWidth?: number;
  renderScale?: number;
  onProgress?: (current: number, total: number, message: string) => void;
}

const DEFAULT_LAYERS: CanvasLayer[] = [
  { id: 'layer-1', name: 'Layer 1 (Background)', visible: true, locked: false, opacity: 1 },
  { id: 'layer-2', name: 'Layer 2 (Notes & Ink)', visible: true, locked: false, opacity: 1 },
];

/**
 * Checks if a file or filename has a PDF MIME type or extension.
 */
export function isPdfFile(fileOrName: File | string): boolean {
  if (typeof fileOrName === 'string') {
    return fileOrName.toLowerCase().endsWith('.pdf');
  }
  if (fileOrName.type === 'application/pdf') return true;
  return fileOrName.name.toLowerCase().endsWith('.pdf');
}

/**
 * Calculates page dimensions normalized around base width while strictly preserving aspect ratio.
 */
export function calculatePdfPageDimensions(
  origW: number,
  origH: number,
  baseTargetWidth: number = 820
): { width: number; height: number; scale: number } {
  const safeW = origW > 0 ? origW : 595;
  const safeH = origH > 0 ? origH : 842;
  const aspectRatio = safeH / safeW;

  let width = baseTargetWidth;
  // If default baseTargetWidth was used and document is a wide landscape presentation (e.g. 16:9)
  if (baseTargetWidth === 820 && safeW > safeH * 1.25) {
    width = 960;
  }

  const height = Math.round(width * aspectRatio);
  const scale = width / safeW;

  return { width, height, scale };
}

/**
 * Sanitizes and cleans extracted text from PDF streams.
 */
export function sanitizePdfText(raw: string): string {
  if (!raw) return '';
  return raw
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses and renders a PDF document into high-resolution page canvases and extracted text.
 */
export async function parsePdfDocument(
  source: ArrayBuffer | Uint8Array,
  filename: string = 'Document.pdf',
  options: PdfParseOptions = {}
): Promise<PdfImportResult> {
  const {
    maxPages = 100,
    baseTargetWidth = 820,
    renderScale = 2.0, // 2x retina sharpness
    onProgress,
  } = options;

  onProgress?.(0, 1, 'Initializing PDF reader engine...');

  const loadingTask = pdfjsLib.getDocument({
    data: source instanceof Uint8Array ? source : new Uint8Array(source),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPagesInDoc = pdfDoc.numPages;
  const pagesToLoad = Math.min(totalPagesInDoc, maxPages);

  const pagesData: PdfPageData[] = [];

  for (let pageNum = 1; pageNum <= pagesToLoad; pageNum++) {
    onProgress?.(
      pageNum,
      pagesToLoad,
      `Rendering page ${pageNum} of ${pagesToLoad}...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });

    const { width, height, scale: baseScale } = calculatePdfPageDimensions(
      unscaledViewport.width,
      unscaledViewport.height,
      baseTargetWidth
    );

    // Multiplied by renderScale for crisp high-DPI display
    const finalViewport = page.getViewport({ scale: baseScale * renderScale });

    let dataUrl = '';
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(finalViewport.width);
      canvas.height = Math.round(finalViewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        await page.render({
          canvasContext: ctx,
          viewport: finalViewport,
          canvas: canvas,
        }).promise;

        dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      }
    }

    // Extract text content for instant search and AI chat context
    let extractedText = '';
    try {
      const textContent = await page.getTextContent();
      const rawText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      extractedText = sanitizePdfText(rawText);
    } catch {
      // Non-critical if text extraction fails on scanned image PDFs
    }

    pagesData.push({
      pageNumber: pageNum,
      width,
      height,
      originalWidth: unscaledViewport.width,
      originalHeight: unscaledViewport.height,
      dataUrl,
      text: extractedText,
    });
  }

  onProgress?.(pagesToLoad, pagesToLoad, 'PDF processing complete!');

  return {
    title: filename,
    totalPages: pagesData.length,
    pages: pagesData,
  };
}

/**
 * Converts a parsed PdfImportResult into standard Omninotes PageMetadata objects.
 */
export function convertPdfPagesToNotebookPages(
  result: PdfImportResult,
  options?: { customTitlePrefix?: string }
): PageMetadata[] {
  const cleanTitle = (result.title || 'PDF Document').replace(/\.[^/.]+$/, '');
  const prefix = options?.customTitlePrefix || cleanTitle;
  const now = Date.now();

  return result.pages.map((p, idx) => {
    const pageId = `pdf-page-${now}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
    const pdfBg: PdfBackground = {
      dataUrl: p.dataUrl,
      originalWidth: p.originalWidth,
      originalHeight: p.originalHeight,
      pageIndex: idx,
      pdfName: result.title,
      extractedText: p.text,
    };

    return {
      id: pageId,
      title: `${prefix} — Page ${p.pageNumber}`,
      pattern: 'blank',
      theme: 'white',
      width: p.width,
      height: p.height,
      pdfBackground: pdfBg,
      layers: DEFAULT_LAYERS,
      activeLayerId: 'layer-2',
      strokes: [],
      textBlocks: [],
      codeBlocks: [],
      images: [],
      aiTranscription: p.text ? p.text : undefined,
      createdAt: now,
      updatedAt: now,
    };
  });
}
