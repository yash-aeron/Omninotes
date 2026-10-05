import React, { useState } from 'react';
import {
  PenTool,
  Feather,
  Edit3,
  Paintbrush,
  Highlighter,
  Eraser,
  Hand,
  LassoSelect,
  Shapes,
  Play,
  Layers,
  Menu,
  Type,
  Code,
  Undo2,
  Redo2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Maximize2,
  Minimize2,
  Grid,
  Palette,
  FileDown,
  Trash2,
} from 'lucide-react';
import type { PenType, PaperPattern, PaperTheme, ViewMode } from '../../engine/types';

interface MainToolbarProps {
  currentPen: PenType;
  currentColor: string;
  currentSize: number;
  isPanningMode: boolean;
  enablePalmRejection: boolean;
  autoSnapShapes: boolean;
  isFocusMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentPattern: PaperPattern;
  currentTheme: PaperTheme;
  viewMode: ViewMode;
  showAiSplit: boolean;
  showLayers: boolean;
  onSelectPen: (pen: PenType) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onTogglePanning: () => void;
  onTogglePalmRejection: () => void;
  onToggleAutoSnap: () => void;
  onToggleFocusMode: () => void;
  onToggleTimeLapse: () => void;
  onToggleLayers: () => void;
  onToggleSidebar: () => void;
  onAddTextBlock: () => void;
  onAddCodeBlock: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectPattern: (pattern: PaperPattern) => void;
  onSelectTheme: (theme: PaperTheme) => void;
  onToggleViewMode: () => void;
  onToggleAiSplit: () => void;
  onClearPage: () => void;
  onExportPDF: () => void;
  onExportMarkdown: () => void;
  onExportSVG: () => void;
}

const PRESET_COLORS = [
  '#090a0f', // Jet Black
  '#2563eb', // Royal Blue
  '#dc2626', // Crimson Red
  '#16a34a', // Emerald Green
  '#9333ea', // Purple
  '#d97706', // Amber/Brown
  '#eab308', // Highlighter Yellow
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f8fafc', // White
];

const PRESET_SIZES = [2, 4, 8, 14, 22];

