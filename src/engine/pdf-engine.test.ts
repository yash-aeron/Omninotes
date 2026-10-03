import { describe, it, expect } from 'vitest';
import {
  isPdfFile,
  calculatePdfPageDimensions,
  sanitizePdfText,
  convertPdfPagesToNotebookPages,
  type PdfImportResult,
} from './pdf-engine';

describe('PDF Engine Utilities', () => {
  it('correctly identifies PDF files by extension and mime type', () => {
    expect(isPdfFile('document.pdf')).toBe(true);
    expect(isPdfFile('DOCUMENT.PDF')).toBe(true);
    expect(isPdfFile('notes.png')).toBe(false);

    const pdfFile = new File(['dummy'], 'lecture-notes.pdf', { type: 'application/pdf' });
    expect(isPdfFile(pdfFile)).toBe(true);

    const textFile = new File(['dummy'], 'notes.txt', { type: 'text/plain' });
    expect(isPdfFile(textFile)).toBe(false);
  });

  it('calculates proportional page dimensions preserving aspect ratio', () => {
    // Standard A4 ratio: 595.28 x 841.89 (portrait)
    const portraitDim = calculatePdfPageDimensions(595, 842, 820);
    expect(portraitDim.width).toBe(820);
    expect(portraitDim.height).toBeGreaterThan(1100);
    expect(portraitDim.height).toBeLessThan(1200);

    // Landscape slide: 960 x 540 (16:9)
    const landscapeDim = calculatePdfPageDimensions(960, 540, 960);
    expect(landscapeDim.width).toBe(960);
    expect(landscapeDim.height).toBe(540);
  });

  it('sanitizes and compacts extracted PDF text', () => {
    const raw = '   Chapter 1:\n\nIntroduction   to   Neural  Networks \n\n  Page 1   ';
    const clean = sanitizePdfText(raw);
    expect(clean).toBe('Chapter 1:\n\nIntroduction to Neural Networks\n\nPage 1');
  });

  it('converts PdfImportResult into valid PageMetadata array', () => {
    const mockResult: PdfImportResult = {
      title: 'Machine Learning Slides.pdf',
      totalPages: 2,
      pages: [
        {
          pageNumber: 1,
          width: 820,
          height: 1160,
          originalWidth: 595,
          originalHeight: 842,
          dataUrl: 'data:image/jpeg;base64,mock1',
          text: 'Slide 1: Overview of Supervised Learning',
        },
        {
          pageNumber: 2,
          width: 820,
          height: 1160,
          originalWidth: 595,
          originalHeight: 842,
          dataUrl: 'data:image/jpeg;base64,mock2',
          text: 'Slide 2: Cost Function & Optimization',
        },
      ],
    };

    const pages = convertPdfPagesToNotebookPages(mockResult);
    expect(pages).toHaveLength(2);

    expect(pages[0].title).toBe('Machine Learning Slides — Page 1');
    expect(pages[0].pdfBackground?.pageIndex).toBe(0);
    expect(pages[0].pdfBackground?.pdfName).toBe('Machine Learning Slides.pdf');
    expect(pages[0].aiTranscription).toBe('Slide 1: Overview of Supervised Learning');
    expect(pages[0].strokes).toEqual([]);
    expect(pages[0].pattern).toBe('blank');

    expect(pages[1].title).toBe('Machine Learning Slides — Page 2');
    expect(pages[1].pdfBackground?.pageIndex).toBe(1);
  });
});
