# Repository Guidelines (TypeScript/Bun)

## Project Structure & Module Organization
- `src/main.ts`: CLI and MCP entrypoint (stdio; HTTP planned).
- `src/server/mcp-server.ts`: MCP server wiring using `fastmcp` + `zod`.
- `src/tools/read-aloud.ts`: `read_aloud` and `list_voices` tool implementations.
- `src/tts/`: TTS core types and engine (`say-engine.ts` uses espeak on Linux; built-ins on macOS/Windows).
- `src/audio/`: Audio file management and playback (`manager.ts`).
- `audio_outputs/`: Timestamped audio files and `.metadata.json` live here.
- Tooling: `package.json` (scripts), `tsconfig.json`, `biome.json`, `bun.lock`.

## Build, Test, and Development Commands
- Setup: `bun install` (installs runtime deps and dev tools).
- Run (stdio MCP): `bun run src/main.ts` or `bun run start`.
- Run (HTTP): `bun run src/main.ts --http --port 8000` (planned; not yet implemented).
- One‑shot TTS: `bun run src/main.ts --text "Hello" [--no-play] [--voice Alex] [--rate 1.5]`.
- Lint/Format: `bun run lint` and `bun run format` (Biome).
- Type check: `bun run type-check` (tsc noEmit).
- Tests: `bun run test` (Vitest). Put tests under `tests/` and mock subprocess/audio I/O.
- Logs: the CLI prints status and file paths; generated audio lives under `audio_outputs/`.

## Coding Style & Naming Conventions
- TypeScript (ESM). Prefer `lower-kebab-case` for modules, `camelCase` for functions, `PascalCase` for classes.
- Enforced by Biome (`biome.json`): line width 100, single quotes, semicolons, organize imports.
- Public API is via MCP tools (`read_aloud`, `list_voices`) and the CLI entry in `src/main.ts`.

## Testing Guidelines
- Use Vitest. Start with unit tests for `src/tools/read-aloud.ts` and `src/tts/say-engine.ts`.
- Mock external I/O: stub `child_process.spawn` (espeak), filesystem operations, and audio players.
- Example: `bun run test -q` (after adding tests under `tests/`).

## Commit & Pull Request Guidelines
- Commits: imperative, focused, and scoped. Example: "Add MCP read_aloud tool and file metadata save".
- Include rationale and surface area (files or modules touched). Reference issues (e.g., `#12`) when applicable.
- PRs: include reproduction steps and exact `bun run` commands. Call out OS-specific behavior (Linux/macOS/Windows audio).

## Security & Configuration Tips
- Linux: install `espeak-ng` for stable voices (see README). On WSL, audio may need PulseAudio configured.
- Do not commit generated audio (`audio_outputs/`) or local env artifacts. Avoid embedding secrets.
- If deploying as a service, run with least privileges and a dedicated working directory for `audio_outputs/`.
