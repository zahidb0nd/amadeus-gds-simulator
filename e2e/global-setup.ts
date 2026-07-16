import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PnrDocument } from '../src/types/pnr';

let mongod: MongoMemoryServer | null = null;

async function globalSetup() {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amadeus_test';

  if (!process.env.CI) {
    try {
      mongod = await MongoMemoryServer.create({ instance: { port: 27017 } });
      uri = mongod.getUri();
      console.log('Started in-memory MongoDB at', uri);
    } catch (err) {
      console.log('Failed to start in-memory MongoDB, continuing with original URI:', uri);
    }
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('amadeus_test');

    // Test collection
    const collection = db.collection<PnrDocument>('pnrs');

    // Flush test collection
    await collection.deleteMany({});

    // Seed test collection
    const seedData: PnrDocument[] = [
      {
        recordLocator: 'Y7B9XZ',
        sessionId: 'seed-session-1',
        names: [
          { surname: 'DOE', firstname: 'JOHN', title: 'MR' }
        ],
        itinerary: [
          {
            segmentRef: 1,
            airline: 'AA',
            flightNumber: '100',
            bookingClass: 'Y',
            quantity: 1,
            origin: 'LAX',
            destination: 'JFK',
            departure: '15OCT0900',
            arrival: '15OCT1700',
            status: 'KK'
          }
        ],
        status: 'ACTIVE',
        createdAt: new Date()
      },
      {
        recordLocator: 'X3A1QC',
        sessionId: 'seed-session-2',
        names: [
          { surname: 'SMITH', firstname: 'JANE', title: 'MS' },
          { surname: 'SMITH', firstname: 'TIMMY', title: 'CHD' }
        ],
        itinerary: [
          {
            segmentRef: 1,
            airline: 'DL',
            flightNumber: '205',
            bookingClass: 'Y',
            quantity: 2,
            origin: 'SFO',
            destination: 'LHR',
            departure: '15OCT1000',
            arrival: '15OCT1800',
            status: 'KK'
          },
          {
            segmentRef: 2,
            airline: 'DL',
            flightNumber: '99',
            bookingClass: 'Y',
            quantity: 2,
            origin: 'LHR',
            destination: 'CDG',
            departure: '16OCT0900',
            arrival: '16OCT1100',
            status: 'KK'
          }
        ],
        status: 'ACTIVE',
        createdAt: new Date()
      }
    ];

    await collection.insertMany(seedData);

    console.log('Test database seeded successfully.');
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

export default globalSetup;
