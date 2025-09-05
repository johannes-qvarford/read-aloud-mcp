#!/usr/bin/env bun
/**
 * Read Aloud MCP Server - TypeScript/Bun Implementation
 * Main entry point with CLI argument parsing and server initialization
 */

import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { SayEngine } from './tts/say-engine.ts';
import { DefaultAudioManager } from './audio/manager.ts';
import { ReadAloudMCPServer } from './server/mcp-server.ts';
import { readAloudTool } from './tools/read-aloud.ts';
import type { ToolContext } from './tools/types.ts';

const VERSION = '0.1.0';
const DEFAULT_OUTPUT_DIR = './audio_outputs';

interface CLIOptions {
  text?: string;
  'no-play'?: boolean;
  http?: boolean;
  port?: string;
  voice?: string;
  rate?: string;
  format?: 'wav' | 'mp3' | 'ogg';
  help?: boolean;
  version?: boolean;
  'output-dir'?: string;
}

function showHelp(): void {
  console.log(`
Read Aloud MCP Server (TypeScript/Bun) v${VERSION}

USAGE:
  bun run src/main.ts [OPTIONS]

OPTIONS:
  --text <TEXT>           One-shot mode: convert text to speech and exit
  --no-play              Don't play audio after generation (only save file)
  --http                 Run as HTTP server instead of stdio
  --port <PORT>          Port for HTTP server (default: 8000)
  --voice <VOICE>        Voice to use for TTS
  --rate <RATE>          Speech rate (0.1-10.0, default: 1.0)
  --format <FORMAT>      Audio format: wav, mp3, ogg (default: wav)
  --output-dir <DIR>     Output directory for audio files (default: ${DEFAULT_OUTPUT_DIR})
  --help                 Show this help message
  --version              Show version information

EXAMPLES:
  # Start MCP server (stdio mode)
  bun run src/main.ts

  # Start HTTP server
  bun run src/main.ts --http --port 8000

  # One-shot text-to-speech
  bun run src/main.ts --text "Hello world"

  # Generate without playing
  bun run src/main.ts --text "Hello world" --no-play

  # Use specific voice and rate
  bun run src/main.ts --text "Hello" --voice "Alex" --rate 1.5
`);
}

function showVersion(): void {
  console.log(`Read Aloud MCP Server (TypeScript/Bun) v${VERSION}`);
}

async function createContext(outputDir: string): Promise<ToolContext> {
  const ttsEngine = new SayEngine();
  const audioManager = new DefaultAudioManager({ outputDir });
  
  // Test TTS availability
  if (!(await ttsEngine.isAvailable())) {
    console.error('❌ TTS engine is not available on this system');
    console.error('On Linux, please install espeak-ng: sudo apt install espeak-ng');
    process.exit(1);
  }
  
  return { ttsEngine, audioManager };
}

async function runOneShot(
  text: string,
  context: ToolContext,
  options: {
    play: boolean;
    voice?: string;
    rate?: number;
    format?: 'wav' | 'mp3' | 'ogg';
  }
): Promise<void> {
  console.log(`🎤 Converting text to speech: ${text.length > 50 ? text.slice(0, 50) + '...' : text}`);
  
  try {
    const result = await readAloudTool(text, context, {
      play: options.play,
      voice: options.voice,
      rate: options.rate,
      format: options.format,
    });
    
    console.log(`✅ ${result.message}`);
    console.log(`📁 File: ${result.audioFile} (${Math.round(result.fileSize / 1024)} KB)`);
    
    if (options.play && !result.played) {
      console.log('⚠️  Audio playback failed, but file was generated successfully');
    }
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
      console.log(`🚀 Starting MCP server in HTTP mode on port ${port}`);
      console.log(`📡 Server will be available at http://localhost:${port}`);
      // TODO: Implement HTTP transport
      console.error('❌ HTTP mode not yet implemented. Use stdio mode instead.');
      process.exit(1);
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
        'no-play': { type: 'boolean' },
        http: { type: 'boolean' },
        port: { type: 'string' },
        voice: { type: 'string' },
        rate: { type: 'string' },
        format: { type: 'string' },
        help: { type: 'boolean' },
        version: { type: 'boolean' },
        'output-dir': { type: 'string' },
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
    const outputDir = options['output-dir'] || DEFAULT_OUTPUT_DIR;

    // Validate format
    const format = options.format as 'wav' | 'mp3' | 'ogg' | undefined;
    if (format && !['wav', 'mp3', 'ogg'].includes(format)) {
      console.error('❌ Invalid format. Supported formats: wav, mp3, ogg');
      process.exit(1);
    }

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
        play: !options['no-play'],
        voice: options.voice,
        rate,
        format,
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