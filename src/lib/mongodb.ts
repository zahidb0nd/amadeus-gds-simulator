import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

let client = uri ? new MongoClient(uri) : null;

export function getMongoClient() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  const isClosed = client && (client as any).topology?.s?.state === 'closed';
  if (isClosed || client === null) {
    client = new MongoClient(uri);
    global.__mongoClientPromise = undefined;
  }

  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = client.connect();
  }

  return global.__mongoClientPromise;
}