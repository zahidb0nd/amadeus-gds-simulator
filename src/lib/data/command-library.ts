export type CommandCategory = 
  | 'System'
  | 'Availability'
  | 'PNR'
  | 'Fare/Pricing'
  | 'Ticketing'
  | 'Cancellation/Refund'
  | 'Reference/Decode';

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
  },
  {
    id: 'dac',
    category: 'Reference/Decode',
    command: 'DAC',
    syntax: 'DAC[AIRLINE_CODE]',
    description: 'Decodes a 2-letter airline code into full name and alliance.',
    exampleInput: 'DACQR',
    expectedOutput: 'QR - QATAR AIRWAYS (ONEWORLD)'
  },
  {
    id: 'dan',
    category: 'Reference/Decode',
    command: 'DAN',
    syntax: 'DAN[AIRPORT_CODE]',
    description: 'Decodes a 3-letter airport or city code into full name, city, and country.',
    exampleInput: 'DANBLR',
    expectedOutput: 'BLR - KEMPEGOWDA INTERNATIONAL, BENGALURU, IN'
  },
  {
    id: 'ean',
    category: 'Reference/Decode',
    command: 'EAN',
    syntax: 'EAN[NAME]',
    description: 'Encodes a partial or full city/airport name into matching 3-letter code(s).',
    exampleInput: 'EANDOHA',
    expectedOutput: 'DOH - HAMAD INTERNATIONAL, DOHA, QA'
  },
  {
    id: 'dna-name',
    category: 'Reference/Decode',
    command: 'DNA',
    syntax: 'DNA[AIRLINE_NAME]',
    description: 'Encodes an airline name to its 2-letter code.',
    exampleInput: 'DNAQATAR',
    expectedOutput: 'QATAR AIRWAYS - QR (157)'
  },
  {
    id: 'dna-code',
    category: 'Reference/Decode',
    command: 'DNA',
    syntax: 'DNA[AIRLINE_CODE]',
    description: 'Decodes a 2-letter airline code to its name.',
    exampleInput: 'DNAQR',
    expectedOutput: 'QR - QATAR AIRWAYS (ONEWORLD)'
  },
  {
    id: 'dna-ticket',
    category: 'Reference/Decode',
    command: 'DNA',
    syntax: 'DNA[TICKET_PREFIX]',
    description: 'Decodes a numeric ticket designator to its airline.',
    exampleInput: 'DNA157',
    expectedOutput: '157 - QR - QATAR AIRWAYS'
  },
  {
    id: 'dc-name',
    category: 'Reference/Decode',
    command: 'DC',
    syntax: 'DC[COUNTRY_NAME]',
    description: 'Encodes a country name to its 2-letter code.',
    exampleInput: 'DCFRANCE',
    expectedOutput: 'FRANCE - FR'
  },
  {
    id: 'dc-code',
    category: 'Reference/Decode',
    command: 'DC',
    syntax: 'DC[COUNTRY_CODE]',
    description: 'Decodes a 2-letter country code to its name.',
    exampleInput: 'DCFR',
    expectedOutput: 'FR - FRANCE'
  },
  {
    id: 'ggalliance',
    category: 'Reference/Decode',
    command: 'GGALLIANCE',
    syntax: 'GGALLIANCE',
    description: 'Lists all Oneworld alliance airlines.',
    exampleInput: 'GGALLIANCE',
    expectedOutput: 'ONEWORLD ALLIANCE CARRIERS:\nQR - QATAR AIRWAYS\nBA - BRITISH AIRWAYS\nAA - AMERICAN AIRLINES'
  },
  {
    id: 'gpow',
    category: 'Reference/Decode',
    command: 'GPOW',
    syntax: 'GPOW',
    description: 'Lists all Oneworld alliance airlines.',
    exampleInput: 'GPOW',
    expectedOutput: 'ONEWORLD ALLIANCE CARRIERS:\nQR - QATAR AIRWAYS\nBA - BRITISH AIRWAYS\nAA - AMERICAN AIRLINES'
  },
  {
    id: 'gpsa',
    category: 'Reference/Decode',
    command: 'GPSA',
    syntax: 'GPSA',
    description: 'Lists all Star Alliance airlines.',
    exampleInput: 'GPSA',
    expectedOutput: 'STAR ALLIANCE CARRIERS:\nUA - UNITED AIRLINES'
  },
  {
    id: 'gga',
    category: 'Reference/Decode',
    command: 'GGA',
    syntax: 'GGA[AIRLINE_CODE]',
    description: 'Displays a detailed information page for an airline.',
    exampleInput: 'GGAQR',
    expectedOutput: 'AIRLINE INFORMATION - QR\nNAME: QATAR AIRWAYS\nALLIANCE: ONEWORLD\n...'
  },
  {
    id: 'ggcou',
    category: 'Reference/Decode',
    command: 'GGCOU',
    syntax: 'GGCOU[COUNTRY_CODE]',
    description: 'Displays a detailed information page for a country.',
    exampleInput: 'GGCOUFR',
    expectedOutput: 'COUNTRY INFORMATION - FR\nNAME: FRANCE\nISO CODE: FR'
  },
  {
    id: 'ggpca',
    category: 'Reference/Decode',
    command: 'GGPCA',
    syntax: 'GGPCA[AIRLINE_CODE]',
    description: 'Checks if an airline is a participating carrier.',
    exampleInput: 'GGPCAQR',
    expectedOutput: 'QR IS A PARTICIPATING CARRIER'
  },
  {
    id: 'dd-time',
    category: 'Reference/Decode',
    command: 'DD',
    syntax: 'DD[CITY_CODE]',
    description: 'Displays the current local date and time in a specific city.',
    exampleInput: 'DDDEL',
    expectedOutput: 'DELHI IN THURSDAY 17JUL26 0327'
  },
  {
    id: 'dd-day',
    category: 'Reference/Decode',
    command: 'DD',
    syntax: 'DD[DATE]',
    description: 'Calculates the day of the week for a given date.',
    exampleInput: 'DD23JUN',
    expectedOutput: '23JUN26 TUESDAY'
  },
  {
    id: 'dd-math',
    category: 'Reference/Decode',
    command: 'DD',
    syntax: 'DD[DATE]+[DAYS] / DD[DATE]-[DAYS]',
    description: 'Adds or subtracts a number of days from a given date.',
    exampleInput: 'DD15JUL+10',
    expectedOutput: '15JUL26 + 10D = 25JUL26 SATURDAY'
  },
  {
    id: 'df',
    category: 'Reference/Decode',
    command: 'DF',
    syntax: 'DF[NUM1];[NUM2] / DF[NUM1]-[NUM2] / DF[NUM1]*[NUM2] / DF[NUM1]/[NUM2]',
    description: 'Performs basic math utilities (addition with semicolon, subtraction, multiplication, division).',
    exampleInput: 'DF10;5',
    expectedOutput: '10 + 5 = 15'
  }
];
