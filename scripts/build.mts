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
import { basename, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import markdownlint from '../src/markdownlint/markdownlint-cli2.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]
  );

export const flattenInto = (outDir: string, files: string[], base: string) => {
  for (const file of files) {
    const name = basename(file);
    const target = join(outDir, name);
    if (existsSync(target)) {
      throw new Error(`dist で ${name} が重なる: ${relative(base, file)}`);
    }
    cpSync(file, target);
  }
};

const runTsc = (outDir: string) =>
  spawnSync(
    join(root, 'node_modules', '.bin', 'tsc'),
    ['-p', join(root, 'tsconfig.build.json'), '--outDir', outDir],
    { stdio: 'inherit' }
  ).status;

export const build = (outDir: string, compile: (outDir: string) => number | null = runTsc) => {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const compiled = mkdtempSync(join(tmpdir(), 'dev-config-tsc-'));
  if (compile(compiled) !== 0) throw new Error('tsc が失敗した');
  flattenInto(outDir, filesUnder(compiled), compiled);
  flattenInto(
    outDir,
    filesUnder(src).filter((file) => !file.endsWith('.mts')),
    src
  );
  rmSync(compiled, { recursive: true, force: true });
  // JSONC もやめないのは、エディタのユーザー設定から読むときに、信頼していないワークスペースでは拡張が JS を読まないため
  writeFileSync(
    join(outDir, 'markdownlint-cli2.jsonc'),
    `${JSON.stringify(markdownlint, null, 2)}\n`
  );
  chmodSync(join(outDir, 'cli.mjs'), 0o755);
};

// 測らないのは、bun run build と validate:build が子プロセスとして動かし、子プロセスは測れないため
/* v8 ignore start */
if (import.meta.main) {
  build(resolve(root, process.argv[2] ?? 'dist'));
}
/* v8 ignore stop */
