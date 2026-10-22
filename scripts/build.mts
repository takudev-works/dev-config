import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import markdownlint from '../src/markdownlint-cli2.mjs';

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
  // JSONC もやめないのは、v6.1 までの書き方（--config や .vscode/settings.json でこのファイルを渡す）の repo があるため
  writeFileSync(
    join(outDir, 'markdownlint-cli2.jsonc'),
    `${JSON.stringify(markdownlint, null, 2)}\n`
  );
  chmodSync(join(outDir, 'cli.mjs'), 0o755);
};

if (import.meta.main) {
  build(join(root, process.argv[2] ?? 'dist'));
}
