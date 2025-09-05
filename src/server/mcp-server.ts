/**
 * MCP server implementation using fastmcp + zod
 */

import type { ToolContext } from '../tools/types.ts';
import { readAloudTool, getAvailableVoices } from '../tools/read-aloud.ts';
import { z } from 'zod';
import type { FastMCP as FastMCPType, ContentResult } from 'fastmcp';

// The fastmcp package provides a simplified API for defining tools and serving via stdio.
// We keep a thin class wrapper to preserve the public surface used by src/main.ts.

export interface MCPServerOptions {
  name: string;
  version: `${number}.${number}.${number}`;
  context: ToolContext;
}

export class ReadAloudMCPServer {
  private context: ToolContext;
  private server: FastMCPType | null = null;
  private readonly name: string;
  private readonly version: `${number}.${number}.${number}`;

  constructor(options: MCPServerOptions) {
    this.context = options.context;
    this.name = options.name;
    this.version = options.version;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.server) return;
    // Dynamic import for ESM/Bun compatibility
    const mod = await import('fastmcp');
    const FastMCP = (mod as unknown as { FastMCP: new (opts: { name: string; version: `${number}.${number}.${number}` }) => FastMCPType }).FastMCP;

    // Define schemas with zod
    const readAloudSchema = z.object({
      text: z.string().min(1, 'text is required'),
      voice: z.string().optional(),
      rate: z.number().min(0.1).max(10).optional(),
      volume: z.number().min(0).max(1).optional(),
    });

    const listVoicesSchema = z.object({});

    // Create server
    this.server = new FastMCP({ name: this.name, version: this.version });

    // Register tools
    this.server.addTool({
      name: 'read_aloud',
      description: 'Play text aloud (Linux-only, espeak-ng). No files are written to disk.',
      parameters: readAloudSchema,
      execute: async (args: z.infer<typeof readAloudSchema>) => {
        const { text, voice, rate, volume } = args;
        const result = await readAloudTool(text, this.context, { voice, rate, volume });
        const response: ContentResult = { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        return response;
      },
    });

    this.server.addTool({
      name: 'list_voices',
      description: 'Get list of available TTS voices on the system',
      parameters: listVoicesSchema,
      execute: async () => {
        const voices = await getAvailableVoices(this.context);
        const response: ContentResult = { content: [{ type: 'text', text: JSON.stringify({ availableVoices: voices }, null, 2) }] };
        return response;
      },
    });
  }

  async runStdio(): Promise<void> {
    await this.ensureInitialized();
    if (!this.server) {
      throw new Error('FastMCP failed to initialize');
    }
    await this.server.start({ transportType: 'stdio' });
  }

  async runHttpStream(port: number, host?: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.server) {
      throw new Error('FastMCP failed to initialize');
    }
    await this.server.start({
      transportType: 'httpStream',
      httpStream: {
        port,
        host: host ?? '127.0.0.1',
        // Defaults to endpoint "/mcp" inside fastmcp
      },
    });
    // Keep process alive when started via httpStream; FastMCP server handles lifecycle
    await new Promise(() => {});
  }

  async cleanup(): Promise<void> {
    await this.context.ttsEngine.cleanup();
  }
}
