import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  PenTool,
  Feather,
  Edit3,
  Highlighter,
  Eraser,
  LassoSelect,
  Shapes,
  Hand,
  Type,
  Code,
  Sparkles,
  Undo2,
  Redo2,
  Layers,
  Play,
  FileDown,
  Maximize2,
  Minimize2,
  Grid,
  Palette,
  Trash2,
  ChevronDown,
  Check,
  Cpu,
  LayoutGrid,
  FilePlus,
  FileUp,
} from 'lucide-react';
import type { PenType, PaperPattern, PaperTheme, ViewMode } from '../../engine/types';

interface StudioToolbarProps {
  notebookTitle: string;
  pageTitle: string;
  currentPen: PenType;
  currentColor: string;
  currentSize: number;
  isPanningMode: boolean;
  autoSnapShapes: boolean;
  isFocusMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentPattern: PaperPattern;
  currentTheme: PaperTheme;
  viewMode: ViewMode;
  showAiSplit: boolean;
  showLayers: boolean;
  showPagesPanel?: boolean;
  pageCount?: number;
  onBackToLibrary: () => void;
  onTogglePagesPanel?: () => void;
  onOpenAddPageModal?: () => void;
  onImportPdf?: (file: File) => void;
  onUpdatePageTitle: (title: string) => void;
  onSelectPen: (pen: PenType) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onTogglePanning: () => void;
  onToggleAutoSnap: () => void;
  onToggleFocusMode: () => void;
  onToggleTimeLapse: () => void;
  onToggleLayers: () => void;
  onAddTextBlock: () => void;
  onAddCodeBlock: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectPattern: (pattern: PaperPattern) => void;
  onSelectTheme: (theme: PaperTheme) => void;
  onToggleViewMode: () => void;
  onToggleAiSplit: () => void;
  onToggleMcp?: () => void;
  onClearPage: () => void;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onExportSVG: () => void;
}

const CURATED_INKS = [
  { name: 'Onyx Black', hex: '#090a0f' },
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Royal Indigo', hex: '#3b82f6' },
  { name: 'Deep Navy', hex: '#1e3a8a' },
  { name: 'Forest Emerald', hex: '#059669' },
  { name: 'Crimson Wine', hex: '#dc2626' },
  { name: 'Tuscan Amber', hex: '#d97706' },
  { name: 'Amethyst Violet', hex: '#9333ea' },
  { name: 'Fluorescent Yellow', hex: '#eab308' },
  { name: 'Chalk White', hex: '#f8fafc' },
];

