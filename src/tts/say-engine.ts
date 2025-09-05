/**
 * TTS engine implementation using direct espeak subprocess calls
 * Linux-only support (espeak-ng required). Playback-only; no files written.
 */

import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { platform } from 'node:os';
import type { TTSEngine, TTSOptions, TTSResult, AudioFormat } from './types.ts';
import { TTSError } from './types.ts';

export class SayEngine implements TTSEngine {
  private readonly defaultOptions: Required<Omit<TTSOptions, 'voice'>> = {
    rate: 1.0,
    volume: 1.0,
    format: 'wav' as const,
  };

  async generateSpeech(
    text: string,
    outputPath: string,
    options: TTSOptions = {}
  ): Promise<TTSResult> {
    if (!text.trim()) {
      throw new TTSError('Text cannot be empty');
    }

    if (!(await this.isAvailable())) {
      throw new TTSError('Espeak is not available on this platform');
    }

    const finalOptions = { ...this.defaultOptions, ...options };

    try {
      await this.runEspeak(text, outputPath, { ...finalOptions, voice: options.voice });

      const stats = await stat(outputPath);

      return {
        filePath: outputPath,
        size: stats.size,
        format: finalOptions.format,
        duration: undefined,
      };
    } catch (error) {
      throw new TTSError(
        `Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async runEspeak(
    text: string,
    outputPath: string,
    options: Required<Omit<TTSOptions, 'voice'>> & Pick<TTSOptions, 'voice'>
  ): Promise<void> {
    const os = platform();
    if (os !== 'linux') {
      throw new TTSError('Only Linux is supported for TTS generation');
    }

    return new Promise((resolve, reject) => {
      const args: string[] = [];

      if (options.voice) {
        args.push('-v', options.voice);
      }

      // espeak-ng uses words per minute. Base at ~175 wpm.
      const wpm = Math.round(175 * Math.min(10.0, Math.max(0.1, options.rate)));
      args.push('-s', wpm.toString());

      // 0..200 amplitude scale
      const amplitude = Math.round(Math.min(1, Math.max(0, options.volume)) * 200);
      args.push('-a', amplitude.toString());

      // Output to file
      args.push('-w', outputPath);

      // Text as final argument
      args.push(text);

      const command = 'espeak-ng';
      const espeak = spawn(command, args);

      let stderr = '';
      espeak.stderr?.on('data', (d) => (stderr += d.toString()));
      espeak.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Espeak failed with code ${code}: ${stderr}`));
      });
      espeak.on('error', (error) => reject(new Error(`Failed to spawn espeak: ${error.message}`)));
    });
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!text.trim()) {
      throw new TTSError('Text cannot be empty');
    }

    const finalOptions = { ...this.defaultOptions, ...options };
    const os = platform();
    if (os !== 'linux') {
      throw new TTSError('Only Linux is supported for playback');
    }

    return new Promise((resolve, reject) => {
      // Linux-only playback using espeak-ng (no file output)
      const command = 'espeak-ng';
      const args: string[] = [];
      if (finalOptions.voice) {
        args.push('-v', finalOptions.voice);
      }
      const wpm = Math.round(175 * Math.min(10.0, Math.max(0.1, finalOptions.rate)));
      args.push('-s', wpm.toString());
      const amplitude = Math.round(Math.min(1, Math.max(0, finalOptions.volume)) * 200);
      args.push('-a', amplitude.toString());
      args.push(text);

      const proc = spawn(command, args);
      let stderr = '';
      proc.stderr?.on('data', (d) => (stderr += d.toString()));
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new TTSError(`Playback failed with code ${code}: ${stderr}`));
      });
      proc.on('error', (err) => reject(new TTSError(`Failed to spawn player: ${err.message}`)));
    });
  }

  async getAvailableVoices(): Promise<string[]> {
    if (!(await this.isAvailable())) {
      return [];
    }

    try {
      const command = 'espeak-ng';
      return await new Promise<string[]>((resolve) => {
        const espeak = spawn(command, ['--voices']);
        let stdout = '';
        let stderr = '';
        espeak.stdout?.on('data', (d) => (stdout += d.toString()));
        espeak.stderr?.on('data', (d) => (stderr += d.toString()));
        espeak.on('close', (code) => {
          if (code === 0) {
            resolve(this.parseEspeakVoices(stdout));
          } else {
            console.warn(`Failed to get voices (code ${code}): ${stderr}`);
            resolve([]);
          }
        });
        espeak.on('error', (error) => {
          console.warn('Failed to get available voices:', error);
          resolve([]);
        });
      });
    } catch (error) {
      console.warn('Failed to get available voices:', error);
      return [];
    }
  }

  private parseEspeakVoices(output: string): string[] {
    const voices: string[] = [];
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.startsWith('Pty') || !line.trim()) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const voiceName = parts[3];
        if (voiceName && voiceName !== 'VoiceName') voices.push(voiceName);
      }
    }
    return voices;
  }

  async isAvailable(): Promise<boolean> {
    const os = platform();
    if (os !== 'linux') return false;
    try {
      return await this.checkLinuxTTSAvailable();
    } catch {
      return false;
    }
  }

  private async checkLinuxTTSAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const espeak = spawn('which', ['espeak-ng']);
      espeak.on('close', (code) => {
        if (code === 0) {
          resolve(true);
          return;
        }
        const espeakFallback = spawn('which', ['espeak']);
        espeakFallback.on('close', (fallbackCode) => {
          resolve(fallbackCode === 0);
        });
      });
    });
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }
}

