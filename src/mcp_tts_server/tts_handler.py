"""TTS handler module for generating and playing audio files."""

from datetime import datetime
from pathlib import Path
from typing import Optional

import pyttsx3  # type: ignore[import-untyped]
import simpleaudio as sa  # type: ignore[import-untyped]


class TTSHandler:
    """Handles text-to-speech generation and audio playback."""

    def __init__(self, output_dir: str = "audio_outputs") -> None:
        """Initialize TTS handler with output directory."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self._tts_engine: Optional[pyttsx3.Engine] = None

    def __del__(self) -> None:
        """Clean up resources."""
        self.cleanup()

    def cleanup(self) -> None:
        """Clean up TTS engine resources."""
        if self._tts_engine is not None:
            try:
                self._tts_engine.stop()
                del self._tts_engine
                self._tts_engine = None
            except Exception:
                pass  # Ignore cleanup errors

    def _get_tts_engine(self) -> pyttsx3.Engine:
        """Get or initialize TTS engine."""
        if self._tts_engine is None:
            # Initialize with default settings to avoid voice issues
            self._tts_engine = pyttsx3.init()
            
            try:
                # Only set speech rate, avoid voice selection issues
                self._tts_engine.setProperty('rate', 200)
            except Exception:
                # Continue with default settings if customization fails
                pass
        return self._tts_engine

    def _generate_timestamp_filename(self) -> str:
        """Generate timestamp-based filename with milliseconds."""
        now = datetime.now()
        timestamp = now.strftime("%Y-%m-%d_%H-%M-%S-%f")[
            :-3
        ]  # Remove last 3 digits to get ms
        return f"{timestamp}.wav"

    def generate_speech(self, text: str) -> Path:
        """Generate speech from text and save to timestamped file."""
        if not text.strip():
            raise ValueError("Text cannot be empty")

        tts_engine = self._get_tts_engine()
        filename = self._generate_timestamp_filename()
        output_path = self.output_dir / filename

        # Save audio using pyttsx3
        tts_engine.save_to_file(text, str(output_path))
        tts_engine.runAndWait()

        return output_path

    def play_audio_file(self, file_path: Path) -> None:
        """Play audio file using simpleaudio."""
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        try:
            wave_obj = sa.WaveObject.from_wave_file(str(file_path))
            play_obj = wave_obj.play()
            play_obj.wait_done()  # Wait for playback to complete
            
            # Give a moment for audio system to clean up
            import time
            time.sleep(0.1)
            
        except Exception as e:
            raise RuntimeError(f"Failed to play audio: {e}") from e

    def read_aloud(self, text: str) -> str:
        """Generate speech and play it immediately."""
        try:
            # Generate audio file
            audio_path = self.generate_speech(text)

            # Play the generated audio
            self.play_audio_file(audio_path)

            return f"Successfully generated and played audio: {audio_path.name}"

        except Exception as e:
            return f"Error processing text-to-speech: {str(e)}"
