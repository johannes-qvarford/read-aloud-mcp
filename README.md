# Read Aloud MCP Server

A Model Context Protocol (MCP) server that provides text-to-speech functionality using Chatterbox TTS.

## Features

- Text-to-speech conversion using state-of-the-art Chatterbox TTS
- Automatic audio file generation with timestamps
- Immediate playback after generation
- Cross-platform audio support

## Installation

```bash
uv sync --extra dev
```

## Usage

Run the MCP server:

```bash
uv run read-aloud-mcp
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