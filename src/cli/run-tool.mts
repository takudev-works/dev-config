import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));

// どの tool のディレクトリにあるかを表に持たないのは、src に正本を足すたびに表を直す手間と直し忘れを避けるため
export const canonical = (name: string) => {
  const beside = join(moduleDir, name);
  if (existsSync(beside)) return beside;
  const sourceNames = [name, name.replace(/\.mjs$/, '.mts')];
  for (const dir of readdirSync(join(moduleDir, '..'))) {
    const found = sourceNames
      .map((sourceName) => join(moduleDir, '..', dir, sourceName))
      .find((path) => existsSync(path));
    if (found !== undefined) return found;
  }
  return beside;
};

type Tool = {
  bin: string;
  options: (cwd: string) => string[];
};

type Spawn = (
  command: string,
  args: string[],
  options: { cwd: string; stdio: 'inherit' }
) => { status: number | null; error?: Error };

export const ignoreFile = (name: string, repoIgnore: string, cwd: string) => {
  const repoPath = join(cwd, repoIgnore);
  if (!existsSync(repoPath)) return canonical(name);
  const merged = join(mkdtempSync(join(tmpdir(), 'dev-config-')), name);
  writeFileSync(
    merged,
    `${readFileSync(canonical(name), 'utf8')}\n${readFileSync(repoPath, 'utf8')}`
  );
  return merged;
};

const repoOrCanonical = (repoConfig: string, name: string, cwd: string) => {
  const repoPath = join(cwd, repoConfig);
  return existsSync(repoPath) ? repoPath : canonical(name);
};

export const tools: Record<string, Tool> = {
  actionlint: {
    bin: 'actionlint',
    options: (cwd) => [
      '-config-file',
      repoOrCanonical('.github/actionlint.yaml', 'actionlint.yaml', cwd)
    ]
  },
  commitlint: {
    bin: 'commitlint',
    options: () => ['--config', canonical('commitlintrc.json')]
  },
  markdownlint: {
    bin: 'markdownlint-cli2',
    options: () => ['--config', canonical('markdownlint-cli2.mjs')]
  },
  'npm-package-json-lint': {
    bin: 'npmPkgJsonLint',
    options: () => ['--configFile', canonical('npmpackagejsonlintrc.json')]
  },
  secretlint: {
    bin: 'secretlint',
    options: (cwd) => [
      '--secretlintrc',
      canonical('secretlintrc.json'),
      '--secretlintignore',
      ignoreFile('secretlintignore', '.secretlintignore', cwd)
    ]
  },
  textlint: {
    bin: 'textlint',
    options: (cwd) => [
      '--config',
      canonical('textlintrc.json'),
      '--ignore-path',
      ignoreFile('textlintignore', '.textlintignore', cwd)
    ]
  },
  zizmor: {
    bin: 'zizmor',
    options: (cwd) => [
      '--offline',
      '--min-severity',
      'low',
      '--config',
      repoOrCanonical('.github/zizmor.yml', 'zizmor.yml', cwd)
    ]
  }
};

export const resolveBin = (bin: string, from = moduleDir) =>
  [join(from, '..', 'node_modules', '.bin', bin), join(from, '..', '..', '..', '.bin', bin)].find(
    (path) => existsSync(path)
  ) ?? bin;

export const runTool = (
  [name, ...args]: string[],
  { cwd = process.cwd(), spawn = spawnSync as Spawn }: { cwd?: string; spawn?: Spawn } = {}
): number => {
  const tool = name === undefined ? undefined : tools[name];
  if (tool === undefined) {
    console.error(`使い方: dev-config <${Object.keys(tools).join('|')}> [引数...]`);
    return 2;
  }
  const result = spawn(resolveBin(tool.bin), [...tool.options(cwd), ...args], {
    cwd,
    stdio: 'inherit'
  });
  if (result.error) {
    console.error(result.error.message);
    if ('code' in result.error && result.error.code === 'ENOENT') {
      console.error(
        `${tool.bin} が見つからない。repo の mise.toml に入れ、mise install を実行する`
      );
    }
    return 1;
  }
  return result.status ?? 1;
};
