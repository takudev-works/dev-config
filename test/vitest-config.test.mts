import { expect, test } from 'vitest';
import config, { coverage } from '../src/vitest/vitest.config.mjs';

test('正本の coverage は、置き場所を絞らずにすべての TS を数える', () => {
  expect(coverage.include).toEqual(['**/*.{ts,tsx,mts,cts}']);
});

test.each([
  ['テスト', '**/*.{test,spec}.{ts,tsx,mts,cts}'],
  ['型の定義', '**/*.d.{ts,mts,cts}'],
  ['設定ファイル', '**/*.config.{ts,mts,cts}'],
  ['テスト用のディレクトリ', '**/{test,tests,__tests__}/**']
])('正本の coverage は、%s を数えない', (_, pattern) => {
  expect(coverage.exclude).toContain(pattern);
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
