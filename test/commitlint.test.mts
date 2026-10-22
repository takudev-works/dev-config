import { spawnSync } from 'node:child_process';
import { URL, fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

const commitlint = (message: string) =>
  spawnSync('node_modules/.bin/commitlint', ['--config', 'src/commitlint/commitlintrc.json'], {
    cwd: root,
    input: message,
    encoding: 'utf8'
  }).status;

// 既定の 5 秒にしないのは、commitlint を子プロセスで起動し、CI で検査を並べて回すと 5 秒を超えることがあるため
describe('commitlint の正本', { timeout: 30_000 }, () => {
  test.each(['feat: README を直す', 'chore: TypeScript を上げる', 'fix(ci): 検査を直す'])(
    '固有名詞で始まる日本語の subject も通す: %s',
    (message) => {
      expect(commitlint(message)).toBe(0);
    }
  );

  test.each(['README を直す', 'feature: 検査を足す', 'feat:検査を足す'])(
    'Conventional Commits の形でないものは落とす: %s',
    (message) => {
      expect(commitlint(message)).not.toBe(0);
    }
  );

  test('merge commit は検査しない', () => {
    expect(commitlint("Merge branch 'main' into feat/x")).toBe(0);
  });
});
