import React, { useRef, useState, useMemo } from 'react';
import type {
  Point,
  Stroke,
  StrokeStyle,
  PageMetadata,
  ViewMode,
  TextBlock,
  CodeBlock,
  ImageElement,
} from '../../engine/types';
import { generateStrokePath, isPointNearStroke } from '../../engine/stroke-math';
import { StylusInputArbiter } from '../../engine/palm-rejection';
import { recognizeShape } from '../../engine/shape-recognition';
import { isStrokeInsideLasso, getStrokesBoundingBox } from '../../engine/lasso';
import { getTimeLapseSlice } from '../../engine/time-lapse';
import { PaperTemplate } from './PaperTemplate';
import { Trash2 } from 'lucide-react';

interface StylusCanvasProps {
  page: PageMetadata;
  currentStyle: StrokeStyle;
  viewMode: ViewMode;
  zoom: number;
  pan: { x: number; y: number };
  isPanningMode: boolean;
  enablePalmRejection: boolean;
  allowTouchDrawing: boolean;
  autoSnapShapes: boolean;
  timeLapseProgress: number; // 1.0 = normal, < 1.0 = time lapse mode
  onStrokesChange: (strokes: Stroke[]) => void;
  onTextBlocksChange: (blocks: TextBlock[]) => void;
  onCodeBlocksChange: (blocks: CodeBlock[]) => void;
  onImagesChange: (images: ImageElement[]) => void;
  onPointerTelemetry?: (data: {
    pointerType: string;
    pressure: number;
    tiltX: number;
    tiltY: number;
    x: number;
    y: number;
  }) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
  onZoomChange?: (zoom: number) => void;
  onDropPdf?: (file: File) => void;
}

