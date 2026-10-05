import React, { useState } from 'react';
import {
  Book,
  FolderPlus,
  FilePlus,
  Search,
  Pin,
  Trash2,
  X,
  History,
  FileText,
  Link2,
} from 'lucide-react';
import type { Notebook } from '../../engine/types';
import { StorageAdapter } from '../../engine/storage-adapter';

interface NotebookSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notebooks: Notebook[];
  activeNotebookId: string;
  activePageIndex: number;
  onSelectNotebook: (notebookId: string) => void;
  onSelectPage: (index: number) => void;
  onAddNotebook: (title: string) => void;
  onAddPage: () => void;
  onDeleteNotebook: (notebookId: string) => void;
  onTogglePinPage: (pageId: string) => void;
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  isOpen,
  onClose,
  notebooks,
  activeNotebookId,
  activePageIndex,
  onSelectNotebook,
  onSelectPage,
  onAddNotebook,
  onAddPage,
  onDeleteNotebook,
  onTogglePinPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (!isOpen) return null;

  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) || notebooks[0];
  const allPages = currentNotebook?.sections[0]?.pages || [];

  // Filter pages based on search query
  const filteredPages = allPages.filter((page) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = page.title.toLowerCase().includes(query);
    const contentMatch = page.aiTranscription?.toLowerCase().includes(query);
    const textBlockMatch = page.textBlocks.some((tb) =>
      tb.text.toLowerCase().includes(query)
    );
    return titleMatch || contentMatch || textBlockMatch;
  });

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookTitle.trim()) {
      onAddNotebook(newNotebookTitle.trim());
      setNewNotebookTitle('');
      setShowNewNotebookInput(false);
    }
  };

  const currentPage = allPages[activePageIndex];
  const historySnapshots = currentPage ? StorageAdapter.getPageHistory(currentPage.id) : [];

  return (
    <aside className="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="h-14 px-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Book size={18} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-100">Notebooks & Pages</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-800/80 bg-gray-950/40">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, ink & transcripts..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Notebook Selector & Add Notebook */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Notebooks
          </span>
          <button
            onClick={() => setShowNewNotebookInput(!showNewNotebookInput)}
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <FolderPlus size={13} />
            <span>New</span>
          </button>
        </div>

        {showNewNotebookInput && (
          <form onSubmit={handleCreateNotebook} className="mb-2 flex gap-1.5">
            <input
              type="text"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              placeholder="Notebook name..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-white/30"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 bg-white text-zinc-950 hover:bg-zinc-200 rounded text-xs font-semibold"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-1 max-h-36 overflow-y-auto">
          {notebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => onSelectNotebook(nb.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                nb.id === activeNotebookId
                  ? 'bg-white/10 text-white border border-white/20 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: nb.color || '#6366f1' }}
                />
                <span className="truncate">{nb.title}</span>
              </div>
              {notebooks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotebook(nb.id);
                  }}
                  className="p-1 opacity-0 hover:opacity-100 group-hover:opacity-100 text-gray-500 hover:text-rose-400"
                  title="Delete Notebook"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Pages in {currentNotebook.title} ({filteredPages.length})
          </span>
          <button
            onClick={onAddPage}
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <FilePlus size={13} />
            <span>Add Page</span>
          </button>
        </div>

        {filteredPages.map((page, idx) => (
          <div
            key={page.id}
            onClick={() => onSelectPage(idx)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all border ${
              idx === activePageIndex
                ? 'bg-zinc-800 text-white border-white/20 shadow-sm'
                : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate flex-1 mr-2">
              <FileText size={14} className={idx === activePageIndex ? 'text-white' : 'text-zinc-500'} />
              <div className="truncate">
                <div className="font-medium truncate">{page.title || `Page ${idx + 1}`}</div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                  <span>{page.strokes.length} strokes</span>
                  <span>•</span>
                  <span className="capitalize">{page.pattern}</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinPage(page.id);
              }}
              className={`p-1 transition-colors ${
                page.pinned ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'
              }`}
              title={page.pinned ? 'Unpin page' : 'Pin page'}
            >
              <Pin size={12} className={page.pinned ? 'fill-amber-400' : ''} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer: Version History & Backlinks */}
      <div className="p-3 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-xs text-gray-400">
        <button
          onClick={() => setShowHistoryModal(!showHistoryModal)}
          className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
          title="View Version History"
        >
          <History size={14} className="text-indigo-400" />
          <span>History ({historySnapshots.length})</span>
        </button>
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Link2 size={13} />
          <span>Bi-directional Links Active</span>
        </div>
      </div>
    </aside>
  );
};
