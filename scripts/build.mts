import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import markdownlint from '../src/markdownlint/markdownlint-cli2.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]
  );

const flattenInto = (outDir: string, files: string[], base: string) => {
  for (const file of files) {
    const name = file.split('/').at(-1) ?? '';
    const target = join(outDir, name);
    if (existsSync(target)) {
      throw new Error(`dist で ${name} が重なる: ${relative(base, file)}`);
    }
    cpSync(file, target);
  }
};

export const build = (outDir: string) => {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const compiled = mkdtempSync(join(tmpdir(), 'dev-config-tsc-'));
  const tsc = spawnSync(
    join(root, 'node_modules', '.bin', 'tsc'),
    ['-p', join(root, 'tsconfig.build.json'), '--outDir', compiled],
    { stdio: 'inherit' }
  );
  if (tsc.status !== 0) throw new Error('tsc が失敗した');
  flattenInto(outDir, filesUnder(compiled), compiled);
  flattenInto(
    outDir,
    filesUnder(src).filter((file) => !file.endsWith('.mts')),
    src
  );
  rmSync(compiled, { recursive: true, force: true });
  // JSONC もやめないのは、v6.1 までの書き方（--config や .vscode/settings.json でこのファイルを渡す）の repo があるため
  writeFileSync(
    join(outDir, 'markdownlint-cli2.jsonc'),
    `${JSON.stringify(markdownlint, null, 2)}\n`
  );
  chmodSync(join(outDir, 'cli.mjs'), 0o755);
};

if (import.meta.main) {
  build(resolve(root, process.argv[2] ?? 'dist'));
}
