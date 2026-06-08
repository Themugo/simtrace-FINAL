// tests/setup.ts - Jest setup file
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB server for tests
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI_TEST = uri;
});

afterAll(async () => {
  // Stop in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
});
