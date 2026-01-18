import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mocking the default export of prisma client if possible, but simpler to mock the instance import.
// Since we don't have a singleton export file yet, we might need to create one or mock the module.
// Let's create `src/prisma.ts` first if it doesn't exist, to centralize the client.
// Looking at previous edits, we initialized Prisma in `index.ts` and `seed.ts`. 
// We should refactor to have a `src/prisma.ts` that exports the client.

// WE NEED TO REFACTOR FIRST BEFORE THIS FILE WORKS PROPERLY IF WE WANT TO MOCK THE IMPORT.
// Or we can mock the @prisma/client module itself.

import prisma from '../prismaClient'; // We will create this file

jest.mock('../prismaClient', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
