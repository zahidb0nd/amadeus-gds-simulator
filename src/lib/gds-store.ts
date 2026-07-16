import { randomBytes } from 'crypto';
import { getMongoClient } from './mongodb';
import { airports, type Airport } from './data/airports';
import { flights } from './data/flights';

export type AvailabilityContextLine = {
  lineNumber: number;
  airline: string;
  flightNumber: string;
  classes: Record<string, number>;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  aircraft: string;
  date: string;
};

export type PnrName = {
  surname: string;
  firstname: string;
  title?: string;
};

export type PnrSegment = {
  segmentRef: number;
  airline: string;
  flightNumber: string;
  bookingClass: string;
  quantity: number;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  status: 'KK' | 'XX';
};

export type FareTax = {
  code: string;
  amount: number;
};

export type TstQuote = {
  route: string;
  bookingClass: string;
  fareBasis: string;
  baseFare: number;
  taxes: FareTax[];
  total: number;
  currency: string;
  refundable: boolean;
  penalty: number;
};

export type FareDocument = {
  origin: string;
  destination: string;
  bookingClass: string;
  fareBasis: string;
  baseFare: number;
  currency: string;
  taxes: FareTax[];
  refundable: boolean;
  penalty: number;
};

export type TicketDocument = {
  number: string;
  status: 'ISSUED' | 'VOIDED';
  issuedAt: Date;
  voidedAt?: Date;
};

export type PnrDraft = {
  names: PnrName[];
  segments: PnrSegment[];
  contact?: string;
  ticketingArrangement?: string;
  tst?: TstQuote;
};

export type FlightDocument = {
  flightNumber: string;
  carrierCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  classes: { class: string; seats: number }[];
};

export type SessionState = {
  sessionId: string;
  availabilityContext: AvailabilityContextLine[];
  pnrInProgress: PnrDraft;
  lastCompletedRecordLocator?: string;
  lastCommand: string;
  updatedAt: Date;
};

export type PnrDocument = {
  recordLocator: string;
  sessionId: string;
  names: PnrName[];
  itinerary: PnrSegment[];
  contact?: string;
  ticketingArrangement?: string;
  tst?: TstQuote;
  ticket?: TicketDocument;
  refund?: {
    amount: number;
    currency: string;
    processedAt: Date;
  };
  status: 'ACTIVE' | 'TICKETED' | 'CANCELLED' | 'REFUNDED';
  createdAt: Date;
};

const memorySessions = new Map<string, SessionState>();
const memoryPnrs = new Map<string, PnrDocument>();

let currentTimeProvider = () => new Date();

const fareSeeds: FareDocument[] = [
  { origin: 'BLR', destination: 'DOH', bookingClass: 'J', fareBasis: 'JOW', baseFare: 540, currency: 'USD', taxes: [{ code: 'YQ', amount: 58 }, { code: 'IN', amount: 18 }], refundable: true, penalty: 0 },
  { origin: 'BLR', destination: 'DOH', bookingClass: 'C', fareBasis: 'COW', baseFare: 420, currency: 'USD', taxes: [{ code: 'YQ', amount: 52 }, { code: 'IN', amount: 18 }], refundable: true, penalty: 0 },
  { origin: 'BLR', destination: 'DOH', bookingClass: 'D', fareBasis: 'DOW', baseFare: 360, currency: 'USD', taxes: [{ code: 'YQ', amount: 48 }, { code: 'IN', amount: 16 }], refundable: true, penalty: 0 },
  { origin: 'BLR', destination: 'DOH', bookingClass: 'Y', fareBasis: 'YOW', baseFare: 210, currency: 'USD', taxes: [{ code: 'YQ', amount: 45 }, { code: 'IN', amount: 12 }], refundable: true, penalty: 0 },
  { origin: 'BLR', destination: 'DOH', bookingClass: 'B', fareBasis: 'BOW', baseFare: 190, currency: 'USD', taxes: [{ code: 'YQ', amount: 42 }, { code: 'IN', amount: 12 }], refundable: false, penalty: 75 },
  { origin: 'BLR', destination: 'DOH', bookingClass: 'M', fareBasis: 'MOW', baseFare: 160, currency: 'USD', taxes: [{ code: 'YQ', amount: 38 }, { code: 'IN', amount: 10 }], refundable: false, penalty: 90 }
];

