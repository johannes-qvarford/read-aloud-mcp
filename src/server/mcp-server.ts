/**
 * MCP server implementation using fastmcp + zod
 */

import type { ToolContext } from '../tools/types.ts';
import { readAloudTool, getAvailableVoices } from '../tools/read-aloud.ts';
import { z } from 'zod';

// The fastmcp package provides a simplified API for defining tools and serving via stdio.
// We keep a thin class wrapper to preserve the public surface used by src/main.ts.

export interface MCPServerOptions {
  name: string;
  version: string;
  context: ToolContext;
}

export class ReadAloudMCPServer {
  private context: ToolContext;
  private server: any; // fastmcp instance (avoid tight coupling to types)

  constructor(options: MCPServerOptions) {
    this.context = options.context;

    // Lazy import pattern keeps constructor side-effects minimal
    const { createMCP } = requireFastMCP();

    // Define schemas with zod
    const readAloudSchema = z.object({
      text: z.string().min(1, 'text is required'),
      voice: z.string().optional(),
      rate: z.number().min(0.1).max(10).optional(),
      volume: z.number().min(0).max(1).optional(),
    });

    const listVoicesSchema = z.object({});

    // Create server
    this.server = createMCP({ name: options.name, version: options.version });

    // Register tools
    this.server.tool(
      'read_aloud',
      {
        description:
          'Play text aloud (Linux-only, espeak-ng). No files are written to disk.',
        schema: readAloudSchema,
      },
      async (args: z.infer<typeof readAloudSchema>) => {
        const { text, voice, rate, volume } = args;
        const result = await readAloudTool(text, this.context, { voice, rate, volume });
        return JSON.stringify(result, null, 2);
      }
    );

    this.server.tool(
      'list_voices',
      {
        description: 'Get list of available TTS voices on the system',
        schema: listVoicesSchema,
      },
      async () => {
        const voices = await getAvailableVoices(this.context);
        return JSON.stringify({ availableVoices: voices }, null, 2);
      }
    );
  }

  async runStdio(): Promise<void> {
    await this.server.stdio();
  }

  async cleanup(): Promise<void> {
    await this.context.ttsEngine.cleanup();
  }
}

// Small helper to avoid import errors if tooling inspects without deps installed
function requireFastMCP(): {
  createMCP: (opts: { name: string; version: string }) => any;
} {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fastmcp = require('fastmcp');
  // Support possible named or default exports depending on package version
  const createMCP = fastmcp.createMCP || fastmcp.default?.createMCP || fastmcp;
  return { createMCP };
}
