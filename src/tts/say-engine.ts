/**
 * TTS engine implementation using direct espeak subprocess calls
 * Provides cross-platform text-to-speech functionality
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

      // Get file stats
      const stats = await stat(outputPath);

      return {
        filePath: outputPath,
        size: stats.size,
        format: finalOptions.format,
        // Duration calculation would need additional audio analysis
        duration: undefined,
      };
    } catch (error) {
      throw new TTSError(
        `Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async runEspeak(text: string, outputPath: string, options: Required<Omit<TTSOptions, 'voice'>> & Pick<TTSOptions, 'voice'>): Promise<void> {
    const os = platform();
    
    return new Promise((resolve, reject) => {
      const args: string[] = [];
      
      // Add voice if specified
      if (options.voice) {
        args.push('-v', options.voice);
      }
      
      // Add speech rate - espeak uses words per minute, convert from our rate scale
      // Our scale: 0.1-10.0, espeak default is ~175 wpm, reasonable range 80-400
      const wpm = Math.round(175 * Math.min(10.0, Math.max(0.1, options.rate)));
      args.push('-s', wpm.toString());
      
      // Add amplitude (volume) - espeak uses 0-200, convert from our 0.0-1.0 scale
      const amplitude = Math.round(options.volume * 200);
      args.push('-a', amplitude.toString());
      
      // Output to file
      args.push('-w', outputPath);
      
      // Add the text
      args.push(text);
      
      // Choose the appropriate espeak command
      const command = os === 'linux' ? 'espeak-ng' : 'espeak';
      
      const espeak = spawn(command, args);
      
      let stderr = '';
      
      espeak.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      espeak.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Espeak failed with code ${code}: ${stderr}`));
        }
      });
      
      espeak.on('error', (error) => {
        reject(new Error(`Failed to spawn espeak: ${error.message}`));
      });
    });
  }

  async getAvailableVoices(): Promise<string[]> {
    if (!(await this.isAvailable())) {
      return [];
    }

    try {
      const os = platform();
      const command = os === 'linux' ? 'espeak-ng' : 'espeak';
      
      return await new Promise<string[]>((resolve, reject) => {
        const espeak = spawn(command, ['--voices']);
        
        let stdout = '';
        let stderr = '';
        
        espeak.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        espeak.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        espeak.on('close', (code) => {
          if (code === 0) {
            // Parse espeak voices output
            const voices = this.parseEspeakVoices(stdout);
            resolve(voices);
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
      // Skip header line and empty lines
      if (line.startsWith('Pty') || !line.trim()) {
        continue;
      }
      
      // espeak --voices output format: Pty Language Age/Gender VoiceName  File  Other Languages
      // We want the VoiceName (4th column)
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const voiceName = parts[3];
        if (voiceName && voiceName !== 'VoiceName') {
          voices.push(voiceName);
        }
      }
    }
    
    return voices;
  }

  async isAvailable(): Promise<boolean> {
    const os = platform();
    
    try {
      switch (os) {
        case 'darwin':
          // macOS has built-in speech synthesis
          return true;
        
        case 'win32':
          // Windows has SAPI
          return true;
        
        case 'linux':
          // Linux requires espeak or espeak-ng
          return await this.checkLinuxTTSAvailable();
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private async checkLinuxTTSAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if espeak-ng is available (preferred)
      const espeak = spawn('which', ['espeak-ng']);
      espeak.on('close', (code) => {
        if (code === 0) {
          resolve(true);
          return;
        }
        
        // Fallback to espeak
        const espeakFallback = spawn('which', ['espeak']);
        espeakFallback.on('close', (fallbackCode) => {
          resolve(fallbackCode === 0);
        });
      });
    });
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for subprocess-based approach
    return Promise.resolve();
  }
}
