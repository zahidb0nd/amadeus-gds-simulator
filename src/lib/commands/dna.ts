import { CommandHandler, CommandResult, CommandHandlerContext } from './types';
import { airlines } from '../data/airlines';

export const dnaCommand: CommandHandler = {
  name: 'DNA',
  match: (input: string) => /^DNA(.+)$/i.test(input),
  execute: (context: CommandHandlerContext): CommandResult => {
    const match = context.normalizedInput.match(/^DNA(.+)$/i);
    if (!match) return { ok: false, command: 'DNA', echo: context.normalizedInput, output: 'INVALID FORMAT' };

    const query = match[1].trim();

    // Check if it's a 2-letter airline code
    if (query.length === 2 && /^[A-Z0-9]{2}$/.test(query)) {
      const airline = airlines.find(a => a.code === query);
      if (airline) {
        return {
          ok: true,
          command: 'DNA',
          echo: context.normalizedInput,
          output: `${airline.code} - ${airline.name.toUpperCase()} (${airline.alliance.toUpperCase()})`
        };
      }
    }

    // Check if it's a 3-digit numeric ticket prefix
    if (/^\d{3}$/.test(query)) {
      const airline = airlines.find(a => a.ticketPrefix === query);
      if (airline) {
        return {
          ok: true,
          command: 'DNA',
          echo: context.normalizedInput,
          output: `${query} - ${airline.code} - ${airline.name.toUpperCase()}`
        };
      }
    }

    // Otherwise, treat as airline name
    const matches = airlines.filter(a => a.name.toUpperCase().includes(query));
    if (matches.length > 0) {
      const output = matches
        .map(a => `${a.name.toUpperCase()} - ${a.code} (${a.ticketPrefix})`)
        .join('\n');
      return { ok: true, command: 'DNA', echo: context.normalizedInput, output };
    }

    return { ok: false, command: 'DNA', echo: context.normalizedInput, output: 'NOT FOUND' };
  }
};
