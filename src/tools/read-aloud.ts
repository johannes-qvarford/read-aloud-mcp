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

  const { voice, rate = 1.0, volume = 1.0 } = options;

  try {
    // Playback-only, no filesystem writes
    await context.ttsEngine.speak(text, { voice, rate, volume });

    return {
      message: 'Successfully played audio',
      played: true,
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
