# Claude Integration (MCP)

This repository provides a Model Context Protocol (MCP) server for text‑to‑speech.
Use it with Claude Desktop or any MCP‑compatible client via stdio.

Note: Linux-only support (uses `espeak-ng`).

## Available Tools

- `read_aloud`: Play text aloud (no files written).
- `list_voices`: Return available TTS voices on the system.

## Quick Start (Claude Desktop)

1) Install dependencies:

```
bun install
```

2) Add the server to Claude Desktop config (Linux): `~/.config/Claude/claude_desktop_config.json`

Example config snippet:

```json
{
  "mcpServers": {
    "read-aloud-mcp-ts": {
      "command": "bun",
      "args": ["run", "src/main.ts"],
      "cwd": "/ABSOLUTE/PATH/TO/REPO",
      "env": {}
    }
  }
}
```

3) Restart Claude Desktop.

4) Ask Claude to use the tool, e.g.:

"Read this aloud: Hello from TypeScript!"

or call explicitly:

"Use the `read_aloud` tool with rate `1.2`."

## CLI Usage (without Claude)

```
bun run src/main.ts --text "Hello world" [--no-play] [--voice Alex] [--rate 1.2]
```

HTTP transport is planned but not yet implemented. Use stdio for Claude.
