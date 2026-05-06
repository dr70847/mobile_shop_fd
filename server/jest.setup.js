// Test setup file for Jest
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set timeout for async operations
jest.setTimeout(10000);

// Avoid ESM parsing issues from otplib transitive dependencies in Jest CJS runs.
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'TEST_2FA_SECRET'),
  generateURI: jest.fn(() => 'otpauth://totp/MobileShop:test@example.com?secret=TEST_2FA_SECRET'),
  verifySync: jest.fn(() => true),
}));