function createEmptyDraft(): PnrDraft {
  return { names: [], segments: [] };
}

function createEmptySession(sessionId: string): SessionState {
  return {
    sessionId,
    availabilityContext: [],
    pnrInProgress: createEmptyDraft(),
    lastCompletedRecordLocator: undefined,
    lastCommand: '',
    updatedAt: new Date()
  };
}

function useMongoBackend() {
  return Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('example.mongodb.net'));
}

async function getCollections() {
  const client = await getMongoClient();
  const db = client.db();

  return {
    sessions: db.collection<SessionState>('sessions'),
    pnrs: db.collection<PnrDocument>('pnrs'),
    fares: db.collection<FareDocument>('fares'),
    airports: db.collection<Airport>('airports'),
    flights: db.collection<FlightDocument>('flights')
  };
}

function cloneSession(session: SessionState): SessionState {
  return {
    ...session,
    availabilityContext: session.availabilityContext.map((line) => ({ ...line, classes: { ...line.classes } })),
    pnrInProgress: {
      names: session.pnrInProgress.names.map((name) => ({ ...name })),
      segments: session.pnrInProgress.segments.map((segment) => ({ ...segment })),
      contact: session.pnrInProgress.contact,
      ticketingArrangement: session.pnrInProgress.ticketingArrangement,
      tst: session.pnrInProgress.tst
    },
    lastCompletedRecordLocator: session.lastCompletedRecordLocator,
    updatedAt: new Date(session.updatedAt)
  };
}

export function calculateTstTotal(baseFare: number, taxes: FareTax[]) {
  return baseFare + taxes.reduce((sum, tax) => sum + tax.amount, 0);
}

function cloneFareSeed(fare: FareDocument): FareDocument {
  return {
    ...fare,
    taxes: fare.taxes.map((tax) => ({ ...tax }))
  };
}

function clonePnrDocument(document: PnrDocument & { _id?: unknown }): PnrDocument {
  const cleanedDocument = cloneMongoDocument(document);

  return {
    ...cleanedDocument,
    names: cleanedDocument.names.map((name) => ({ ...name })),
    itinerary: cleanedDocument.itinerary.map((segment) => ({ ...segment })),
    tst: cleanedDocument.tst ? { ...cleanedDocument.tst, taxes: cleanedDocument.tst.taxes.map((tax) => ({ ...tax })) } : undefined,
    ticket: cleanedDocument.ticket ? { ...cleanedDocument.ticket } : undefined,
    refund: cleanedDocument.refund ? { ...cleanedDocument.refund } : undefined
  };
}

export function getFareSeeds() {
  return fareSeeds.map(cloneFareSeed);
}

export async function ensureFareSeeds(): Promise<void> {
  if (!useMongoBackend()) {
    return;
  }

  const { fares } = await getCollections();
  const count = await fares.countDocuments({ origin: 'BLR', destination: 'DOH' });

  if (count === 0) {
    await fares.insertMany(getFareSeeds());
  }
}

export async function ensureAirportSeeds(): Promise<void> {
  if (!useMongoBackend()) {
    return;
  }

  const { airports: airportsCollection } = await getCollections();
  const count = await airportsCollection.countDocuments({});

  if (count === 0) {
    // Insert in batches if needed, but native driver handles large arrays reasonably well
    await airportsCollection.insertMany(airports as any[]);
  }
}

