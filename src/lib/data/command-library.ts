export type CommandCategory = 
  | 'System'
  | 'Availability'
  | 'PNR'
  | 'Fare/Pricing'
  | 'Ticketing'
  | 'Cancellation/Refund';

export interface CommandLibraryEntry {
  id: string;
  category: CommandCategory;
  command: string;
  syntax: string;
  description: string;
  exampleInput: string;
  expectedOutput: string;
}

export const commandLibraryData: CommandLibraryEntry[] = [
  {
    id: 'help',
    category: 'System',
    command: 'HELP',
    syntax: 'HELP',
    description: 'Lists all supported commands in the simulator.',
    exampleInput: 'HELP',
    expectedOutput: '** AMADEUS GDS COMMAND SIMULATOR - COMMAND LIBRARY **\n...'
  },
  {
    id: 'ig',
    category: 'System',
    command: 'IG',
    syntax: 'IG',
    description: 'Ignores the current workarea, discarding any unsaved PNR elements.',
    exampleInput: 'IG',
    expectedOutput: 'WORKAREA IGNORED'
  },
  {
    id: 'an',
    category: 'Availability',
    command: 'AN',
    syntax: 'AN[DDMMM][ORIGIN][DEST]',
    description: 'Searches for flight availability on a specific date and route.',
    exampleInput: 'AN15JULBLRDOH',
    expectedOutput: '** AMADEUS AVAILABILITY - AN **  15JUL26  BLR BENGALURU DOH DOHA\n1  QR  522  J9 C9 Y9           BLR DOH 0135 0350  E0/321'
  },
  {
    id: 'ss',
    category: 'PNR',
    command: 'SS',
    syntax: 'SS[QTY][CLASS][LINE]',
    description: 'Sells a segment from an availability display. QTY=number of seats, CLASS=booking class, LINE=line number from availability.',
    exampleInput: 'SS1Y1',
    expectedOutput: '1  QR  522  Y1  BLR DOH 0135 0350  KK'
  },
  {
    id: 'nm',
    category: 'PNR',
    command: 'NM',
    syntax: 'NM1[SURNAME]/[FIRSTNAME]',
    description: 'Adds a passenger name to the PNR.',
    exampleInput: 'NM1PATEL/ARJUN',
    expectedOutput: '1  PATEL/ARJUN'
  },
  {
    id: 'ap',
    category: 'PNR',
    command: 'AP',
    syntax: 'AP[PHONE]',
    description: 'Adds a contact phone number to the PNR.',
    exampleInput: 'AP+919876543210',
    expectedOutput: 'AP +919876543210'
  },
  {
    id: 'tk',
    category: 'PNR',
    command: 'TK',
    syntax: 'TK TL[DDMMM]/[HHMM]',
    description: 'Adds a ticketing arrangement (time limit) to the PNR.',
    exampleInput: 'TK TL15JUL/2100',
    expectedOutput: 'TK TL15JUL/2100'
  },
  {
    id: 'er',
    category: 'PNR',
    command: 'ER',
    syntax: 'ER',
    description: 'Ends the transaction, saves the PNR, and retrieves it. Generates a record locator.',
    exampleInput: 'ER',
    expectedOutput: 'PNR CREATED 85CF5C'
  },
  {
    id: 'rt',
    category: 'PNR',
    command: 'RT',
    syntax: 'RT[RECORD_LOCATOR]',
    description: 'Retrieves an existing PNR by its 6-character record locator.',
    exampleInput: 'RT85CF5C',
    expectedOutput: '* PNR RETRIEVAL *  85CF5C\n1  PATEL/ARJUN\n1  QR  522  Y1  BLR DOH 0135 0350  HK\nSTATUS ACTIVE'
  },
  {
    id: 'fxp',
    category: 'Fare/Pricing',
    command: 'FXP',
    syntax: 'FXP',
    description: 'Prices the current itinerary and creates a Transitional Stored Ticket (TST) fare quote.',
    exampleInput: 'FXP',
    expectedOutput: 'TST PRICE PNR\nROUTE BLR-DOH\nBOOKING CLASS Y\nFARE BASIS YOW\nBASE FARE USD 210.00\nTOTAL USD 267.00'
  },
  {
    id: 'ttp',
    category: 'Ticketing',
    command: 'TTP',
    syntax: 'TTP',
    description: 'Issues an e-ticket for a priced and saved PNR.',
    exampleInput: 'TTP',
    expectedOutput: 'E-TICKET 6802981570693'
  },
  {
    id: 'ttv',
    category: 'Ticketing',
    command: 'TTV',
    syntax: 'TTV',
    description: 'Voids a previously issued ticket (must be done on the same day it was issued).',
    exampleInput: 'TTV',
    expectedOutput: 'TICKET VOIDED'
  },
  {
    id: 'xi',
    category: 'Cancellation/Refund',
    command: 'XI',
    syntax: 'XI[SEGMENT_NUMBER]',
    description: 'Cancels a specific itinerary segment from the PNR.',
    exampleInput: 'XI1',
    expectedOutput: 'SEGMENT 1 CANCELLED'
  },
  {
    id: 'refund',
    category: 'Cancellation/Refund',
    command: 'REFUND',
    syntax: 'REFUND',
    description: 'Calculates and processes a refund for a ticketed PNR with cancelled segments, applying fare rules (penalties).',
    exampleInput: 'REFUND',
    expectedOutput: 'REFUND USD 267.00\nSTATUS REFUNDED'
  }
];
