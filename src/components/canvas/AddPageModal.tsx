import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  FileText,
  Grid,
  Calendar,
  Users,
  Code2,
  Music2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { PaperPattern, PaperTheme } from '../../engine/types';
import { PAPER_THEME_COLORS } from './PaperTemplate';

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePageIndex: number;
  totalPages: number;
  currentPattern: PaperPattern;
  currentTheme: PaperTheme;
  onAddPage: (options: {
    pattern: PaperPattern;
    theme: PaperTheme;
    title: string;
    position: 'after-current' | 'end' | 'start';
  }) => void;
}

interface TemplateOption {
  id: PaperPattern;
  name: string;
  category: 'standard' | 'productivity' | 'specialized';
  description: string;
  badge?: string;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'ruled',
    name: 'Ruled / Lined',
    category: 'standard',
    description: 'Classic college ruled lines with pink margin bar for handwriting & note taking',
    icon: <FileText size={16} />,
  },
  {
    id: 'grid',
    name: 'Square Grid',
    category: 'standard',
    description: 'Precision graph paper squares for diagrams, math, charts, and geometry',
    icon: <Grid size={16} />,
  },
  {
    id: 'dotted',
    name: 'Bullet Dot Grid',
    category: 'standard',
    description: 'Minimal dot matrix layout for bullet journaling and flexible layouts',
    icon: <Sparkles size={16} />,
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'standard',
    description: 'Pure distraction-free open paper for sketching, mindmaps, and freeform ink',
    icon: <BookOpen size={16} />,
  },
  {
    id: 'cornell',
    name: 'Cornell Notes',
    category: 'productivity',
    description: 'Top topic line, cue column on left, main note area, and summary section',
    badge: 'Popular',
    icon: <BookOpen size={16} />,
  },
  {
    id: 'daily-journal',
    name: 'Daily Reflection & Habits',
    category: 'productivity',
    description: 'Date header, top 3 priorities, daily gratitude, and lined brain dump',
    icon: <Calendar size={16} />,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Minutes',
    category: 'productivity',
    description: 'Header for agenda & attendees, discussion notes, and action item deliverables',
    icon: <Users size={16} />,
  },
  {
    id: 'lecture-notes',
    name: 'Lecture & Study Notes',
    category: 'productivity',
    description: 'Course header, terms/questions sidebar, and wide note-taking area',
    icon: <FileText size={16} />,
  },
  {
    id: 'code-split',
    name: 'Code & Notes Split',
    category: 'productivity',
    description: 'Side-by-side: architecture handwriting on left, code syntax zone on right',
    badge: 'Developer',
    icon: <Code2 size={16} />,
  },
  {
    id: 'music',
    name: 'Music Manuscript',
    category: 'specialized',
    description: 'Standard 5-line musical staves for musical composition and notation',
    icon: <Music2 size={16} />,
  },
  {
    id: 'isometric',
    name: 'Isometric Dot Grid',
    category: 'specialized',
    description: 'Triangular isometric dot grid for 3D technical drawing and architecture',
    icon: <Grid size={16} />,
  },
];

const THEME_OPTIONS: { id: PaperTheme; name: string; hex: string }[] = [
  { id: 'white', name: 'Clean White', hex: '#ffffff' },
  { id: 'ivory', name: 'Warm Ivory', hex: '#fdfbf7' },
  { id: 'legal-yellow', name: 'Legal Yellow', hex: '#fefce8' },
  { id: 'dark-slate', name: 'Dark Slate', hex: '#1e293b' },
  { id: 'oled-black', name: 'OLED Black', hex: '#090a0f' },
];

