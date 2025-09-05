# Read Aloud MCP Server (TypeScript/Bun)

A high-performance Model Context Protocol (MCP) server providing text-to-speech functionality using TypeScript and Bun runtime. This is a modern rewrite of the Python version with enhanced performance and better type safety. Note: Linux-only support (espeak-ng).

## 🚀 Features

- **⚡ Ultra-fast performance** - Bun runtime with fast startup
- **🔧 TypeScript** - Full type safety with modern ES features
- **🎙️ Linux TTS (playback-only)** - Uses `espeak-ng` on Linux; no files written
- **📡 Multiple modes** - stdio MCP server and CLI one-shot
- **🔍 MCP integration** - Compatible with Claude Desktop and other MCP clients
- **⚙️ Modern tooling** - Biome for linting/formatting, Vitest for testing

## 📋 Prerequisites

### System Requirements

- **Bun** 1.0+ - Install from [bun.sh](https://bun.sh)
- **Linux** (x86_64/arm64) with `espeak-ng` available in PATH

### Linux Systems

Install espeak-ng for TTS functionality:

```bash
sudo apt update
sudo apt install espeak-ng espeak-ng-data libespeak-ng1
```

Windows and macOS are not supported.

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

Play text directly from the command line (no files written):

```bash
# Play with defaults
bun run src/main.ts --text "Hello world"

# Use specific voice and rate
bun run src/main.ts --text "Hello" --voice "Alex" --rate 1.5
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

Play text aloud (Linux-only). No files are written.

**Parameters:**
- `text` (required): Text to speak
- `voice` (optional): Voice to use for TTS
- `rate` (optional): Speech rate from 0.1 to 10.0 (default: 1.0)
- `volume` (optional): Volume from 0.0 to 1.0 (default: 1.0)

**Returns:**
```json
{
  "message": "Successfully played audio",
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

## 📁 File Management

Playback-only: no files are written.

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

**Audio Playback Issues**: On Linux, the system will try multiple audio players in order:
- aplay → paplay → sox

### Development Issues

**Import Errors**: Ensure all paths end with `.ts` extension for proper Bun resolution.

**Permission Errors**: Ensure the service user has write access to `audio_outputs/`.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Biome for formatting: `bun run format`
3. Add types for all new functionality
4. Test on Linux (espeak-ng) only
5. Update documentation for new features

## 📄 License

MIT License - See LICENSE file for details.
