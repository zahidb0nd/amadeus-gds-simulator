import fs from 'fs';
import path from 'path';

// 1. Load countries mapping
const countriesPath = path.join(process.cwd(), 'scripts', 'countries_downloaded.json');
const countriesContent = fs.readFileSync(countriesPath, 'utf-8');
const isoCountries = JSON.parse(countriesContent);

const nameToCode = {};
for (const c of isoCountries) {
  nameToCode[c.name.toUpperCase()] = c['alpha-2'];
}

// Custom manual overrides for countries
const overrides = {
  'USA': 'US',
  'UK': 'GB',
  'VIRGIN ISL.': 'VI',
  'VIET NAM': 'VN',
  'WALLIS & FUTUNA': 'WF',
  'WEST TIMOR': 'ID',
  'ZAIRE': 'CD',
  'YUGOSLAVIA': 'RS',
  'REUNION ISLAND': 'RE',
  'RUSSIA': 'RU',
  'S. GEORGIA & S. SANDWICH': 'GS',
  'SAINT HELENA': 'SH',
  'SAINT KITTS & NEVIS': 'KN',
  'SAINT LUCIA': 'LC',
  'SAINT VINCENT': 'VC',
  'SAO TOME & PRINCIPE': 'ST',
  'SVALBARD & JAN MAYEN': 'SJ',
  'TANZANIA': 'TZ',
  'TRINIDAD & TOBAGO': 'TT',
  'TURKS & CAICOS ISL.': 'TC',
  'TUVALU ISLAND': 'TV',
  'NETHERLANDS ANTILLES': 'BQ',
  'NEW CALEDONIA': 'NC',
  'NORTH KOREA': 'KP',
  'MARSHALL ISLANDS': 'MH',
  'MIDWAY ISLANDS': 'UM',
  'MICRONESIA': 'FM',
  'MONTSERRAT': 'MS',
  'MACEDONIA': 'MK',
  'MALDIVES': 'MV',
  'FALKLAND ISLANDS': 'FK',
  'FED. STATES OF MICRONESIA': 'FM',
  'FR. POLYNESIA': 'PF',
  'FRENCH GUIANA': 'GF',
  'IRAN': 'IR',
  'HOWLAND ISLAND': 'UM',
  'JOHNSTON ISLAND': 'UM',
  'LAOS': 'LA',
  'ACORES': 'PT',
  'ANGUILLA ISL.': 'AI',
  'ANTILLES': 'BQ',
  'BAKER I ISLAND': 'UM',
  'BRITISH VIRGIN ISL.': 'VG',
  'CANARY ISLANDS': 'ES',
  'CAPE VERDE': 'CV',
  'CAYMAN ISLANDS': 'KY',
  'CHRISTMAS ISL.': 'CX',
  'COCOS ISLANDS': 'CC',
  'COOK ISLANDS': 'CK',
  'CZECH REPUBLIC': 'CZ',
  'EAST TIMOR': 'TL',
  'WAKE ISLAND': 'UM',
  'WALES': 'GB',
  'SYRIA': 'SY',
  'SUDAN': 'SD',
  'SOUTH KOREA': 'KR',
  'SOLOMON ISLANDS': 'SB',
  'BOLIVIA': 'BO',
  'BRUNEI': 'BN',
  'BYELORUSSIA': 'BY',
  'PALESTINIAN TERRITORY': 'PS',
  'MOLDOVA': 'MD',
  'PITCAIRN ISLANDS': 'PN',
  'SVALBARD AND JAN MAYEN': 'SJ',
  'WEST INDIES': 'BQ',
  'PHILIPPINES': 'PH',
  'ST. PIERRE & MIQUELON': 'PM',
  'SCOTLAND': 'GB',
  'TAIWAN': 'TW',
  'VATICAN CITY': 'VA',
  'W. SAMOA': 'WS',
  'CAROLINE ISLANDS': 'FM',
  'CENTRAL AFRICAN REP.': 'CF',
  'CONGO': 'CG',
  'DOMINICAN REPUBLIC': 'DO',
  'ENGLAND': 'GB',
  'EQUATORIAL GUINEA': 'GQ',
  'GERMANY': 'DE',
  'HAWAII': 'US',
  'IVORY COAST': 'CI',
  'KOREA': 'KR',
  'LIBYA': 'LY',
  'MACAO': 'MO',
  'NETHERLANDS': 'NL',
  'NORTHERN IRELAND': 'GB',
  'SWAZILAND': 'SZ',
  'VENEZUELA': 'VE',
  'ENGALND': 'GB',
  'SHETLAND ISLAND': 'GB',
  'FAROE ISL.': 'FO',
  'LUXEMBURG': 'LU',
  'BOPHUTHATSWANA': 'ZA',
  'DIEGO GARCIA ISLAND': 'IO',
  'SPANISH NORTH AFRICA': 'ES',
  'OCCIDENTAL SAHARA': 'EH',
  'CAPE VERDE ISLANDS': 'CV',
  'CORSE ISL.': 'FR',
  'MADEIRA': 'PT',
  'BOSNIA-HERCEGOVINA': 'BA',
  'TURKEY': 'TR',
  'FORMER MACEDONIA': 'MK',
  'TURKS & CAICOS I.': 'TC',
  'TUAMOTU ISLANDS': 'PF',
  'PHOENIX ISL.': 'KI',
  'JOHNSTON ATOLL': 'UM',
  'LINE ISLANDS': 'KI',
  'MIDWAY ISLAND': 'UM',
  'LEEWARD ISLANDS': 'GP',
  'ST. KITTS & NEVIS': 'KN',
  'ST. LUCIA ISLAND': 'LC',
  'ST.VINCENT/GRENADINES': 'VC',
  'MACAU': 'MO'
};

