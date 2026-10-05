import React, { useState, useMemo } from 'react';
import type { Notebook, PaperPattern, PaperTheme } from '../../engine/types';
import {
  BookOpen,
  Plus,
  PenTool,
  Search,
  Star,
  Clock,
  FileText,
  FileUp,
  Trash2,
  FolderPlus,
  ChevronRight,
} from 'lucide-react';

interface LibraryViewProps {
  notebooks: Notebook[];
  onOpenNotebook: (notebookId: string, pageIndex?: number) => void;
  onCreateNotebook: (title: string, pattern?: PaperPattern, theme?: PaperTheme, color?: string) => void;
  onQuickNote: () => void;
  onDeleteNotebook: (notebookId: string) => void;
  onOpenSearch: () => void;
  onImportPdf?: (file: File) => void;
}

const TEMPLATE_STARTERS: Array<{
  id: string;
  title: string;
  description: string;
  pattern: PaperPattern;
  theme: PaperTheme;
  color: string;
  badge: string;
}> = [
  {
    id: 'tpl-ruled',
    title: 'Classic Lined',
    description: 'Clean ruled paper for lecture notes, summaries & prose',
    pattern: 'ruled',
    theme: 'white',
    color: '#6366f1',
    badge: 'Popular',
  },
  {
    id: 'tpl-cornell',
    title: 'Cornell Notes',
    description: 'Structured layout with cue column, notes area & summary',
    pattern: 'cornell',
    theme: 'white',
    color: '#3b82f6',
    badge: 'Study',
  },
  {
    id: 'tpl-grid',
    title: 'Grid / Engineering',
    description: 'Precise graph paper for mathematics, diagrams & technical work',
    pattern: 'grid',
    theme: 'white',
    color: '#0ea5e9',
    badge: 'Technical',
  },
  {
    id: 'tpl-journal',
    title: 'Daily Journal',
    description: 'Ivory textured paper with date header for reflection',
    pattern: 'daily-journal',
    theme: 'ivory',
    color: '#ec4899',
    badge: 'Personal',
  },
  {
    id: 'tpl-dotted',
    title: 'Dot Grid',
    description: 'Subtle dots for bullet journaling, sketching & wireframing',
    pattern: 'dotted',
    theme: 'white',
    color: '#8b5cf6',
    badge: 'Creative',
  },
  {
    id: 'tpl-blank',
    title: 'Blank Canvas',
    description: 'Unconstrained infinite white space for freeform thinking',
    pattern: 'blank',
    theme: 'white',
    color: '#10b981',
    badge: 'Freeform',
  },
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  notebooks,
  onOpenNotebook,
  onCreateNotebook,
  onQuickNote,
  onDeleteNotebook,
  onOpenSearch,
  onImportPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'notebooks' | 'recent' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newPattern, setNewPattern] = useState<PaperPattern>('ruled');
  const [newTheme, setNewTheme] = useState<PaperTheme>('white');

  // Flatten all pages for "Recent" and "All Notes"
  const allPages = useMemo(() => {
    const list: Array<{
      notebookId: string;
      notebookTitle: string;
      notebookColor: string;
      pageIndex: number;
      page: any;
    }> = [];
    notebooks.forEach((nb) => {
      nb.sections.forEach((sec) => {
        sec.pages.forEach((p, idx) => {
          list.push({
            notebookId: nb.id,
            notebookTitle: nb.title,
            notebookColor: nb.color,
            pageIndex: idx,
            page: p,
          });
        });
      });
    });
    return list;
  }, [notebooks]);

  // Filtered lists
  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) return notebooks;
    const q = searchQuery.toLowerCase();
    return notebooks.filter(
      (nb) =>
        nb.title.toLowerCase().includes(q) ||
        nb.sections.some((s) => s.pages.some((p) => p.title.toLowerCase().includes(q)))
    );
  }, [notebooks, searchQuery]);

  const filteredPages = useMemo(() => {
    let result = allPages;
    if (activeTab === 'favorites') {
      result = result.filter((item) => item.page.pinned);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.page.title.toLowerCase().includes(q) ||
          item.notebookTitle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPages, activeTab, searchQuery]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNotebook(newTitle.trim(), newPattern, newTheme, newColor);
    setNewTitle('');
    setIsCreatingModal(false);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
          onImportPdf?.(f);
        }
      }}
      className="flex w-screen h-screen bg-[#090a0f] text-gray-100 select-none overflow-hidden font-sans"
    >
      {/* 1. Left Navigation Rail */}
      <aside className="w-64 border-r border-white/5 bg-[#0e1017]/80 backdrop-blur-xl flex flex-col justify-between p-4 z-20">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-100 shadow-sm">
              <PenTool size={17} className="transform -rotate-12" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-white flex items-center gap-1.5">
                Omninotes
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium">Stylus & AI Notes</p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onQuickNote}
              className="w-full py-2.5 px-3.5 bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <PenTool size={14} />
              <span>Quick Scribble</span>
            </button>
            <button
              onClick={() => setIsCreatingModal(true)}
              className="w-full py-2.5 px-3.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-200 border border-white/10 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <FolderPlus size={14} className="text-zinc-400" />
              <span>New Notebook</span>
            </button>

            {onImportPdf && (
              <label className="w-full py-2.5 px-3.5 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.98] text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                <FileUp size={14} className="text-blue-400" />
                <span>Import PDF</span>
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
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} />
                <span>All Notebooks</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-500">{notebooks.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('recent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock size={15} />
                <span>Recent Pages</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-500">{allPages.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star size={15} />
                <span>Favorites</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-500">
                {allPages.filter((p) => p.page.pinned).length}
              </span>
            </button>
          </nav>

          {/* Notebooks Quick List */}
          <div className="pt-2 border-t border-white/5">
            <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Notebooks
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
              {notebooks.map((nb) => (
                <button
                  key={nb.id}
                  onClick={() => onOpenNotebook(nb.id, 0)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: nb.color }}
                    />
                    <span className="truncate">{nb.title}</span>
                  </div>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-zinc-500 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Shelf */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0b0e]">
        {/* Top Search & Filter Bar */}
        <header className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="relative w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search notes, handwriting or notebooks... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onOpenSearch();
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-14 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/25 focus:bg-white/10 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 font-mono">
              Ctrl K
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            {onImportPdf && (
              <label className="px-3.5 py-2 text-xs font-semibold text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95">
                <FileUp size={14} className="text-blue-400" />
                <span>Open / Import PDF</span>
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

            {notebooks.length > 0 && (
              <button
                onClick={() => onOpenNotebook(notebooks[0].id, 0)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={14} className="text-zinc-400" />
                <span>Resume Last Session</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 space-y-9 max-w-7xl mx-auto w-full">
          {/* Section: Starter Templates */}
          {activeTab === 'all' && !searchQuery && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Start Fresh</h2>
                  <p className="text-xs text-zinc-400">Choose a template designed for how you think</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {TEMPLATE_STARTERS.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => onCreateNotebook(tpl.title, tpl.pattern, tpl.theme, tpl.color)}
                    className="group relative flex flex-col items-start p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-full aspect-[4/3] rounded-lg bg-zinc-950/70 border border-white/10 mb-3 flex items-center justify-center relative overflow-hidden group-hover:border-white/25">
                      {/* Mini paper preview lines */}
                      <div className="w-full h-full p-2.5 opacity-60 flex flex-col justify-between">
                        {tpl.pattern === 'ruled' && (
                          <div className="w-full h-full space-y-1.5 pt-1">
                            <div className="h-0.5 bg-zinc-400/50 w-full" />
                            <div className="h-0.5 bg-zinc-400/30 w-full" />
                            <div className="h-0.5 bg-zinc-400/30 w-full" />
                            <div className="h-0.5 bg-zinc-400/30 w-3/4" />
                          </div>
                        )}
                        {tpl.pattern === 'grid' && (
                          <div className="w-full h-full border border-dashed border-zinc-500/40 grid grid-cols-3 grid-rows-3" />
                        )}
                        {tpl.pattern === 'cornell' && (
                          <div className="w-full h-full flex flex-col justify-between">
                            <div className="flex gap-1 h-3/4">
                              <div className="w-1/3 border-r border-zinc-400/30" />
                              <div className="flex-1 space-y-1 pt-1">
                                <div className="h-0.5 bg-zinc-400/30 w-full" />
                                <div className="h-0.5 bg-zinc-400/30 w-2/3" />
                              </div>
                            </div>
                            <div className="h-2 border-t border-zinc-400/30" />
                          </div>
                        )}
                        {tpl.pattern === 'daily-journal' && (
                          <div className="w-full h-full bg-amber-100/10 rounded flex flex-col justify-between p-1">
                            <div className="h-1 bg-amber-400/40 w-1/2 rounded" />
                            <div className="space-y-1">
                              <div className="h-0.5 bg-amber-400/20 w-full" />
                              <div className="h-0.5 bg-amber-400/20 w-3/4" />
                            </div>
                          </div>
                        )}
                        {tpl.pattern === 'dotted' && (
                          <div className="w-full h-full grid grid-cols-4 grid-rows-4 place-items-center opacity-40">
                            {[...Array(16)].map((_, i) => (
                              <span key={i} className="w-0.5 h-0.5 bg-zinc-400 rounded-full" />
                            ))}
                          </div>
                        )}
                        {tpl.pattern === 'blank' && (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <FileText size={18} className="opacity-40" />
                          </div>
                        )}
                      </div>
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {tpl.badge}
                      </span>
                    </div>

                    <h3 className="font-semibold text-xs text-white group-hover:text-zinc-200 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {tpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Section: Notebooks Grid */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">Notebooks</h2>
                <p className="text-xs text-zinc-400">
                  {filteredNotebooks.length} {filteredNotebooks.length === 1 ? 'collection' : 'collections'} organized on your shelf
                </p>
              </div>

              <button
                onClick={() => setIsCreatingModal(true)}
                className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={13} />
                <span>New Notebook</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredNotebooks.map((nb) => {
                const totalPages = nb.sections.reduce((acc, s) => acc + s.pages.length, 0);
                const firstPage = nb.sections[0]?.pages[0];

                return (
                  <div
                    key={nb.id}
                    onClick={() => onOpenNotebook(nb.id, 0)}
                    className="group relative flex flex-col justify-between p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm overflow-hidden"
                  >
                    {/* Spine accent bar on the left */}
                    <div
                      className="absolute top-0 left-0 bottom-0 w-1.5 transition-colors"
                      style={{ backgroundColor: nb.color }}
                    />

                    <div>
                      {/* Top metadata */}
                      <div className="flex items-center justify-between pb-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                          style={{ backgroundColor: `${nb.color}33`, color: nb.color }}
                        >
                          {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                        </span>

                        {notebooks.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete notebook "${nb.title}"?`)) {
                                onDeleteNotebook(nb.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Notebook"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Title & Section */}
                      <h3 className="font-semibold text-sm text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                        {nb.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {firstPage?.title || 'Empty notebook'}
                      </p>
                    </div>

                    {/* Bottom footer */}
                    <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="capitalize">{firstPage?.pattern || 'ruled'} layout</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-zinc-400 group-hover:text-white font-medium">
                        Open <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Create New Notebook Card */}
              <button
                onClick={() => setIsCreatingModal(true)}
                className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 hover:border-white/25 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 transition-all group min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 group-hover:text-white flex items-center justify-center mb-2 transition-colors">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                  Create Notebook
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Custom cover & layout</span>
              </button>
            </div>
          </section>

          {/* Section: Recent / Starred Pages */}
          {(activeTab === 'all' || activeTab === 'recent' || activeTab === 'favorites') && (
            <section className="space-y-3.5 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    {activeTab === 'favorites' ? 'Starred Pages' : 'Jump Back In'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {filteredPages.length} {filteredPages.length === 1 ? 'note' : 'notes'} ready for editing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredPages.map((item) => (
                  <div
                    key={item.page.id}
                    onClick={() => onOpenNotebook(item.notebookId, item.pageIndex)}
                    className="group relative p-3.5 bg-white/[0.025] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.notebookColor }}
                          />
                          <span className="truncate font-medium text-zinc-400">
                            {item.notebookTitle}
                          </span>
                        </span>
                        {item.page.pinned && (
                          <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                      </div>

                      <h4 className="font-semibold text-xs text-zinc-200 group-hover:text-white line-clamp-1">
                        {item.page.title}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{item.page.strokes.length} handwriting strokes</span>
                      <span className="capitalize">{item.page.pattern}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* 3. Create Notebook Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12141c] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">Create New Notebook</h3>
                <p className="text-xs text-zinc-400">Set a title, cover accent and paper style</p>
              </div>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Notebook Title
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g., Physics II, Meeting Minutes, Daily Thoughts"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Cover Color Picker */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Spine & Cover Accent
                </label>
                <div className="flex items-center gap-2">
                  {[
                    '#4f46e5', // Deep Indigo
                    '#0284c7', // Sky Blue
                    '#059669', // Emerald
                    '#dc2626', // Crimson Red
                    '#d97706', // Tuscan Amber
                    '#7c3aed', // Purple
                    '#e11d48', // Rose
                    '#475569', // Slate
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#12141c]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Paper Pattern & Theme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Paper Pattern
                  </label>
                  <select
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value as PaperPattern)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30 capitalize"
                  >
                    <option value="ruled" className="bg-[#12141c]">Ruled (Lined)</option>
                    <option value="grid" className="bg-[#12141c]">Grid / Graph</option>
                    <option value="dotted" className="bg-[#12141c]">Dotted</option>
                    <option value="cornell" className="bg-[#12141c]">Cornell Notes</option>
                    <option value="daily-journal" className="bg-[#12141c]">Daily Journal</option>
                    <option value="blank" className="bg-[#12141c]">Blank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Paper Theme
                  </label>
                  <select
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value as PaperTheme)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30 capitalize"
                  >
                    <option value="white" className="bg-[#12141c]">Classic White</option>
                    <option value="ivory" className="bg-[#12141c]">Moleskine Ivory</option>
                    <option value="legal-yellow" className="bg-[#12141c]">Legal Yellow</option>
                    <option value="dark-slate" className="bg-[#12141c]">Dark Slate</option>
                    <option value="oled-black" className="bg-[#12141c]">OLED Black</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
