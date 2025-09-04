# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides text-to-speech functionality using pyttsx3/espeak. It integrates with MCP clients (like Claude Desktop) to enable TTS capabilities through the `read_aloud` tool.

## Development Commands

**Package Management**: Uses `uv` package manager
- Install dependencies: `uv sync --extra dev`
- Run stdio server: `uv run read-aloud-mcp`
- Run HTTP server: `uv run read-aloud-mcp --http --port 8000`
- One-shot TTS: `uv run read-aloud-mcp --text "Hello world"`
- Generate without playing: `uv run read-aloud-mcp --text "Hello" --no-play`


**Code Quality**:
- Type checking: `uv run mypy src/`
- Linting: `uv run ruff check .`
- Auto-fix linting: `uv run ruff check . --fix`
- Formatting: `uv run ruff format .`

## Architecture

**Multiple Operation Modes**:
- **Stdio Server Mode**: Traditional MCP server using stdio transport for Claude Desktop integration
- **HTTP Server Mode**: FastMCP HTTP server for web-based integration
- **One-shot Mode**: CLI usage triggered by `--text` argument

**Core Components**:
- `server.py`: FastMCP server with `@mcp.tool()` decorator for `read_aloud` function
- `tts_handler.py`: TTSHandler class managing pyttsx3 engine lifecycle, audio generation, and file management

**FastMCP Integration**:
- Uses FastMCP framework for simplified MCP server development
- Single `@mcp.tool()` decorator replaces complex handler registration
- Automatic HTTP and stdio transport support
- Built-in argument validation and response formatting

**Key Patterns**:
- **FastMCP Tools**: Simple decorated functions instead of class-based handlers
- **Async/Threading**: TTS processing runs in thread executor to avoid blocking
- **Resource Management**: Lazy TTS engine initialization with proper cleanup
- **File Management**: Timestamped filenames (`YYYY-MM-DD_HH-MM-SS-mmm.wav`) in `audio_outputs/`


## Important Implementation Details

**TTS Engine**: Uses pyttsx3 which automatically selects OS-appropriate TTS engines (espeak on Linux, SAPI5 on Windows, etc.)

**Audio Flow**: Text → pyttsx3.save_to_file() → .wav file → simpleaudio playback

**Error Handling**: Comprehensive validation and cleanup, especially important in one-shot mode where process exits

**Dependencies**: Minimal runtime deps (mcp, pyttsx3, simpleaudio) with strict typing enabled via mypy configuration
