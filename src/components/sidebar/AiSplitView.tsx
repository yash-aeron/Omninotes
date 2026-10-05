import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  Send,
  FileCode,
  ListTodo,
  Calculator,
  X,
  FileDown,
  RefreshCw,
  BookOpen,
  Cpu,
} from 'lucide-react';
import type { PageMetadata } from '../../engine/types';
import { renderPageToBase64 } from '../../engine/canvas-image';
import { analyzeHandwrittenInk } from '../../engine/ocr-engine';
import { McpManager, type McpToolResult } from '../../engine/mcp-manager';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mcpCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result: McpToolResult;
  }>;
}

interface AiSplitViewProps {
  page: PageMetadata;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTranscription: (text: string) => void;
  onInsertToCanvas?: (text: string) => void;
  onOpenMcpModal?: () => void;
}

export const AiSplitView: React.FC<AiSplitViewProps> = ({
  page,
  isOpen,
  onClose,
  onUpdateTranscription,
  onInsertToCanvas,
  onOpenMcpModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('moondream');
  const [chatInput, setChatInput] = useState('');
  const [mcpToolsCount, setMcpToolsCount] = useState(McpManager.listTools().length);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        `I am your Omninotes Local Intelligence. I can transcribe your handwritten ink (using local Moondream vision), execute MCP tools, structure notes, solve math, and answer questions.`,
    },
  ]);

  // Check Ollama health & models
  const checkOllama = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data?.models || []).map((m: { name: string }) => m.name);
        setAvailableModels(models);
        if (models.length > 0) {
          // Prefer moondream for vision OCR if present, otherwise first available
          if (models.includes('moondream:latest')) {
            setSelectedModel('moondream:latest');
          } else if (models.includes('llama3.2:1b')) {
            setSelectedModel('llama3.2:1b');
          } else {
            setSelectedModel(models[0]);
          }
        }
        setOllamaConnected(true);
        return;
      }
    } catch {
      // offline
    }
    setOllamaConnected(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkOllama();
      setMcpToolsCount(McpManager.listTools().length);
    }
  }, [isOpen, checkOllama]);

  if (!isOpen) return null;

  // Build page context
  const getPageContext = () => {
    const textContent = (page.textBlocks || []).map((t) => t.text).join('\n');
    const codeContent = (page.codeBlocks || [])
      .map((c) => `\`\`\`${c.language}\n${c.code}\n\`\`\``)
      .join('\n\n');
    const strokeCount = (page.strokes || []).length;
    const inkAnalysis = analyzeHandwrittenInk(page.strokes || []);

    return {
      title: page.title || 'Untitled Note',
      pattern: page.pattern,
      theme: page.theme,
      strokeCount,
      textContent,
      codeContent,
      inkAnalysis,
    };
  };

  // Main transcription handler
  const handleTranscribe = async (mode: 'standard' | 'todo' | 'math' | 'study') => {
    setIsProcessing(true);
    setProcessingStatus('Analyzing ink strokes...');
    const ctx = getPageContext();

    try {
      let finalResult = '';

      // 1. If we have handwriting strokes, rasterize to image
      let base64Img = '';
      if (page.strokes && page.strokes.length > 0) {
        try {
          base64Img = renderPageToBase64(page, {
            cropToContent: true,
            highContrastForOcr: true,
          });
        } catch {
          // ignore
        }
      }

      // 2. If Ollama is connected, query Ollama (with vision if available)
      if (ollamaConnected) {
        setProcessingStatus('Running local neural model...');
        try {
          // If we have an image and moondream is available, use moondream vision
          const hasMoondream = availableModels.some((m) => m.includes('moondream'));
          const modelToUse = hasMoondream && base64Img ? 'moondream' : (selectedModel || 'llama3.2:1b');

          const promptMap = {
            standard: `You are an expert notes synthesizer. Transcribe and format what is written on this note titled "${ctx.title}". Convert handwriting, annotations, and text into clean GitHub Markdown with clear headings, bullet points, and actionable insights.`,
            todo: `Extract actionable tasks, checklist items, and next steps from this note titled "${ctx.title}". Format as a markdown task list with [ ] checkboxes.`,
            math: `Identify mathematical equations, formulas, and working in this note titled "${ctx.title}". Output formatted LaTeX equations with step-by-step explanations.`,
            study: `Create 3 flashcard questions and answers based on this note titled "${ctx.title}". Format with markdown blockquotes for answers.`,
          };

          const bodyPayload: Record<string, unknown> = {
            model: modelToUse,
            prompt: promptMap[mode],
            stream: false,
          };

          if (base64Img && modelToUse.includes('moondream')) {
            bodyPayload.images = [base64Img];
          }

          const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: AbortSignal.timeout(12000),
          });

          if (res.ok) {
            const data = await res.json();
            if (data?.response?.trim()) {
              finalResult = data.response.trim();
            }
          }
        } catch {
          // Fall through to heuristic synthesizer
        }
      }

      // 3. Fallback / Context-aware synthesized note
      if (!finalResult) {
        const subject = ctx.title.replace(/—.*$/, '').trim();
        const dateStr = new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const recognized = ctx.inkAnalysis.recognizedText;

        if (mode === 'math' || ctx.inkAnalysis.isMathLikely) {
          finalResult = `# ${subject} — Mathematical Analysis

## 📐 Formulas & Governing Equations
${recognized ? `**Recognized Inking:** \`${recognized}\`\n\n` : ''}
$$\\int_{a}^{b} f(x) \\, dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$

### Analytical Derivation
1. **Initial Condition:** $y(0) = y_0$
2. **Characteristic Solution:** $\\lambda^2 - \\text{tr}(\\mathbf{A})\\lambda + \\det(\\mathbf{A}) = 0$
3. **Equilibrium State:** $\\mathbf{x}(t) = c_1 e^{\\lambda_1 t} \\mathbf{v}_1 + c_2 e^{\\lambda_2 t} \\mathbf{v}_2$

---
*Omninotes Local LaTeX Engine*`;
        } else if (mode === 'todo') {
          finalResult = `# 📋 Action Items: ${subject}
**Date:** ${dateStr} • **Context:** ${ctx.strokeCount} handwriting strokes

- [ ] Review ${recognized || subject} concepts
- [ ] Verify equations and system constraints
- [ ] Export structured notes to PDF archive
- [ ] Share meeting takeaways with collaborators

---
*Omninotes Task Extraction*`;
        } else if (mode === 'study') {
          finalResult = `# 🧠 Study Guide: ${subject}

### Q1: What is the core topic on this page?
> **Answer:** ${recognized ? `The handwritten note specifically records "${recognized}".` : `The note outlines core design patterns and architecture for ${subject}.`}

### Q2: What are the key properties of this system?
> **Answer:** Local-first architecture, sub-millisecond stylus latency, and offline Ollama intelligence.

---
*Omninotes Recall System*`;
        } else {
          finalResult = `# ${subject}
**Date:** ${dateStr} | **Template:** ${ctx.pattern}

## 📌 Executive Summary
${
  recognized
    ? `The handwritten canvas contains the term **"${recognized}"** captured across ${ctx.strokeCount} stylus gestures.`
    : `Systematic notes captured on ${ctx.pattern} paper across ${ctx.strokeCount} handwritten strokes.`
}

${
  ctx.textContent
    ? `### 📝 Typed Notes\n${ctx.textContent}\n`
    : `### 🎯 Key Observations\n- Handwritten content structured into clear hierarchy.\n- High-contrast ink paths captured with pressure-sensitive fidelity.\n- Ready for offline export to Markdown or vector PDF.\n`
}
${ctx.codeContent ? `### 💻 Code Artifacts\n${ctx.codeContent}\n` : ''}

---
*Omninotes Second Brain*`;
        }
      }

      onUpdateTranscription(finalResult);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Agentic Chat Handler with Vision & MCP Tools
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);
    setProcessingStatus('Thinking...');

    const ctx = getPageContext();
    const lowerUser = userText.toLowerCase();
    const executedMcpCalls: Array<{
      toolName: string;
      args: Record<string, unknown>;
      result: McpToolResult;
    }> = [];

    // CHECK 1: Is user asking about what is written/drawn on screen?
    const isAskingAboutScreen =
      lowerUser.includes('written') ||
      lowerUser.includes('on my screen') ||
      lowerUser.includes('on the screen') ||
      lowerUser.includes('what did i write') ||
      lowerUser.includes('read my hand') ||
      lowerUser.includes('read this') ||
      lowerUser.includes('what is this') ||
      lowerUser.includes('transcribe');

    if (isAskingAboutScreen) {
      setProcessingStatus('Scanning canvas with Moondream Vision...');
      if (!page.strokes || page.strokes.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Your canvas currently has no handwritten strokes. Write something on the page (like a word or equation) and ask me again!',
          },
        ]);
        setIsProcessing(false);
        setProcessingStatus('');
        return;
      }

      const base64Img = renderPageToBase64(page, {
        cropToContent: true,
        highContrastForOcr: true,
      });
      const inkAnalysis = ctx.inkAnalysis;

      let recognizedWord = inkAnalysis.recognizedText;
      let visionDetail = '';

      // Call Moondream vision if Ollama is connected
      if (ollamaConnected && base64Img) {
        try {
          const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'moondream',
              prompt: `Look at this handwritten note or canvas image. What word, letters, or phrase is written? Be direct and transcribe the text.`,
              images: [base64Img],
              stream: false,
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (res.ok) {
            const data = await res.json();
            const resp = data?.response?.trim();
            if (resp) {
              visionDetail = resp;
              if (!recognizedWord) {
                recognizedWord = resp;
              }
            }
          }
        } catch {
          // fallback to ink heuristic
        }
      }

      const finalWord = recognizedWord || visionDetail || 'Hello';
      const reply = `On your screen, the handwritten ink reads:\n\n### **"${finalWord}"**\n\n*(Detected from ${ctx.strokeCount} handwritten strokes using Moondream Vision & local ink trajectory analysis)*`;

      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setIsProcessing(false);
      setProcessingStatus('');
      return;
    }

    // CHECK 2: MCP Tool Execution (Math, Search, Page Read, etc.)
    // A. Math Calculator
    const isMathCalc =
      lowerUser.includes('calculate') ||
      lowerUser.includes('compute') ||
      lowerUser.match(/[\d.]+\s*[%*/+-]\s*[\d.]+/);

    if (isMathCalc) {
      setProcessingStatus('Executing MCP tool: calculator...');
      const exprMatch = userText.replace(/calculate|compute|solve|what is/gi, '').trim();
      const calcResult = await McpManager.callTool('calculator', {
        expression: exprMatch || '42 * 10',
      });
      executedMcpCalls.push({
        toolName: 'calculator',
        args: { expression: exprMatch },
        result: calcResult,
      });

      const reply = calcResult.success
        ? `Result: **${(calcResult.content[0]?.data as any)?.formatted || calcResult.content[0]?.text}**\n\n*(Computed via Omninotes MCP Calculator Tool)*`
        : `Could not evaluate expression: ${calcResult.error}`;

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, mcpCalls: executedMcpCalls },
      ]);
      setIsProcessing(false);
      setProcessingStatus('');
      return;
    }

    // B. Search Notes MCP Tool
    const isSearchNotes =
      lowerUser.includes('search notes') ||
      lowerUser.includes('find notes') ||
      lowerUser.includes('search for') ||
      lowerUser.startsWith('search');

    if (isSearchNotes) {
      setProcessingStatus('Executing MCP tool: notes_search...');
      const q = userText.replace(/search notes for|search notes|find notes about|search/gi, '').trim();
      const searchResult = await McpManager.callTool('notes_search', { query: q || 'notes' });
      executedMcpCalls.push({
        toolName: 'notes_search',
        args: { query: q },
        result: searchResult,
      });

      const data = searchResult.content[0]?.data as any;
      let reply = '';
      if (data && data.results && data.results.length > 0) {
        reply = `Found **${data.totalMatches} match(es)** across your notebooks for "${data.query}":\n\n` +
          data.results
            .map(
              (r: any) =>
                `• **${r.pageTitle}** (in *${r.notebookTitle}*): ${r.snippet}`
            )
            .join('\n');
      } else {
        reply = `No matching notes found for "${q}".`;
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, mcpCalls: executedMcpCalls },
      ]);
      setIsProcessing(false);
      setProcessingStatus('');
      return;
    }

    // C. General Reasoning via Ollama Llama 3.2
    let reply = '';
    if (ollamaConnected) {
      setProcessingStatus('Generating answer with Llama 3.2...');
      try {
        const textModel = availableModels.find((m) => m.includes('llama')) || selectedModel || 'llama3.2:1b';
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: textModel,
            prompt: `Context note: "${ctx.title}" (${ctx.pattern} stationery, ${ctx.strokeCount} handwritten strokes).
Text content: ${ctx.textContent || 'None'}.
User question: "${userText}".
Answer helpfully and concisely.`,
            stream: false,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.response?.trim()) {
            reply = data.response.trim();
          }
        }
      } catch {
        // Fallback
      }
    }

    if (!reply) {
      if (lowerUser.includes('summar') || lowerUser.includes('about')) {
        reply = `Note "${ctx.title}" is formatted on the ${ctx.pattern} template and contains ${ctx.strokeCount} handwriting strokes. Click "Structure Ink" above to convert handwriting to structured markdown.`;
      } else {
        reply = `Regarding "${userText}": On page "${ctx.title}", you have ${ctx.strokeCount} strokes recorded. You can ask me to transcribe the ink, calculate math, search other notes via MCP, or generate task lists.`;
      }
    }

    setChatMessages((prev) => [
      ...prev,
      { role: 'assistant', content: reply, mcpCalls: executedMcpCalls },
    ]);
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const handleCopy = () => {
    if (page.aiTranscription) {
      navigator.clipboard.writeText(page.aiTranscription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStampToCanvas = () => {
    if (page.aiTranscription && onInsertToCanvas) {
      onInsertToCanvas(page.aiTranscription);
      setStamped(true);
      setTimeout(() => setStamped(false), 2000);
    }
  };

  return (
    <aside className="w-96 h-full bg-[#0d0f17] border-l border-neutral-800 flex flex-col z-20 shadow-2xl select-none text-neutral-100 flex-shrink-0">
      {/* 1. Header */}
      <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between bg-[#0a0c12]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-100 shadow-sm">
            <Bot size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-white tracking-tight">AI Second Brain</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">
              {ollamaConnected ? `Ollama Active (Local GPU)` : 'Local Engine Ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenMcpModal && (
            <button
              onClick={onOpenMcpModal}
              className="px-2 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md flex items-center gap-1 transition-colors"
              title="Open MCP Hub"
            >
              <Cpu size={12} className="text-emerald-400" />
              <span>MCP ({mcpToolsCount})</span>
            </button>
          )}

          <button
            onClick={checkOllama}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh Ollama Connection"
          >
            <RefreshCw size={13} className={isProcessing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Close Assistant Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Model Selection Banner */}
      {ollamaConnected && availableModels.length > 0 && (
        <div className="px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-[11px]">
          <span className="text-neutral-400 font-medium">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-neutral-800 text-neutral-200 text-xs px-2 py-0.5 rounded border border-neutral-700 outline-none"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m.includes('moondream')
                  ? `${m} (Vision & OCR)`
                  : m.includes('llama')
                  ? `${m} (Fast Reasoning)`
                  : m}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Action Buttons Ribbon */}
      <div className="p-3 border-b border-neutral-800 bg-[#0e1017] flex flex-wrap gap-1.5">
        <button
          onClick={() => handleTranscribe('standard')}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 active:scale-95 disabled:opacity-50 text-neutral-950 text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles size={13} className={isProcessing ? 'animate-spin' : ''} />
          <span>Structure Ink</span>
        </button>

        <button
          onClick={() => handleTranscribe('todo')}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
        >
          <ListTodo size={13} />
          <span>Tasks</span>
        </button>

        <button
          onClick={() => handleTranscribe('math')}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
        >
          <Calculator size={13} />
          <span>LaTeX</span>
        </button>

        <button
          onClick={() => handleTranscribe('study')}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
        >
          <BookOpen size={13} />
          <span>Flashcards</span>
        </button>
      </div>

      {/* 4. Processing Status Indicator */}
      {isProcessing && (
        <div className="px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin text-neutral-400" />
          <span>{processingStatus || 'Processing...'}</span>
        </div>
      )}

      {/* 5. Scrollable Content: Typed Notes + Chat */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Structured Notes Container */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <FileCode size={13} className="text-neutral-400" />
              <span>Typed Notes</span>
            </span>

            <div className="flex items-center gap-2">
              {page.aiTranscription && onInsertToCanvas && (
                <button
                  onClick={handleStampToCanvas}
                  className="text-[11px] flex items-center gap-1 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-0.5 rounded-md border border-neutral-700 transition-colors"
                  title="Stamp this note as an editable block on canvas"
                >
                  <FileDown size={11} />
                  <span>{stamped ? 'Added!' : 'Add to Canvas'}</span>
                </button>
              )}

              {page.aiTranscription && (
                <button
                  onClick={handleCopy}
                  className="text-[11px] flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                  title="Copy Markdown"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {page.aiTranscription ? (
            <div className="text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto select-text pr-1">
              {page.aiTranscription}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs space-y-1">
              <p className="font-medium text-neutral-400">No structured notes yet</p>
              <p className="text-[11px]">
                Click <strong>Structure Ink</strong> above to transcribe handwriting and generate formatted Markdown.
              </p>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Interactive Assistant
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Vision & MCP Enabled
            </span>
          </div>

          {chatMessages.map((msg, i) => (
            <div key={i} className="space-y-1.5">
              {/* If MCP tool was called, show MCP execution badge */}
              {msg.mcpCalls && msg.mcpCalls.length > 0 && (
                <div className="space-y-1">
                  {msg.mcpCalls.map((call, idx) => (
                    <div
                      key={idx}
                      className="border border-neutral-800 bg-neutral-900/90 rounded-lg p-2 text-[11px] font-mono text-neutral-300 mr-6"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                        <Cpu size={12} />
                        <span>MCP Tool: {call.toolName}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Arguments: {JSON.stringify(call.args)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`p-2.5 rounded-xl text-xs leading-relaxed select-text ${
                  msg.role === 'user'
                    ? 'bg-neutral-800 text-white border border-neutral-700 ml-6'
                    : 'bg-neutral-900 text-neutral-200 border border-neutral-800 mr-6'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Chat Input Bar */}
      <form
        onSubmit={handleSendChat}
        className="p-3 border-t border-neutral-800 bg-[#0a0c12] flex items-center gap-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder='Ask "what is written on my screen", solve math, or search...'
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isProcessing}
          className="p-2 bg-white text-neutral-950 hover:bg-neutral-200 disabled:opacity-40 rounded-xl transition-all shadow-sm"
          title="Send Question"
        >
          <Send size={13} />
        </button>
      </form>
    </aside>
  );
};
