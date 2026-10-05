import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Templates' | 'Export' | 'View' | 'Tools' | 'File';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? filteredCommands.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800">
          <Search size={18} className="text-zinc-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search notes..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands or pages found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={idx === selectedIndex ? 'text-zinc-950' : 'text-zinc-400'}>
                    {cmd.icon}
                  </span>
                  <span className="font-medium">{cmd.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      idx === selectedIndex
                        ? 'bg-zinc-200 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {cmd.category}
                  </span>
                </div>

                {cmd.shortcut && (
                  <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      idx === selectedIndex
                        ? 'bg-zinc-200 text-zinc-900 border border-zinc-300'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-gray-800 bg-gray-950/60 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span>OmniNotes Spotlight</span>
        </div>
      </div>
    </div>
  );
};
