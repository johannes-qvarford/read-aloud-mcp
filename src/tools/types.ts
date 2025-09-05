/**
 * MCP tool types and interfaces
 */

export interface ToolContext {
  /** TTS engine instance */
  ttsEngine: import('../tts/types.ts').TTSEngine;
}

export interface ReadAloudOptions {
  /** Voice to use for TTS */
  voice?: string;
  /** Speech rate (0.1 to 10.0) */
  rate?: number;
  /** Volume (0.0 to 1.0) */
  volume?: number;
}

export interface ReadAloudResult {
  /** Status message */
  message: string;
  /** Whether audio was played */
  played: boolean;
  /** Available voices (if requested) */
  availableVoices?: string[];
}
