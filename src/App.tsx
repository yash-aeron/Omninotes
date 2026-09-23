import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudioToolbar } from './components/toolbar/StudioToolbar';
import { StylusCanvas } from './components/canvas/StylusCanvas';
import { PageNavigator } from './components/sidebar/PageNavigator';
import { AiSplitView } from './components/sidebar/AiSplitView';
import { NotebookSidebar } from './components/sidebar/NotebookSidebar';
import { CommandPalette } from './components/common/CommandPalette';
import type { CommandItem } from './components/common/CommandPalette';
import { TimeLapseModal } from './components/canvas/TimeLapseModal';
import { LayersPanel } from './components/canvas/LayersPanel';
import { AddPageModal } from './components/canvas/AddPageModal';
import { PagesPanel } from './components/sidebar/PagesPanel';
import { LibraryView } from './components/library/LibraryView';
import { McpModal } from './components/mcp/McpModal';
import { useNotebookStore } from './store/useNotebookStore';
import { exportToPDF, exportToMarkdown, exportToSVG, downloadFile } from './engine/export-engine';
import type { PenType } from './engine/types';
import {
  FilePlus,
  FileDown,
  Sparkles,
  Play,
  Grid,
  Maximize2,
  Trash2,
  BookOpen,
  Cpu,
  LayoutGrid,
} from 'lucide-react';

