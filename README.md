# Omninotes

> **High-Performance Stylus-First AI Notes & Digital Stationery Studio**

Omninotes is a modern, consumer-grade desktop note-taking studio engineered for fluid handwriting, structured productivity templates, and privacy-preserving local AI intelligence.

Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Electron**, Omninotes combines paper-like digital ink aesthetics with GoodNotes-style stationery organization and offline local LLM / Vision models via Ollama.

---

## Key Features

### 1. Natural Inking & Stylus Engine
- **Vector Inking Pipeline:** Sub-pixel path smoothing powered by `perfect-freehand` with velocity and pressure curve thinning.
- **Curated Stylus Tools:** Ballpoint pen, Fountain pen, Calligraphy brush, Highlighter (semi-transparent blending), Precision Eraser, and Freeform Lasso Selection.
- **Hardware Integration:** Native palm rejection guard, stylus tilt/pressure telemetry, and distraction-free Fullscreen Focus Mode (`F11`).
- **Dynamic Geometric Auto-Snap:** Real-time geometric shape recognition for circles, rectangles, triangles, and arrows.

### 2. GoodNotes-Style Pages Side Panel & Card Overview
- **Thumbnail Page Drawer:** Visual miniature overview of all pages in your notebook with authentic A4 aspect ratios.
- **Real-Time Stroke Previews:** Miniature thumbnail cards render actual vector handwriting strokes live on the page.
- **Page Management:** Instant page jumping, page duplication, reordering (`Move Up` / `Move Down`), pinning/bookmarking, and safe deletion.
- **View Modes:** Toggle between Grid View (2-column miniature stationery cards) and List View (detailed metadata rows).

### 3. Stationery & Template Engine
- **Standard Paper:**
  - *Ruled / Lined* (College ruled with pink margin bar)
  - *Square Grid* (Precision graph paper for math & diagrams)
  - *Bullet Dot Grid* (Minimal dot matrix for bullet journaling)
  - *Blank Canvas* (Pure open sheet for sketching)
- **Productivity & Study Layouts:**
  - *Cornell Notes* (Header, left cues column, main notes zone, and bottom summary)
  - *Daily Reflection & Habits* (Top 3 priorities, gratitude block, and lined brain dump)
  - *Meeting Minutes* (Agenda, attendees, key discussions, and action item deliverables)
  - *Lecture Notes* (Subject header, terms/questions sidebar, notes area)
  - *Code & Notes Split* (Architecture ink notes on left, code syntax zone on right)
- **Specialized Stationery:**
  - *Music Manuscript* (Standard 5-line musical staves)
  - *Isometric Dot Grid* (3D sketching & technical drafting)
- **Paper Themes:** Clean White, Warm Ivory (moleskine tone), Legal Yellow, Dark Slate, and OLED Black.

### 4. Local AI & Vision Intelligence (Ollama)
- **100% Offline & Private:** Connects directly to local Ollama daemon (`http://localhost:11434`) with zero cloud telemetry or data leakage.
- **Handwriting OCR Vision:** Uses `moondream` multimodal vision model to transcribe handwritten canvas notes into structured text.
- **Fast Reasoning & Synthesis:** Uses `llama3.2:1b` for instant summaries, action-item extraction, flashcard generation, and note querying.
- **AI Second Brain Split View:** Slide-over assistant panel that can read canvas snapshots and insert structured markdown or code blocks directly onto the canvas.

### 5. Model Context Protocol (MCP) Hub
- Native MCP subsystem enabling extensible agent tools.
- Built-in support for notes search, local storage retrieval, and mathematical calculation engines.
- Configurable endpoints for external MCP server connections.

### 6. Dual Canvas Navigation & Export
- **Canvas Modes:** Paginated Classic Notebook (with automatic responsive centering) and Infinite Pan/Zoom Canvas.
- **Export Capabilities:**
  - High-fidelity paginated PDF document (`.pdf`)
  - Formatted Markdown (`.md`)
  - Vector SVG (`.svg`)

---

## Tech Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Inking & Math:** [perfect-freehand](https://github.com/steveruizok/perfect-freehand)
- **Desktop Runtime:** [Electron](https://www.electronjs.org/) (Windows x64 executable packaging via `electron-packager`)
- **Icons & UI:** [Lucide React](https://lucide.dev/)
- **Export Engines:** [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/)
- **Testing:** [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **Local AI:** [Ollama](https://ollama.ai/) (`moondream`, `llama3.2`)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- (Optional for Local AI features) [Ollama](https://ollama.ai/) running locally:
  ```bash
  ollama run moondream:latest
  ollama run llama3.2:1b
  ```

### Installation
```bash
git clone https://github.com/yash-aeron/Omninotes.git
cd Omninotes
npm install
```

### Running Locally

#### Development Web Server
```bash
npm run dev
```

#### Launching Desktop App (Electron)
```bash
npm run desktop
```

### Running Tests
```bash
# Run unit test suite
npm test

# Run code linter
npm run lint
```

### Building & Packaging

#### Production Web Build
```bash
npm run build
```

#### Windows Desktop Executable (`.exe`)
```bash
npm run package:desktop
```
The packaged standalone application will be generated in:
`dist-desktop/Omninotes-win32-x64/Omninotes.exe`

---

## Project Structure

```
├── electron/                 # Electron main process & desktop entrypoint
│   └── main.cjs
├── public/                   # App icons and static brand assets
├── src/
│   ├── assets/               # Images and SVG assets
│   ├── components/
│   │   ├── canvas/           # StylusCanvas, PaperTemplate, AddPageModal, Layers
│   │   ├── common/           # CommandPalette, modal primitives
│   │   ├── library/          # Notebook Library Shelf & notebook cards
│   │   ├── mcp/              # Model Context Protocol modal & tools
│   │   ├── sidebar/          # PagesPanel, NotebookSidebar, AiSplitView, PageNavigator
│   │   └── toolbar/          # StudioToolbar ribbons & palette popovers
│   ├── engine/               # Inking math, stroke smoothing, OCR, shape detection, export
│   │   ├── types.ts          # Page, notebook, stroke, and theme data contracts
│   │   ├── storage-adapter.ts# Persistence & auto-save engine
│   │   ├── stroke-math.ts    # Geometric stroke rendering
│   │   ├── shape-recognition.ts # Shape snapping engine
│   │   ├── ocr-engine.ts     # Ollama Vision handwriting OCR
│   │   └── mcp-manager.ts    # Model Context Protocol connector
│   ├── store/
│   │   └── useNotebookStore.ts # Centralized reactive notebook state store
│   ├── App.tsx               # Root app container & workspace layout
│   └── main.tsx              # React DOM entry point
├── tests/                    # Vitest unit test suites
├── package.json
└── vite.config.ts
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + P` / `Ctrl + Shift + P` | Toggle GoodNotes Pages Side Panel |
| `Ctrl + Shift + N` | Add New Page with Stationery Template |
| `Ctrl + K` | Global Command Palette |
| `Ctrl + B` | Toggle Notebooks & Folders Tree |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Space` *(Hold)* | Pan Canvas |
| `F11` | Distraction-Free Focus Mode |

---

## License

MIT License. See [LICENSE](LICENSE) for details.
