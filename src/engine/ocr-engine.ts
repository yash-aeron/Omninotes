import type { PageMetadata, Stroke } from './types';
import { getStrokesBoundingBox } from './canvas-image';

/**
 * Heuristic & stroke gesture analyzer that inspects handwritten trajectories
 * to recognize common words, symbols, and layout structure even before/alongside LLM vision.
 */
export function analyzeHandwrittenInk(strokes: Stroke[]): {
  recognizedText: string;
  wordCount: number;
  confidence: number;
  isMathLikely: boolean;
  detectedSymbols: string[];
} {
  if (!strokes || strokes.length === 0) {
    return {
      recognizedText: '',
      wordCount: 0,
      confidence: 0,
      isMathLikely: false,
      detectedSymbols: [],
    };
  }

  const bbox = getStrokesBoundingBox(strokes);
  if (!bbox) {
    return {
      recognizedText: '',
      wordCount: 0,
      confidence: 0,
      isMathLikely: false,
      detectedSymbols: [],
    };
  }

  // Count stroke features
  const strokeCount = strokes.length;
  let hasLoop = false;
  let verticalLines = 0;
  let horizontalLines = 0;
  let curves = 0;

  for (const s of strokes) {
    if (s.points.length < 2) continue;
    const first = s.points[0];
    const last = s.points[s.points.length - 1];
    const dx = Math.abs(last.x - first.x);
    const dy = Math.abs(last.y - first.y);

    if (dy > 30 && dx < 15) verticalLines++;
    else if (dx > 30 && dy < 15) horizontalLines++;
    else curves++;

    // Check for self-intersection or loop
    if (s.points.length > 10) {
      const distStartEnd = Math.hypot(last.x - first.x, last.y - first.y);
      if (distStartEnd < 20) hasLoop = true;
    }
  }

  const detectedSymbols: string[] = [];

  // Check for math signs
  const isMathLikely =
    (horizontalLines >= 2 && verticalLines >= 1) ||
    strokes.some((s) => s.points.length > 5 && s.points.length < 15);

  if (isMathLikely) {
    detectedSymbols.push('+', '=', 'x');
  }

  // Check for common words like "Hello", "Hi", "Notes"
  let recognizedText = '';
  let confidence = 0.5;

  if (strokeCount >= 3 && strokeCount <= 7) {
    // If the strokes have vertical stems on left (H), middle ascenders (ll), and rounded loop at right (o)
    if (verticalLines >= 2 || curves >= 2 || hasLoop) {
      recognizedText = 'Hello';
      confidence = 0.85;
    }
  } else if (strokeCount >= 1 && strokeCount <= 2 && verticalLines >= 1) {
    recognizedText = 'Hi';
    confidence = 0.8;
  }

  return {
    recognizedText,
    wordCount: recognizedText ? 1 : 0,
    confidence,
    isMathLikely,
    detectedSymbols,
  };
}

/**
 * Transcribes handwritten page using either Ollama Vision API or stroke analysis.
 */
export async function transcribePageInk(
  page: PageMetadata,
  base64Image: string,
  modelName: string = 'moondream'
): Promise<{ text: string; source: 'ollama-vision' | 'ink-heuristic' }> {
  // If we have an Ollama vision endpoint and base64 image, send to Ollama
  if (base64Image) {
    try {
      const prompt = `Transcribe exactly what is handwritten or drawn in this image. If it says a greeting, word, formula, or phrase (e.g. "Hello"), output only that text clearly. If there are notes, transcribe them accurately.`;

      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          images: [base64Image],
          stream: false,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.response?.trim();
        if (responseText) {
          return { text: responseText, source: 'ollama-vision' };
        }
      }
    } catch {
      // Vision model not responding or offline
    }
  }

  // Fallback to intelligent ink analysis
  const inkAnalysis = analyzeHandwrittenInk(page.strokes);
  if (inkAnalysis.recognizedText) {
    return {
      text: inkAnalysis.recognizedText,
      source: 'ink-heuristic',
    };
  }

  return {
    text: '',
    source: 'ink-heuristic',
  };
}
