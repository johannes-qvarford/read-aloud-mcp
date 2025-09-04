"""TTS handler module for generating and playing audio files."""

import contextlib
from datetime import datetime
from pathlib import Path
from typing import Optional

import pygame  # type: ignore[import-not-found,import-untyped]
import pyttsx4  # type: ignore[import-not-found,import-untyped]


class TTSHandler:
    """Handles text-to-speech generation and audio playback."""

    def __init__(self, output_dir: str = "audio_outputs") -> None:
        """Initialize TTS handler with output directory."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self._tts_engine: Optional[pyttsx4.Engine] = None
        self._pygame_initialized = False

    def __del__(self) -> None:
        """Clean up resources."""
        self.cleanup()

    def cleanup(self) -> None:
        """Clean up TTS engine and pygame resources."""
        if self._tts_engine is not None:
            with contextlib.suppress(Exception):
                self._tts_engine.stop()
                del self._tts_engine
            self._tts_engine = None

        if self._pygame_initialized:
            with contextlib.suppress(Exception):
                pygame.mixer.quit()
            self._pygame_initialized = False

    def _get_tts_engine(self) -> pyttsx4.Engine:
        """Get or initialize TTS engine."""
        if self._tts_engine is None:
            # Initialize with default settings to avoid voice issues
            self._tts_engine = pyttsx4.init()

            with contextlib.suppress(Exception):
                # Only set speech rate, avoid voice selection issues
                self._tts_engine.setProperty("rate", 200)
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
        """Play audio file using pygame."""
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        try:
            # Initialize pygame mixer if not already done
            if not self._pygame_initialized:
                pygame.mixer.init()
                self._pygame_initialized = True

            # Load and play the sound
            sound = pygame.mixer.Sound(str(file_path))
            sound.play()

            # Wait for playback to complete
            import time

            time.sleep(sound.get_length() + 0.1)

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
