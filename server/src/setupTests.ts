// src/setupTests.js
import { server } from './mocks/server';
import { prismaClient } from './prisma';
import { fetch } from 'cross-fetch';

global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(async () => {
  server.listen();
  await prismaClient.$connect();
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(async () => {
  server.resetHandlers();
  await prismaClient.$disconnect();
});

// Clean up after the tests are finished.
afterAll(async () => {
  server.close();
});
