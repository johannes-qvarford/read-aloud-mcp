/**
 * MCP tool types and interfaces
 */

export interface ToolContext {
  /** TTS engine instance */
  ttsEngine: import('../tts/types.ts').TTSEngine;
  /** Audio manager instance */
  audioManager: import('../audio/types.ts').AudioManager;
}

export interface ReadAloudOptions {
  /** Voice to use for TTS */
  voice?: string;
  /** Speech rate (0.1 to 10.0) */
  rate?: number;
  /** Volume (0.0 to 1.0) */
  volume?: number;
  /** Whether to play audio after generation */
  play?: boolean;
  /** Audio format */
  format?: 'wav' | 'mp3' | 'ogg';
}

export interface ReadAloudResult {
  /** Status message */
  message: string;
  /** Generated audio file path */
  audioFile: string;
  /** Audio file size in bytes */
  fileSize: number;
  /** Whether audio was played */
  played: boolean;
  /** Available voices (if requested) */
  availableVoices?: string[];
}