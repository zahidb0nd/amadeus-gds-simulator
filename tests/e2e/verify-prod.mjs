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

async function verifyProd() {
  const sessionId = 'prod-verify-' + Date.now();
  const url = 'https://amadeus-gds-simulator.vercel.app/api/command';

  async function sendCmd(cmd) {
    console.log(`> ${cmd}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, sessionId })
    });
    const data = await res.json();
    console.log(data.output);
    return data;
  }

  // 1. Live Booking Flow
  await sendCmd('AN15JULBLRDOH');
  await sendCmd('SS1Y1');
  await sendCmd('NM1TEST/PROD');
  await sendCmd('AP+1234567890');
  await sendCmd('TK TL15JUL/2100');
  
  const erResult = await sendCmd('ER');
  
  // Extract Record Locator
  const match = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/);
  if (!match) {
    console.error("Failed to create PNR in live flow.");
    process.exit(1);
  }
  
  const recordLocator = match[1];
  console.log(`\nExtracted Record Locator: ${recordLocator}`);
  
  // 2. Direct MongoDB Verification
  console.log(`\nConnecting to MongoDB Atlas to verify...`);
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const pnr = await db.collection('pnrs').findOne({ recordLocator });
    
    if (pnr) {
      console.log('SUCCESS: PNR found in database directly!');
      console.log(JSON.stringify(pnr, null, 2));
    } else {
      console.log('ERROR: PNR not found in database.');
      process.exit(1);
    }
  } finally {
    await client.close();
  }
}

verifyProd().catch(console.error);
