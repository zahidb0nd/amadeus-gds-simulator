import { readFileSync } from 'fs';

const content = readFileSync('src/lib/data/airports.ts', 'utf8');

// Count total airports by "code": occurrences (inside objects)
const totalEntries = (content.match(/"code":/g) || []).length;
const naCount = (content.match(/"name":\s*"N\/A"/g) || []).length;
const emptyCount = (content.match(/"name":\s*""/g) || []).length;

console.log('========== AIRPORTS DATA AUDIT ==========');
console.log(`Total airports:              ${totalEntries}`);
console.log(`Names that are "N/A":        ${naCount}`);
console.log(`Names that are empty string: ${emptyCount}`);
console.log(`Total problematic airports:  ${naCount + emptyCount}`);
console.log('');

// Find codes of specific known airports
const lhrMatch = content.match(/"code":\s*"LHR"[^}]*"name":\s*"([^"]*)"/s);
const jfkMatch = content.match(/"code":\s*"JFK"[^}]*"name":\s*"([^"]*)"/s);
const cdgMatch = content.match(/"code":\s*"CDG"[^}]*"name":\s*"([^"]*)"/s);
const dxbMatch = content.match(/"code":\s*"DXB"[^}]*"name":\s*"([^"]*)"/s);

console.log('--- Major airport name checks ---');
console.log(`LHR name: ${lhrMatch ? lhrMatch[1] : 'NOT FOUND'}`);
console.log(`JFK name: ${jfkMatch ? jfkMatch[1] : 'NOT FOUND'}`);
console.log(`CDG name: ${cdgMatch ? cdgMatch[1] : 'NOT FOUND'}`);
console.log(`DXB name: ${dxbMatch ? dxbMatch[1] : 'NOT FOUND'}`);
console.log('');

// List first 20 airport codes with N/A name
const naPattern = /"code":\s*"([A-Z0-9]+)"[^}]*"name":\s*"N\/A"/gs;
let match;
const naCodes = [];
while ((match = naPattern.exec(content)) !== null && naCodes.length < 30) {
  naCodes.push(match[1]);
}
console.log(`First ${naCodes.length} airport codes with "N/A" names:`);
console.log(naCodes.join(', '));
console.log('');

// ========== AIRLINES AUDIT ==========
const airlinesContent = readFileSync('src/lib/data/airlines.ts', 'utf8');
const airlineCount = (airlinesContent.match(/code:/g) || []).length;
console.log('========== AIRLINES DATA AUDIT ==========');
console.log(`Total airlines: ${airlineCount}`);
console.log('');

// Check for specific missing major carriers
const majorCarriers = [
  { code: 'LH', name: 'Lufthansa' },
  { code: 'IB', name: 'Iberia' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'LX', name: 'Swiss' },
  { code: 'OS', name: 'Austrian Airlines' },
  { code: 'AZ', name: 'ITA Airways (Alitalia)' },
  { code: 'AI', name: 'Air India' },
  { code: 'NH', name: 'ANA' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'MH', name: 'Malaysia Airlines' },
  { code: 'EY', name: 'Etihad' },
  { code: 'WY', name: 'Oman Air' },
  { code: 'RJ', name: 'Royal Jordanian' },
  { code: 'MS', name: 'EgyptAir' },
  { code: 'ET', name: 'Ethiopian Airlines' },
  { code: 'SA', name: 'South African Airways' },
  { code: 'AC', name: 'Air Canada' },
  { code: 'WS', name: 'WestJet' },
  { code: 'LA', name: 'LATAM' },
  { code: 'G3', name: 'Gol' },
  { code: 'FZ', name: 'flydubai' },
  { code: 'G9', name: 'Air Arabia' },
  { code: 'VY', name: 'Vueling' },
  { code: 'FR', name: 'Ryanair' },
  { code: 'U2', name: 'easyJet' },
  { code: 'W6', name: 'Wizz Air' },
];

const missing = [];
const present = [];
for (const carrier of majorCarriers) {
  const found = airlinesContent.includes(`'${carrier.code}'`) || airlinesContent.includes(`"${carrier.code}"`);
  if (found) present.push(`${carrier.code} (${carrier.name})`);
  else missing.push(`${carrier.code} (${carrier.name})`);
}

console.log(`Major carriers PRESENT (${present.length}):`);
console.log(present.join(', ') || 'none');
console.log('');
console.log(`Major carriers MISSING (${missing.length}):`);
console.log(missing.join(', ') || 'none');
