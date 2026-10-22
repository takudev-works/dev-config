import { expect, test } from 'vitest';
import config, { coverage } from '../src/vitest/vitest.config.mjs';

test.each(['src/a.ts', 'src/a.tsx', 'src/a.mts', 'src/a.cts'])(
  '正本の coverage は %s の拡張子を数える',
  (path) => {
    const extensions = coverage.include[0]?.match(/\{(.+)\}/)?.[1]?.split(',') ?? [];
    expect(extensions).toContain(path.split('.').at(-1));
  }
);

test('正本の coverage は、テストと型の定義を数えない', () => {
  expect(coverage.exclude).toEqual(['src/**/*.test.{ts,tsx,mts,cts}', 'src/**/*.d.{ts,mts,cts}']);
});

test('正本の coverage は、4 つの指標すべてで 95% を求める', () => {
  expect(coverage.thresholds).toEqual({
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95
  });
});

test('正本の既定の設定は、この coverage を使う', () => {
  expect(config.test?.coverage).toBe(coverage);
});