export const AddPageModal: React.FC<AddPageModalProps> = ({
  isOpen,
  onClose,
  activePageIndex,
  totalPages,
  currentPattern,
  currentTheme,
  onAddPage,
}) => {
  const [selectedPattern, setSelectedPattern] = useState<PaperPattern>(currentPattern);
  const [selectedTheme, setSelectedTheme] = useState<PaperTheme>(currentTheme);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'productivity' | 'specialized'>('all');
  const [position, setPosition] = useState<'after-current' | 'end' | 'start'>('after-current');
  const [customTitle, setCustomTitle] = useState('');

  // Update defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('all');
      setSelectedPattern(currentPattern);
      setSelectedTheme(currentTheme);
      setPosition('after-current');
      const tmpl = TEMPLATES.find((t) => t.id === currentPattern);
      setCustomTitle(tmpl ? `${tmpl.name} — Page ${totalPages + 1}` : `Page ${totalPages + 1}`);
    }
  }, [isOpen, currentPattern, currentTheme, totalPages]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleSelectTemplate = (tmpl: TemplateOption) => {
    setSelectedPattern(tmpl.id);
    setCustomTitle(`${tmpl.name} — Page ${totalPages + 1}`);
  };

  const handleConfirm = () => {
    onAddPage({
      pattern: selectedPattern,
      theme: selectedTheme,
      title: customTitle.trim() || `Page ${totalPages + 1}`,
      position,
    });
    onClose();
  };

  // Mini preview renderer for card thumbnails
  const renderMiniPreview = (pattern: PaperPattern, theme: PaperTheme) => {
    const colors = PAPER_THEME_COLORS[theme] || PAPER_THEME_COLORS.white;

    return (
      <div
        className="w-full h-24 rounded-lg relative overflow-hidden border border-white/10 shadow-inner flex flex-col justify-between p-2 select-none"
        style={{ backgroundColor: colors.bg }}
      >
        {/* Render Pattern Specific Mini Lines */}
        {pattern === 'ruled' && (
          <div className="w-full h-full relative">
            <div
              className="absolute left-3 top-0 bottom-0 w-[1.5px]"
              style={{ backgroundColor: colors.margin }}
            />
            <div className="flex flex-col justify-around h-full pl-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-px w-full" style={{ backgroundColor: colors.line }} />
              ))}
            </div>
          </div>
        )}

        {pattern === 'grid' && (
          <div
            className="w-full h-full opacity-60"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.line} 1px, transparent 1px), linear-gradient(to bottom, ${colors.line} 1px, transparent 1px)`,
              backgroundSize: '12px 12px',
            }}
          />
        )}

        {pattern === 'dotted' && (
          <div
            className="w-full h-full opacity-70"
            style={{
              backgroundImage: `radial-gradient(circle, ${colors.line} 1.2px, transparent 1.2px)`,
              backgroundSize: '10px 10px',
            }}
          />
        )}

        {pattern === 'blank' && (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold opacity-30"
              style={{ color: colors.text }}
            >
              Plain Sheet
            </span>
          </div>
        )}

        {pattern === 'cornell' && (
          <div className="w-full h-full flex flex-col justify-between relative">
            <div className="h-3 border-b" style={{ borderColor: colors.line }}>
              <span className="text-[7px] font-bold block ml-1" style={{ color: colors.text, opacity: 0.5 }}>
                TITLE / DATE
              </span>
            </div>
            <div className="flex-1 flex relative">
              <div className="w-1/3 border-r h-full" style={{ borderColor: colors.margin }}>
                <span className="text-[6px] block p-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                  CUES
                </span>
              </div>
              <div className="w-2/3 h-full flex flex-col justify-around pl-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-px w-full" style={{ backgroundColor: colors.line }} />
                ))}
              </div>
            </div>
            <div className="h-4 border-t" style={{ borderColor: colors.line }}>
              <span className="text-[6px] font-bold block ml-1" style={{ color: colors.text, opacity: 0.5 }}>
                SUMMARY
              </span>
            </div>
          </div>
        )}

        {pattern === 'daily-journal' && (
          <div className="w-full h-full flex flex-col justify-between text-[6px]">
            <div className="h-3 rounded px-1 flex items-center justify-between" style={{ backgroundColor: colors.headerBg }}>
              <span className="font-bold" style={{ color: colors.text }}>DAILY REFLECTION</span>
            </div>
            <div className="grid grid-cols-2 gap-1 my-0.5">
              <div className="border rounded p-0.5 h-6" style={{ borderColor: colors.line }}>
                <span className="block font-semibold opacity-60" style={{ color: colors.text }}>PRIORITIES</span>
              </div>
              <div className="border rounded p-0.5 h-6" style={{ borderColor: colors.line }}>
                <span className="block font-semibold opacity-60" style={{ color: colors.text }}>GRATITUDE</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
            </div>
          </div>
        )}

        {pattern === 'meeting-notes' && (
          <div className="w-full h-full flex flex-col justify-between text-[6px]">
            <div className="h-3 rounded px-1 flex items-center justify-between" style={{ backgroundColor: colors.headerBg }}>
              <span className="font-bold" style={{ color: colors.text }}>MEETING MINUTES</span>
            </div>
            <div className="flex flex-col gap-1 my-1">
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
            </div>
            <div className="border rounded p-0.5 h-6" style={{ borderColor: colors.line }}>
              <span className="block font-semibold opacity-60" style={{ color: colors.text }}>ACTION ITEMS</span>
            </div>
          </div>
        )}

        {pattern === 'lecture-notes' && (
          <div className="w-full h-full flex flex-col justify-between text-[6px]">
            <div className="h-3 rounded px-1 flex items-center" style={{ backgroundColor: colors.headerBg }}>
              <span className="font-bold" style={{ color: colors.text }}>LECTURE NOTES</span>
            </div>
            <div className="flex-1 flex gap-1 mt-1">
              <div className="w-1/4 border-r pr-0.5" style={{ borderColor: colors.margin }}>
                <span className="opacity-50" style={{ color: colors.text }}>TERMS</span>
              </div>
              <div className="w-3/4 flex flex-col justify-around">
                <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
                <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
              </div>
            </div>
          </div>
        )}

        {pattern === 'code-split' && (
          <div className="w-full h-full flex text-[6px] gap-1">
            <div className="w-1/2 flex flex-col justify-around pr-1 border-r" style={{ borderColor: colors.line }}>
              <span className="font-bold opacity-60" style={{ color: colors.text }}>NOTES</span>
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
              <div className="h-px w-full" style={{ backgroundColor: colors.line }} />
            </div>
            <div className="w-1/2 rounded p-1 flex flex-col justify-between" style={{ backgroundColor: colors.headerBg }}>
              <span className="font-mono opacity-80" style={{ color: colors.text }}>const code = () =&gt; &#123;&#125;</span>
            </div>
          </div>
        )}

        {pattern === 'music' && (
          <div className="w-full h-full flex flex-col justify-around py-1">
            <div className="space-y-0.5">
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l} className="h-[0.7px] w-full" style={{ backgroundColor: colors.text, opacity: 0.7 }} />
              ))}
            </div>
            <div className="space-y-0.5">
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l} className="h-[0.7px] w-full" style={{ backgroundColor: colors.text, opacity: 0.7 }} />
              ))}
            </div>
          </div>
        )}

        {pattern === 'isometric' && (
          <div
            className="w-full h-full opacity-70"
            style={{
              backgroundImage: `radial-gradient(circle, ${colors.line} 1.2px, transparent 1.2px)`,
              backgroundSize: '14px 20px',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f1118] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-[#0a0c12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FileText size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Add Page with Template
              </h2>
              <p className="text-[11px] text-zinc-400">
                Choose stationery style, paper tone, and placement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body: Two Columns (Templates + Configuration) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Category Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
            {[
              { id: 'all', label: 'All Templates' },
              { id: 'standard', label: 'Standard Paper' },
              { id: 'productivity', label: 'Study & Productivity' },
              { id: 'specialized', label: 'Specialized' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 2. Template Selection Grid */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
              Stationery Layout
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredTemplates.map((tmpl) => {
                const isSelected = selectedPattern === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`group cursor-pointer rounded-xl p-3 border transition-all text-left flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-white/10 border-white shadow-lg'
                        : 'bg-[#141724]/70 border-white/5 hover:border-white/20 hover:bg-[#141724]'
                    }`}
                  >
                    {/* Badge */}
                    {tmpl.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 text-white z-10">
                        {tmpl.badge}
                      </span>
                    )}

                    {/* Mini Visual Preview */}
                    <div className="mb-2.5">
                      {renderMiniPreview(tmpl.id, selectedTheme)}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center gap-1.5">
                          {tmpl.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-white text-zinc-950 flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Paper Theme & Tone Selection */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
              Paper Theme
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white/15 border-white text-white shadow-sm'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span className="truncate">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Placement & Title */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placement */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Insertion Position
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'after-current', label: 'After Current' },
                  { id: 'end', label: 'At End' },
                  { id: 'start', label: 'At Beginning' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id as any)}
                    className={`py-2 px-2 rounded-xl text-center font-medium transition-all truncate ${
                      position === pos.id
                        ? 'bg-white text-zinc-950 font-semibold'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Title */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Page Title
              </span>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Page Title (e.g., Cornell Notes — Chemistry)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 border-t border-white/5 flex items-center justify-between bg-[#0a0c12] flex-shrink-0">
          <div className="text-xs text-zinc-400">
            Inserting after <span className="text-white font-medium">Page {activePageIndex + 1}</span> of {totalPages}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>Add Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