export async function findAirportByCode(code: string): Promise<Airport | null> {
  const normalizedCode = code.toUpperCase();

  if (!useMongoBackend()) {
    return airports.find(a => a.code === normalizedCode) ?? null;
  }

  await ensureAirportSeeds();
  const { airports: airportsCollection } = await getCollections();
  return airportsCollection.findOne({ code: normalizedCode });
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAirportByName(name: string): Promise<Airport | null> {
  const normalizedName = name.toUpperCase();
  const searchRegex = new RegExp(escapeRegExp(name), 'i');

  if (!useMongoBackend()) {
    const exactMatch = airports.find(a => a.code === normalizedName);
    if (exactMatch) return exactMatch;

    return airports.find(a => 
      a.city.toUpperCase().includes(normalizedName) || 
      a.name.toUpperCase().includes(normalizedName)
    ) ?? null;
  }

  await ensureAirportSeeds();
  const { airports: airportsCollection } = await getCollections();
  
  const exactMatch = await airportsCollection.findOne({ code: normalizedName });
  if (exactMatch) return exactMatch;

  return airportsCollection.findOne({
    $or: [
      { city: { $regex: searchRegex } },
      { name: { $regex: searchRegex } }
    ]
  });
}

export async function findAirportsByName(name: string): Promise<Airport[]> {
  const normalizedName = name.toUpperCase();
  const searchRegex = new RegExp(escapeRegExp(name), 'i');

  if (!useMongoBackend()) {
    const exactMatches = airports.filter(a => a.code === normalizedName);
    if (exactMatches.length > 0) return exactMatches;

    return airports.filter(a =>
      a.city.toUpperCase().includes(normalizedName) ||
      a.name.toUpperCase().includes(normalizedName)
    );
  }

  await ensureAirportSeeds();
  const { airports: airportsCollection } = await getCollections();

  const exactMatches = await airportsCollection.find({ code: normalizedName }).toArray();
  if (exactMatches.length > 0) return exactMatches;

  return airportsCollection.find({
    $or: [
      { city: { $regex: searchRegex } },
      { name: { $regex: searchRegex } }
    ]
  }).toArray();
}

export async function ensureFlightSeeds(): Promise<void> {
  if (!useMongoBackend()) {
    return;
  }

  const { flights: flightsCollection } = await getCollections();
  const count = await flightsCollection.countDocuments({});

  if (count === 0) {
    const mapped = flights.map((f) => ({
      flightNumber: f.flightNumber,
      carrierCode: f.airline,
      origin: f.origin,
      destination: f.destination,
      departureTime: f.departure,
      arrivalTime: f.arrival,
      classes: Object.entries(f.classes).map(([c, s]) => ({ class: c, seats: s }))
    }));
    await flightsCollection.insertMany(mapped);
  }
}

export async function findFlights(origin: string, destination: string, date: Date): Promise<FlightDocument[]> {
  const normalizedOrigin = origin.toUpperCase();
  const normalizedDestination = destination.toUpperCase();

  if (!useMongoBackend()) {
    // Map existing local RAM flights array to new FlightDocument interface
    return flights
      .filter((f) => f.origin === normalizedOrigin && f.destination === normalizedDestination)
      .map((f) => ({
        flightNumber: f.flightNumber,
        carrierCode: f.airline,
        origin: f.origin,
        destination: f.destination,
        departureTime: f.departure,
        arrivalTime: f.arrival,
        classes: Object.entries(f.classes).map(([c, s]) => ({ class: c, seats: s }))
      }));
  }

  await ensureFlightSeeds();
  const { flights: flightsCollection } = await getCollections();
  // Using a real DB, you'd likely query by date range as well. 
  // For the simulator, we'll just match origin and destination.
  return flightsCollection.find({ origin: normalizedOrigin, destination: normalizedDestination }).toArray();
}

export async function findFare(origin: string, destination: string, bookingClass: string): Promise<FareDocument | null> {
  const normalizedOrigin = origin.toUpperCase();
  const normalizedDestination = destination.toUpperCase();
  const normalizedClass = bookingClass.toUpperCase();

  let fare = null;
  if (!useMongoBackend()) {
    fare = getFareSeeds().find(
      (f) => f.origin === normalizedOrigin && f.destination === normalizedDestination && f.bookingClass === normalizedClass
    ) ?? null;
  } else {
    await ensureFareSeeds();
    const { fares } = await getCollections();
    fare = await fares.findOne({ origin: normalizedOrigin, destination: normalizedDestination, bookingClass: normalizedClass });
  }

  if (!fare) {
    const VALID_CLASSES = ['F', 'J', 'C', 'D', 'W', 'Y', 'B', 'M'];
    if (!VALID_CLASSES.includes(normalizedClass)) {
      return null;
    }
    fare = {
      origin: normalizedOrigin,
      destination: normalizedDestination,
      bookingClass: normalizedClass,
      fareBasis: `${normalizedClass}OW`,
      baseFare: 350,
      currency: 'USD',
      taxes: [{ code: 'YQ', amount: 50 }, { code: 'XT', amount: 25 }],
      refundable: normalizedClass === 'Y' || normalizedClass === 'J' || normalizedClass === 'C',
      penalty: normalizedClass === 'Y' || normalizedClass === 'J' || normalizedClass === 'C' ? 0 : 100
    };
  }

  return fare;
}

export function generateRecordLocator() {
  return randomBytes(3).toString('hex').toUpperCase();
}

export function generateTicketNumber() {
  return Array.from(randomBytes(13), (byte) => String(byte % 10)).join('');
}

export function getCurrentTime() {
  return currentTimeProvider();
}

export function setCurrentTimeProvider(provider: (() => Date) | undefined) {
  currentTimeProvider = provider ?? (() => new Date());
}

function cloneMongoDocument<T extends { _id?: unknown }>(document: T): T {
  const { _id: ignoredId, ...rest } = document;
  return rest as T;
}

export async function getSessionState(sessionId: string): Promise<SessionState> {
  if (!useMongoBackend()) {
    return cloneSession(memorySessions.get(sessionId) ?? createEmptySession(sessionId));
  }

  const { sessions } = await getCollections();
  const existing = await sessions.findOne({ sessionId });

  if (!existing) {
    return createEmptySession(sessionId);
  }

  return {
    ...existing,
    availabilityContext: existing.availabilityContext ?? [],
    pnrInProgress: existing.pnrInProgress ?? createEmptyDraft(),
    lastCompletedRecordLocator: existing.lastCompletedRecordLocator,
    lastCommand: existing.lastCommand ?? '',
    updatedAt: existing.updatedAt ? new Date(existing.updatedAt) : new Date()
  };
}

export async function saveSessionState(session: SessionState): Promise<void> {
  const normalizedSession = {
    ...session,
    updatedAt: new Date()
  };

  if (!useMongoBackend()) {
    memorySessions.set(session.sessionId, cloneSession(normalizedSession));
    return;
  }

  const { sessions } = await getCollections();
  await sessions.updateOne({ sessionId: session.sessionId }, { $set: normalizedSession }, { upsert: true });
}

export async function resetSessionState(sessionId: string): Promise<void> {
  if (!useMongoBackend()) {
    memorySessions.set(sessionId, createEmptySession(sessionId));
    return;
  }

  const { sessions } = await getCollections();
  await sessions.deleteOne({ sessionId });
}

export async function clearWorkarea(sessionId: string, lastCompletedRecordLocator?: string): Promise<void> {
  const session = createEmptySession(sessionId);
  session.lastCompletedRecordLocator = lastCompletedRecordLocator;
  await saveSessionState(session);
}

export async function setLastCompletedRecordLocator(sessionId: string, recordLocator: string): Promise<void> {
  const session = await getSessionState(sessionId);
  session.lastCompletedRecordLocator = recordLocator;
  await saveSessionState(session);
}

export async function getLastCompletedRecordLocator(sessionId: string): Promise<string | undefined> {
  const session = await getSessionState(sessionId);
  return session.lastCompletedRecordLocator;
}

export async function setAvailabilityContext(
  sessionId: string,
  availabilityContext: AvailabilityContextLine[],
  lastCommand: string
): Promise<void> {
  const session = await getSessionState(sessionId);
  session.availabilityContext = availabilityContext.map((line) => ({ ...line, classes: { ...line.classes } }));
  session.lastCommand = lastCommand;
  await saveSessionState(session);
}

export async function updatePnrDraft(
  sessionId: string,
  updater: (draft: PnrDraft) => PnrDraft
): Promise<SessionState> {
  const session = await getSessionState(sessionId);
  const nextDraft = updater({
    names: session.pnrInProgress.names.map((name) => ({ ...name })),
    segments: session.pnrInProgress.segments.map((segment) => ({ ...segment })),
    contact: session.pnrInProgress.contact,
    ticketingArrangement: session.pnrInProgress.ticketingArrangement,
    tst: session.pnrInProgress.tst
  });

  session.pnrInProgress = nextDraft;
  await saveSessionState(session);

  return session;
}

export async function issueTicket(recordLocator: string, ticketNumber: string): Promise<PnrDocument | null> {
  const pnr = await getPnr(recordLocator);

  if (!pnr) {
    return null;
  }

  const updated: PnrDocument = {
    ...clonePnrDocument(pnr as PnrDocument & { _id?: unknown }),
    ticket: {
      number: ticketNumber,
      status: 'ISSUED',
      issuedAt: getCurrentTime()
    },
    status: 'TICKETED'
  };

  if (!useMongoBackend()) {
    memoryPnrs.set(recordLocator, clonePnrDocument(updated));
    return updated;
  }

  const { pnrs } = await getCollections();
  await pnrs.updateOne({ recordLocator }, { $set: updated });
  return updated;
}

export async function voidTicket(recordLocator: string): Promise<PnrDocument | null> {
  const pnr = await getPnr(recordLocator);

  if (!pnr || !pnr.ticket) {
    return null;
  }

  const updated: PnrDocument = {
    ...clonePnrDocument(pnr as PnrDocument & { _id?: unknown }),
    ticket: {
      ...pnr.ticket,
      status: 'VOIDED',
      voidedAt: getCurrentTime()
    },
    status: 'ACTIVE'
  };

  if (!useMongoBackend()) {
    memoryPnrs.set(recordLocator, clonePnrDocument(updated));
    return updated;
  }

  const { pnrs } = await getCollections();
  await pnrs.updateOne({ recordLocator }, { $set: updated });
  return updated;
}

export async function saveCompletedPnr(document: PnrDocument): Promise<void> {
  if (!useMongoBackend()) {
    memoryPnrs.set(document.recordLocator, clonePnrDocument(document));
    return;
  }

  const { pnrs } = await getCollections();
  await pnrs.insertOne(document);
}

export async function getPnr(recordLocator: string): Promise<PnrDocument | null> {
  if (!useMongoBackend()) {
    return memoryPnrs.get(recordLocator) ?? null;
  }

  const { pnrs } = await getCollections();
  return pnrs.findOne({ recordLocator });
}

export async function deletePnr(recordLocator: string): Promise<void> {
  if (!useMongoBackend()) {
    memoryPnrs.delete(recordLocator);
    return;
  }

  const { pnrs } = await getCollections();
  await pnrs.deleteOne({ recordLocator });
}

export async function cancelSegment(recordLocator: string, segmentNumber: number): Promise<PnrDocument | null> {
  const pnr = await getPnr(recordLocator);

  if (!pnr) {
    return null;
  }

  const nextItinerary = pnr.itinerary.map((segment) =>
    segment.segmentRef === segmentNumber ? { ...segment, status: 'XX' as const } : { ...segment }
  );

  const wasCancelled = nextItinerary.some((segment) => segment.segmentRef === segmentNumber && segment.status === 'XX');

  if (!wasCancelled) {
    return null;
  }

  const updated: PnrDocument = {
    ...clonePnrDocument(pnr as PnrDocument & { _id?: unknown }),
    itinerary: nextItinerary,
    status: 'CANCELLED'
  };

  if (!useMongoBackend()) {
    memoryPnrs.set(recordLocator, clonePnrDocument(updated));
    return updated;
  }

  const { pnrs } = await getCollections();
  await pnrs.updateOne({ recordLocator }, { $set: updated });
  return updated;
}

export async function applyRefund(recordLocator: string, amount: number, currency: string): Promise<PnrDocument | null> {
  const pnr = await getPnr(recordLocator);

  if (!pnr) {
    return null;
  }

  const updated: PnrDocument = {
    ...clonePnrDocument(pnr as PnrDocument & { _id?: unknown }),
    ticket: pnr.ticket
      ? {
          ...pnr.ticket,
          status: 'VOIDED',
          voidedAt: pnr.ticket.voidedAt ?? getCurrentTime()
        }
      : undefined,
    refund: {
      amount,
      currency,
      processedAt: getCurrentTime()
    },
    status: 'REFUNDED'
  };

  if (!useMongoBackend()) {
    memoryPnrs.set(recordLocator, clonePnrDocument(updated));
    return updated;
  }

  const { pnrs } = await getCollections();
  await pnrs.updateOne({ recordLocator }, { $set: updated });
  return updated;
}