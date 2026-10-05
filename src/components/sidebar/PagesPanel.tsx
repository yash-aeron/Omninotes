import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  X,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pin,
  Search,
  MoreVertical,
  FileText,
} from 'lucide-react';
import type { PageMetadata, PaperTheme } from '../../engine/types';
import { PAPER_THEME_COLORS } from '../canvas/PaperTemplate';

interface PagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageMetadata[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onOpenAddPageModal: () => void;
  onDuplicatePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDeletePage: (index: number) => void;
  onTogglePinPage: (pageId: string) => void;
}

export const PagesPanel: React.FC<PagesPanelProps> = ({
  isOpen,
  onClose,
  pages,
  activePageIndex,
  onSelectPage,
  onOpenAddPageModal,
  onDuplicatePage,
  onMovePage,
  onDeletePage,
  onTogglePinPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // Filter pages by search query
  const filteredPagesWithIndices = pages
    .map((page, originalIdx) => ({ page, originalIdx }))
    .filter(({ page }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        page.title.toLowerCase().includes(q) ||
        page.pattern.toLowerCase().includes(q) ||
        (page.aiTranscription && page.aiTranscription.toLowerCase().includes(q))
      );
    });

  const renderThumbnailContent = (page: PageMetadata) => {
    const theme = (page.theme || 'white') as PaperTheme;
    const colors = PAPER_THEME_COLORS[theme] || PAPER_THEME_COLORS.white;

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none"
        style={{ backgroundColor: colors.bg }}
      >
        {/* Pattern Background Simulation */}
        {page.pattern === 'ruled' && (
          <div className="absolute inset-0">
            <div
              className="absolute left-2.5 top-0 bottom-0 w-[1px]"
              style={{ backgroundColor: colors.margin, opacity: 0.7 }}
            />
            <div className="flex flex-col justify-around h-full pl-4 opacity-40">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-px w-full" style={{ backgroundColor: colors.line }} />
              ))}
            </div>
          </div>
        )}

        {page.pattern === 'grid' && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.line} 1px, transparent 1px), linear-gradient(to bottom, ${colors.line} 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
          />
        )}

        {page.pattern === 'dotted' && (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `radial-gradient(circle, ${colors.line} 1px, transparent 1px)`,
              backgroundSize: '8px 8px',
            }}
          />
        )}

        {page.pattern === 'cornell' && (
          <div className="absolute inset-0 flex flex-col justify-between opacity-50 p-1">
            <div className="h-2 border-b" style={{ borderColor: colors.line }} />
            <div className="flex-1 flex">
              <div className="w-1/3 border-r h-full" style={{ borderColor: colors.margin }} />
              <div className="w-2/3 h-full flex flex-col justify-around pl-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-px w-full" style={{ backgroundColor: colors.line }} />
                ))}
              </div>
            </div>
            <div className="h-2 border-t" style={{ borderColor: colors.line }} />
          </div>
        )}

        {/* Real-time Ink Strokes Vector Preview */}
        {page.strokes && page.strokes.length > 0 && (
          <svg
            viewBox={`0 0 ${page.width || 820} ${page.height || 1160}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {page.strokes.map((stroke) => {
              if (stroke.pathData) {
                return (
                  <path
                    key={stroke.id}
                    d={stroke.pathData}
                    fill={stroke.style.color}
                    opacity={stroke.style.opacity ?? 1}
                  />
                );
              }
              return null;
            })}
          </svg>
        )}

        {/* Text Blocks Mini indicator */}
        {page.textBlocks && page.textBlocks.length > 0 && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/40 text-[7px] text-white backdrop-blur-xs font-mono">
            {page.textBlocks.length} T
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-80 h-full bg-[#0c0e16] border-r border-white/5 flex flex-col z-30 select-none shadow-2xl flex-shrink-0">
      {/* 1. Header */}
      <div className="h-12 px-4 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-[#090b11]">
        <div className="flex items-center gap-2">
          <LayoutGrid size={15} className="text-zinc-300" />
          <h2 className="text-xs font-semibold text-white tracking-wide">Pages</h2>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
            {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Add Page Button */}
          <button
            onClick={onOpenAddPageModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Add Page with Template"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add</span>
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Pages Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Subheader: Search + View Toggle */}
      <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-[#090b11]/50">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-7 pr-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* View Switcher: Grid vs List */}
        <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={12} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="List View"
          >
            <List size={12} />
          </button>
        </div>
      </div>

      {/* 3. Pages Cards Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredPagesWithIndices.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
            <FileText size={24} className="mb-2 opacity-40" />
            <span>No matching pages</span>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View: 2 Columns of Miniature Cards */
          <div className="grid grid-cols-2 gap-3">
            {filteredPagesWithIndices.map(({ page, originalIdx }) => {
              const isActive = originalIdx === activePageIndex;
              const isMenuOpen = menuOpenIdx === originalIdx;

              return (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(originalIdx)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all border ${
                    isActive
                      ? 'border-white ring-2 ring-white/40 shadow-lg bg-white/5'
                      : 'border-white/5 bg-[#12141e]/60 hover:border-white/20 hover:bg-[#12141e]'
                  }`}
                >
                  {/* Miniature Thumbnail (A4 ratio approx 1:1.41) */}
                  <div className="w-full aspect-[1/1.35] relative overflow-hidden rounded-t-lg border-b border-white/5">
                    {renderThumbnailContent(page)}

                    {/* Page Index Badge */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-mono font-medium text-white border border-white/10">
                      {originalIdx + 1}
                    </div>

                    {/* Pin/Bookmark Status */}
                    {page.pinned && (
                      <div className="absolute top-1.5 right-1.5 text-amber-400">
                        <Pin size={11} className="fill-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-white">
                        {page.title || `Page ${originalIdx + 1}`}
                      </span>

                      {/* Three-dots Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenIdx(isMenuOpen ? null : originalIdx);
                          }}
                          className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="Page Actions"
                        >
                          <MoreVertical size={11} />
                        </button>

                        {/* Page Context Dropdown */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1 w-36 bg-[#161824] border border-white/10 rounded-xl shadow-2xl p-1 z-50 text-[11px] space-y-0.5"
                          >
                            <button
                              onClick={() => {
                                onDuplicatePage(originalIdx);
                                setMenuOpenIdx(null);
                              }}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5"
                            >
                              <Copy size={11} />
                              <span>Duplicate</span>
                            </button>
                            <button
                              onClick={() => {
                                onMovePage(originalIdx, originalIdx - 1);
                                setMenuOpenIdx(null);
                              }}
                              disabled={originalIdx === 0}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp size={11} />
                              <span>Move Up</span>
                            </button>
                            <button
                              onClick={() => {
                                onMovePage(originalIdx, originalIdx + 1);
                                setMenuOpenIdx(null);
                              }}
                              disabled={originalIdx === pages.length - 1}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown size={11} />
                              <span>Move Down</span>
                            </button>
                            <button
                              onClick={() => {
                                onTogglePinPage(page.id);
                                setMenuOpenIdx(null);
                              }}
                              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5"
                            >
                              <Pin size={11} />
                              <span>{page.pinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                            {pages.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete Page ${originalIdx + 1}?`)) {
                                    onDeletePage(originalIdx);
                                  }
                                  setMenuOpenIdx(null);
                                }}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 size={11} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-500">
                      <span className="capitalize">{page.pattern.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>{page.strokes?.length || 0} strokes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View: Horizontal rows with miniature preview */
          <div className="space-y-2">
            {filteredPagesWithIndices.map(({ page, originalIdx }) => {
              const isActive = originalIdx === activePageIndex;

              return (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(originalIdx)}
                  className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'border-white ring-1 ring-white/30 bg-white/10 text-white'
                      : 'border-white/5 bg-[#12141e]/60 hover:border-white/15 hover:bg-[#12141e] text-zinc-300'
                  }`}
                >
                  {/* Thumbnail snippet */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 relative">
                    {renderThumbnailContent(page)}
                    <div className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/70 text-[8px] font-mono text-white">
                      {originalIdx + 1}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 truncate">
                    <div className="text-xs font-semibold truncate group-hover:text-white">
                      {page.title || `Page ${originalIdx + 1}`}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{page.pattern}</span>
                      <span>•</span>
                      <span>{page.strokes?.length || 0} strokes</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(originalIdx);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete Page ${originalIdx + 1}?`)) {
                            onDeletePage(originalIdx);
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom Footer: Direct Add Page Template Button */}
      <div className="p-3 border-t border-white/5 bg-[#090b11] flex-shrink-0">
        <button
          onClick={onOpenAddPageModal}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium border border-white/5 transition-all active:scale-98"
        >
          <Plus size={14} />
          <span>Add Page with Template</span>
        </button>
      </div>
    </aside>
  );
};
