import console from 'node:console';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const snapshot = (dir: string) =>
  new Map(
    readdirSync(dir).map((name) => {
      const path = join(dir, name);
      return [name, `${statSync(path).mode & 0o111 ? 'x' : '-'}${readFileSync(path, 'utf8')}`];
    })
  );

export const staleFiles = (expectedDir: string, actualDir: string) => {
  const expected = snapshot(expectedDir);
  const actual = snapshot(actualDir);
  return [...new Set([...expected.keys(), ...actual.keys()])].filter(
    (name) => expected.get(name) !== actual.get(name)
  );
};

// 測らないのは、validate:build と lefthook が子プロセスとして動かし、子プロセスは測れないため
/* v8 ignore start */
if (import.meta.main) {
  const fresh = join(mkdtempSync(join(tmpdir(), 'dev-config-build-')), 'dist');
  build(fresh);
  const stale = staleFiles(fresh, fileURLToPath(new URL('../dist', import.meta.url)));
  if (stale.length > 0) {
    console.error(`dist が src と合っていない: ${stale.join(', ')}`);
    console.error('bun run build を実行して、dist をコミットする');
    process.exitCode = 1;
  }
}
/* v8 ignore stop */
