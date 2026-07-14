import type { CommandHandler } from './types';

const helpOutput = [
  'HELP',
  '** AMADEUS GDS COMMAND SIMULATOR - COMMAND LIBRARY **',
  'AN[DDMMM][ORIGIN][DEST]    AVAILABILITY SEARCH',
  'SS[QTY][CLASS][LINE]       SELL SEGMENT',
  'NM1[SURNAME]/[FIRSTNAME]   ADD NAME ELEMENT',
  'AP[PHONE]                  ADD CONTACT ELEMENT',
  'TK TL[DATE/TIME]           ADD TICKETING ARRANGEMENT',
  'FXP                        FARE PRICE PNR',
  'RT[RECORDLOCATOR]          RETRIEVE PNR',
  'TTP                        ISSUE TICKET',
  'TTV                        VOID TICKET',
  'XI[SEGMENT]                CANCEL SEGMENT',
  'REFUND                     PROCESS REFUND',
  'IG                         IGNORE WORKAREA',
  'ER                         END AND RETRIEVE',
  'HELP                      SHOW COMMAND LIST'
].join('\n');

export const helpCommand: CommandHandler = {
  name: 'HELP',
  match(input) {
    return input === 'HELP';
  },
  execute(context) {
    return {
      ok: true,
      command: 'HELP',
      echo: context.normalizedInput,
      output: helpOutput
    };
  }
};