import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

const notCopied = (name: string) => name.endsWith('.mts');

export const build = (outDir: string) => {
  rmSync(outDir, { recursive: true, force: true });
  const tsc = spawnSync(
    join(root, 'node_modules', '.bin', 'tsc'),
    ['-p', join(root, 'tsconfig.build.json'), '--outDir', outDir],
    { stdio: 'inherit' }
  );
  if (tsc.status !== 0) throw new Error('tsc が失敗した');
  for (const name of readdirSync(src)) {
    if (!notCopied(name)) cpSync(join(src, name), join(outDir, name));
  }
  chmodSync(join(outDir, 'cli.mjs'), 0o755);
};

if (import.meta.main) {
  build(join(root, process.argv[2] ?? 'dist'));
}
