/**
 * Audio file management implementation
 * Handles file creation, metadata, cleanup, and playback
 */

import { mkdir, readdir, stat, unlink, writeFile, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import type { AudioManager, AudioManagerOptions, AudioMetadata } from './types.ts';

export class DefaultAudioManager implements AudioManager {
  private readonly options: Required<AudioManagerOptions>;
  private readonly metadataFile: string;

  constructor(options: AudioManagerOptions) {
    this.options = {
      maxFiles: 100,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options,
    };
    this.metadataFile = join(this.options.outputDir, '.metadata.json');
    
    // Ensure output directory exists
    mkdir(this.options.outputDir, { recursive: true }).catch(console.warn);
  }

  generateFilename(format: string): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5); // Remove milliseconds and Z
    
    return `${timestamp}.${format}`;
  }

  getFullPath(filename: string): string {
    return join(this.options.outputDir, filename);
  }

  async saveMetadata(metadata: AudioMetadata): Promise<void> {
    try {
      const existing = await this.loadMetadataFile();
      const filename = extname(metadata.path) 
        ? metadata.path.split('/').pop() || metadata.path
        : metadata.path;
      
      existing[filename] = metadata;
      
      await writeFile(
        this.metadataFile,
        JSON.stringify(existing, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('Failed to save metadata:', error);
    }
  }

  async getMetadata(filename: string): Promise<AudioMetadata | null> {
    try {
      const metadata = await this.loadMetadataFile();
      return metadata[filename] || null;
    } catch {
      return null;
    }
  }

  async listAudioFiles(): Promise<AudioMetadata[]> {
    try {
      const files = await readdir(this.options.outputDir);
      const audioFiles = files.filter(file => 
        /\.(wav|mp3|ogg)$/i.test(file) && !file.startsWith('.')
      );

      const metadata = await this.loadMetadataFile();
      const result: AudioMetadata[] = [];

      for (const file of audioFiles) {
        const filePath = this.getFullPath(file);
        
        if (metadata[file]) {
          result.push(metadata[file]);
        } else {
          // Create basic metadata for files without stored metadata
          try {
            const stats = await stat(filePath);
            result.push({
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime,
              originalText: 'Unknown',
              format: extname(file).slice(1).toLowerCase(),
            });
          } catch {
            // Skip files that can't be accessed
          }
        }
      }

      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  async cleanup(): Promise<void> {
    try {
      const files = await this.listAudioFiles();
      const now = Date.now();
      const filesToDelete: AudioMetadata[] = [];

      // Mark files for deletion based on age
      for (const file of files) {
        const age = now - file.createdAt.getTime();
        if (age > this.options.maxAge) {
          filesToDelete.push(file);
        }
      }

      // Mark excess files for deletion based on count
      if (files.length > this.options.maxFiles) {
        const excessFiles = files
          .slice(this.options.maxFiles)
          .filter(f => !filesToDelete.includes(f));
        filesToDelete.push(...excessFiles);
      }

      // Delete marked files
      const metadata = await this.loadMetadataFile();
      for (const file of filesToDelete) {
        try {
          await unlink(file.path);
          const filename = file.path.split('/').pop();
          if (filename) {
            delete metadata[filename];
          }
        } catch (error) {
          console.warn(`Failed to delete ${file.path}:`, error);
        }
      }

      // Save updated metadata
      if (filesToDelete.length > 0) {
        await writeFile(
          this.metadataFile,
          JSON.stringify(metadata, null, 2),
          'utf-8'
        );
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  async playAudioFile(filePath: string): Promise<void> {
    const os = platform();
    
    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[];

      switch (os) {
        case 'darwin':
          command = 'afplay';
          args = [filePath];
          break;
        case 'linux':
          // Try different players in order of preference
          command = 'aplay';
          args = [filePath];
          break;
        case 'win32':
          // Use PowerShell to play audio on Windows
          command = 'powershell';
          args = ['-c', `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`];
          break;
        default:
          reject(new Error(`Audio playback not supported on platform: ${os}`));
          return;
      }

      const player = spawn(command, args);
      
      player.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Try fallback players on Linux
          if (os === 'linux' && command === 'aplay') {
            this.tryLinuxFallbackPlayers(filePath).then(resolve).catch(reject);
          } else {
            reject(new Error(`Audio playback failed with code ${code}`));
          }
        }
      });

      player.on('error', (error) => {
        if (os === 'linux' && command === 'aplay') {
          this.tryLinuxFallbackPlayers(filePath).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  }

  private async tryLinuxFallbackPlayers(filePath: string): Promise<void> {
    const fallbackPlayers = ['paplay', 'pulseaudio', 'sox'];
    
    for (const player of fallbackPlayers) {
      try {
        await new Promise<void>((resolve, reject) => {
          const args = player === 'sox' ? [filePath, '-d'] : [filePath];
          const proc = spawn(player, args);
          
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${player} failed with code ${code}`));
          });
          
          proc.on('error', reject);
        });
        return; // Success, exit loop
      } catch {
        // Try next player
        continue;
      }
    }
    
    throw new Error('No suitable audio player found on this Linux system');
  }

  private async loadMetadataFile(): Promise<Record<string, AudioMetadata>> {
    try {
      const data = await readFile(this.metadataFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      for (const key in parsed) {
        if (parsed[key].createdAt) {
          parsed[key].createdAt = new Date(parsed[key].createdAt);
        }
      }
      
      return parsed;
    } catch {
      return {};
    }
  }
}