import { describe, it, expect } from 'vitest';
import { McpManager } from './mcp-manager';

describe('McpManager', () => {
  it('registers and lists core built-in tools', () => {
    const tools = McpManager.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toContain('notes_search');
    expect(names).toContain('notes_read_page');
    expect(names).toContain('notes_create_page');
    expect(names).toContain('calculator');
    expect(names).toContain('web_fetch');
  });

  it('evaluates math expressions with calculator tool', async () => {
    const result = await McpManager.callTool('calculator', {
      expression: '12 * 8 + 4',
    });

    expect(result.success).toBe(true);
    expect((result.content[0]?.data as any)?.result).toBe(100);
  });

  it('evaluates percentages correctly in calculator', async () => {
    const result = await McpManager.callTool('calculator', {
      expression: '25% of 200',
    });

    expect(result.success).toBe(true);
    expect((result.content[0]?.data as any)?.result).toBe(50);
  });

  it('returns clean error for unknown tool', async () => {
    const result = await McpManager.callTool('non_existent_tool_xyz', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('not registered');
  });

  it('records execution history in memory', async () => {
    await McpManager.callTool('calculator', { expression: '1 + 1' });
    const history = McpManager.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].toolName).toBe('calculator');
  });
});
