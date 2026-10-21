import { spawnSync } from 'node:child_process';
import { URL, fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

const commitlint = (message: string) =>
  spawnSync('node_modules/.bin/commitlint', ['--config', 'src/commitlintrc.json'], {
    cwd: root,
    input: message,
    encoding: 'utf8'
  }).status;

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
