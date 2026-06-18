// Jest runs native ESM (the project is "type": "module"), so no transform is
// needed. Tests run serially against the local Postgres + Redis.
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
};
