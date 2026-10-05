import { useState, useCallback, useEffect } from 'react';
import type {
  Notebook,
  PageMetadata,
  Stroke,
  StrokeStyle,
  PaperPattern,
  PaperTheme,
  ViewMode,
  CanvasLayer,
  TextBlock,
  CodeBlock,
  ImageElement,
} from '../engine/types';
import { StorageAdapter } from '../engine/storage-adapter';
import { parsePdfDocument, convertPdfPagesToNotebookPages } from '../engine/pdf-engine';

const DEFAULT_LAYERS: CanvasLayer[] = [
  { id: 'layer-1', name: 'Layer 1 (Background)', visible: true, locked: false, opacity: 1 },
  { id: 'layer-2', name: 'Layer 2 (Notes & Ink)', visible: true, locked: false, opacity: 1 },
];

const INITIAL_PAGE: PageMetadata = {
  id: 'page-1',
  title: 'Untitled Note',
  pattern: 'ruled',
  theme: 'white',
  width: 820,
  height: 1160,
  layers: DEFAULT_LAYERS,
  activeLayerId: 'layer-2',
  strokes: [],
  textBlocks: [],
  codeBlocks: [],
  images: [],
  pinned: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-1',
    title: 'My Notes',
    color: '#6366f1',
    sections: [
      {
        id: 'sec-1',
        title: 'Notes',
        pages: [INITIAL_PAGE],
        activePageIndex: 0,
      },
    ],
    activeSectionId: 'sec-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function useNotebookStore() {
  // Load persisted notebooks if available
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    return StorageAdapter.loadNotebooks() || INITIAL_NOTEBOOKS;
  });

  const [appView, setAppView] = useState<'library' | 'editor'>('library');
  const [activeNotebookId, setActiveNotebookId] = useState<string>(notebooks[0].id);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('classic');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState<boolean>(false);
  const [enablePalmRejection, setEnablePalmRejection] = useState<boolean>(true);
  const [allowTouchDrawing, setAllowTouchDrawing] = useState<boolean>(false);
  const [autoSnapShapes, setAutoSnapShapes] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [showAiSplit, setShowAiSplit] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showPagesPanel, setShowPagesPanel] = useState<boolean>(false);
  const [showLayers, setShowLayers] = useState<boolean>(false);
  const [showTimeLapse, setShowTimeLapse] = useState<boolean>(false);
  const [isImportingPdf, setIsImportingPdf] = useState<boolean>(false);
  const [pdfImportProgress, setPdfImportProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  // Time-Lapse Replay State
  const [timeLapseProgress, setTimeLapseProgress] = useState<number>(1.0);
  const [isTimeLapsePlaying, setIsTimeLapsePlaying] = useState<boolean>(false);
  const [timeLapseSpeed, setTimeLapseSpeed] = useState<number>(1);

  // Pen Tool Style State
  const [currentStyle, setCurrentStyle] = useState<StrokeStyle>({
    penType: 'ballpoint',
    color: '#090a0f',
    size: 3.5,
    opacity: 1,
    smoothing: 0.5,
    thinning: 0.15,
    streamline: 0.4,
  });

  // History Stacks for Undo / Redo
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  // Get current active notebook and page
  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) || notebooks[0];
  const currentSection = currentNotebook.sections[0];
  const pages = currentSection.pages;
  const currentPage = pages[activePageIndex] || pages[0];

  // Auto-save to localStorage debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      StorageAdapter.saveNotebooks(notebooks);
    }, 500);
    return () => clearTimeout(timer);
  }, [notebooks]);

  // Update current page helper
  const updateCurrentPage = useCallback(
    (updater: (page: PageMetadata) => PageMetadata) => {
      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          return {
            ...nb,
            sections: nb.sections.map((sec) => ({
              ...sec,
              pages: sec.pages.map((p, idx) =>
                idx === activePageIndex ? updater(p) : p
              ),
            })),
          };
        })
      );
    },
    [activeNotebookId, activePageIndex]
  );

  // Update strokes with Undo history
  const updateStrokes = useCallback(
    (newStrokes: Stroke[]) => {
      setUndoStack((prev) => [...prev.slice(-30), currentPage.strokes]);
      setRedoStack([]);

      updateCurrentPage((page) => ({
        ...page,
        strokes: newStrokes,
        updatedAt: Date.now(),
      }));

      // Auto-save snapshot into version history
      StorageAdapter.saveVersionSnapshot({
        ...currentPage,
        strokes: newStrokes,
      });
    },
    [currentPage, updateCurrentPage]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentPage.strokes]);
    updateCurrentPage((page) => ({ ...page, strokes: previous }));
  }, [undoStack, currentPage.strokes, updateCurrentPage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, currentPage.strokes]);
    updateCurrentPage((page) => ({ ...page, strokes: next }));
  }, [redoStack, currentPage.strokes, updateCurrentPage]);

  // Notebook operations
  const openNotebook = useCallback((notebookId: string, pageIndex: number = 0) => {
    setActiveNotebookId(notebookId);
    setActivePageIndex(pageIndex);
    setAppView('editor');
  }, []);

  const createAndOpenNotebook = useCallback(
    (title: string, pattern: PaperPattern = 'ruled', theme: PaperTheme = 'white', color: string = '#6366f1') => {
      const newPage: PageMetadata = {
        ...INITIAL_PAGE,
        id: `page-${Date.now()}`,
        title: `${title} — Page 1`,
        pattern,
        theme,
        strokes: [],
        textBlocks: [],
        codeBlocks: [],
        images: [],
      };
      const newNb: Notebook = {
        id: `nb-${Date.now()}`,
        title,
        color,
        sections: [
          {
            id: `sec-${Date.now()}`,
            title: 'General',
            pages: [newPage],
            activePageIndex: 0,
          },
        ],
        activeSectionId: `sec-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotebooks((prev) => [...prev, newNb]);
      setActiveNotebookId(newNb.id);
      setActivePageIndex(0);
      setAppView('editor');
    },
    []
  );

  const importPdfAsNotebook = useCallback(async (file: File) => {
    try {
      setIsImportingPdf(true);
      setPdfImportProgress({ current: 0, total: 1, message: 'Opening PDF file...' });

      const buffer = await file.arrayBuffer();
      const result = await parsePdfDocument(buffer, file.name, {
        onProgress: (current, total, message) => {
          setPdfImportProgress({ current, total, message });
        },
      });

      if (result.pages.length === 0) {
        throw new Error('No renderable pages found in PDF.');
      }

      const pages = convertPdfPagesToNotebookPages(result);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const newNb: Notebook = {
        id: `nb-pdf-${Date.now()}`,
        title: cleanTitle,
        color: '#3b82f6',
        sections: [
          {
            id: `sec-${Date.now()}`,
            title: 'Document',
            pages,
            activePageIndex: 0,
          },
        ],
        activeSectionId: `sec-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setNotebooks((prev) => [newNb, ...prev]);
      setActiveNotebookId(newNb.id);
      setActivePageIndex(0);
      setAppView('editor');
      setShowPagesPanel(true);
    } catch (err) {
      console.error('Failed to import PDF document:', err);
      alert(`Could not import PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsImportingPdf(false);
      setPdfImportProgress(null);
    }
  }, []);

  const importPdfPagesIntoCurrentNotebook = useCallback(
    async (file: File, insertPosition: 'end' | 'after-current' = 'after-current') => {
      try {
        setIsImportingPdf(true);
        setPdfImportProgress({ current: 0, total: 1, message: 'Reading PDF pages...' });

        const buffer = await file.arrayBuffer();
        const result = await parsePdfDocument(buffer, file.name, {
          onProgress: (current, total, message) => {
            setPdfImportProgress({ current, total, message });
          },
        });

        if (result.pages.length === 0) {
          throw new Error('No renderable pages found in PDF.');
        }

        const newPages = convertPdfPagesToNotebookPages(result);

        setNotebooks((prevNbs) =>
          prevNbs.map((nb) => {
            if (nb.id !== activeNotebookId) return nb;
            return {
              ...nb,
              sections: nb.sections.map((sec) => {
                let targetIndex = sec.pages.length;
                if (insertPosition === 'after-current') {
                  targetIndex = Math.min(sec.pages.length, activePageIndex + 1);
                }
                const updated = [...sec.pages];
                updated.splice(targetIndex, 0, ...newPages);
                return {
                  ...sec,
                  pages: updated,
                };
              }),
            };
          })
        );

        const newActiveIdx = insertPosition === 'after-current' ? activePageIndex + 1 : pages.length;
        setActivePageIndex(newActiveIdx);
        setShowPagesPanel(true);
      } catch (err) {
        console.error('Failed to insert PDF pages:', err);
        alert(`Could not insert PDF pages: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsImportingPdf(false);
        setPdfImportProgress(null);
      }
    },
    [pages.length, activePageIndex, activeNotebookId]
  );

  const quickNote = useCallback(() => {
    // Add page to active notebook and open editor
    const newPage: PageMetadata = {
      ...INITIAL_PAGE,
      id: `page-${Date.now()}`,
      title: `Quick Note — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pattern: 'ruled',
      theme: 'white',
      strokes: [],
      textBlocks: [],
      codeBlocks: [],
      images: [],
    };
    setNotebooks((prevNbs) =>
      prevNbs.map((nb) => {
        if (nb.id !== activeNotebookId) return nb;
        return {
          ...nb,
          sections: nb.sections.map((sec) => ({
            ...sec,
            pages: [newPage, ...sec.pages],
          })),
        };
      })
    );
    setActivePageIndex(0);
    setAppView('editor');
  }, [activeNotebookId]);

  const updateNotebookTitle = useCallback((notebookId: string, title: string) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, title, updatedAt: Date.now() } : nb))
    );
  }, []);

  const addNotebook = useCallback((title: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title,
      color: '#8b5cf6',
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: 'General',
          pages: [
            {
              ...INITIAL_PAGE,
              id: `page-${Date.now()}`,
              title: 'Welcome Note',
              strokes: [],
              textBlocks: [],
              codeBlocks: [],
              images: [],
            },
          ],
          activePageIndex: 0,
        },
      ],
      activeSectionId: `sec-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotebooks((prev) => [...prev, newNb]);
    setActiveNotebookId(newNb.id);
    setActivePageIndex(0);
  }, []);

  const deleteNotebook = useCallback(
    (notebookId: string) => {
      if (notebooks.length <= 1) return;
      setNotebooks((prev) => prev.filter((nb) => nb.id !== notebookId));
      if (activeNotebookId === notebookId) {
        const remaining = notebooks.filter((nb) => nb.id !== notebookId);
        setActiveNotebookId(remaining[0].id);
        setActivePageIndex(0);
      }
    },
    [notebooks, activeNotebookId]
  );

  // Page operations
  const addPageWithTemplate = useCallback(
    (options?: {
      pattern?: PaperPattern;
      theme?: PaperTheme;
      title?: string;
      position?: 'after-current' | 'end' | 'start';
    }) => {
      const pattern = options?.pattern || currentPage.pattern;
      const theme = options?.theme || currentPage.theme;
      const position = options?.position || 'after-current';

      const formattedPattern = pattern
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const defaultTitle = `${formattedPattern} — Page ${pages.length + 1}`;
      const title = options?.title?.trim() || defaultTitle;

      const newP: PageMetadata = {
        id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        pattern,
        theme,
        width: 820,
        height: 1160,
        layers: DEFAULT_LAYERS,
        activeLayerId: 'layer-2',
        strokes: [],
        textBlocks: [],
        codeBlocks: [],
        images: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let insertIndex = pages.length;
      if (position === 'start') {
        insertIndex = 0;
      } else if (position === 'after-current') {
        insertIndex = Math.min(pages.length, activePageIndex + 1);
      }

      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          return {
            ...nb,
            sections: nb.sections.map((sec) => {
              const newPages = [...sec.pages];
              newPages.splice(insertIndex, 0, newP);
              return {
                ...sec,
                pages: newPages,
              };
            }),
          };
        })
      );
      setActivePageIndex(insertIndex);
      setUndoStack([]);
      setRedoStack([]);
    },
    [pages.length, activePageIndex, currentPage.pattern, currentPage.theme, activeNotebookId]
  );

  const addPage = useCallback(() => {
    addPageWithTemplate();
  }, [addPageWithTemplate]);

  const duplicatePage = useCallback(
    (index: number) => {
      const targetPage = pages[index];
      if (!targetPage) return;

      const newP: PageMetadata = {
        ...targetPage,
        id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `${targetPage.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        strokes: JSON.parse(JSON.stringify(targetPage.strokes)),
        textBlocks: JSON.parse(JSON.stringify(targetPage.textBlocks)),
        codeBlocks: JSON.parse(JSON.stringify(targetPage.codeBlocks)),
        images: JSON.parse(JSON.stringify(targetPage.images)),
      };

      const insertIndex = index + 1;

      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          return {
            ...nb,
            sections: nb.sections.map((sec) => {
              const newPages = [...sec.pages];
              newPages.splice(insertIndex, 0, newP);
              return {
                ...sec,
                pages: newPages,
              };
            }),
          };
        })
      );
      setActivePageIndex(insertIndex);
      setUndoStack([]);
      setRedoStack([]);
    },
    [pages, activeNotebookId]
  );

  const movePage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 ||
        fromIndex >= pages.length ||
        toIndex < 0 ||
        toIndex >= pages.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          return {
            ...nb,
            sections: nb.sections.map((sec) => {
              const newPages = [...sec.pages];
              const [moved] = newPages.splice(fromIndex, 1);
              newPages.splice(toIndex, 0, moved);
              return {
                ...sec,
                pages: newPages,
              };
            }),
          };
        })
      );

      if (activePageIndex === fromIndex) {
        setActivePageIndex(toIndex);
      } else if (fromIndex < activePageIndex && toIndex >= activePageIndex) {
        setActivePageIndex((prev) => prev - 1);
      } else if (fromIndex > activePageIndex && toIndex <= activePageIndex) {
        setActivePageIndex((prev) => prev + 1);
      }
    },
    [pages.length, activePageIndex, activeNotebookId]
  );

  const deletePage = useCallback(
    (index: number) => {
      if (pages.length <= 1) return;
      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          return {
            ...nb,
            sections: nb.sections.map((sec) => ({
              ...sec,
              pages: sec.pages.filter((_, idx) => idx !== index),
            })),
          };
        })
      );
      setActivePageIndex((prev) => Math.max(0, Math.min(prev, pages.length - 2)));
      setUndoStack([]);
      setRedoStack([]);
    },
    [pages.length, activeNotebookId]
  );

  const togglePinPage = useCallback(
    (pageId: string) => {
      setNotebooks((prevNbs) =>
        prevNbs.map((nb) => ({
          ...nb,
          sections: nb.sections.map((sec) => ({
            ...sec,
            pages: sec.pages.map((p) =>
              p.id === pageId ? { ...p, pinned: !p.pinned } : p
            ),
          })),
        }))
      );
    },
    []
  );

  // Text & Code Blocks
  const addTextBlock = useCallback(() => {
    const newBlock: TextBlock = {
      id: `text-${Date.now()}`,
      x: 100,
      y: 120,
      width: 280,
      height: 80,
      text: 'Click here to edit typed note...',
      fontSize: 14,
      color: '#1e293b',
    };
    updateCurrentPage((page) => ({
      ...page,
      textBlocks: [...page.textBlocks, newBlock],
    }));
  }, [updateCurrentPage]);

  const insertTypedNote = useCallback((text: string) => {
    const newBlock: TextBlock = {
      id: `text-${Date.now()}`,
      x: 60,
      y: 100,
      width: 520,
      height: 280,
      text,
      fontSize: 13,
      color: '#1e293b',
    };
    updateCurrentPage((page) => ({
      ...page,
      textBlocks: [...page.textBlocks, newBlock],
    }));
  }, [updateCurrentPage]);

  const addCodeBlock = useCallback(() => {
    const newCode: CodeBlock = {
      id: `code-${Date.now()}`,
      x: 100,
      y: 220,
      width: 420,
      height: 140,
      language: 'typescript',
      code: `function quickNotes() {\n  console.log("Stylus-first AI Notes");\n}`,
    };
    updateCurrentPage((page) => ({
      ...page,
      codeBlocks: [...page.codeBlocks, newCode],
    }));
  }, [updateCurrentPage]);

  // Layers Management
  const addLayer = useCallback(() => {
    const newL: CanvasLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${currentPage.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
    };
    updateCurrentPage((page) => ({
      ...page,
      layers: [...page.layers, newL],
      activeLayerId: newL.id,
    }));
  }, [currentPage.layers.length, updateCurrentPage]);

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (currentPage.layers.length <= 1) return;
      updateCurrentPage((page) => ({
        ...page,
        layers: page.layers.filter((l) => l.id !== layerId),
        activeLayerId:
          page.activeLayerId === layerId
            ? page.layers.find((l) => l.id !== layerId)!.id
            : page.activeLayerId,
      }));
    },
    [currentPage.layers.length, updateCurrentPage]
  );

  const toggleLayerVisible = useCallback(
    (layerId: string) => {
      updateCurrentPage((page) => ({
        ...page,
        layers: page.layers.map((l) =>
          l.id === layerId ? { ...l, visible: !l.visible } : l
        ),
      }));
    },
    [updateCurrentPage]
  );

  const toggleLayerLocked = useCallback(
    (layerId: string) => {
      updateCurrentPage((page) => ({
        ...page,
        layers: page.layers.map((l) =>
          l.id === layerId ? { ...l, locked: !l.locked } : l
        ),
      }));
    },
    [updateCurrentPage]
  );

  // Time-Lapse playback ticker
  useEffect(() => {
    let animId: number;
    if (isTimeLapsePlaying && currentPage.strokes.length > 0) {
      const step = () => {
        setTimeLapseProgress((prev) => {
          const next = prev + 0.005 * timeLapseSpeed;
          if (next >= 1.0) {
            setIsTimeLapsePlaying(false);
            return 1.0;
          }
          return next;
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isTimeLapsePlaying, timeLapseSpeed, currentPage.strokes.length]);

  return {
    notebooks,
    currentNotebook,
    pages,
    currentPage,
    activeNotebookId,
    activePageIndex,
    viewMode,
    zoom,
    pan,
    isPanningMode,
    enablePalmRejection,
    allowTouchDrawing,
    autoSnapShapes,
    isFocusMode,
    currentStyle,
    showAiSplit,
    showSidebar,
    showPagesPanel,
    showLayers,
    showTimeLapse,
    isImportingPdf,
    pdfImportProgress,
    timeLapseProgress,
    isTimeLapsePlaying,
    timeLapseSpeed,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    setActiveNotebookId,
    setActivePageIndex,
    setViewMode,
    setZoom,
    setPan,
    setIsPanningMode,
    setEnablePalmRejection,
    setAllowTouchDrawing,
    setAutoSnapShapes,
    setIsFocusMode,
    setShowAiSplit,
    setShowSidebar,
    setShowPagesPanel,
    setShowLayers,
    setShowTimeLapse,
    setTimeLapseProgress,
    setIsTimeLapsePlaying,
    setTimeLapseSpeed,
    setCurrentStyle,
    updateStrokes,
    updateTextBlocks: (blocks: TextBlock[]) =>
      updateCurrentPage((p) => ({ ...p, textBlocks: blocks })),
    updateCodeBlocks: (blocks: CodeBlock[]) =>
      updateCurrentPage((p) => ({ ...p, codeBlocks: blocks })),
    updateImages: (images: ImageElement[]) =>
      updateCurrentPage((p) => ({ ...p, images })),
    handleUndo,
    handleRedo,
    addNotebook,
    deleteNotebook,
    addPage,
    addPageWithTemplate,
    duplicatePage,
    movePage,
    deletePage,
    togglePinPage,
    addTextBlock,
    insertTypedNote,
    addCodeBlock,
    addLayer,
    deleteLayer,
    toggleLayerVisible,
    toggleLayerLocked,
    setActiveLayer: (layerId: string) =>
      updateCurrentPage((p) => ({ ...p, activeLayerId: layerId })),
    setPattern: (pattern: PaperPattern) =>
      updateCurrentPage((p) => ({ ...p, pattern })),
    setTheme: (theme: PaperTheme) => updateCurrentPage((p) => ({ ...p, theme })),
    updateTranscription: (text: string) =>
      updateCurrentPage((p) => ({ ...p, aiTranscription: text })),
    appView,
    setAppView,
    openNotebook,
    createAndOpenNotebook,
    importPdfAsNotebook,
    importPdfPagesIntoCurrentNotebook,
    quickNote,
    updateNotebookTitle,
    updatePageTitle: (title: string) => updateCurrentPage((p) => ({ ...p, title })),
    resetPanZoom: () => {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    },
    clearCurrentPage: () => updateStrokes([]),
  };
}
