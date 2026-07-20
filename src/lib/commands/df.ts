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

    // A. Multiple additions: e.g. DF134;55;21 or DF100;50;30;20
    if (arg.includes(';') && !/[\-\*\/P]/.test(arg)) {
      const parts = arg.split(';');
      const nums = parts.map(p => parseFloat(p));
      if (nums.some(isNaN) || parts.some(p => p.trim() === '')) {
        return {
          ok: false,
          command: 'DF',
          echo: context.normalizedInput,
          output: 'INVALID FORMAT'
        };
      }
      const result = nums.reduce((sum, n) => sum + n, 0);
      return {
        ok: true,
        command: 'DF',
        echo: context.normalizedInput,
        output: `${nums.map(formatNumber).join(' + ')} = ${formatNumber(result)}`
      };
    }

    // B. Percentage: e.g. DF513P10
    if (arg.includes('P')) {
      const parts = arg.split('P');
      if (parts.length === 2) {
        const valA = parseFloat(parts[0]);
        const valB = parseFloat(parts[1]);
        if (!isNaN(valA) && !isNaN(valB)) {
          const result = valA * (valB / 100);
          return {
            ok: true,
            command: 'DF',
            echo: context.normalizedInput,
            output: `${formatNumber(valA)} P ${formatNumber(valB)} = ${formatNumber(result)}`
          };
        }
      }
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
