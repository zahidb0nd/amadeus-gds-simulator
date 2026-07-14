export type ParsedCommand = {
  rawInput: string;
  normalizedInput: string;
  commandToken: string;
};

export function tokenizeCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const normalizedInput = trimmed.toUpperCase();
  const commandToken = normalizedInput.split(/\s+/)[0];

  return {
    rawInput: input,
    normalizedInput,
    commandToken
  };
}