export function App() {
  const store = useNotebookStore();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);

  // Global hotkeys (Undo, Redo, Command Palette, Focus Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      // Toggle Sidebar in editor (Ctrl+B)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && store.appView === 'editor') {
        e.preventDefault();
        store.setShowSidebar(!store.showSidebar);
      }
      // Toggle GoodNotes Pages Panel (Ctrl+P or Ctrl+Shift+P)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && store.appView === 'editor') {
        e.preventDefault();
        store.setShowPagesPanel(!store.showPagesPanel);
      }
      // Add Page with Template Modal (Ctrl+Shift+N)
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n' && store.appView === 'editor') {
        e.preventDefault();
        setShowAddPageModal(true);
      }
      // Undo (Ctrl+Z)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          store.handleRedo();
        } else {
          store.handleUndo();
        }
      }
      // Redo (Ctrl+Y)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.handleRedo();
      }
      // Pan mode spacebar hold
      else if (
        e.code === 'Space' &&
        !e.repeat &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        store.setIsPanningMode(true);
      }
      // Focus mode (F11)
      else if (e.key === 'F11') {
        e.preventDefault();
        store.setIsFocusMode(!store.isFocusMode);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        store.setIsPanningMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [store]);

  // Export handlers
  const handleExportPDF = useCallback(() => {
    exportToPDF(store.pages, store.currentNotebook.title);
  }, [store.pages, store.currentNotebook.title]);

  const handleExportMarkdown = useCallback(() => {
    const md = exportToMarkdown(store.currentPage, store.currentNotebook.title);
    downloadFile(
      md,
      `${store.currentPage.title.toLowerCase().replace(/\s+/g, '-')}.md`,
      'text/markdown'
    );
  }, [store.currentPage, store.currentNotebook.title]);

  const handleExportSVG = useCallback(() => {
    const svg = exportToSVG(store.currentPage);
    downloadFile(
      svg,
      `${store.currentPage.title.toLowerCase().replace(/\s+/g, '-')}.svg`,
      'image/svg+xml'
    );
  }, [store.currentPage]);

  // Command Palette Items
  const commandList: CommandItem[] = useMemo(
    () => [
      {
        id: 'library',
        title: 'Go to Library Shelf',
        category: 'View',
        icon: <BookOpen size={16} />,
        action: () => store.setAppView('library'),
      },
      {
        id: 'quick-note',
        title: 'New Quick Scribble',
        category: 'Actions',
        icon: <FilePlus size={16} />,
        shortcut: 'Ctrl+N',
        action: store.quickNote,
      },
      {
        id: 'new-page',
        title: 'Add New Page to Notebook',
        category: 'Actions',
        icon: <FilePlus size={16} />,
        action: store.addPage,
      },
      {
        id: 'add-page-template',
        title: 'Add Page with Template...',
        category: 'Actions',
        icon: <FilePlus size={16} />,
        shortcut: 'Ctrl+Shift+N',
        action: () => setShowAddPageModal(true),
      },
      {
        id: 'pages-panel',
        title: 'Toggle Pages Thumbnail Side Panel',
        category: 'View',
        icon: <LayoutGrid size={16} />,
        shortcut: 'Ctrl+P',
        action: () => store.setShowPagesPanel(!store.showPagesPanel),
      },
      {
        id: 'ai-split',
        title: 'Toggle AI Structured Notes & Assistant',
        category: 'View',
        icon: <Sparkles size={16} />,
        shortcut: 'Ctrl+Shift+A',
        action: () => store.setShowAiSplit(!store.showAiSplit),
      },
      {
        id: 'mcp-hub',
        title: 'Open Model Context Protocol (MCP) Hub',
        category: 'Tools',
        icon: <Cpu size={16} />,
        shortcut: 'Ctrl+Shift+M',
        action: () => setShowMcpModal(true),
      },
      {
        id: 'export-pdf',
        title: 'Export Notebook to PDF Document',
        category: 'Export',
        icon: <FileDown size={16} />,
        action: handleExportPDF,
      },
      {
        id: 'export-md',
        title: 'Export Current Page to Markdown',
        category: 'Export',
        icon: <FileDown size={16} />,
        action: handleExportMarkdown,
      },
      {
        id: 'export-svg',
        title: 'Export Vector SVG Canvas',
        category: 'Export',
        icon: <FileDown size={16} />,
        action: handleExportSVG,
      },
      {
        id: 'time-lapse',
        title: 'Start Handwriting Time-Lapse Replay',
        category: 'Actions',
        icon: <Play size={16} />,
        action: () => {
          store.setTimeLapseProgress(0.01);
          store.setIsTimeLapsePlaying(true);
          store.setShowTimeLapse(true);
        },
      },
      {
        id: 'tpl-ruled',
        title: 'Set Template: Ruled (Lined)',
        category: 'Templates',
        icon: <Grid size={16} />,
        action: () => store.setPattern('ruled'),
      },
      {
        id: 'tpl-cornell',
        title: 'Set Template: Cornell Notes Layout',
        category: 'Templates',
        icon: <Grid size={16} />,
        action: () => store.setPattern('cornell'),
      },
      {
        id: 'tpl-grid',
        title: 'Set Template: Grid Graph Paper',
        category: 'Templates',
        icon: <Grid size={16} />,
        action: () => store.setPattern('grid'),
      },
      {
        id: 'focus-mode',
        title: 'Toggle Distraction-Free Focus Mode',
        category: 'View',
        icon: <Maximize2 size={16} />,
        shortcut: 'F11',
        action: () => store.setIsFocusMode(!store.isFocusMode),
      },
      {
        id: 'clear-canvas',
        title: 'Clear All Strokes on Current Page',
        category: 'Actions',
        icon: <Trash2 size={16} />,
        action: store.clearCurrentPage,
      },
    ],
    [store, handleExportPDF, handleExportMarkdown, handleExportSVG]
  );

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#090a0f] text-gray-100 select-none">
      {/* View 1: Consumer Home / Library Shelf */}
      {store.appView === 'library' ? (
        <LibraryView
          notebooks={store.notebooks}
          onOpenNotebook={store.openNotebook}
          onCreateNotebook={store.createAndOpenNotebook}
          onQuickNote={store.quickNote}
          onDeleteNotebook={store.deleteNotebook}
          onOpenSearch={() => setShowCommandPalette(true)}
        />
      ) : (
        /* View 2: Notebook Workspace & Studio Inking Canvas */
        <div className="relative flex flex-col w-full h-full overflow-hidden">
          {/* Header & Floating Studio Toolbar */}
          <StudioToolbar
            notebookTitle={store.currentNotebook.title}
            pageTitle={store.currentPage.title}
            currentPen={store.currentStyle.penType}
            currentColor={store.currentStyle.color}
            currentSize={store.currentStyle.size}
            isPanningMode={store.isPanningMode}
            autoSnapShapes={store.autoSnapShapes}
            isFocusMode={store.isFocusMode}
            canUndo={store.canUndo}
            canRedo={store.canRedo}
            currentPattern={store.currentPage.pattern}
            currentTheme={store.currentPage.theme}
            viewMode={store.viewMode}
            showAiSplit={store.showAiSplit}
            showLayers={store.showLayers}
            showPagesPanel={store.showPagesPanel}
            pageCount={store.pages.length}
            onTogglePagesPanel={() => store.setShowPagesPanel(!store.showPagesPanel)}
            onOpenAddPageModal={() => setShowAddPageModal(true)}
            onBackToLibrary={() => store.setAppView('library')}
            onUpdatePageTitle={store.updatePageTitle}
            onSelectPen={(pen: PenType) =>
              store.setCurrentStyle((prev) => ({ ...prev, penType: pen }))
            }
            onSelectColor={(color: string) =>
              store.setCurrentStyle((prev) => ({ ...prev, color }))
            }
            onSelectSize={(size: number) =>
              store.setCurrentStyle((prev) => ({ ...prev, size }))
            }
            onTogglePanning={() => store.setIsPanningMode(!store.isPanningMode)}
            onToggleAutoSnap={() => store.setAutoSnapShapes(!store.autoSnapShapes)}
            onToggleFocusMode={() => store.setIsFocusMode(!store.isFocusMode)}
            onToggleTimeLapse={() => {
              store.setTimeLapseProgress(0.01);
              store.setIsTimeLapsePlaying(true);
              store.setShowTimeLapse(true);
            }}
            onToggleLayers={() => store.setShowLayers(!store.showLayers)}
            onAddTextBlock={store.addTextBlock}
            onAddCodeBlock={store.addCodeBlock}
            onUndo={store.handleUndo}
            onRedo={store.handleRedo}
            onSelectPattern={store.setPattern}
            onSelectTheme={store.setTheme}
            onToggleViewMode={() =>
              store.setViewMode(store.viewMode === 'classic' ? 'infinite' : 'classic')
            }
            onToggleAiSplit={() => store.setShowAiSplit(!store.showAiSplit)}
            onToggleMcp={() => setShowMcpModal((prev) => !prev)}
            onClearPage={store.clearCurrentPage}
            onExportPDF={handleExportPDF}
            onExportMarkdown={handleExportMarkdown}
            onExportSVG={handleExportSVG}
          />

          {/* Canvas Area */}
          <div className="relative flex-1 flex overflow-hidden">
            {/* GoodNotes-Style Pages Side Panel Drawer */}
            <PagesPanel
              isOpen={store.showPagesPanel && !store.isFocusMode}
              onClose={() => store.setShowPagesPanel(false)}
              pages={store.pages}
              activePageIndex={store.activePageIndex}
              onSelectPage={store.setActivePageIndex}
              onOpenAddPageModal={() => setShowAddPageModal(true)}
              onDuplicatePage={store.duplicatePage}
              onMovePage={store.movePage}
              onDeletePage={store.deletePage}
              onTogglePinPage={store.togglePinPage}
            />

            {/* Notebooks & Sections Drawer (Ctrl+B) */}
            <NotebookSidebar
              isOpen={store.showSidebar && !store.isFocusMode}
              onClose={() => store.setShowSidebar(false)}
              notebooks={store.notebooks}
              activeNotebookId={store.activeNotebookId}
              activePageIndex={store.activePageIndex}
              onSelectNotebook={store.setActiveNotebookId}
              onSelectPage={store.setActivePageIndex}
              onAddNotebook={store.addNotebook}
              onAddPage={store.addPage}
              onDeleteNotebook={store.deleteNotebook}
              onTogglePinPage={store.togglePinPage}
            />

            {/* Inking Canvas with Auto-Centering and Smooth Gestures */}
            <div className="relative flex-1 h-full overflow-hidden">
              <StylusCanvas
                page={store.currentPage}
                currentStyle={store.currentStyle}
                viewMode={store.viewMode}
                zoom={store.zoom}
                pan={store.pan}
                isPanningMode={store.isPanningMode}
                enablePalmRejection={store.enablePalmRejection}
                allowTouchDrawing={store.allowTouchDrawing}
                autoSnapShapes={store.autoSnapShapes}
                timeLapseProgress={store.timeLapseProgress}
                onStrokesChange={store.updateStrokes}
                onTextBlocksChange={store.updateTextBlocks}
                onCodeBlocksChange={store.updateCodeBlocks}
                onImagesChange={store.updateImages}
                onPanChange={store.setPan}
                onZoomChange={store.setZoom}
              />

              {/* Layers Panel Popover */}
              <LayersPanel
                isOpen={store.showLayers && !store.isFocusMode}
                onClose={() => store.setShowLayers(false)}
                layers={store.currentPage.layers}
                activeLayerId={store.currentPage.activeLayerId}
                onSelectLayer={store.setActiveLayer}
                onToggleVisible={store.toggleLayerVisible}
                onToggleLocked={store.toggleLayerLocked}
                onAddLayer={store.addLayer}
                onDeleteLayer={store.deleteLayer}
              />

              {/* Time-Lapse Floating Replay Controller */}
              <TimeLapseModal
                isOpen={store.showTimeLapse}
                onClose={() => {
                  store.setShowTimeLapse(false);
                  store.setIsTimeLapsePlaying(false);
                  store.setTimeLapseProgress(1.0);
                }}
                isPlaying={store.isTimeLapsePlaying}
                progress={store.timeLapseProgress}
                speed={store.timeLapseSpeed}
                currentStrokeIndex={Math.ceil(
                  store.currentPage.strokes.length * store.timeLapseProgress
                )}
                totalStrokes={store.currentPage.strokes.length}
                onTogglePlay={() =>
                  store.setIsTimeLapsePlaying(!store.isTimeLapsePlaying)
                }
                onSeek={(p) => store.setTimeLapseProgress(p)}
                onCycleSpeed={() => {
                  const speeds = [1, 2, 5, 10];
                  const next = speeds[(speeds.indexOf(store.timeLapseSpeed) + 1) % speeds.length];
                  store.setTimeLapseSpeed(next);
                }}
                onReset={() => store.setTimeLapseProgress(0.01)}
              />
            </div>

            {/* AI Second Brain Slide-over */}
            <AiSplitView
              page={store.currentPage}
              isOpen={store.showAiSplit && !store.isFocusMode}
              onClose={() => store.setShowAiSplit(false)}
              onUpdateTranscription={store.updateTranscription}
              onInsertToCanvas={store.insertTypedNote}
              onOpenMcpModal={() => setShowMcpModal(true)}
            />
          </div>

          {/* Bottom Docked Page Navigator & Status Bar */}
          {!store.isFocusMode && (
            <PageNavigator
              pages={store.pages}
              activePageIndex={store.activePageIndex}
              onSelectPage={store.setActivePageIndex}
              onAddPage={store.addPage}
              onOpenAddPageModal={() => setShowAddPageModal(true)}
              onTogglePagesPanel={() => store.setShowPagesPanel(!store.showPagesPanel)}
              onDeletePage={store.deletePage}
              zoom={store.zoom}
              onZoomChange={store.setZoom}
              onResetPanZoom={store.resetPanZoom}
            />
          )}
        </div>
      )}

      {/* Global Command Palette Spotlight (Ctrl+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commandList}
      />

      {/* GoodNotes-Style Add Page with Template Modal */}
      <AddPageModal
        isOpen={showAddPageModal}
        onClose={() => setShowAddPageModal(false)}
        activePageIndex={store.activePageIndex}
        totalPages={store.pages.length}
        currentPattern={store.currentPage.pattern}
        currentTheme={store.currentPage.theme}
        onAddPage={store.addPageWithTemplate}
      />

      {/* Model Context Protocol (MCP) Hub Modal */}
      <McpModal
        isOpen={showMcpModal}
        onClose={() => setShowMcpModal(false)}
      />
    </div>
  );
}

export default App;
