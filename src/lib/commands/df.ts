import type { CommandHandler } from './types';

function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(4)).toString();
}

export const dfCommand: CommandHandler = {
  name: 'DF',
  match(input) {
    return /^DF.*$/.test(input);
  },
  async execute(context) {
    const arg = context.argument ? context.argument.toUpperCase().replace(/\s+/g, '') : '';

    if (!arg) {
      return {
        ok: false,
        command: 'DF',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const mathMatch = arg.match(/^([+-]?\d+(?:\.\d+)?)([\;\-\*\/])([+-]?\d+(?:\.\d+)?)$/);
    if (!mathMatch) {
      return {
        ok: false,
        command: 'DF',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const valA = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const valB = parseFloat(mathMatch[3]);

    let result: number;
    let displayOp = op;

    if (op === ';') {
      result = valA + valB;
      displayOp = '+';
    } else if (op === '-') {
      result = valA - valB;
    } else if (op === '*') {
      result = valA * valB;
    } else if (op === '/') {
      if (valB === 0) {
        return {
          ok: false,
          command: 'DF',
          echo: context.normalizedInput,
          output: 'DIVISION BY ZERO'
        };
      }
      result = valA / valB;
    } else {
      return {
        ok: false,
        command: 'DF',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    return {
      ok: true,
      command: 'DF',
      echo: context.normalizedInput,
      output: `${formatNumber(valA)} ${displayOp} ${formatNumber(valB)} = ${formatNumber(result)}`
    };
  }
};
