import { defineConfig, type ViteUserConfig } from 'vitest/config';

type CoverageOptions = NonNullable<NonNullable<ViteUserConfig['test']>['coverage']>;

const ignoredDirs = [
  'node_modules',
  '.venv',
  'venv',
  'vendor',
  'dist',
  'build',
  'out',
  '.output',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
  '.expo',
  '.next',
  '.turbo',
  '.ruby-lsp',
  '.terraform',
  '.vercel',
  '.git'
];

// src/ のような置き場所に絞らないのは、repo ごとに置き場所が違い、絞った外にテストの無いコードを足しても数字に出ないため
export const coverage = {
  provider: 'v8',
  include: ['**/*.{ts,tsx,mts,cts}'],
  exclude: [
    '**/*.{test,spec}.{ts,tsx,mts,cts}',
    '**/*.d.{ts,mts,cts}',
    '**/*.config.{ts,mts,cts}',
    '**/{test,tests,__tests__}/**',
    ...ignoredDirs.map((dir) => `**/${dir}/**`)
  ],
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
