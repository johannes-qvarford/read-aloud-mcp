# Read Aloud MCP Server

A Model Context Protocol (MCP) server that provides text-to-speech functionality using pyttsx3/espeak. Built with FastMCP for multiple transport modes and easy local deployment.

## Features

- **FastMCP Integration**: Modern MCP server framework with HTTP and stdio transport support
- **Multiple Operation Modes**: HTTP server, stdio server, and CLI one-shot
- **Text-to-speech conversion**: Uses pyttsx3 (espeak-ng on Linux, SAPI5 on Windows, etc.)
- **Automatic audio file generation**: Timestamped .wav files in `audio_outputs/`
- **Local audio playback**: Full audio support when running locally

## Prerequisites

### Linux Systems

Install espeak-ng for proper TTS functionality:

```bash
sudo apt update
sudo apt install espeak-ng espeak-ng-data libespeak-ng1
```

**Important**: The older `espeak` package may cause voice selection errors. Use `espeak-ng` for best compatibility with pyttsx3.

## Installation

```bash
uv sync --extra dev
```

## Usage

### MCP Server Mode (stdio)

Run as MCP server for integration with Claude Desktop or other MCP clients:

```bash
uv run read-aloud-mcp
```

### MCP Server Mode (HTTP)

Run as HTTP server for web-based integration:

```bash
uv run read-aloud-mcp --http --port 8000
```

### CLI One-shot Mode

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
