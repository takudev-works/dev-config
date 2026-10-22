import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import { resolveBin, runTool } from '../src/run-tool.mjs';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const cli = join(src, 'cli.mjs');

const emptyDir = () => mkdtempSync(join(tmpdir(), 'dev-config-test-'));

/**
 * @param {string[]} argv
 * @param {string} [cwd]
 */
const spawned = (argv, cwd = emptyDir()) => {
  let bin = '';
  /** @type {string[]} */
  let args = [];
  /** @param {string} b @param {string[]} a */
  const spawn = (b, a) => {
    [bin, args] = [b, a];
    return { status: 0 };
  };
  // @ts-expect-error 戻り値は status だけを返す
  const code = runTool(argv, { cwd, spawn });
  return { code, bin, args };
};

/** @param {string[]} args @param {string} flag */
const valueOf = (args, flag) => args[args.indexOf(flag) + 1] ?? '';

describe('正本の設定を渡してツールを動かす', () => {
  test.each([
    ['commitlint', 'commitlint', '--config', 'commitlintrc.json'],
    ['markdownlint', 'markdownlint-cli2', '--config', 'markdownlint-cli2.jsonc'],
    ['npm-package-json-lint', 'npmPkgJsonLint', '--configFile', 'npmpackagejsonlintrc.json'],
    ['secretlint', 'secretlint', '--secretlintrc', 'secretlintrc.json'],
    ['textlint', 'textlint', '--config', 'textlintrc.json']
  ])('%s', (name, bin, flag, file) => {
    const { code, bin: actualBin, args } = spawned([name, 'a.md']);
    expect(code).toBe(0);
    expect(actualBin).toBe(resolveBin(bin));
    expect(valueOf(args, flag)).toBe(join(src, file));
    expect(args.at(-1)).toBe('a.md');
  });
});

describe.each([
  ['textlint', '--ignore-path', 'textlintignore', '.textlintignore'],
  ['secretlint', '--secretlintignore', 'secretlintignore', '.secretlintignore']
])('%s の除外', (name, flag, file, repoIgnore) => {
  test('repo に除外ファイルが無ければ、正本の除外ファイルを渡す', () => {
    const { args } = spawned([name]);
    expect(valueOf(args, flag)).toBe(join(src, file));
  });

  test('repo に除外ファイルがあれば、正本の除外に repo の行を足して渡す', () => {
    const cwd = emptyDir();
    writeFileSync(join(cwd, repoIgnore), 'docs/generated/**\n');
    const { args } = spawned([name], cwd);
    const merged = readFileSync(valueOf(args, flag), 'utf8');
    expect(merged).toContain(readFileSync(join(src, file), 'utf8'));
    expect(merged).toContain('docs/generated/**');
  });
});

test('知らないツールの名前では、使い方を出して 2 で終わる', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(spawned(['eslint']).code).toBe(2);
  expect(spawned([]).code).toBe(2);
  expect(error).toHaveBeenCalledWith(expect.stringContaining('使い方: dev-config'));
  error.mockRestore();
});

test('ツールを起動できなければ 1 で終わる', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const spawn = vi.fn(() => ({ error: new Error('spawn ENOENT'), status: null }));
  // @ts-expect-error 戻り値は error と status だけを返す
  expect(runTool(['commitlint'], { cwd: emptyDir(), spawn })).toBe(1);
  error.mockRestore();
});

describe('dev-config コマンド', () => {
  /** @param {string} message */
  const commitlint = (message) =>
    spawnSync(process.execPath, [cli, 'commitlint'], { input: message, encoding: 'utf8' }).status;

  test('ツールの終了コードを返す', () => {
    expect(commitlint('feat: 検査を足す')).toBe(0);
    expect(commitlint('検査を足す')).not.toBe(0);
  });
});
