import { cancelSegment, getLastCompletedRecordLocator } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const cancelPattern = /^XI(\d+)$/;

export const cancelSegmentCommand: CommandHandler = {
  name: 'XI',
  match(input) {
    return cancelPattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(cancelPattern);

    if (!match) {
      return {
        ok: false,
        command: 'XI',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const segmentNumber = Number(match[1]);
    const recordLocator = await getLastCompletedRecordLocator(context.sessionId);

    if (!recordLocator) {
      return {
        ok: false,
        command: 'XI',
        echo: context.normalizedInput,
        output: 'NO COMPLETED PNR AVAILABLE'
      };
    }

    const cancelled = await cancelSegment(recordLocator, segmentNumber);

    if (!cancelled) {
      return {
        ok: false,
        command: 'XI',
        echo: context.normalizedInput,
        output: 'SEGMENT NOT FOUND'
      };
    }

    return {
      ok: true,
      command: 'XI',
      echo: context.normalizedInput,
      output: `SEGMENT ${segmentNumber} CANCELLED`
    };
  }
};