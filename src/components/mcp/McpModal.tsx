import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Server,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  McpManager,
  type McpToolDefinition,
  type McpServerConfig,
  type McpToolResult,
} from '../../engine/mcp-manager';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'servers' | 'logs'>('tools');
  const [tools, setTools] = useState<McpToolDefinition[]>([]);
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [history, setHistory] = useState<McpToolResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom server form
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerEndpoint, setNewServerEndpoint] = useState('');

  // Tool tester state
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testArgs, setTestArgs] = useState<string>('{}');
  const [testResult, setTestResult] = useState<McpToolResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const update = () => {
      setTools(McpManager.listTools());
      setServers(McpManager.getServers());
      setHistory(McpManager.getHistory());
    };

    update();
    const unsub = McpManager.subscribe(update);
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunTest = async (tool: McpToolDefinition) => {
    setIsExecuting(true);
    setTestResult(null);
    try {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(testArgs);
      } catch {
        parsedArgs = { query: testArgs };
      }
      const res = await McpManager.callTool(tool.name, parsedArgs);
      setTestResult(res);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerEndpoint.trim()) return;
    McpManager.addServer(newServerName || 'Custom Server', newServerEndpoint.trim());
    setNewServerName('');
    setNewServerEndpoint('');
    setShowAddServer(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <Cpu className="w-4 h-4 text-neutral-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100">
                  Model Context Protocol (MCP) Hub
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {tools.length} Tools Active
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Connect and manage agentic tools and external MCP data providers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 px-6 gap-6 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'tools'
                ? 'border-neutral-200 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Available Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'servers'
                ? 'border-neutral-200 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Servers ({servers.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-neutral-200 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Execution Logs ({history.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter MCP tools by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTools.map((tool) => {
                  const isTesting = testingTool === tool.name;
                  return (
                    <div
                      key={tool.name}
                      className="border border-neutral-800 bg-neutral-950/60 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <code className="text-xs font-mono font-semibold text-neutral-100 bg-neutral-800/80 px-2 py-0.5 rounded">
                            {tool.name}
                          </code>
                          <span className="text-[10px] text-neutral-400 border border-neutral-800 px-1.5 py-0.5 rounded">
                            {tool.serverName || 'Omninotes'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                          {tool.description}
                        </p>
                      </div>

                      <div>
                        {isTesting ? (
                          <div className="mt-2 pt-3 border-t border-neutral-800/80 space-y-2">
                            <label className="text-[10px] font-mono text-neutral-400">
                              Input Arguments (JSON):
                            </label>
                            <textarea
                              rows={2}
                              value={testArgs}
                              onChange={(e) => setTestArgs(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-xs font-mono text-neutral-200 focus:outline-none"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                disabled={isExecuting}
                                onClick={() => handleRunTest(tool)}
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-900 hover:bg-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                              >
                                {isExecuting ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                Execute Tool
                              </button>
                              <button
                                onClick={() => {
                                  setTestingTool(null);
                                  setTestResult(null);
                                }}
                                className="text-xs text-neutral-400 hover:text-neutral-200"
                              >
                                Cancel
                              </button>
                            </div>

                            {testResult && (
                              <div className="mt-2 p-2 bg-neutral-900/90 border border-neutral-800 rounded text-xs font-mono text-neutral-300 max-h-36 overflow-y-auto">
                                <div className="text-[10px] text-neutral-400 mb-1">
                                  {testResult.success ? '✓ Output' : '⚠ Error'} (
                                  {testResult.executionTimeMs}ms):
                                </div>
                                <pre className="whitespace-pre-wrap text-[11px]">
                                  {testResult.content[0]?.text}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end pt-2 border-t border-neutral-800/40">
                            <button
                              onClick={() => {
                                setTestingTool(tool.name);
                                setTestArgs(
                                  tool.name === 'notes_search'
                                    ? JSON.stringify({ query: 'notes' }, null, 2)
                                    : tool.name === 'calculator'
                                    ? JSON.stringify({ expression: '42 * 12' }, null, 2)
                                    : tool.name === 'notes_create_page'
                                    ? JSON.stringify({ title: 'Sprint Retrospective' }, null, 2)
                                    : '{}'
                                );
                                setTestResult(null);
                              }}
                              className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 py-1 px-2 rounded hover:bg-neutral-800 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              Test in Console
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SERVERS */}
          {activeTab === 'servers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Configured Model Context Protocol endpoints exposing local or external tools.
                </p>
                <button
                  onClick={() => setShowAddServer(!showAddServer)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 text-neutral-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add MCP Server
                </button>
              </div>

              {showAddServer && (
                <form
                  onSubmit={handleAddServer}
                  className="border border-neutral-800 bg-neutral-950 p-4 rounded-xl space-y-3"
                >
                  <h3 className="text-xs font-semibold text-neutral-200">
                    Register New MCP Server
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        Server Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SQLite DB Server"
                        value={newServerName}
                        onChange={(e) => setNewServerName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        Endpoint URL (HTTP or SSE)
                      </label>
                      <input
                        type="text"
                        placeholder="http://localhost:8000/mcp"
                        value={newServerEndpoint}
                        onChange={(e) => setNewServerEndpoint(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddServer(false)}
                      className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-neutral-100 text-neutral-900 font-medium text-xs rounded hover:bg-white transition-colors"
                    >
                      Connect Server
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {servers.map((s) => (
                  <div
                    key={s.id}
                    className="border border-neutral-800 bg-neutral-950 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        <Server className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-200">
                            {s.name}
                          </span>
                          {s.status === 'connected' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                              <AlertCircle className="w-3 h-3" /> {s.status}
                            </span>
                          )}
                        </div>
                        <code className="text-[11px] text-neutral-400 font-mono">
                          {s.endpoint}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.type !== 'internal' && (
                        <>
                          <button
                            onClick={() => McpManager.testServer(s.id)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                            title="Ping & refresh tools"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => McpManager.removeServer(s.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                            title="Remove server"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Trace execution of MCP tool calls invoked by the user or AI Second Brain.
                </p>
                {history.length > 0 && (
                  <button
                    onClick={() => McpManager.clearHistory()}
                    className="text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                  <Terminal className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">No tool calls executed yet</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Tool executions will appear here in real-time as the AI agent runs queries.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((log) => (
                    <div
                      key={log.callId}
                      className="border border-neutral-800 bg-neutral-950 p-3 rounded-lg font-mono text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.success ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          <span className="font-semibold text-neutral-200">
                            {log.toolName}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500">
                          {log.executionTimeMs}ms
                        </span>
                      </div>
                      <pre className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded max-h-28 overflow-y-auto whitespace-pre-wrap">
                        {log.content[0]?.text || log.error}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
