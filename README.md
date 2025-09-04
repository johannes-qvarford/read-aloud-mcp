# Read Aloud MCP Server

A Model Context Protocol (MCP) server that provides text-to-speech functionality using pyttsx3/espeak.

## Features

- Text-to-speech conversion using pyttsx3 (espeak on Linux, SAPI5 on Windows, etc.)
- Automatic audio file generation with timestamps
- Immediate playback after generation
- Cross-platform audio support
- Dual operation modes: MCP server and CLI one-shot

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

### MCP Server Mode

Run as MCP server for integration with Claude Desktop or other MCP clients:

```bash
uv run read-aloud-mcp
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
