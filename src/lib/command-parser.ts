export type ParsedCommand = {
  rawInput: string;
  normalizedInput: string;
  commandToken: string;
  argument?: string;
};

export function tokenizeCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const normalizedInput = trimmed.toUpperCase();
  let commandToken = '';
  let argument = '';

  // Special component-agnostic routing for specific verbs
  if (normalizedInput.startsWith('AN') || normalizedInput.startsWith('AD')) {
    commandToken = normalizedInput.slice(0, 2);
    argument = normalizedInput.slice(2).trim();
  } else if (normalizedInput.startsWith('NM1')) {
    commandToken = 'NM1';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('DAN')) {
    commandToken = 'DAN';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('DAC')) {
    commandToken = 'DAC';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('EAN')) {
    commandToken = 'EAN';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('DNA')) {
    commandToken = 'DNA';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('DMI')) {
    commandToken = 'DMI';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('DRT')) {
    commandToken = 'DRT';
    argument = normalizedInput.slice(3).trim();
  } else if (normalizedInput.startsWith('TKDO')) {
    commandToken = 'TKDO';
    argument = normalizedInput.slice(4).trim();
  } else if (normalizedInput.startsWith('TKIN')) {
    commandToken = 'TKIN';
    argument = normalizedInput.slice(4).trim();
  } else if (
    normalizedInput.startsWith('TN') ||
    normalizedInput.startsWith('DC') ||
    normalizedInput.startsWith('DD') ||
    normalizedInput.startsWith('DF') ||
    normalizedInput.startsWith('MN') ||
    normalizedInput.startsWith('MY') ||
    normalizedInput.startsWith('MB') ||
    normalizedInput.startsWith('AC') ||
    normalizedInput.startsWith('DO') ||
    normalizedInput.startsWith('DM')
  ) {
    commandToken = normalizedInput.slice(0, 2);
    argument = normalizedInput.slice(2).trim();
  } else {
    commandToken = normalizedInput.split(/\s+/)[0];
    argument = normalizedInput.slice(commandToken.length).trim();
  }

  const result: ParsedCommand = {
    rawInput: input,
    normalizedInput,
    commandToken
  };

  if (argument.length > 0) {
    result.argument = argument;
  }

  return result;
}