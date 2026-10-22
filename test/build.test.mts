import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { build, flattenInto } from '../scripts/build.mjs';
import { staleFiles } from '../scripts/check-build.mjs';

const dist = fileURLToPath(new URL('../dist', import.meta.url));

const emptyDir = () => mkdtempSync(join(tmpdir(), 'dev-config-build-test-'));

// 既定の 5 秒にしないのは、tsc を子プロセスで動かし、CI で検査を並べて回すと 5 秒を超えることがあるため
describe('build', { timeout: 60_000 }, () => {
  const out = join(emptyDir(), 'dist');
  build(out);

  test('コミットしてある dist と同じものを作る', () => {
    expect(staleFiles(out, dist)).toEqual([]);
  });

  test('src の tool ごとのディレクトリを、dist の直下に平らに並べる', () => {
    expect(readdirSync(out).every((name) => statSync(join(out, name)).isFile())).toBe(true);
    expect(existsSync(join(out, 'textlintrc.json'))).toBe(true);
  });

  test('cli.mjs に実行の権限を付ける', () => {
    expect(statSync(join(out, 'cli.mjs')).mode & 0o111).not.toBe(0);
  });

  test('tsc が失敗したら、止める', () => {
    expect(() => build(join(emptyDir(), 'dist'), () => 1)).toThrow('tsc が失敗した');
  });
});

describe('flattenInto', () => {
  test('別のディレクトリにある同じ名前のファイルがあれば、止める', () => {
    const base = emptyDir();
    const files = ['a', 'b'].map((dir) => {
      const path = join(base, dir, 'same.json');
      mkdirSync(join(base, dir));
      writeFileSync(path, '{}');
      return path;
    });
    expect(() => flattenInto(emptyDir(), files, base)).toThrow(
      'dist で same.json が重なる: b/same.json'
    );
  });
});

describe('staleFiles', () => {
  const pair = (expected: Record<string, string>, actual: Record<string, string>) => {
    const [a, b] = [emptyDir(), emptyDir()];
    Object.entries(expected).forEach(([name, body]) => writeFileSync(join(a, name), body));
    Object.entries(actual).forEach(([name, body]) => writeFileSync(join(b, name), body));
    return [a, b] as const;
  };

  test('中身が同じなら、何も返さない', () => {
    expect(staleFiles(...pair({ 'a.mjs': 'x' }, { 'a.mjs': 'x' }))).toEqual([]);
  });

  test('中身の違うファイル、片方にしか無いファイルを返す', () => {
    const [a, b] = pair({ 'a.mjs': 'x', 'b.mjs': 'y' }, { 'a.mjs': 'z', 'c.mjs': 'w' });
    expect(staleFiles(a, b).sort()).toEqual(['a.mjs', 'b.mjs', 'c.mjs']);
  });

  test('実行の権限の有無が違うファイルを返す', () => {
    const [a, b] = pair({ 'cli.mjs': 'x' }, { 'cli.mjs': 'x' });
    chmodSync(join(a, 'cli.mjs'), 0o755);
    expect(staleFiles(a, b)).toEqual(['cli.mjs']);
  });
});
