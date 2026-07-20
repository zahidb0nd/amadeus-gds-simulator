export type Airline = {
  code: string;
  name: string;
  alliance: string;
  ticketPrefix: string;
  participating: boolean;
};

export const airlines: Airline[] = [
  // ── Star Alliance ──────────────────────────────────────────────────────────
  { code: 'UA', name: 'United Airlines',        alliance: 'Star Alliance', ticketPrefix: '016', participating: true  },
  { code: 'LH', name: 'Lufthansa',              alliance: 'Star Alliance', ticketPrefix: '220', participating: true  },
  { code: 'SQ', name: 'Singapore Airlines',     alliance: 'Star Alliance', ticketPrefix: '618', participating: true  },
  { code: 'TK', name: 'Turkish Airlines',       alliance: 'Star Alliance', ticketPrefix: '235', participating: true  },
  { code: 'NH', name: 'ANA',                    alliance: 'Star Alliance', ticketPrefix: '205', participating: true  },
  { code: 'LX', name: 'Swiss',                  alliance: 'Star Alliance', ticketPrefix: '724', participating: true  },
  { code: 'OS', name: 'Austrian Airlines',      alliance: 'Star Alliance', ticketPrefix: '257', participating: true  },
  { code: 'AI', name: 'Air India',              alliance: 'Star Alliance', ticketPrefix: '098', participating: true  },
  { code: 'ET', name: 'Ethiopian Airlines',     alliance: 'Star Alliance', ticketPrefix: '071', participating: true  },
  { code: 'AC', name: 'Air Canada',             alliance: 'Star Alliance', ticketPrefix: '014', participating: true  },
  { code: 'MS', name: 'EgyptAir',               alliance: 'Star Alliance', ticketPrefix: '077', participating: true  },
  { code: 'SA', name: 'South African Airways',  alliance: 'Star Alliance', ticketPrefix: '083', participating: true  },
  { code: 'SK', name: 'Scandinavian Airlines',  alliance: 'Star Alliance', ticketPrefix: '117', participating: true  },
  { code: 'TP', name: 'TAP Air Portugal',       alliance: 'Star Alliance', ticketPrefix: '047', participating: true  },
  { code: 'OZ', name: 'Asiana Airlines',        alliance: 'Star Alliance', ticketPrefix: '988', participating: true  },
  { code: 'CA', name: 'Air China',              alliance: 'Star Alliance', ticketPrefix: '999', participating: true  },
  { code: 'SN', name: 'Brussels Airlines',      alliance: 'Star Alliance', ticketPrefix: '082', participating: true  },
  { code: 'AV', name: 'Avianca',                alliance: 'Star Alliance', ticketPrefix: '134', participating: true  },
  { code: 'CM', name: 'Copa Airlines',          alliance: 'Star Alliance', ticketPrefix: '230', participating: true  },
  { code: 'NZ', name: 'Air New Zealand',        alliance: 'Star Alliance', ticketPrefix: '086', participating: true  },

  // ── Oneworld ───────────────────────────────────────────────────────────────
  { code: 'BA', name: 'British Airways',        alliance: 'Oneworld',      ticketPrefix: '125', participating: true  },
  { code: 'AA', name: 'American Airlines',      alliance: 'Oneworld',      ticketPrefix: '001', participating: true  },
  { code: 'QR', name: 'Qatar Airways',          alliance: 'Oneworld',      ticketPrefix: '157', participating: true  },
  { code: 'IB', name: 'Iberia',                 alliance: 'Oneworld',      ticketPrefix: '075', participating: true  },
  { code: 'CX', name: 'Cathay Pacific',         alliance: 'Oneworld',      ticketPrefix: '160', participating: true  },
  { code: 'JL', name: 'Japan Airlines',         alliance: 'Oneworld',      ticketPrefix: '131', participating: true  },
  { code: 'MH', name: 'Malaysia Airlines',      alliance: 'Oneworld',      ticketPrefix: '232', participating: true  },
  { code: 'RJ', name: 'Royal Jordanian',        alliance: 'Oneworld',      ticketPrefix: '512', participating: true  },
  { code: 'LA', name: 'LATAM Airlines',         alliance: 'Oneworld',      ticketPrefix: '045', participating: true  },
  { code: 'AY', name: 'Finnair',                alliance: 'Oneworld',      ticketPrefix: '105', participating: true  },
  { code: 'VY', name: 'Vueling',                alliance: 'Oneworld',      ticketPrefix: '573', participating: false },
  { code: 'AT', name: 'Royal Air Maroc',        alliance: 'Oneworld',      ticketPrefix: '147', participating: true  },
  { code: 'UL', name: 'SriLankan Airlines',     alliance: 'Oneworld',      ticketPrefix: '603', participating: true  },

  // ── SkyTeam ────────────────────────────────────────────────────────────────
  { code: 'DL', name: 'Delta Air Lines',        alliance: 'SkyTeam',       ticketPrefix: '006', participating: true  },
  { code: 'AF', name: 'Air France',             alliance: 'SkyTeam',       ticketPrefix: '057', participating: true  },
  { code: 'KL', name: 'KLM',                    alliance: 'SkyTeam',       ticketPrefix: '074', participating: true  },
  { code: 'AZ', name: 'ITA Airways',            alliance: 'SkyTeam',       ticketPrefix: '055', participating: true  },
  { code: 'MU', name: 'China Eastern',          alliance: 'SkyTeam',       ticketPrefix: '781', participating: true  },
  { code: 'KE', name: 'Korean Air',             alliance: 'SkyTeam',       ticketPrefix: '180', participating: true  },
  { code: 'SU', name: 'Aeroflot',               alliance: 'SkyTeam',       ticketPrefix: '555', participating: true  },
  { code: 'AM', name: 'Aeromexico',             alliance: 'SkyTeam',       ticketPrefix: '139', participating: true  },
  { code: 'AR', name: 'Aerolineas Argentinas',  alliance: 'SkyTeam',       ticketPrefix: '044', participating: true  },
  { code: 'CZ', name: 'China Southern',         alliance: 'SkyTeam',       ticketPrefix: '784', participating: true  },
  { code: 'GA', name: 'Garuda Indonesia',       alliance: 'SkyTeam',       ticketPrefix: '126', participating: true  },
  { code: 'VN', name: 'Vietnam Airlines',       alliance: 'SkyTeam',       ticketPrefix: '738', participating: true  },

  // ── Independent / Major carriers ───────────────────────────────────────────
  { code: 'EK', name: 'Emirates',               alliance: 'None',          ticketPrefix: '176', participating: true  },
  { code: 'EY', name: 'Etihad Airways',         alliance: 'None',          ticketPrefix: '607', participating: true  },
  { code: 'WY', name: 'Oman Air',               alliance: 'None',          ticketPrefix: '910', participating: true  },
  { code: 'FZ', name: 'flydubai',               alliance: 'None',          ticketPrefix: '141', participating: false },
  { code: 'G9', name: 'Air Arabia',             alliance: 'None',          ticketPrefix: '301', participating: false },
  { code: 'GF', name: 'Gulf Air',               alliance: 'None',          ticketPrefix: '072', participating: true  },
  { code: 'SV', name: 'Saudia',                 alliance: 'None',          ticketPrefix: '065', participating: true  },

  // ── Indian subcontinent ────────────────────────────────────────────────────
  { code: '6E', name: 'IndiGo',                 alliance: 'None',          ticketPrefix: '312', participating: false },
  { code: 'IX', name: 'Air India Express',      alliance: 'None',          ticketPrefix: '526', participating: false },
  { code: 'SG', name: 'SpiceJet',               alliance: 'None',          ticketPrefix: '636', participating: false },

  // ── European low-cost ──────────────────────────────────────────────────────
  { code: 'FR', name: 'Ryanair',                alliance: 'None',          ticketPrefix: '520', participating: false },
  { code: 'U2', name: 'easyJet',                alliance: 'None',          ticketPrefix: '000', participating: false },
  { code: 'W6', name: 'Wizz Air',               alliance: 'None',          ticketPrefix: '239', participating: false },

  // ── Americas regional ──────────────────────────────────────────────────────
  { code: 'WS', name: 'WestJet',                alliance: 'None',          ticketPrefix: '838', participating: false },
  { code: 'G3', name: 'Gol',                    alliance: 'SkyTeam',       ticketPrefix: '127', participating: false },
  { code: 'AD', name: 'Azul Brazilian Airlines', alliance: 'None',         ticketPrefix: '577', participating: false },
];

export function getAirline(code: string) {
  return airlines.find((airline) => airline.code === code.toUpperCase());
}
