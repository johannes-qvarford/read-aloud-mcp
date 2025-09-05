import type { AudioManager, AudioManagerOptions, AudioMetadata } from './types.ts';

export class NoopAudioManager implements AudioManager {
  // No options needed; keep signature for compatibility
  constructor(_options?: Partial<AudioManagerOptions>) {}

  generateFilename(_format: string): string {
    const now = new Date();
    return now.toISOString();
  }

  async saveMetadata(_metadata: AudioMetadata): Promise<void> {
    // no-op
  }

  async getMetadata(_filename: string): Promise<AudioMetadata | null> {
    return null;
  }

  async listAudioFiles(): Promise<AudioMetadata[]> {
    return [];
  }

  async cleanup(): Promise<void> {
    // no-op
  }

  async playAudioFile(_filePath: string): Promise<void> {
    throw new Error('NoopAudioManager cannot play files (playback is direct via TTS engine)');
  }

  getFullPath(filename: string): string {
    return filename;
  }
}