export const StylusCanvas: React.FC<StylusCanvasProps> = ({
  page,
  currentStyle,
  viewMode,
  zoom,
  pan,
  isPanningMode,
  enablePalmRejection,
  allowTouchDrawing,
  autoSnapShapes,
  timeLapseProgress,
  onStrokesChange,
  onTextBlocksChange,
  onCodeBlocksChange,
  onImagesChange,
  onPointerTelemetry,
  onPanChange,
  onZoomChange,
  onDropPdf,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-center page horizontally and vertically in classic mode
  React.useEffect(() => {
    const handleCenter = () => {
      if (!containerRef.current || viewMode !== 'classic') return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const centeredX = Math.max(20, Math.round((rect.width - page.width * zoom) / 2));
        const topMargin = 28;
        if (pan.x === 0 || Math.abs(pan.x - Math.round((rect.width - page.width * zoom) / 2)) < 80) {
          onPanChange?.({ x: centeredX, y: pan.y === 0 ? topMargin : pan.y });
        }
      }
    };
    handleCenter();
    window.addEventListener('resize', handleCenter);
    const ro = new ResizeObserver(() => handleCenter());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', handleCenter);
      ro.disconnect();
    };
  }, [viewMode, page.width, zoom, onPanChange]);

  // Lasso Selection State
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);

  const arbiter = useMemo(
    () =>
      new StylusInputArbiter({
        enablePalmRejection,
        allowTouchDrawing,
      }),
    [enablePalmRejection, allowTouchDrawing]
  );

  // Time-lapse slice calculation
  const visibleStrokes = useMemo(() => {
    if (timeLapseProgress >= 1.0) return page.strokes;
    return getTimeLapseSlice(page.strokes, timeLapseProgress);
  }, [page.strokes, timeLapseProgress]);

  // Live stroke SVG path
  const liveStrokePath = useMemo(() => {
    if (currentPoints.length === 0) return '';
    return generateStrokePath(currentPoints, currentStyle);
  }, [currentPoints, currentStyle]);

  // Separate regular vs highlighter strokes
  const { regularStrokes, highlighterStrokes } = useMemo(() => {
    const regular: Stroke[] = [];
    const highlighters: Stroke[] = [];
    visibleStrokes.forEach((stroke) => {
      if (stroke.style.penType === 'highlighter') {
        highlighters.push(stroke);
      } else {
        regular.push(stroke);
      }
    });
    return { regularStrokes: regular, highlighterStrokes: highlighters };
  }, [visibleStrokes]);

  // Selected strokes bounding box
  const selectedStrokes = useMemo(() => {
    return page.strokes.filter((s) => selectedStrokeIds.includes(s.id));
  }, [page.strokes, selectedStrokeIds]);

  const selectionBBox = useMemo(() => {
    return getStrokesBoundingBox(selectedStrokes);
  }, [selectedStrokes]);

  // Handle pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || isPanningMode || (e.pointerType === 'touch' && !allowTouchDrawing && !arbiter.shouldStartStroke(e))) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (!arbiter.shouldStartStroke(e)) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const points = arbiter.extractPoints(e, rect, zoom, pan);
    if (points.length === 0) return;

    // Eraser Mode
    if (currentStyle.penType === 'eraser') {
      const hitPoint = points[0];
      const remaining = page.strokes.filter(
        (s) => !isPointNearStroke(hitPoint, s, currentStyle.size * 2)
      );
      if (remaining.length !== page.strokes.length) {
        onStrokesChange(remaining);
      }
      setIsDrawing(true);
      return;
    }

    // Clear previous lasso selection if clicking outside
    if (currentStyle.penType !== 'lasso' && selectedStrokeIds.length > 0) {
      setSelectedStrokeIds([]);
    }

    setIsDrawing(true);
    setCurrentPoints(points);

    if (onPointerTelemetry) {
      const p = points[points.length - 1];
      onPointerTelemetry({
        pointerType: e.pointerType,
        pressure: p.pressure,
        tiltX: p.tiltX || 0,
        tiltY: p.tiltY || 0,
        x: Math.round(p.x),
        y: Math.round(p.y),
      });
    }

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning && onPanChange) {
      onPanChange({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawing) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const points = arbiter.extractPoints(e, rect, zoom, pan);
    if (points.length === 0) return;

    if (currentStyle.penType === 'eraser') {
      const hitPoint = points[0];
      const remaining = page.strokes.filter(
        (s) => !isPointNearStroke(hitPoint, s, currentStyle.size * 2)
      );
      if (remaining.length !== page.strokes.length) {
        onStrokesChange(remaining);
      }
      return;
    }

    setCurrentPoints((prev) => [...prev, ...points]);

    if (onPointerTelemetry) {
      const p = points[points.length - 1];
      onPointerTelemetry({
        pointerType: e.pointerType,
        pressure: p.pressure,
        tiltX: p.tiltX || 0,
        tiltY: p.tiltY || 0,
        x: Math.round(p.x),
        y: Math.round(p.y),
      });
    }
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;

    arbiter.endStroke(e.pointerId);
    setIsDrawing(false);

    // 1. Lasso Tool selection completion
    if (currentStyle.penType === 'lasso') {
      if (currentPoints.length > 5) {
        const insideStrokes = page.strokes.filter((s) =>
          isStrokeInsideLasso(s, currentPoints)
        );
        setSelectedStrokeIds(insideStrokes.map((s) => s.id));
      }
      setCurrentPoints([]);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    // 2. Normal Inking / Shape Recognition
    if (currentStyle.penType !== 'eraser' && currentPoints.length > 0) {
      let finalPoints = currentPoints;

      // Shape recognition auto-snap
      if (autoSnapShapes) {
        const recognized = recognizeShape(currentPoints);
        if (recognized.type !== 'none' && recognized.confidence > 0.8) {
          finalPoints = recognized.replacementPoints;
        }
      }

      const pathData = generateStrokePath(finalPoints, currentStyle);
      if (pathData) {
        const newStroke: Stroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          layerId: page.activeLayerId,
          points: finalPoints,
          style: { ...currentStyle },
          pathData,
          createdAt: Date.now(),
        };
        onStrokesChange([...page.strokes, newStroke]);
      }
    }

    setCurrentPoints([]);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    arbiter.endStroke(e.pointerId);
    setIsDrawing(false);
    setIsPanning(false);
    setCurrentPoints([]);
  };

  // Handle Drag & Drop of Images from Operating System
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      onDropPdf?.(file);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        const dropX = rect ? (e.clientX - rect.left - pan.x) / zoom : 100;
        const dropY = rect ? (e.clientY - rect.top - pan.y) / zoom : 100;

        const newImage: ImageElement = {
          id: `img-${Date.now()}`,
          layerId: page.activeLayerId,
          x: Math.max(0, dropX - 150),
          y: Math.max(0, dropY - 100),
          width: 300,
          height: 200,
          src: reader.result as string,
          name: file.name,
        };
        onImagesChange([...page.images, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete Lasso Selected Strokes
  const handleDeleteSelection = () => {
    onStrokesChange(page.strokes.filter((s) => !selectedStrokeIds.includes(s.id)));
    setSelectedStrokeIds([]);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      const newZoom = Math.min(2.5, Math.max(0.4, Number((zoom * zoomFactor).toFixed(2))));
      if (containerRef.current && onPanChange && onZoomChange) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
        onZoomChange(newZoom);
        onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
      }
    } else {
      if (onPanChange) {
        onPanChange({ x: Math.round(pan.x - e.deltaX), y: Math.round(pan.y - e.deltaY) });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-[#090b11] ${
        isPanningMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
    >
      {/* Viewport Transform Layer */}
      <div
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: viewMode === 'classic' ? page.width : '100%',
          height: viewMode === 'classic' ? page.height : '100%',
        }}
      >
        {/* Paper Page Container */}
        <div
          className={`relative ${
            viewMode === 'classic'
              ? 'rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/10 overflow-hidden'
              : 'w-full h-full'
          }`}
          style={{
            width: viewMode === 'classic' ? `${page.width}px` : '4000px',
            height: viewMode === 'classic' ? `${page.height}px` : '4000px',
          }}
        >
          {/* Paper Background Template */}
          <PaperTemplate
            pattern={page.pattern}
            theme={page.theme}
            width={viewMode === 'classic' ? page.width : 4000}
            height={viewMode === 'classic' ? page.height : 4000}
          />

          {/* PDF Page High-Res Background Layer */}
          {page.pdfBackground?.dataUrl && (
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center bg-white">
              <img
                src={page.pdfBackground.dataUrl}
                alt={`PDF Page ${page.pdfBackground.pageIndex + 1} - ${page.title}`}
                data-testid="pdf-page-background"
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </div>
          )}

          {/* Render Images on Canvas (can be annotated on top) */}
          {page.images.map((img) => (
            <div
              key={img.id}
              className="absolute group border border-dashed border-transparent hover:border-white/30 select-none"
              style={{
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                height: `${img.height}px`,
              }}
            >
              <img
                src={img.src}
                alt={img.name || 'Dropped image'}
                className="w-full h-full object-contain pointer-events-none rounded"
              />
              <button
                onClick={() => onImagesChange(page.images.filter((i) => i.id !== img.id))}
                className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity"
                title="Remove image"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Render Typed Text Blocks */}
          {page.textBlocks.map((tb) => (
            <div
              key={tb.id}
              className="absolute group p-2 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm"
              style={{
                left: `${tb.x}px`,
                top: `${tb.y}px`,
                width: `${tb.width}px`,
                fontSize: `${tb.fontSize}px`,
                color: tb.color,
              }}
            >
              <textarea
                value={tb.text}
                onChange={(e) => {
                  onTextBlocksChange(
                    page.textBlocks.map((t) =>
                      t.id === tb.id ? { ...t, text: e.target.value } : t
                    )
                  );
                }}
                className="w-full bg-transparent resize-none outline-none font-sans"
              />
              <button
                onClick={() => onTextBlocksChange(page.textBlocks.filter((t) => t.id !== tb.id))}
                className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Render Code Blocks */}
          {page.codeBlocks.map((cb) => (
            <div
              key={cb.id}
              className="absolute group p-3 bg-zinc-950/90 text-zinc-200 border border-zinc-800 rounded-xl shadow-lg font-mono text-xs"
              style={{
                left: `${cb.x}px`,
                top: `${cb.y}px`,
                width: `${cb.width}px`,
              }}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>{cb.language}</span>
                <button
                  onClick={() => onCodeBlocksChange(page.codeBlocks.filter((c) => c.id !== cb.id))}
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                value={cb.code}
                onChange={(e) => {
                  onCodeBlocksChange(
                    page.codeBlocks.map((c) =>
                      c.id === cb.id ? { ...c, code: e.target.value } : c
                    )
                  );
                }}
                className="w-full bg-transparent resize-none outline-none font-mono text-xs leading-relaxed"
                rows={5}
              />
            </div>
          ))}

          {/* SVG Inking Vector Rendering Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${viewMode === 'classic' ? page.width : 4000} ${
              viewMode === 'classic' ? page.height : 4000
            }`}
          >
            {/* Highlighters Group */}
            <g style={{ mixBlendMode: 'multiply' }}>
              {highlighterStrokes.map((stroke) => (
                <path
                  key={stroke.id}
                  d={stroke.pathData || generateStrokePath(stroke.points, stroke.style)}
                  fill={stroke.style.color}
                  opacity={0.4}
                />
              ))}
              {isDrawing && currentStyle.penType === 'highlighter' && liveStrokePath && (
                <path d={liveStrokePath} fill={currentStyle.color} opacity={0.4} />
              )}
            </g>

            {/* Standard Ink Layer */}
            <g>
              {regularStrokes.map((stroke) => {
                const isSelected = selectedStrokeIds.includes(stroke.id);
                return (
                  <path
                    key={stroke.id}
                    d={stroke.pathData || generateStrokePath(stroke.points, stroke.style)}
                    fill={isSelected ? '#6366f1' : stroke.style.color}
                    opacity={stroke.style.opacity || 1}
                  />
                );
              })}

              {/* Live Inking Stroke */}
              {isDrawing &&
                currentStyle.penType !== 'highlighter' &&
                currentStyle.penType !== 'eraser' &&
                currentStyle.penType !== 'lasso' &&
                liveStrokePath && (
                  <path d={liveStrokePath} fill={currentStyle.color} opacity={currentStyle.opacity || 1} />
                )}

              {/* Live Lasso Outline Loop */}
              {isDrawing && currentStyle.penType === 'lasso' && currentPoints.length > 1 && (
                <polyline
                  points={currentPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(99, 102, 241, 0.12)"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          </svg>

          {/* Lasso Selection Bounding Box & Action Overlay */}
          {selectionBBox && selectedStrokeIds.length > 0 && (
            <div
              className="absolute border-2 border-dashed border-white/50 bg-white/5 pointer-events-auto rounded-lg"
              style={{
                left: `${selectionBBox.minX - 8}px`,
                top: `${selectionBBox.minY - 8}px`,
                width: `${selectionBBox.width + 16}px`,
                height: `${selectionBBox.height + 16}px`,
              }}
            >
              <div className="absolute -top-7 left-0 flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[11px] text-white shadow">
                <span>{selectedStrokeIds.length} strokes</span>
                <button
                  onClick={handleDeleteSelection}
                  className="ml-1.5 p-0.5 text-rose-400 hover:text-rose-300"
                  title="Delete Selection"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
