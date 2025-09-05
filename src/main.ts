#!/usr/bin/env bun
/**
 * Read Aloud MCP Server - TypeScript/Bun Implementation
 * Main entry point with CLI argument parsing and server initialization
 */

import { parseArgs } from 'node:util';
import { SayEngine } from './tts/say-engine.ts';
import { ReadAloudMCPServer } from './server/mcp-server.ts';
import { readAloudTool } from './tools/read-aloud.ts';
import type { ToolContext } from './tools/types.ts';

const VERSION = '0.1.0';
// Playback-only; no filesystem writes

interface CLIOptions {
  text?: string;
  http?: boolean;
  port?: string;
  voice?: string;
  rate?: string;
  help?: boolean;
  version?: boolean;
}

function showHelp(): void {
  console.log(`
Read Aloud MCP Server (TypeScript/Bun) v${VERSION}

USAGE:
  bun run src/main.ts [OPTIONS]

OPTIONS:
  --text <TEXT>           One-shot mode: convert text to speech and exit
  --http                 Run as HTTP server instead of stdio
  --port <PORT>          Port for HTTP server (default: 8000)
  --voice <VOICE>        Voice to use for TTS
  --rate <RATE>          Speech rate (0.1-10.0, default: 1.0)
  --help                 Show this help message
  --version              Show version information

EXAMPLES:
  # Start MCP server (stdio mode)
  bun run src/main.ts

  # Start HTTP server
  bun run src/main.ts --http --port 8000

  # One-shot text-to-speech
  bun run src/main.ts --text "Hello world"

  # Use specific voice and rate
  bun run src/main.ts --text "Hello" --voice "Alex" --rate 1.5
`);
}

function showVersion(): void {
  console.log(`Read Aloud MCP Server (TypeScript/Bun) v${VERSION}`);
}

async function createContext(_outputDir: string): Promise<ToolContext> {
  const ttsEngine = new SayEngine();
  
  // Test TTS availability
  if (!(await ttsEngine.isAvailable())) {
    console.error('❌ TTS engine is not available on this system');
    console.error('On Linux, please install espeak-ng: sudo apt install espeak-ng');
    process.exit(1);
  }
  
  return { ttsEngine };
}

async function runOneShot(
  text: string,
  context: ToolContext,
  options: {
    play: boolean;
    voice?: string;
    rate?: number;
  }
): Promise<void> {
  console.log(`🎤 Converting text to speech: ${text.length > 50 ? text.slice(0, 50) + '...' : text}`);
  
  try {
    const result = await readAloudTool(text, context, {
      voice: options.voice,
      rate: options.rate,
    });
    console.log(`✅ ${result.message}`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function runMCPServer(context: ToolContext, httpMode: boolean = false, port: number = 8000): Promise<void> {
  const server = new ReadAloudMCPServer({
    name: 'read-aloud-mcp-ts',
    version: VERSION,
    context,
  });
  
  // Setup graceful shutdown
  const cleanup = async (): Promise<void> => {
    console.log('\n🧹 Cleaning up...');
    await server.cleanup();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  try {
    if (httpMode) {
      console.log(`🚀 Starting MCP server in streaming-HTTP mode on port ${port}`);
      console.log(`📡 MCP endpoint will be http://localhost:${port}/mcp`);
      await server.runHttpStream(port);
    } else {
      console.log('🚀 Starting MCP server in stdio mode');
      console.log('📡 Ready to receive MCP requests...');
      await server.runStdio();
    }
  } catch (error) {
    console.error(`❌ Server error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    const { values: options } = parseArgs({
      args: process.argv.slice(2),
      options: {
        text: { type: 'string' },
        http: { type: 'boolean' },
        port: { type: 'string' },
        voice: { type: 'string' },
        rate: { type: 'string' },
        help: { type: 'boolean' },
        version: { type: 'boolean' },
      },
      allowPositionals: false,
    }) as { values: CLIOptions };

    if (options.help) {
      showHelp();
      return;
    }

    if (options.version) {
      showVersion();
      return;
    }

    // Parse numeric options
    const port = options.port ? parseInt(options.port, 10) : 8000;
    const rate = options.rate ? parseFloat(options.rate) : undefined;
    const outputDir = 'unused';

    // Validate rate
    if (rate !== undefined && (rate < 0.1 || rate > 10.0)) {
      console.error('❌ Invalid rate. Must be between 0.1 and 10.0');
      process.exit(1);
    }

    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('❌ Invalid port. Must be between 1 and 65535');
      process.exit(1);
    }

    // Create context
    const context = await createContext(outputDir);

    if (options.text) {
      // One-shot mode
      await runOneShot(options.text, context, {
        play: true,
        voice: options.voice,
        rate,
      });
    } else {
      // Server mode
      await runMCPServer(context, options.http, port);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError') {
      console.error('❌ Invalid command line arguments. Use --help for usage information.');
    } else {
      console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
