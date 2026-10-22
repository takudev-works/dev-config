import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import eslintConfig from '../src/eslint.mjs';
import markdownlintOptions from '../src/markdownlint-cli2.mjs';

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

const read = (path: string) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');

const readJsonc = async (path: string): Promise<Record<string, string[]>> => {
  const { config, error } = ts.parseConfigFileTextToJson(path, await read(path));
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  return config;
};

const readLines = async (path: string) =>
  (await read(path)).split('\n').filter((line) => line !== '' && !line.startsWith('#'));

const tools: Record<string, () => Promise<string[]>> = {
  cspell: async () => (await readJsonc('cspell.json')).ignorePaths ?? [],
  eslint: async () =>
    eslintConfig
      .filter((c) => Object.keys(c).every((k) => k === 'ignores' || k === 'name'))
      .flatMap((c) => c.ignores ?? []),
  markdownlint: async () => markdownlintOptions.ignores,
  secretlint: () => readLines('secretlintignore'),
  textlint: () => readLines('textlintignore')
};

const dirOf = (pattern: string) => pattern.replace(/^\*\*\//, '').replace(/\/\*\*$/, '');

describe.each(Object.entries(tools))('%s の除外', (_, load) => {
  test('どの repo でも検査しないディレクトリをすべて含む', async () => {
    const dirs = (await load()).map(dirOf);
    expect(dirs).toEqual(expect.arrayContaining(ignoredDirs));
  });

  test('ディレクトリの除外は、ほかのツールと同じ一覧のものだけ', async () => {
    const dirs = (await load()).filter((p) => p.endsWith('/**')).map(dirOf);
    expect(ignoredDirs).toEqual(expect.arrayContaining(dirs));
  });
});
