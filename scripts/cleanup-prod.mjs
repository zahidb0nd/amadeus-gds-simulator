import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^MONGODB_URI="?([^"]+)"?/);
    if (match) process.env.MONGODB_URI = match[1];
  }
}

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    // We want to delete PNRs where names match our test data: PATEL/ARJUN or TEST/PROD
    const result = await db.collection('pnrs').deleteMany({
      $or: [
        { 'names.surname': 'PATEL', 'names.firstname': 'ARJUN' },
        { 'names.surname': 'TEST', 'names.firstname': 'PROD' }
      ]
    });

    console.log(`Successfully deleted ${result.deletedCount} test PNR(s) from production.`);
  } finally {
    await client.close();
  }
}

cleanup().catch(console.error);
