import { StorageAdapter } from './storage-adapter';
import type { Notebook, PageMetadata } from './types';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
  serverName?: string;
}

export interface McpToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  timestamp: number;
}

export interface McpToolResult {
  toolName: string;
  callId: string;
  success: boolean;
  content: Array<{
    type: 'text' | 'image' | 'json';
    text?: string;
    data?: unknown;
  }>;
  executionTimeMs: number;
  error?: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  endpoint: string;
  type: 'internal' | 'sse' | 'http';
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastPing?: number;
  errorMessage?: string;
}

class McpManagerEngine {
  private customServers: McpServerConfig[] = [];
  private toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();
  private toolDefinitions: Map<string, McpToolDefinition> = new Map();
  private executionHistory: McpToolResult[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadServers();
    this.registerBuiltInTools();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private loadServers() {
    try {
      const saved = localStorage.getItem('omninotes_mcp_servers');
      if (saved) {
        this.customServers = JSON.parse(saved);
      }
    } catch {
      this.customServers = [];
    }
  }

  private saveServers() {
    try {
      localStorage.setItem('omninotes_mcp_servers', JSON.stringify(this.customServers));
    } catch {
      // storage unavailable
    }
    this.notify();
  }

  public getServers(): McpServerConfig[] {
    const internalServer: McpServerConfig = {
      id: 'srv-internal',
      name: 'Omninotes Core MCP Server',
      endpoint: 'in-process://omninotes.local',
      type: 'internal',
      enabled: true,
      status: 'connected',
      lastPing: Date.now(),
    };
    return [internalServer, ...this.customServers];
  }

  public addServer(name: string, endpoint: string, type: 'sse' | 'http' = 'http'): McpServerConfig {
    const newServer: McpServerConfig = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || 'Custom MCP Server',
      endpoint: endpoint.trim(),
      type,
      enabled: true,
      status: 'disconnected',
    };
    this.customServers.push(newServer);
    this.saveServers();
    this.testServer(newServer.id);
    return newServer;
  }

  public removeServer(serverId: string) {
    this.customServers = this.customServers.filter((s) => s.id !== serverId);
    this.saveServers();
  }

  public toggleServer(serverId: string) {
    const s = this.customServers.find((srv) => srv.id === serverId);
    if (s) {
      s.enabled = !s.enabled;
      this.saveServers();
    }
  }

