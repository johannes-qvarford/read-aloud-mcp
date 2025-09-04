# Read Aloud MCP Server

A Model Context Protocol (MCP) server that provides text-to-speech functionality using pyttsx3/espeak. Built with FastMCP for easy deployment and multiple transport modes.

## Features

- **FastMCP Integration**: Modern MCP server framework with HTTP and stdio transport support
- **Docker Deployment**: Easy deployment with all dependencies included
- **Multiple Operation Modes**: HTTP server, stdio server, and CLI one-shot
- **Text-to-speech conversion**: Uses pyttsx3 (espeak-ng on Linux, SAPI5 on Windows, etc.)
- **Automatic audio file generation**: Timestamped .wav files in `audio_outputs/`
- **Cross-platform audio support**: Works in containers and local environments

## Prerequisites

### Linux Systems

Install espeak-ng for proper TTS functionality:

```bash
sudo apt update
sudo apt install espeak-ng espeak-ng-data libespeak-ng1
```

**Important**: The older `espeak` package may cause voice selection errors. Use `espeak-ng` for best compatibility with pyttsx3.

## Installation

### Local Development

```bash
uv sync --extra dev
```

### Docker Deployment (Recommended)

The easiest way to run this MCP server is using Docker, which handles all system dependencies:

```bash
# Build and run HTTP server
docker compose up --build

# Or run in background
docker compose up -d --build
```

The server will be available at `http://localhost:8000`

## Usage

### Docker HTTP Server

```bash
# Start HTTP server (recommended for production)
docker compose up

# Test the server
curl -X POST http://localhost:8000/tools/read_aloud \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Docker!"}'
```

### Local Development Modes

#### MCP Server Mode (stdio)

Run as MCP server for integration with Claude Desktop or other MCP clients:

```bash
uv run read-aloud-mcp
```

#### MCP Server Mode (HTTP)

Run as HTTP server for web-based integration:

```bash
uv run read-aloud-mcp --http --port 8000
```

#### CLI One-shot Mode

Convert text to speech directly from command line:

```bash
# Generate and play audio
uv run read-aloud-mcp --text "Hello world"

# Generate audio file without playing
uv run read-aloud-mcp --text "Hello world" --no-play
```

## Development

Format code:
```bash
uv run ruff format .
uv run ruff check .
```

Type checking:
```bash
uv run mypy src/
```
