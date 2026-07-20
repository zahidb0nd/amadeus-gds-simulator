const fs = require('fs');
const { MongoClient } = require('mongodb');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/MONGODB_URI=(.*)/);
const uri = match[1].trim().replace(/^['"]|['"]$/g, '');
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  await db.collection('airports').deleteMany({});
  await db.collection('airlines').deleteMany({});
  await db.collection('flights').deleteMany({});
  console.log('Collections cleared');
  await client.close();
  process.exit(0);
}
run().catch(console.error);
