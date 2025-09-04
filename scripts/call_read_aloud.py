import argparse
import asyncio
import json

from mcp_tts_server import server as srv


async def main() -> None:
    parser = argparse.ArgumentParser(description="Call read_aloud tool directly")
    parser.add_argument("--text", required=True, help="Text to convert to speech")
    args = parser.parse_args()

    # Call the underlying coroutine function for the tool
    result = await srv.read_aloud.fn(args.text)  # returns TTSResult (Pydantic model)
    print(json.dumps(result.model_dump(), indent=2))


if __name__ == "__main__":
    asyncio.run(main())