export const MainToolbar: React.FC<MainToolbarProps> = ({
  currentPen,
  currentColor,
  currentSize,
  isPanningMode,
  enablePalmRejection,
  autoSnapShapes,
  isFocusMode,
  canUndo,
  canRedo,
  currentPattern,
  currentTheme,
  viewMode,
  showAiSplit,
  showLayers,
  onSelectPen,
  onSelectColor,
  onSelectSize,
  onTogglePanning,
  onTogglePalmRejection,
  onToggleAutoSnap,
  onToggleFocusMode,
  onToggleTimeLapse,
  onToggleLayers,
  onToggleSidebar,
  onAddTextBlock,
  onAddCodeBlock,
  onUndo,
  onRedo,
  onSelectPattern,
  onSelectTheme,
  onToggleViewMode,
  onToggleAiSplit,
  onClearPage,
  onExportPDF,
  onExportMarkdown,
  onExportSVG,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-3 flex items-center justify-between z-30 select-none shadow-md">
      {/* Left Section: Sidebar button + App Title + View Mode + Templates */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Toggle Notebooks & Pages (Ctrl+B)"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold text-xs tracking-tighter">
            ON
          </div>
          <span className="hidden xl:inline text-xs font-semibold text-gray-200">OmniNotes</span>
        </div>

        <div className="h-5 w-px bg-gray-800 hidden md:block" />

        {/* View Mode Toggle */}
        <button
          onClick={onToggleViewMode}
          title={viewMode === 'classic' ? 'Switch to Infinite Canvas' : 'Switch to Classic Notebook'}
          className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
            viewMode === 'classic'
              ? 'bg-gray-800 text-indigo-300 border-indigo-500/40'
              : 'bg-gray-800 text-purple-300 border-purple-500/40'
          }`}
        >
          {viewMode === 'classic' ? <BookOpen size={13} /> : <Maximize2 size={13} />}
          <span className="capitalize">{viewMode}</span>
        </button>

        {/* Paper Pattern Dropdown */}
        <div className="flex items-center gap-1 bg-gray-800/80 rounded-lg p-0.5 border border-gray-700/60">
          <Grid size={13} className="text-gray-400 ml-1.5" />
          <select
            value={currentPattern}
            onChange={(e) => onSelectPattern(e.target.value as PaperPattern)}
            className="bg-transparent text-xs text-gray-200 border-0 focus:ring-0 cursor-pointer pr-1 py-0.5 outline-none font-medium capitalize"
          >
            <option value="blank" className="bg-gray-900">Blank</option>
            <option value="ruled" className="bg-gray-900">Ruled (Lined)</option>
            <option value="grid" className="bg-gray-900">Grid / Graph</option>
            <option value="dotted" className="bg-gray-900">Dotted</option>
            <option value="cornell" className="bg-gray-900">Cornell Notes</option>
            <option value="isometric" className="bg-gray-900">Isometric</option>
            <option value="music" className="bg-gray-900">Music Staff</option>
            <option value="daily-journal" className="bg-gray-900">Daily Journal</option>
            <option value="meeting-notes" className="bg-gray-900">Meeting Notes</option>
            <option value="lecture-notes" className="bg-gray-900">Lecture Notes</option>
            <option value="code-split" className="bg-gray-900">Code Split</option>
          </select>
        </div>

        {/* Paper Theme Dropdown */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-800/80 rounded-lg p-0.5 border border-gray-700/60">
          <Palette size={13} className="text-gray-400 ml-1.5" />
          <select
            value={currentTheme}
            onChange={(e) => onSelectTheme(e.target.value as PaperTheme)}
            className="bg-transparent text-xs text-gray-200 border-0 focus:ring-0 cursor-pointer pr-1 py-0.5 outline-none font-medium capitalize"
          >
            <option value="white" className="bg-gray-900">White</option>
            <option value="ivory" className="bg-gray-900">Ivory</option>
            <option value="legal-yellow" className="bg-gray-900">Legal Yellow</option>
            <option value="dark-slate" className="bg-gray-900">Dark Slate</option>
            <option value="oled-black" className="bg-gray-900">OLED Black</option>
          </select>
        </div>
      </div>

      {/* Center Section: Main Inking Tools Dock */}
      <div className="flex items-center gap-1 bg-gray-950/80 border border-gray-800 rounded-xl p-1 shadow-inner">
        {/* Hand Pan Tool */}
        <button
          onClick={onTogglePanning}
          title="Pan Canvas (Spacebar)"
          className={`p-1.5 rounded-lg transition-colors ${
            isPanningMode
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Hand size={15} />
        </button>

        {/* Ballpoint Pen */}
        <button
          onClick={() => onSelectPen('ballpoint')}
          title="Ballpoint Pen (B)"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'ballpoint'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <PenTool size={15} />
        </button>

        {/* Fountain Pen */}
        <button
          onClick={() => onSelectPen('fountain')}
          title="Fountain Pen (F)"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'fountain'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Feather size={15} />
        </button>

        {/* Calligraphy Pen */}
        <button
          onClick={() => onSelectPen('calligraphy')}
          title="Calligraphy Pen (C)"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'calligraphy'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Edit3 size={15} />
        </button>

        {/* Brush Pen */}
        <button
          onClick={() => onSelectPen('brush')}
          title="Brush Pen"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'brush'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Paintbrush size={15} />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => onSelectPen('highlighter')}
          title="Highlighter (H) - Multiply Blend"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'highlighter'
              ? 'bg-amber-500 text-gray-950 font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Highlighter size={15} />
        </button>

        {/* Eraser */}
        <button
          onClick={() => onSelectPen('eraser')}
          title="Eraser (E)"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'eraser'
              ? 'bg-rose-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Eraser size={15} />
        </button>

        {/* Lasso Selection Tool */}
        <button
          onClick={() => onSelectPen('lasso')}
          title="Lasso Select (L) - Select & Move Strokes"
          className={`p-1.5 rounded-lg transition-colors ${
            !isPanningMode && currentPen === 'lasso'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <LassoSelect size={15} />
        </button>

        <div className="h-4 w-px bg-gray-800" />

        {/* Shape Recognition Auto-Snap Toggle */}
        <button
          onClick={onToggleAutoSnap}
          title={autoSnapShapes ? 'Shape Auto-Snap ON' : 'Shape Auto-Snap OFF'}
          className={`p-1.5 rounded-lg transition-colors ${
            autoSnapShapes
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shapes size={15} />
        </button>

        <div className="h-4 w-px bg-gray-800" />

        {/* Colors */}
        <div className="flex items-center gap-1 px-1">
          {PRESET_COLORS.slice(0, 5).map((c) => (
            <button
              key={c}
              onClick={() => onSelectColor(c)}
              className={`w-4 h-4 rounded-full border transition-transform ${
                currentColor === c ? 'scale-125 ring-2 ring-indigo-400 border-white' : 'border-gray-700'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
            title="Custom Ink Color"
          />
        </div>

        <div className="h-4 w-px bg-gray-800" />

        {/* Stroke Sizes */}
        <div className="hidden sm:flex items-center gap-1 px-1">
          {PRESET_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => onSelectSize(sz)}
              className={`w-4 h-4 flex items-center justify-center rounded hover:bg-gray-800 ${
                currentSize === sz ? 'bg-gray-800 text-indigo-400' : 'text-gray-500'
              }`}
              title={`Size ${sz}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: `${Math.min(sz, 10)}px`, height: `${Math.min(sz, 10)}px` }}
              />
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-800" />

        {/* Add Text & Code Blocks */}
        <button
          onClick={onAddTextBlock}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          title="Add Typed Text Block"
        >
          <Type size={14} />
        </button>
        <button
          onClick={onAddCodeBlock}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          title="Add Code Snippet Block"
        >
          <Code size={14} />
        </button>
      </div>

      {/* Right Section: Palm Guard, Layers, Time-Lapse, Export, AI */}
      <div className="flex items-center gap-1.5">
        {/* Palm Rejection */}
        <button
          onClick={onTogglePalmRejection}
          title={enablePalmRejection ? 'Palm Guard Active' : 'Palm Guard Inactive'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
            enablePalmRejection
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/50'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}
        >
          {enablePalmRejection ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
          <span className="hidden xl:inline">Palm Guard</span>
        </button>

        {/* Layers Panel Toggle */}
        <button
          onClick={onToggleLayers}
          className={`p-1.5 rounded-lg border transition-colors ${
            showLayers
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'text-gray-400 hover:text-white border-gray-800 hover:bg-gray-800'
          }`}
          title="Layers Panel"
        >
          <Layers size={15} />
        </button>

        {/* Time-Lapse Replay */}
        <button
          onClick={onToggleTimeLapse}
          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors"
          title="Time-Lapse Inking Replay"
        >
          <Play size={15} />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-gray-800/80 rounded-lg border border-gray-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 rounded-l-lg"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <div className="h-3 w-px bg-gray-700" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-gray-300 hover:text-white disabled:opacity-30 rounded-r-lg"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Clear Page */}
        <button
          onClick={onClearPage}
          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors"
          title="Clear Current Page"
        >
          <Trash2 size={14} />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg border border-gray-700/60 transition-colors"
            title="Export Notebook / Notes"
          >
            <FileDown size={14} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-1 z-50 text-xs">
              <button
                onClick={() => {
                  onExportPDF();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-gray-800 text-gray-200 flex items-center justify-between"
              >
                <span>Export PDF</span>
                <span className="text-[10px] text-gray-500">.pdf</span>
              </button>
              <button
                onClick={() => {
                  onExportMarkdown();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-gray-800 text-gray-200 flex items-center justify-between"
              >
                <span>Export Markdown</span>
                <span className="text-[10px] text-gray-500">.md</span>
              </button>
              <button
                onClick={() => {
                  onExportSVG();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-gray-800 text-gray-200 flex items-center justify-between"
              >
                <span>Export Vector SVG</span>
                <span className="text-[10px] text-gray-500">.svg</span>
              </button>
            </div>
          )}
        </div>

        {/* Focus Mode */}
        <button
          onClick={onToggleFocusMode}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors"
          title={isFocusMode ? 'Exit Focus Mode' : 'Enter Distraction-Free Focus Mode'}
        >
          {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* AI Split View */}
        <button
          onClick={onToggleAiSplit}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg transition-all ${
            showAiSplit
              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white ring-1 ring-white/20'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          <Sparkles size={13} className={showAiSplit ? 'animate-pulse' : ''} />
          <span>AI</span>
        </button>
      </div>
    </header>
  );
};