function getCountryCode(name) {
  const norm = name.toUpperCase().trim();
  if (overrides[norm]) return overrides[norm];
  if (nameToCode[norm]) return nameToCode[norm];
  
  const rewritten = norm.replace('&', 'AND');
  if (nameToCode[rewritten]) return nameToCode[rewritten];

  const noIsland = norm.replace(/\b(ISLANDS?|ISL\.)\b/g, '').trim();
  if (nameToCode[noIsland]) return nameToCode[noIsland];

  for (const key of Object.keys(nameToCode)) {
    if (key.includes(norm) || norm.includes(key)) {
      return nameToCode[key];
    }
  }
  return null;
}

// 2. Parse airports database
const dbPath = path.join(process.cwd(), 'docs', 'GlobalAirportDatabase.txt');
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const dbLines = dbContent.split('\n');

const airports = [];
const usedCountryCodes = new Set();

const hardcodedOverrides = {
  'BLR': { name: 'Kempegowda International', city: 'Bengaluru', country: 'IN' },
  'DOH': { name: 'Hamad International', city: 'Doha', country: 'QA' },
  'DXB': { name: 'Dubai International', city: 'Dubai', country: 'AE' },
  'DEL': { name: 'Indira Gandhi International', city: 'Delhi', country: 'IN' }
};

for (const line of dbLines) {
  if (!line.trim()) continue;
  const parts = line.split(':');
  const icao = parts[0]?.trim();
  const iata = parts[1]?.trim();
  const name = parts[2]?.trim();
  const city = parts[3]?.trim();
  const countryName = parts[4]?.trim();
  const altitude = parseInt(parts[13]?.trim() || '0', 10);
  const latDec = parseFloat(parts[14]?.trim() || '0');
  const lonDec = parseFloat(parts[15]?.trim() || '0');

  // We only keep airports that have a valid 3-letter IATA code
  if (iata && iata !== 'N/A' && iata.length === 3) {
    const countryCode = getCountryCode(countryName);
    if (!countryCode) {
      console.warn(`Warning: unmapped country "${countryName}" for airport ${iata}`);
      continue;
    }

    usedCountryCodes.add(countryCode);

    const baseAirport = {
      code: iata,
      name: name,
      city: city,
      country: countryCode,
      latDec,
      lonDec,
      altitude
    };

    // Apply the exact original hardcoded fields for the 4 key simulation airports
    if (hardcodedOverrides[iata]) {
      Object.assign(baseAirport, hardcodedOverrides[iata]);
    }

    airports.push(baseAirport);
  }
}

// Sort airports by IATA code for consistency and readability
airports.sort((a, b) => a.code.localeCompare(b.code));

// 3. Generate countries database
const countries = [];
for (const code of usedCountryCodes) {
  const countryMatch = isoCountries.find(c => c['alpha-2'] === code);
  countries.push({
    code,
    name: countryMatch ? countryMatch.name : code
  });
}
countries.sort((a, b) => a.code.localeCompare(b.code));

// Ensure the 6 original countries are present and match their previous names exactly
const coreCountryNames = {
  'IN': 'India',
  'QA': 'Qatar',
  'AE': 'United Arab Emirates',
  'US': 'United States',
  'GB': 'United Kingdom',
  'FR': 'France'
};
for (const c of countries) {
  if (coreCountryNames[c.code]) {
    c.name = coreCountryNames[c.code];
  }
}

// 4. Write src/lib/data/airports.ts
const airportsOutPath = path.join(process.cwd(), 'src', 'lib', 'data', 'airports.ts');
const airportsCode = `export type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
  latDec?: number;
  lonDec?: number;
  altitude?: number;
};

export const airports: Airport[] = ${JSON.stringify(airports, null, 2)};

export function getAirport(code: string) {
  return airports.find((airport) => airport.code === code.toUpperCase());
}
`;
fs.writeFileSync(airportsOutPath, airportsCode, 'utf-8');
console.log(`Generated ${airports.length} airports in ${airportsOutPath}`);

// 5. Write src/lib/data/countries.ts
const countriesOutPath = path.join(process.cwd(), 'src', 'lib', 'data', 'countries.ts');
const countriesCode = `export type Country = {
  code: string;
  name: string;
};

export const countries: Country[] = ${JSON.stringify(countries, null, 2)};

export function getCountry(code: string) {
  return countries.find((country) => country.code === code.toUpperCase());
}
`;
fs.writeFileSync(countriesOutPath, countriesCode, 'utf-8');
console.log(`Generated ${countries.length} countries in ${countriesOutPath}`);
