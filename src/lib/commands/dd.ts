import { findAirportByCode } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const ddCommand: CommandHandler = {
  name: 'DD',
  match(input) {
    return /^DD.*$/.test(input);
  },
  async execute(context) {
    const arg = context.argument ? context.argument.toUpperCase().replace(/\s+/g, '') : '';

    if (!arg) {
      const now = new Date();
      const monthStr = MONTHS[now.getMonth()];
      const day = now.getDate().toString().padStart(2, '0');
      const year = now.getFullYear().toString().slice(2);
      const dayOfWeek = DAYS[now.getDay()];
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `SYSTEM TIME: ${dayOfWeek} ${day}${monthStr}${year} ${hh}${mm}`
      };
    }

    // 1. Date Math Match: e.g. DD15JUL+10, DD15JUL-10
    const dateMathMatch = arg.match(/^(\d{1,2})([A-Z]{3})(\d{2})?([\+\-])(\d+)$/);
    if (dateMathMatch) {
      const day = parseInt(dateMathMatch[1], 10);
      const monthStr = dateMathMatch[2];
      const monthIndex = MONTHS.indexOf(monthStr);
      if (monthIndex === -1) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'INVALID DATE FORMAT'
        };
      }
      const op = dateMathMatch[4];
      const days = parseInt(dateMathMatch[5], 10);

      const now = new Date();
      let year = now.getFullYear();
      if (dateMathMatch[3]) {
        year = 2000 + parseInt(dateMathMatch[3], 10);
      }

      const baseDate = new Date(year, monthIndex, day);
      const resultDate = new Date(baseDate.getTime());
      if (op === '+') {
        resultDate.setDate(resultDate.getDate() + days);
      } else {
        resultDate.setDate(resultDate.getDate() - days);
      }

      const formatShort = (d: Date) => {
        const ddVal = d.getDate().toString().padStart(2, '0');
        const mmVal = MONTHS[d.getMonth()];
        const yyVal = d.getFullYear().toString().slice(2);
        return `${ddVal}${mmVal}${yyVal}`;
      };

      const resultDayOfWeek = DAYS[resultDate.getDay()];

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `${formatShort(baseDate)} ${op} ${days}D = ${formatShort(resultDate)} ${resultDayOfWeek}`
      };
    }

    // 2. Single Date Match: e.g. DD23JUN, DD23JUN26
    const singleDateMatch = arg.match(/^(\d{1,2})([A-Z]{3})(\d{2})?$/);
    if (singleDateMatch) {
      const day = parseInt(singleDateMatch[1], 10);
      const monthStr = singleDateMatch[2];
      const monthIndex = MONTHS.indexOf(monthStr);
      if (monthIndex === -1) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'INVALID DATE FORMAT'
        };
      }

      const now = new Date();
      let year = now.getFullYear();
      if (singleDateMatch[3]) {
        year = 2000 + parseInt(singleDateMatch[3], 10);
      }

      const targetDate = new Date(year, monthIndex, day);
      const dayOfWeek = DAYS[targetDate.getDay()];
      const ddStr = day.toString().padStart(2, '0');
      const yyStr = year.toString().slice(2);

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `${ddStr}${monthStr}${yyStr} ${dayOfWeek}`
      };
    }

    // 3. City Code Match: e.g. DDDEL, DDLAX
    const cityMatch = arg.match(/^[A-Z]{3}$/);
    if (cityMatch) {
      const airport = await findAirportByCode(arg);
      if (!airport) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'UNKNOWN CITY/AIRPORT CODE'
        };
      }

      const tz = airport.timezone || 'UTC';
      const now = new Date();

      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'long',
          hour12: false
        });
        const parts = formatter.formatToParts(now);
        const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));

        const day = lookup.day.padStart(2, '0');
        const mIdx = parseInt(lookup.month, 10) - 1;
        const mStr = MONTHS[mIdx];
        const yr = lookup.year;
        const dayOfWeek = lookup.weekday.toUpperCase();
        let hh = lookup.hour;
        let mm = lookup.minute;
        if (hh === '24') hh = '00';

        const cityUpper = airport.city.toUpperCase();
        const countryUpper = airport.country.toUpperCase();

        return {
          ok: true,
          command: 'DD',
          echo: context.normalizedInput,
          output: `${cityUpper} ${countryUpper} ${dayOfWeek} ${day}${mStr}${yr} ${hh}${mm}`
        };
      } catch (err) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'ERROR DETERMINING LOCAL TIME'
        };
      }
    }

    return {
      ok: false,
      command: 'DD',
      echo: context.normalizedInput,
      output: 'INVALID FORMAT'
    };
  }
};
