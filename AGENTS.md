# Repository Guidelines

## Project Structure & Module Organization
- `src/mcp_tts_server/`: Python package.
  - `server.py`: FastMCP entrypoint and CLI (`read-aloud-mcp`).
  - `tts_handler.py`: TTS generation (pyttsx4) and playback (pygame).
  - `__init__.py`: package metadata.
- `audio_outputs/`: Timestamped `.wav` files are written here.
- Scripts: `install-service.sh`, `install-user-service.sh`, `uninstall-service.sh` for systemd deployment.
- Tooling: `pyproject.toml` (hatch/uv, deps), `.pre-commit-config.yaml`, Ruff/Mypy config.

## Build, Test, and Development Commands
- Setup: `uv sync --extra dev` (installs runtime + dev tools).
- Run (stdio MCP): `uv run read-aloud-mcp`
- Run (HTTP): `uv run read-aloud-mcp --http --port 8000`
- One‑shot TTS: `uv run read-aloud-mcp --text "Hello" [--no-play]`
- Lint/Format: `uv run ruff format . && uv run ruff check .`
- Type check: `uv run mypy src/`
- Service install: `./install-service.sh` (root service) or `./install-user-service.sh` (user service). View logs with `journalctl -u read-aloud-mcp -f` (or `--user`).

## Coding Style & Naming Conventions
- Python 3.11+. Follow PEP 8; Ruff enforces style (line length 88; common rules E/W/F/B/C4/ARG/SIM; ignores E501/E203).
- Type hints required; mypy is strict (`disallow_untyped_defs`, `check_untyped_defs`).
- Naming: modules `lower_snake_case`, functions `snake_case`, classes `PascalCase`. Keep public API under `mcp_tts_server` and expose CLI via `read-aloud-mcp`.

## Testing Guidelines
- No test suite yet. Prefer `pytest` with files in `tests/` (e.g., `tests/test_tts_handler.py`).
- Mock external I/O: stub `pyttsx4.Engine.save_to_file/runAndWait` and `pygame.mixer.Sound` for deterministic tests.
- Example: `uv run pytest -q` (after adding `pytest` to `project.optional-dependencies.dev`).

## Commit & Pull Request Guidelines
- Commits: imperative, focused, and scoped. Example: "Fix uv PATH issue in systemd service installation".
- Include rationale and surface area (files or modules touched). Reference issues (e.g., `#12`) when applicable.
- PRs: clear description, testing steps (exact `uv run` commands), platform notes (Linux/WSL audio), and any screenshots/log excerpts. Update README if behavior or setup changes.

## Security & Configuration Tips
- Linux: install `espeak-ng` for stable voices (see README). For WSL, audio may need `PULSE_SERVER`/`DISPLAY` (see `install-user-service.sh`).
- Do not commit generated audio (`audio_outputs/`) or local env artifacts. Keep service units minimal and avoid embedding secrets.

