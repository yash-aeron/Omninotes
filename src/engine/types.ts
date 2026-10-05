export type PointerType = 'mouse' | 'pen' | 'touch';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  time?: number;
}

export type PenType = 
  | 'ballpoint' 
  | 'fountain' 
  | 'calligraphy' 
  | 'brush' 
  | 'highlighter' 
  | 'eraser'
  | 'lasso';

export interface StrokeStyle {
  penType: PenType;
  color: string;
  size: number;
  opacity: number;
  smoothing: number;
  thinning: number;
  streamline: number;
}

export interface Stroke {
  id: string;
  layerId?: string;
  points: Point[];
  style: StrokeStyle;
  pathData?: string; // Precomputed SVG path string
  createdAt: number;
}

export type PaperPattern = 
  | 'blank' 
  | 'ruled' 
  | 'grid' 
  | 'dotted' 
  | 'cornell' 
  | 'isometric'
  | 'music'
  | 'daily-journal'
  | 'meeting-notes'
  | 'lecture-notes'
  | 'code-split';

export type PaperTheme = 
  | 'white' 
  | 'ivory' 
  | 'legal-yellow' 
  | 'dark-slate' 
  | 'oled-black';

export interface TextBlock {
  id: string;
  layerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface CodeBlock {
  id: string;
  layerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  language: string;
  code: string;
}

export interface ImageElement {
  id: string;
  layerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string; // base64 or blob URL
  name?: string;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface PdfBackground {
  dataUrl: string; // High-resolution rasterized rendering of the PDF page
  originalWidth: number; // Native PDF point width
  originalHeight: number; // Native PDF point height
  pageIndex: number; // 0-based page index
  pdfName?: string; // Original filename
  extractedText?: string; // Text content extracted from the PDF page
}

export interface PageMetadata {
  id: string;
  title: string;
  pattern: PaperPattern;
  theme: PaperTheme;
  width: number; // e.g. 820 standard classic A4 ratio
  height: number; // e.g. 1160
  pdfBackground?: PdfBackground;
  layers: CanvasLayer[];
  activeLayerId: string;
  strokes: Stroke[];
  textBlocks: TextBlock[];
  codeBlocks: CodeBlock[];
  images: ImageElement[];
  aiTranscription?: string;
  tags?: string[];
  pinned?: boolean;
  backlinks?: string[]; // linked page IDs
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'classic' | 'infinite';

export interface Section {
  id: string;
  title: string;
  pages: PageMetadata[];
  activePageIndex: number;
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  sections: Section[];
  activeSectionId: string;
  createdAt: number;
  updatedAt: number;
}
