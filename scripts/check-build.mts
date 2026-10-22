import console from 'node:console';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const fresh = join(mkdtempSync(join(tmpdir(), 'dev-config-build-')), 'dist');
build(fresh);

const snapshot = (dir: string) =>
  new Map(
    readdirSync(dir).map((name) => {
      const path = join(dir, name);
      return [name, `${statSync(path).mode & 0o111 ? 'x' : '-'}${readFileSync(path, 'utf8')}`];
    })
  );

const expected = snapshot(fresh);
const actual = snapshot(dist);
const stale = [...new Set([...expected.keys(), ...actual.keys()])].filter(
  (name) => expected.get(name) !== actual.get(name)
);

if (stale.length > 0) {
  console.error(`dist が src と合っていない: ${stale.join(', ')}`);
  console.error('bun run build を実行して、dist をコミットする');
  process.exitCode = 1;
}
