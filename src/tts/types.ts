/**
 * TTS engine types and interfaces
 */

export interface TTSOptions {
  /** Voice name or identifier */
  voice?: string;
  /** Speech rate (0.1 to 10.0) */
  rate?: number;
  /** Volume (0.0 to 1.0) */
  volume?: number;
  /** Audio format for output */
  format?: AudioFormat;
}

export type AudioFormat = 'wav' | 'mp3' | 'ogg';

export interface TTSResult {
  /** Path to the generated audio file */
  filePath: string;
  /** Duration of the audio in seconds */
  duration?: number;
  /** Size of the audio file in bytes */
  size: number;
  /** Audio format used */
  format: AudioFormat;
}

export interface TTSEngine {
  /** Generate speech from text and save to file */
  generateSpeech(text: string, outputPath: string, options?: TTSOptions): Promise<TTSResult>;
  
  /** Speak text directly without writing to disk */
  speak(text: string, options?: TTSOptions): Promise<void>;
  
  /** Get available voices */
  getAvailableVoices(): Promise<string[]>;
  
  /** Test if the engine is available on this system */
  isAvailable(): Promise<boolean>;
  
  /** Clean up resources */
  cleanup(): Promise<void>;
}

export class TTSError extends Error {
  constructor(message: string, public override cause?: Error) {
    super(message);
    this.name = 'TTSError';
  }
}
