"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
// Mocking the default export of prisma client if possible, but simpler to mock the instance import.
// Since we don't have a singleton export file yet, we might need to create one or mock the module.
// Let's create `src/prisma.ts` first if it doesn't exist, to centralize the client.
// Looking at previous edits, we initialized Prisma in `index.ts` and `seed.ts`. 
// We should refactor to have a `src/prisma.ts` that exports the client.
// WE NEED TO REFACTOR FIRST BEFORE THIS FILE WORKS PROPERLY IF WE WANT TO MOCK THE IMPORT.
// Or we can mock the @prisma/client module itself.
const prismaClient_1 = __importDefault(require("../prismaClient")); // We will create this file
jest.mock('../prismaClient', () => ({
    __esModule: true,
    default: (0, jest_mock_extended_1.mockDeep)(),
}));
beforeEach(() => {
    (0, jest_mock_extended_1.mockReset)(exports.prismaMock);
});
exports.prismaMock = prismaClient_1.default;
//# sourceMappingURL=singleton.js.map