const PRESET_THICKNESSES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Broad', size: 8 },
  { label: 'Marker', size: 16 },
];

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  notebookTitle,
  pageTitle,
  currentPen,
  currentColor,
  currentSize,
  isPanningMode,
  autoSnapShapes,
  isFocusMode,
  canUndo,
  canRedo,
  currentPattern,
  currentTheme,
  viewMode,
  showAiSplit,
  showLayers,
  showPagesPanel = false,
  pageCount,
  onBackToLibrary,
  onTogglePagesPanel,
  onOpenAddPageModal,
  onImportPdf,
  onUpdatePageTitle,
  onSelectPen,
  onSelectColor,
  onSelectSize,
  onTogglePanning,
  onToggleAutoSnap,
  onToggleFocusMode,
  onToggleTimeLapse,
  onToggleLayers,
  onAddTextBlock,
  onAddCodeBlock,
  onUndo,
  onRedo,
  onSelectPattern,
  onSelectTheme,
  onToggleViewMode,
  onToggleAiSplit,
  onToggleMcp,
  onClearPage,
  onExportPDF,
  onExportMarkdown,
  onExportSVG,
}) => {
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showPenPopover, setShowPenPopover] = useState(false);
  const [showSizePopover, setShowSizePopover] = useState(false);
  const [showPaperPopover, setShowPaperPopover] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(pageTitle);

  // Quick 3 ink palette slots
  const [favoriteColors, setFavoriteColors] = useState(['#090a0f', '#2563eb', '#dc2626']);

  useEffect(() => {
    setTempTitle(pageTitle);
  }, [pageTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdatePageTitle(tempTitle.trim());
    }
  };

  const handleSelectColorSlot = (hex: string) => {
    onSelectColor(hex);
    if (!favoriteColors.includes(hex)) {
      setFavoriteColors([hex, favoriteColors[0], favoriteColors[1]]);
    }
    setShowColorPopover(false);
  };

  if (isFocusMode) {
    return (
      <button
        onClick={onToggleFocusMode}
        className="fixed top-4 right-4 z-40 p-2.5 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl text-zinc-300 hover:text-white shadow-xl transition-all"
        title="Exit Focus Mode (F11)"
      >
        <Minimize2 size={16} />
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col z-30 select-none bg-[#0d0f17] border-b border-white/5 flex-shrink-0">
      {/* 1. Top Header: Navigation & Global Tools */}
      <header className="h-11 px-4 flex items-center justify-between border-b border-white/5 bg-[#0a0c12]">
        {/* Left: Back to Library + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-medium text-zinc-300 hover:text-white transition-all border border-white/5"
            title="Return to Library Shelf"
          >
            <ChevronLeft size={15} />
            <span>Library</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* GoodNotes Pages Side Panel Toggle */}
          {onTogglePagesPanel && (
            <button
              onClick={onTogglePagesPanel}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                showPagesPanel
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5'
              }`}
              title="Pages Thumbnail Overview (Ctrl+Shift+P)"
            >
              <LayoutGrid size={13} className={showPagesPanel ? 'text-zinc-950' : 'text-zinc-400'} />
              <span>Pages{pageCount !== undefined ? ` (${pageCount})` : ''}</span>
            </button>
          )}

          {/* Add Page with Template Trigger */}
          {onOpenAddPageModal && (
            <button
              onClick={onOpenAddPageModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium border border-white/5 transition-all"
              title="Add Page with Template"
            >
              <FilePlus size={13} className="text-zinc-400" />
              <span className="hidden sm:inline">Add Page</span>
            </button>
          )}

          {/* Import PDF Trigger */}
          {onImportPdf && (
            <label
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/25 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Import PDF pages into notebook"
            >
              <FileUp size={13} className="text-blue-400" />
              <span className="hidden sm:inline">Import PDF</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onImportPdf(f);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          )}

          <div className="h-4 w-px bg-white/10" />

          {/* Notebook & Page Title */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 font-medium">{notebookTitle}</span>
            <span className="text-zinc-600">/</span>
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="bg-white/10 border border-white/30 rounded px-1.5 py-0.5 text-xs text-white outline-none font-semibold"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="font-semibold text-zinc-200 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors text-left truncate max-w-xs"
                title="Click to rename page"
              >
                {pageTitle}
              </button>
            )}
          </div>
        </div>

        {/* Center: View Mode & Paper Pattern Popover */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle (Classic / Infinite) */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-white/5"
            title={viewMode === 'classic' ? 'Switch to Infinite Canvas' : 'Switch to Classic Notebook'}
          >
            <span className="capitalize">{viewMode === 'classic' ? 'Notebook View' : 'Infinite Canvas'}</span>
          </button>

          {/* Paper Style Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPaperPopover(!showPaperPopover)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-white/5"
              title="Paper Pattern & Theme"
            >
              <Grid size={13} className="text-zinc-400" />
              <span className="capitalize hidden sm:inline">{currentPattern}</span>
              <ChevronDown size={11} className="text-zinc-400" />
            </button>

            {showPaperPopover && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-[#13151f] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Pattern
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {(['ruled', 'grid', 'dotted', 'cornell', 'daily-journal', 'blank'] as PaperPattern[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          onSelectPattern(p);
                          setShowPaperPopover(false);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left capitalize transition-colors flex items-center justify-between ${
                          currentPattern === p ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{p.replace('-', ' ')}</span>
                        {currentPattern === p && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Theme
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {(['white', 'ivory', 'legal-yellow', 'dark-slate', 'oled-black'] as PaperTheme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          onSelectTheme(t);
                          setShowPaperPopover(false);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left capitalize transition-colors flex items-center justify-between ${
                          currentTheme === t ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{t.replace('-', ' ')}</span>
                        {currentTheme === t && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                {onOpenAddPageModal && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setShowPaperPopover(false);
                        onOpenAddPageModal();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                    >
                      <FilePlus size={13} />
                      <span>More Templates & Layouts...</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Undo/Redo + AI Assistant + Export + Focus */}
        <div className="flex items-center gap-2">
          {/* Undo & Redo */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition-colors ${
                canUndo ? 'text-zinc-300 hover:text-white hover:bg-white/10' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition-colors ${
                canRedo ? 'text-zinc-300 hover:text-white hover:bg-white/10' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          {/* AI Assistant Button (Clean Minimal Styling) */}
          <button
            onClick={onToggleAiSplit}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              showAiSplit
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10'
            }`}
            title="Toggle AI Second Brain"
          >
            <Sparkles size={13} className={showAiSplit ? 'text-zinc-950' : 'text-zinc-400'} />
            <span>AI Assistant</span>
          </button>

          {/* MCP Hub Button */}
          {onToggleMcp && (
            <button
              onClick={onToggleMcp}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-white/5"
              title="Model Context Protocol (MCP) Hub"
            >
              <Cpu size={13} className="text-emerald-400" />
              <span>MCP</span>
            </button>
          )}

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5"
              title="Export Notebook"
            >
              <FileDown size={15} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#13151f] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    onExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/5 flex items-center gap-2"
                >
                  <FileDown size={14} className="text-zinc-400" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/5 flex items-center gap-2"
                >
                  <FileDown size={14} className="text-zinc-400" />
                  <span>Export as Markdown</span>
                </button>
                <button
                  onClick={() => {
                    onExportSVG();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-zinc-200 hover:bg-white/5 flex items-center gap-2"
                >
                  <FileDown size={14} className="text-zinc-400" />
                  <span>Export as Vector SVG</span>
                </button>
              </div>
            )}
          </div>

          {/* Focus Mode */}
          <button
            onClick={onToggleFocusMode}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5"
            title="Focus Mode (F11)"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </header>

      {/* 2. Docked Inking & Stylus Toolbar Ribbon */}
      <div className="h-11 px-4 flex items-center justify-center gap-1.5 bg-[#0f1118]">
        {/* Pen Tool with Type Popover */}
        <div className="relative">
          <button
            onClick={() => {
              if (isPanningMode) onTogglePanning();
              if (currentPen !== 'ballpoint' && currentPen !== 'fountain' && currentPen !== 'calligraphy') {
                onSelectPen('ballpoint');
              } else {
                setShowPenPopover(!showPenPopover);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              !isPanningMode && (currentPen === 'ballpoint' || currentPen === 'fountain' || currentPen === 'calligraphy')
                ? 'bg-white/15 text-white font-medium border border-white/20 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Pen Tool (Click to select Ballpoint, Fountain, Calligraphy)"
          >
            {currentPen === 'fountain' ? (
              <Feather size={14} />
            ) : currentPen === 'calligraphy' ? (
              <Edit3 size={14} />
            ) : (
              <PenTool size={14} />
            )}
            <ChevronDown size={10} className="opacity-60" />
          </button>

          {showPenPopover && (
            <div className="absolute left-0 top-full mt-2 w-40 bg-[#151724] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  onSelectPen('ballpoint');
                  setShowPenPopover(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${
                  currentPen === 'ballpoint' ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <PenTool size={14} />
                <span>Ballpoint</span>
              </button>
              <button
                onClick={() => {
                  onSelectPen('fountain');
                  setShowPenPopover(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${
                  currentPen === 'fountain' ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Feather size={14} />
                <span>Fountain Pen</span>
              </button>
              <button
                onClick={() => {
                  onSelectPen('calligraphy');
                  setShowPenPopover(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${
                  currentPen === 'calligraphy' ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Edit3 size={14} />
                <span>Calligraphy</span>
              </button>
            </div>
          )}
        </div>

        {/* Highlighter */}
        <button
          onClick={() => {
            if (isPanningMode) onTogglePanning();
            onSelectPen('highlighter');
          }}
          className={`p-1.5 rounded-xl transition-all ${
            !isPanningMode && currentPen === 'highlighter'
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Highlighter (H)"
        >
          <Highlighter size={14} />
        </button>

        {/* Eraser */}
        <button
          onClick={() => {
            if (isPanningMode) onTogglePanning();
            onSelectPen('eraser');
          }}
          className={`p-1.5 rounded-xl transition-all ${
            !isPanningMode && currentPen === 'eraser'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Eraser (E)"
        >
          <Eraser size={14} />
        </button>

        {/* Lasso Select */}
        <button
          onClick={() => {
            if (isPanningMode) onTogglePanning();
            onSelectPen('lasso');
          }}
          className={`p-1.5 rounded-xl transition-all ${
            !isPanningMode && currentPen === 'lasso'
              ? 'bg-white/15 text-white font-medium border border-white/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Lasso Selection (L)"
        >
          <LassoSelect size={14} />
        </button>

        {/* Shape Auto-snap */}
        <button
          onClick={onToggleAutoSnap}
          className={`p-1.5 rounded-xl transition-all ${
            autoSnapShapes
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Geometric Shape Auto-Snap"
        >
          <Shapes size={14} />
        </button>

        {/* Hand Pan Tool */}
        <button
          onClick={onTogglePanning}
          className={`p-1.5 rounded-xl transition-all ${
            isPanningMode
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Pan Canvas (Spacebar)"
        >
          <Hand size={14} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Typed Content: Text Block & Code Block */}
        <button
          onClick={onAddTextBlock}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Typed Text Block"
        >
          <Type size={14} />
        </button>
        <button
          onClick={onAddCodeBlock}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Add Code Snippet Block"
        >
          <Code size={14} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Color Slots + Palette Popover */}
        <div className="flex items-center gap-1.5 px-1 relative">
          {favoriteColors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => onSelectColor(color)}
              className={`w-4 h-4 rounded-full transition-transform ${
                currentColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0f1118]' : 'hover:scale-110 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}

          <button
            onClick={() => setShowColorPopover(!showColorPopover)}
            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 ml-0.5"
            title="More Inks"
          >
            <Palette size={10} />
          </button>

          {showColorPopover && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-[#151724] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Curated Inks
              </span>
              <div className="grid grid-cols-5 gap-2">
                {CURATED_INKS.map((ink) => (
                  <button
                    key={ink.hex}
                    onClick={() => handleSelectColorSlot(ink.hex)}
                    className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: ink.hex }}
                    title={ink.name}
                  >
                    {currentColor === ink.hex && (
                      <Check size={12} className={ink.hex === '#f8fafc' ? 'text-black' : 'text-white'} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Stroke Thickness Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSizePopover(!showSizePopover)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-medium"
            title="Stroke Thickness"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" style={{ transform: `scale(${Math.min(2, Math.max(0.6, currentSize / 4))})` }} />
            <span className="text-[11px] font-mono">{currentSize}px</span>
          </button>

          {showSizePopover && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-[#151724] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Thickness
              </span>
              <div className="space-y-0.5">
                {PRESET_THICKNESSES.map((pt) => (
                  <button
                    key={pt.size}
                    onClick={() => {
                      onSelectSize(pt.size);
                      setShowSizePopover(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs ${
                      currentSize === pt.size ? 'bg-white/15 text-white font-medium' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{pt.label}</span>
                    <span className="font-mono text-[10px] opacity-70">{pt.size}px</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Layers Panel Toggle */}
        <button
          onClick={onToggleLayers}
          className={`p-1.5 rounded-xl transition-colors ${
            showLayers ? 'bg-white/15 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Canvas Layers"
        >
          <Layers size={14} />
        </button>

        {/* Time-lapse Replay Toggle */}
        <button
          onClick={onToggleTimeLapse}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Time-Lapse Replay"
        >
          <Play size={14} />
        </button>

        {/* Clear Page Action */}
        <button
          onClick={() => {
            if (confirm('Clear all strokes on this page?')) {
              onClearPage();
            }
          }}
          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
          title="Clear Page"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
