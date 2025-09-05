/**
 * MCP server implementation using @modelcontextprotocol/sdk
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../tools/types.ts';
import { readAloudTool, getAvailableVoices } from '../tools/read-aloud.ts';

export interface MCPServerOptions {
  name: string;
  version: string;
  context: ToolContext;
}

export class ReadAloudMCPServer {
  private server: Server;
  private context: ToolContext;

  constructor(options: MCPServerOptions) {
    this.context = options.context;
    
    this.server = new Server(
      {
        name: options.name,
        version: options.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_aloud',
            description: 'Convert text to speech and optionally play it aloud. Generates timestamped audio files.',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to convert to speech',
                },
                voice: {
                  type: 'string',
                  description: 'Voice to use for TTS (optional)',
                },
                rate: {
                  type: 'number',
                  description: 'Speech rate from 0.1 to 10.0 (default: 1.0)',
                  minimum: 0.1,
                  maximum: 10.0,
                },
                volume: {
                  type: 'number',
                  description: 'Volume from 0.0 to 1.0 (default: 1.0)',
                  minimum: 0.0,
                  maximum: 1.0,
                },
                play: {
                  type: 'boolean',
                  description: 'Whether to play audio after generation (default: true)',
                },
                format: {
                  type: 'string',
                  enum: ['wav', 'mp3', 'ogg'],
                  description: 'Audio format (default: wav)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'list_voices',
            description: 'Get list of available TTS voices on the system',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_aloud': {
            const { text, voice, rate, volume, play, format } = args as {
              text: string;
              voice?: string;
              rate?: number;
              volume?: number;
              play?: boolean;
              format?: 'wav' | 'mp3' | 'ogg';
            };

            const result = await readAloudTool(text, this.context, {
              voice,
              rate,
              volume,
              play,
              format,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_voices': {
            const voices = await getAvailableVoices(this.context);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ availableVoices: voices }, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async runStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async cleanup(): Promise<void> {
    await this.context.ttsEngine.cleanup();
  }
}