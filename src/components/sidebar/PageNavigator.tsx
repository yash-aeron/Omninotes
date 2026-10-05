import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import type { PageMetadata } from '../../engine/types';

interface PageNavigatorProps {
  pages: PageMetadata[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onOpenAddPageModal?: () => void;
  onTogglePagesPanel?: () => void;
  onDeletePage: (index: number) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetPanZoom: () => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onOpenAddPageModal,
  onTogglePagesPanel,
  onDeletePage,
  zoom,
  onZoomChange,
  onResetPanZoom,
}) => {
  return (
    <footer className="h-9 px-4 bg-[#0a0c12] border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 z-30 select-none flex-shrink-0">
      {/* Left: Page Switcher & Add Page */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex === 0}
            title="Previous Page"
            className="p-1 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={13} />
          </button>

          <button
            onClick={onTogglePagesPanel}
            title="Toggle Pages Overview (Ctrl+Shift+P)"
            className="font-medium text-[11px] px-2 py-0.5 rounded-md hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            Page {activePageIndex + 1} of {pages.length}
          </button>

          <button
            onClick={() => onSelectPage(Math.min(pages.length - 1, activePageIndex + 1))}
            disabled={activePageIndex === pages.length - 1}
            title="Next Page"
            className="p-1 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="h-3.5 w-px bg-white/10" />

        <button
          onClick={onOpenAddPageModal || onAddPage}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] font-medium border border-white/5 transition-all"
          title="Add New Page with Template"
        >
          <Plus size={12} />
          <span>Add Page</span>
        </button>

        {pages.length > 1 && (
          <button
            onClick={() => {
              if (confirm('Delete current page?')) {
                onDeletePage(activePageIndex);
              }
            }}
            title="Delete Current Page"
            className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Center: Canvas Status */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-500">
        <span>Stylus & Palm Guard Active</span>
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-1 font-mono text-[11px]">
        <button
          onClick={() => onZoomChange(Math.max(0.4, Number((zoom - 0.1).toFixed(2))))}
          className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>

        <button
          onClick={onResetPanZoom}
          title="Reset to 100% and Center"
          className="px-1.5 py-0.5 rounded hover:bg-white/5 text-zinc-300 hover:text-white font-medium"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => onZoomChange(Math.min(2.5, Number((zoom + 0.1).toFixed(2))))}
          className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
      </div>
    </footer>
  );
};
