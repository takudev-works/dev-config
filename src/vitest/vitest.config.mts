import { defineConfig, type ViteUserConfig } from 'vitest/config';

type CoverageOptions = NonNullable<NonNullable<ViteUserConfig['test']>['coverage']>;

export const coverage = {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx,mts,cts}'],
  exclude: ['src/**/*.test.{ts,tsx,mts,cts}', 'src/**/*.d.{ts,mts,cts}'],
  reporter: ['text', 'lcov'],
  thresholds: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  }
} satisfies CoverageOptions & { include: string[]; exclude: string[] };

export default defineConfig({
  test: { coverage }
});
