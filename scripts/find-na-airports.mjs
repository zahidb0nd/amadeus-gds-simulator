// Audit which well-known IATA airports have N/A names
import { readFileSync } from 'fs';

const content = readFileSync('src/lib/data/airports.ts', 'utf8');

// Extract all code+name pairs
const pairs = [];
const re = /"code":\s*"([^"]+)"[^}]*?"name":\s*"([^"]*)"/gs;
let m;
while ((m = re.exec(content)) !== null) {
  pairs.push({ code: m[1], name: m[2] });
}

const naOnes = pairs.filter(p => p.name === 'N/A');
console.log(`Total N/A airports: ${naOnes.length}`);
console.log('\nAll N/A airport codes:');
console.log(naOnes.map(p => p.code).join(', '));

// Check specific high-traffic codes
const targetCodes = [
  'LHR','LGW','STN','LTN','LCY',   // London airports
  'MAN','BHX','EDI','GLA','BRS',   // UK regional
  'ORD','LAX','SFO','MIA','BOS','SEA','DFW','IAD','IAH','ATL','MSP','DTW','PHL','CLT','DEN',  // US majors
  'YYZ','YVR','YUL','YYC',         // Canada
  'MEX','BOG','GIG','EZE','SCL',   // Latin America
  'SYD','MEL','BNE','PER','AKL',   // Oceania
  'NBO','ADD','JNB','CPT','ACC',   // Africa
  'DEL','BOM','HYD','MAA','BLR','CCU', // India
  'PEK','PVG','CAN','CTU','SZX',   // China
  'ICN','TPE','KUL','BKK','SGN','CGK','MNL', // SE Asia
  'FRA','MUC','DUS','TXL','HAM',   // Germany
  'CDG','ORY','NCE','LYS',         // France
  'MAD','BCN','PMI','AGP','VLC',   // Spain
  'FCO','MXP','NAP','VCE','LIN',   // Italy
  'AMS','BRU','ZRH','VIE','CPH','ARN','OSL','HEL', // N/W Europe
  'IST','SAW','ADB',               // Turkey
  'CAI','CMN','ALG','TUN',         // N Africa/Middle East
  'DXB','AUH','DOH','KWI','BAH','AMM', // Gulf
  'TLV','BEY',
];

const naInTarget = targetCodes.filter(c => naOnes.some(n => n.code === c));
if (naInTarget.length > 0) {
  console.log('\nHigh-traffic airports with N/A name:');
  console.log(naInTarget.join(', '));
} else {
  console.log('\nNo high-traffic target airports have N/A names.');
}