  public async testServer(serverId: string): Promise<boolean> {
    const s = this.customServers.find((srv) => srv.id === serverId);
    if (!s) return false;

    s.status = 'connecting';
    this.notify();

    try {
      const res = await fetch(s.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        s.status = 'connected';
        s.lastPing = Date.now();
        s.errorMessage = undefined;

        // If tools returned, register them dynamically
        if (data?.result?.tools && Array.isArray(data.result.tools)) {
          data.result.tools.forEach((t: McpToolDefinition) => {
            this.registerTool(
              {
                ...t,
                serverName: s.name,
              },
              async (args) => {
                const callRes = await fetch(s.endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: { name: t.name, arguments: args },
                  }),
                });
                return await callRes.json();
              }
            );
          });
        }
        this.saveServers();
        return true;
      } else {
        s.status = 'error';
        s.errorMessage = `HTTP error ${res.status}: ${res.statusText}`;
        this.saveServers();
        return false;
      }
    } catch (err) {
      s.status = 'error';
      s.errorMessage = err instanceof Error ? err.message : 'Connection failed';
      this.saveServers();
      return false;
    }
  }

  public registerTool(
    definition: McpToolDefinition,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ) {
    this.toolDefinitions.set(definition.name, definition);
    this.toolHandlers.set(definition.name, handler);
    this.notify();
  }

  public listTools(): McpToolDefinition[] {
    return Array.from(this.toolDefinitions.values());
  }

  public getHistory(): McpToolResult[] {
    return [...this.executionHistory];
  }

  public clearHistory() {
    this.executionHistory = [];
    this.notify();
  }

  public async callTool(
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<McpToolResult> {
    const start = performance.now();
    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const def = this.toolDefinitions.get(toolName);
    const handler = this.toolHandlers.get(toolName);

    if (!def || !handler) {
      const failedResult: McpToolResult = {
        toolName,
        callId,
        success: false,
        content: [{ type: 'text', text: `Unknown MCP tool: "${toolName}"` }],
        executionTimeMs: Math.round(performance.now() - start),
        error: `Tool "${toolName}" not registered on active MCP servers.`,
      };
      this.executionHistory.unshift(failedResult);
      if (this.executionHistory.length > 50) this.executionHistory.pop();
      this.notify();
      return failedResult;
    }

    try {
      const output = await handler(args);
      const executionTimeMs = Math.round(performance.now() - start);

      let textRepresentation = '';
      if (typeof output === 'string') {
        textRepresentation = output;
      } else {
        textRepresentation = JSON.stringify(output, null, 2);
      }

      const successResult: McpToolResult = {
        toolName,
        callId,
        success: true,
        content: [
          {
            type: 'text',
            text: textRepresentation,
            data: output,
          },
        ],
        executionTimeMs,
      };

      this.executionHistory.unshift(successResult);
      if (this.executionHistory.length > 50) this.executionHistory.pop();
      this.notify();
      return successResult;
    } catch (err) {
      const executionTimeMs = Math.round(performance.now() - start);
      const errorMsg = err instanceof Error ? err.message : String(err);

      const failedResult: McpToolResult = {
        toolName,
        callId,
        success: false,
        content: [{ type: 'text', text: `Error: ${errorMsg}` }],
        executionTimeMs,
        error: errorMsg,
      };

      this.executionHistory.unshift(failedResult);
      if (this.executionHistory.length > 50) this.executionHistory.pop();
      this.notify();
      return failedResult;
    }
  }

  private registerBuiltInTools() {
    // 1. notes_search
    this.registerTool(
      {
        name: 'notes_search',
        description: 'Search across all Omninotes notebooks and pages by keyword, title, transcription, or typed text.',
        serverName: 'Omninotes Core',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to search for across notebooks and pages.',
            },
          },
          required: ['query'],
        },
      },
      async (args) => {
        const query = String(args.query || '').toLowerCase().trim();
        const notebooks: Notebook[] = StorageAdapter.loadNotebooks() || [];
        const matches: Array<{
          notebookTitle: string;
          pageTitle: string;
          pageId: string;
          snippet: string;
          strokesCount: number;
        }> = [];

        notebooks.forEach((nb) => {
          nb.sections.forEach((sec) => {
            sec.pages.forEach((page) => {
              const titleMatch = (page.title || '').toLowerCase().includes(query);
              const transcriptMatch = (page.aiTranscription || '').toLowerCase().includes(query);
              const textMatch = page.textBlocks.some((t) => t.text.toLowerCase().includes(query));

              if (titleMatch || transcriptMatch || textMatch) {
                let snippet = '';
                if (page.aiTranscription) {
                  snippet = page.aiTranscription.slice(0, 140) + '...';
                } else if (page.textBlocks.length > 0) {
                  snippet = page.textBlocks[0].text.slice(0, 140);
                } else {
                  snippet = `${page.strokes.length} handwritten strokes`;
                }

                matches.push({
                  notebookTitle: nb.title,
                  pageTitle: page.title || 'Untitled Note',
                  pageId: page.id,
                  snippet,
                  strokesCount: page.strokes.length,
                });
              }
            });
          });
        });

        return {
          query,
          totalMatches: matches.length,
          results: matches.slice(0, 8),
        };
      }
    );

    // 2. notes_read_page
    this.registerTool(
      {
        name: 'notes_read_page',
        description: 'Read the detailed content, ink metrics, and metadata of a note page.',
        serverName: 'Omninotes Core',
        parameters: {
          type: 'object',
          properties: {
            titleOrId: {
              type: 'string',
              description: 'The title or page ID to retrieve. If empty, retrieves the first active page.',
            },
          },
        },
      },
      async (args) => {
        const query = String(args.titleOrId || '').toLowerCase().trim();
        const notebooks: Notebook[] = StorageAdapter.loadNotebooks() || [];

        let foundPage: PageMetadata | null = null;
        let notebookName = '';

        for (const nb of notebooks) {
          for (const sec of nb.sections) {
            for (const page of sec.pages) {
              if (
                !query ||
                page.id === query ||
                (page.title || '').toLowerCase().includes(query)
              ) {
                foundPage = page;
                notebookName = nb.title;
                break;
              }
            }
            if (foundPage) break;
          }
          if (foundPage) break;
        }

        if (!foundPage) {
          return { error: 'Page not found.' };
        }

        return {
          notebook: notebookName,
          pageId: foundPage.id,
          title: foundPage.title,
          pattern: foundPage.pattern,
          theme: foundPage.theme,
          strokeCount: foundPage.strokes.length,
          typedBlocks: foundPage.textBlocks.map((t) => t.text),
          aiTranscription: foundPage.aiTranscription || null,
          lastUpdated: new Date(foundPage.updatedAt).toISOString(),
        };
      }
    );

    // 3. notes_create_page
    this.registerTool(
      {
        name: 'notes_create_page',
        description: 'Create a new blank or templated note page in the active notebook.',
        serverName: 'Omninotes Core',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the new note page.',
            },
            pattern: {
              type: 'string',
              description: 'Stationery template: ruled, blank, grid, cornell, dotted, or daily-journal.',
              enum: ['ruled', 'blank', 'grid', 'cornell', 'dotted', 'daily-journal'],
            },
            initialContent: {
              type: 'string',
              description: 'Optional initial markdown notes to insert.',
            },
          },
          required: ['title'],
        },
      },
      async (args) => {
        const title = String(args.title || 'New Note').trim();
        const pattern = (args.pattern as any) || 'ruled';
        const initialContent = args.initialContent ? String(args.initialContent) : '';

        const notebooks: Notebook[] = StorageAdapter.loadNotebooks() || [];
        if (notebooks.length === 0) return { error: 'No notebooks found to create page in.' };

        const targetNb = notebooks[0];
        const targetSec = targetNb.sections[0];

        const newPage: PageMetadata = {
          id: `page-${Date.now()}`,
          title,
          pattern,
          theme: 'white',
          width: 820,
          height: 1160,
          layers: [
            { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1 },
            { id: 'layer-2', name: 'Notes & Inking', visible: true, locked: false, opacity: 1 },
          ],
          activeLayerId: 'layer-2',
          strokes: [],
          textBlocks: initialContent
            ? [
                {
                  id: `tb-${Date.now()}`,
                  x: 60,
                  y: 80,
                  width: 700,
                  height: 200,
                  text: initialContent,
                  fontSize: 16,
                  color: '#111827',
                },
              ]
            : [],
          codeBlocks: [],
          images: [],
          aiTranscription: initialContent || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        targetSec.pages.push(newPage);
        StorageAdapter.saveNotebooks(notebooks);

        return {
          success: true,
          createdPageId: newPage.id,
          title: newPage.title,
          notebook: targetNb.title,
          pattern: newPage.pattern,
        };
      }
    );

    // 4. calculator
    this.registerTool(
      {
        name: 'calculator',
        description: 'Safely evaluate a mathematical calculation, formula, percentage, or scientific expression.',
        serverName: 'Omninotes Core',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Expression to compute, e.g. "128 * 4", "sqrt(256) + 42", "20% of 1500".',
            },
          },
          required: ['expression'],
        },
      },
      async (args) => {
        let expr = String(args.expression || '').trim();
        
        // Handle "X% of Y"
        const percentMatch = expr.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/i);
        if (percentMatch) {
          const pct = parseFloat(percentMatch[1]);
          const total = parseFloat(percentMatch[2]);
          const res = (pct / 100) * total;
          return { expression: expr, result: res, formatted: `${pct}% of ${total} = ${res}` };
        }

        // Sanitize for safe math evaluation
        const sanitized = expr
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/log/g, 'Math.log10')
          .replace(/ln/g, 'Math.log')
          .replace(/pi/gi, 'Math.PI')
          .replace(/\^/g, '**');

        if (!/^[\d\s+\-*/().,MathPIEe]+$/.test(sanitized)) {
          return { error: 'Invalid characters in mathematical expression.' };
        }

        // Safely evaluate math expression
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${sanitized});`)();
        return {
          expression: expr,
          result,
          formatted: `${expr} = ${result}`,
        };
      }
    );

    // 5. web_fetch
    this.registerTool(
      {
        name: 'web_fetch',
        description: 'Fetch content from a web URL for research and note compilation.',
        serverName: 'Omninotes Core',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Full HTTP or HTTPS URL to fetch.',
            },
          },
          required: ['url'],
        },
      },
      async (args) => {
        const url = String(args.url || '').trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return { error: 'URL must start with http:// or https://' };
        }

        try {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(6000),
          });
          const text = await res.text();
          // Extract text snippet
          const cleanText = text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return {
            url,
            status: res.status,
            snippet: cleanText.slice(0, 1000),
            totalLength: cleanText.length,
          };
        } catch (err) {
          return {
            url,
            error: err instanceof Error ? err.message : 'Failed to fetch URL',
          };
        }
      }
    );
  }
}

export const McpManager = new McpManagerEngine();
