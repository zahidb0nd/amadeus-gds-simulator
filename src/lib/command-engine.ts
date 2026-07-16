import { getCommandHandler } from './commands';
import { tokenizeCommand } from './command-parser';
import type { CommandResult } from './commands/types';

export type ExecuteCommandOptions = {
  sessionId?: string;
};

export async function executeCommand(input: string, options: ExecuteCommandOptions = {}): Promise<CommandResult> {
  const parsed = tokenizeCommand(input);
  const sessionId = options.sessionId ?? 'default';

  if (!parsed) {
    return {
      ok: false,
      command: '',
      echo: '',
      output: 'INVALID FORMAT'
    };
  }

  const handler = getCommandHandler(parsed.normalizedInput);

  if (!handler) {
    return {
      ok: false,
      command: parsed.commandToken,
      echo: parsed.normalizedInput,
      output: 'INVALID FORMAT'
    };
  }

  return handler.execute({
    rawInput: parsed.rawInput,
    normalizedInput: parsed.normalizedInput,
    commandToken: parsed.commandToken,
    argument: parsed.argument ?? '',
    sessionId
  });
}