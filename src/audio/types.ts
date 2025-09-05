/**
 * Audio management types and interfaces
 */

export interface AudioMetadata {
  /** File path */
  path: string;
  /** File size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Duration in seconds (if available) */
  duration?: number;
  /** Original text that generated this audio */
  originalText: string;
  /** Audio format */
  format: string;
}

export interface AudioManagerOptions {
  /** Output directory for audio files */
  outputDir: string;
  /** Maximum number of audio files to keep */
  maxFiles?: number;
  /** Maximum age of audio files in milliseconds */
  maxAge?: number;
}

export interface AudioManager {
  /** Generate a timestamped filename */
  generateFilename(format: string): string;
  
  /** Save audio metadata */
  saveMetadata(metadata: AudioMetadata): Promise<void>;
  
  /** Get audio metadata by filename */
  getMetadata(filename: string): Promise<AudioMetadata | null>;
  
  /** List all audio files */
  listAudioFiles(): Promise<AudioMetadata[]>;
  
  /** Clean up old audio files */
  cleanup(): Promise<void>;
  
  /** Play an audio file */
  playAudioFile(filePath: string): Promise<void>;
  
  /** Get the full path for a filename */
  getFullPath(filename: string): string;
}