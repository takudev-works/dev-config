import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import eslintConfig from '../src/eslint/eslint.mjs';

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: eslintConfig });

const undefinedNames = async (code: string, filePath: string) => {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === 'no-undef')
    .map((message) => message.message);
};

describe('ESLint の正本', () => {
  test.each(['a.js', 'a.mjs', 'a.cjs'])('%s で Node のグローバルを使える', async (file) => {
    const code = 'console.log(process.argv, new URL("a:b"), Buffer.from("x"), setTimeout);\n';
    expect(await undefinedNames(code, file)).toEqual([]);
  });

  test('JS でブラウザのグローバルは使えない', async () => {
    expect(await undefinedNames('console.log(window);\n', 'a.mjs')).toEqual([
      "'window' is not defined."
    ]);
  });
});
