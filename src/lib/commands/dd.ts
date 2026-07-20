import { findAirportByCode } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function getOffset(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const year = parseInt(lookup.year, 10);
    const month = parseInt(lookup.month, 10) - 1;
    const day = parseInt(lookup.day, 10);
    const hour = parseInt(lookup.hour, 10) % 24;
    const minute = parseInt(lookup.minute, 10);
    const second = parseInt(lookup.second, 10);
    
    const utcDate = Date.UTC(year, month, day, hour, minute, second);
    return Math.round((utcDate - date.getTime()) / 60000);
  } catch (e) {
    return 0;
  }
}

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

    // 1. Date Math Match: e.g. DD15JUL+10, DD15JUL-10, DD12APR/-35
    const dateMathMatch = arg.match(/^(\d{1,2})([A-Z]{3})(\d{2})?(?:\/)?([\+\-])(\d+)$/);
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

    // 1b. Elapsed flight time calculation: e.g. DDNCE1800/SYD0500+2
    const elapsedMatch = arg.match(/^([A-Z]{3})(\d{4})\/([A-Z]{3})(\d{4})(?:\+(\d+))?$/);
    if (elapsedMatch) {
      const city1 = elapsedMatch[1];
      const time1 = elapsedMatch[2];
      const city2 = elapsedMatch[3];
      const time2 = elapsedMatch[4];
      const daysAdded = parseInt(elapsedMatch[5] || '0', 10);

      const apt1 = await findAirportByCode(city1);
      const apt2 = await findAirportByCode(city2);

      if (!apt1 || !apt2) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'UNKNOWN CITY/AIRPORT CODE'
        };
      }

      const tz1 = apt1.timezone || 'UTC';
      const tz2 = apt2.timezone || 'UTC';

      const depHour = parseInt(time1.slice(0, 2), 10);
      const depMin = parseInt(time1.slice(2), 10);
      const arrHour = parseInt(time2.slice(0, 2), 10);
      const arrMin = parseInt(time2.slice(2), 10);

      const baseDate = new Date();
      const offset1 = getOffset(tz1, baseDate);
      
      const arrivalDate = new Date(baseDate.getTime() + daysAdded * 86400000);
      const offset2 = getOffset(tz2, arrivalDate);

      const depUTC = (depHour * 60 + depMin) - offset1;
      const arrUTC = ((daysAdded * 24 + arrHour) * 60 + arrMin) - offset2;

      const elapsedMinutes = arrUTC - depUTC;
      if (elapsedMinutes < 0) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'INVALID TIME SEQUENCE'
        };
      }

      const hours = Math.floor(elapsedMinutes / 60);
      const mins = elapsedMinutes % 60;

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `ELAPSED FLYING TIME: ${hours.toString().padStart(2, '0')}HR ${mins.toString().padStart(2, '0')}MIN`
      };
    }

    // 1c. City-to-city time conversion: e.g. DDLAX1500/MUC
    const convertMatch = arg.match(/^([A-Z]{3})(\d{4})\/([A-Z]{3})$/);
    if (convertMatch) {
      const city1 = convertMatch[1];
      const time1 = convertMatch[2];
      const city2 = convertMatch[3];

      const apt1 = await findAirportByCode(city1);
      const apt2 = await findAirportByCode(city2);

      if (!apt1 || !apt2) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'UNKNOWN CITY/AIRPORT CODE'
        };
      }

      const tz1 = apt1.timezone || 'UTC';
      const tz2 = apt2.timezone || 'UTC';

      const hour = parseInt(time1.slice(0, 2), 10);
      const min = parseInt(time1.slice(2), 10);

      const baseDate = new Date();
      const offset1 = getOffset(tz1, baseDate);
      const offset2 = getOffset(tz2, baseDate);

      const depUTC = (hour * 60 + min) - offset1;
      const targetMinutes = depUTC + offset2;

      const daysOffset = Math.floor(targetMinutes / 1440);
      const localMinutes = (targetMinutes % 1440 + 1440) % 1440;

      const targetHour = Math.floor(localMinutes / 60);
      const targetMin = localMinutes % 60;

      const dayStr = daysOffset === 1 ? ' (+1D)' : daysOffset === -1 ? ' (-1D)' : '';

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `${city1} ${time1} / ${city2} ${targetHour.toString().padStart(2, '0')}${targetMin.toString().padStart(2, '0')}${dayStr}`
      };
    }

    // 1d. Time difference between two cities: e.g. DDOSA/DEL
    const diffMatch = arg.match(/^([A-Z]{3})\/([A-Z]{3})$/);
    if (diffMatch) {
      const city1 = diffMatch[1];
      const city2 = diffMatch[2];

      const apt1 = await findAirportByCode(city1);
      const apt2 = await findAirportByCode(city2);

      if (!apt1 || !apt2) {
        return {
          ok: false,
          command: 'DD',
          echo: context.normalizedInput,
          output: 'UNKNOWN CITY/AIRPORT CODE'
        };
      }

      const tz1 = apt1.timezone || 'UTC';
      const tz2 = apt2.timezone || 'UTC';

      const baseDate = new Date();
      const offset1 = getOffset(tz1, baseDate);
      const offset2 = getOffset(tz2, baseDate);

      const diffMin = offset1 - offset2;
      const absDiff = Math.abs(diffMin);
      const hr = Math.floor(absDiff / 60);
      const min = absDiff % 60;

      const relation = diffMin >= 0 ? 'AHEAD OF' : 'BEHIND';

      return {
        ok: true,
        command: 'DD',
        echo: context.normalizedInput,
        output: `TIME DIFFERENCE: ${city1} IS ${hr}HR ${min.toString().padStart(2, '0')}MIN ${relation} ${city2}`
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
