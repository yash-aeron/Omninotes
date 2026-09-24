import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, X } from 'lucide-react';
import type { CanvasLayer } from '../../engine/types';

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: CanvasLayer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onToggleVisible: (layerId: string) => void;
  onToggleLocked: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  isOpen,
  onClose,
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisible,
  onToggleLocked,
  onAddLayer,
  onDeleteLayer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-30 w-64 bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl p-3 text-xs select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
          <Layers size={15} className="text-zinc-400" />
          <span>Canvas Layers</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddLayer}
            className="p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800"
            title="Add Layer"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer border transition-all ${
              layer.id === activeLayerId
                ? 'bg-white/10 border-white/20 text-white font-medium'
                : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="truncate flex-1">{layer.name}</span>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisible(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-white"
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-gray-600" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLocked(layer.id);
                }}
                className="p-1 text-gray-400 hover:text-white"
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? <Lock size={13} className="text-amber-400" /> : <Unlock size={13} />}
              </button>

              {layers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="p-1 text-gray-500 hover:text-rose-400"
                  title="Delete Layer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
