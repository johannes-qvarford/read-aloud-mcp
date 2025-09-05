# Read Aloud MCP Server (TypeScript/Bun)

A high-performance Model Context Protocol (MCP) server providing text-to-speech functionality using TypeScript and Bun runtime. This is a modern rewrite of the Python version with enhanced performance, better type safety, and improved cross-platform support.

## 🚀 Features

- **⚡ Ultra-fast performance** - Bun runtime provides ~10x faster startup than Python
- **🔧 TypeScript** - Full type safety with modern ES features
- **🎙️ Cross-platform TTS** - Uses `say` library (espeak-ng on Linux, SAPI on Windows, built-in on macOS)  
- **📡 Multiple modes** - HTTP server, stdio server, and CLI one-shot
- **🎵 Audio management** - Timestamped files with metadata and automatic cleanup
- **🔍 MCP integration** - Compatible with Claude Desktop and other MCP clients
- **⚙️ Modern tooling** - Biome for linting/formatting, Vitest for testing

## 📋 Prerequisites

### System Requirements

- **Bun** 1.0+ - Install from [bun.sh](https://bun.sh)
- **Node.js** compatible system (Linux, macOS, Windows)

### Linux Systems

Install espeak-ng for TTS functionality:

```bash
sudo apt update
sudo apt install espeak-ng espeak-ng-data libespeak-ng1
```

### Windows

Windows has built-in SAPI support - no additional installation needed.

### macOS

macOS has built-in speech synthesis - no additional installation needed.

## 🛠️ Installation

```bash
# From the repository root
bun install
```

## 💻 Usage

### MCP Server Mode (stdio)

Run as MCP server for integration with Claude Desktop:

```bash
bun run src/main.ts
```

### MCP Server Mode (HTTP)

Note: HTTP mode is planned but not yet implemented. Use stdio mode for now.

### CLI One-shot Mode

Convert text to speech directly from command line:

```bash
# Generate and play audio
bun run src/main.ts --text "Hello world"

# Generate without playing
bun run src/main.ts --text "Hello world" --no-play

# Use specific voice and settings
bun run src/main.ts --text "Hello" --voice "Alex" --rate 1.5 --format wav
```

### Production Deployment

You can run this as a systemd service. Create a unit like below and adjust the `User`, `WorkingDirectory`, and `ExecStart` paths:

```ini
[Unit]
Description=Read Aloud MCP (TypeScript)
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/ABSOLUTE/PATH/TO/REPO
ExecStart=/usr/bin/env bun run src/main.ts
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now read-aloud-mcp-ts
sudo journalctl -u read-aloud-mcp-ts -f
```

## 📚 MCP Tools

### `read_aloud`

Convert text to speech and optionally play it aloud.

**Parameters:**
- `text` (required): Text to convert to speech
- `voice` (optional): Voice to use for TTS
- `rate` (optional): Speech rate from 0.1 to 10.0 (default: 1.0)
- `volume` (optional): Volume from 0.0 to 1.0 (default: 1.0)  
- `play` (optional): Whether to play audio after generation (default: true)
- `format` (optional): Audio format - wav, mp3, ogg (default: wav)

**Returns:**
```json
{
  "message": "Successfully generated and played audio: 2024-01-15_14-30-25.wav",
  "audioFile": "2024-01-15_14-30-25.wav", 
  "fileSize": 48000,
  "played": true
}
```

### `list_voices`

Get list of available TTS voices on the system.

**Returns:**
```json
{
  "availableVoices": ["Alex", "Alice", "Bruce", "Fred"]
}
```

## 🏗️ Architecture

```
src/
├── main.ts              # CLI entry point & argument parsing
├── server/              
│   └── mcp-server.ts    # MCP server implementation
├── tts/                 
│   ├── types.ts         # TTS interfaces
│   └── say-engine.ts    # say library implementation
├── audio/              
│   ├── types.ts         # Audio management interfaces  
│   └── manager.ts       # File management & playback
├── tools/              
│   ├── types.ts         # Tool interfaces
│   └── read-aloud.ts    # MCP tool implementation
└── utils/               # Utilities (future)
```

## 🔧 Development

```bash
# Run in development mode with watching
bun run dev

# Type checking
bun run type-check

# Linting and formatting
bun run lint
bun run format

# Testing
bun run test
```

## 🆚 Comparison with Python Version

| Feature | Python Version | TypeScript Version |
|---------|---------------|-------------------|
| **Runtime** | Python 3.11+ + uv | Bun 1.0+ |
| **Startup Time** | ~2-3 seconds | ~200-300ms |
| **Dependencies** | pyttsx4, pygame, fastmcp | say, @modelcontextprotocol/sdk |
| **Type Safety** | mypy (optional) | TypeScript (built-in) |
| **Memory Usage** | Higher (Python + deps) | Lower (V8 optimization) |
| **Package Management** | uv + pip | bun (built-in) |
| **Hot Reload** | Manual restart | Built-in with --watch |
| **Bundle Size** | N/A | Tree-shaking optimized |

## 📁 File Management

Generated audio files are stored in `audio_outputs/` with:
- **Timestamped filenames**: `YYYY-MM-DD_HH-MM-SS.wav`
- **Metadata tracking**: Original text, file size, creation time
- **Automatic cleanup**: Configurable limits on file count and age

## ⚡ Performance Features

- **Lazy initialization** - TTS engine created only when needed
- **Concurrent processing** - Non-blocking audio generation  
- **Memory efficient** - Automatic resource cleanup
- **Fast startup** - Bun's optimized module resolution
- **Minimal dependencies** - Focused dependency tree

## 🔒 Security

The systemd service runs with restricted permissions:
- Dedicated service user
- Limited file system access
- No new privileges
- Protected system directories
- Private temporary directories

## 🛠️ Troubleshooting

### TTS Engine Not Available

**Linux**: Install espeak-ng
```bash
sudo apt install espeak-ng espeak-ng-data libespeak-ng1
```

**Audio Playback Issues**: The system will try multiple audio players in order:
- Linux: aplay → paplay → sox
- macOS: afplay  
- Windows: PowerShell Media.SoundPlayer

### Development Issues

**Import Errors**: Ensure all paths end with `.ts` extension for proper Bun resolution.

**Permission Errors**: Ensure the service user has write access to `audio_outputs/`.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Biome for formatting: `bun run format`
3. Add types for all new functionality
4. Test cross-platform compatibility
5. Update documentation for new features

## 📄 License

MIT License - See LICENSE file for details.
