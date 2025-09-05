/**
 * MCP read_aloud tool implementation
 */

import type { ToolContext, ReadAloudOptions, ReadAloudResult } from './types.ts';
import { TTSError } from '../tts/types.ts';

export async function readAloudTool(
  text: string,
  context: ToolContext,
  options: ReadAloudOptions = {}
): Promise<ReadAloudResult> {
  if (!text || !text.trim()) {
    throw new Error('Text parameter is required and cannot be empty');
  }

  const {
    voice,
    rate = 1.0,
    volume = 1.0,
    play = true,
    format = 'wav',
  } = options;

  try {
    // Generate audio filename
    const filename = context.audioManager.generateFilename(format);
    const outputPath = context.audioManager.getFullPath(filename);

    // Generate speech
    const ttsResult = await context.ttsEngine.generateSpeech(
      text,
      outputPath,
      {
        voice,
        rate,
        volume,
        format,
      }
    );

    // Save metadata
    await context.audioManager.saveMetadata({
      path: ttsResult.filePath,
      size: ttsResult.size,
      createdAt: new Date(),
      duration: ttsResult.duration,
      originalText: text,
      format: ttsResult.format,
    });

    // Play audio if requested
    let played = false;
    if (play) {
      try {
        await context.audioManager.playAudioFile(ttsResult.filePath);
        played = true;
      } catch (error) {
        console.warn('Audio playback failed:', error);
        // Don't fail the entire operation if playback fails
      }
    }

    // Cleanup old files periodically (every 10th call)
    if (Math.random() < 0.1) {
      context.audioManager.cleanup().catch(console.warn);
    }

    return {
      message: `Successfully generated ${played ? 'and played ' : ''}audio: ${filename}`,
      audioFile: filename,
      fileSize: ttsResult.size,
      played,
    };

  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }
    throw new Error(`Failed to process text-to-speech: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getAvailableVoices(context: ToolContext): Promise<string[]> {
  try {
    return await context.ttsEngine.getAvailableVoices();
  } catch (error) {
    console.warn('Failed to get available voices:', error);
    return [];
  }
}