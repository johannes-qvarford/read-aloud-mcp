"""MCP server for text-to-speech functionality."""

import argparse
import asyncio
import sys

from fastmcp import FastMCP

from .tts_handler import TTSHandler

# Initialize FastMCP server
mcp = FastMCP("Read Aloud MCP Server")
tts_handler = TTSHandler()


@mcp.tool()
async def read_aloud(text: str) -> str:
    """Convert text to speech and play it aloud.

    Args:
        text: The text to convert to speech and play

    Returns:
        Status message indicating success or failure
    """
    # Process text-to-speech in a thread to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, tts_handler.read_aloud, text)
    return result


def main() -> None:
    """Main entry point for the server."""
    parser = argparse.ArgumentParser(
        description="MCP Text-to-Speech Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Start MCP server (stdio)
  %(prog)s

  # Start HTTP server
  %(prog)s --http

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
    parser.add_argument(
        "--http", action="store_true", help="Run as HTTP server instead of stdio"
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Port for HTTP server (default: 8000)"
    )

    args = parser.parse_args()

    if args.text:
        # One-shot mode: convert text to speech and exit
        asyncio.run(run_oneshot(args.text, not args.no_play))
    elif args.http:
        # HTTP server mode
        mcp.run(transport="http", port=args.port)
    else:
        # Stdio server mode (default)
        mcp.run(transport="stdio")


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


if __name__ == "__main__":
    main()
