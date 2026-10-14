import { defineConfig } from 'vitest/config';

export const coverage = {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
  reporter: ['text', 'lcov'],
  thresholds: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  }
};

export default defineConfig({
  test: { coverage }
});
