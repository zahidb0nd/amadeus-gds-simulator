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
    const db = client.db();

    // Test collection
    const collection = db.collection<PnrDocument>('pnrs');

    // Flush test collection
    await collection.deleteMany({});

    // Seed test collection
    const seedData: PnrDocument[] = [
      {
        pnrLocator: 'Y7B9XZ',
        passengers: [
          { firstName: 'JOHN', lastName: 'DOE', title: 'MR' }
        ],
        segments: [
          {
            airline: 'AA',
            flightNumber: '100',
            departureAirport: 'LAX',
            arrivalAirport: 'JFK',
            departureDate: '15OCT',
            status: 'HK'
          }
        ]
      },
      {
        pnrLocator: 'X3A1QC',
        passengers: [
          { firstName: 'JANE', lastName: 'SMITH', title: 'MS' },
          { firstName: 'TIMMY', lastName: 'SMITH', title: 'CHD' }
        ],
        segments: [
          {
            airline: 'DL',
            flightNumber: '205',
            departureAirport: 'SFO',
            arrivalAirport: 'LHR',
            departureDate: '15OCT',
            status: 'HK'
          },
          {
            airline: 'DL',
            flightNumber: '99',
            departureAirport: 'LHR',
            arrivalAirport: 'CDG',
            departureDate: '16OCT',
            status: 'HK'
          }
        ]
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
