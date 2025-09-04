"""MCP server for text-to-speech functionality."""

import argparse
import asyncio
import sys
from typing import Any

import mcp.server.stdio
import mcp.types as types
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions

from .tts_handler import TTSHandler

app = Server("read-aloud-mcp")
tts_handler = TTSHandler()


@app.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools."""
    return [
        types.Tool(
            name="read_aloud",
            description="Convert text to speech and play it aloud",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to convert to speech and play",
                    }
                },
                "required": ["text"],
            },
        )
    ]


@app.call_tool()
async def handle_call_tool(
    name: str, arguments: dict[str, Any] | None
) -> list[types.TextContent]:
    """Handle tool calls."""
    if name != "read_aloud":
        raise ValueError(f"Unknown tool: {name}")

    if not arguments or "text" not in arguments:
        raise ValueError("Missing required argument: text")

    text = arguments["text"]
    if not isinstance(text, str):
        raise ValueError("Argument 'text' must be a string")

    # Process text-to-speech in a thread to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, tts_handler.read_aloud, text)

    return [types.TextContent(type="text", text=result)]


def main() -> None:
    """Main entry point for the server."""
    parser = argparse.ArgumentParser(
        description="MCP Text-to-Speech Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start MCP server
  %(prog)s

  # One-shot text-to-speech
  %(prog)s --text "Hello world"
  %(prog)s --text "This is a test" --no-play
        """.strip(),
    )
    parser.add_argument(
        "--text", type=str, help="Text to convert to speech (one-shot mode)"
    )
    parser.add_argument(
        "--no-play",
        action="store_true",
        help="Don't play audio after generation (only save to file)",
    )

    args = parser.parse_args()

    if args.text:
        # One-shot mode: convert text to speech and exit
        asyncio.run(run_oneshot(args.text, not args.no_play))
    else:
        # Server mode: start MCP server
        asyncio.run(run_server())


async def run_oneshot(text: str, play_audio: bool = True) -> None:
    """Run one-shot text-to-speech conversion."""
    print(f"Converting text to speech: {text[:50]}{'...' if len(text) > 50 else ''}")

    handler = None
    try:
        handler = TTSHandler()
        if play_audio:
            result = handler.read_aloud(text)
        else:
            audio_path = handler.generate_speech(text)
            result = f"Audio saved to: {audio_path.name}"

        print(f"✓ {result}")

    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
    finally:
        # Ensure proper cleanup
        if handler is not None:
            handler.cleanup()

        # Give time for resources to be released
        import time

        time.sleep(0.5)


async def run_server() -> None:
    """Run MCP server mode."""
    print("Starting MCP Text-to-Speech Server...")
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="read-aloud-mcp",
                server_version="0.1.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    main()
