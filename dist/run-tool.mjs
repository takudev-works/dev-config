import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
const srcDir = dirname(fileURLToPath(import.meta.url));
const canonical = (name) => join(srcDir, name);
export const ignoreFile = (name, repoIgnore, cwd) => {
    const repoPath = join(cwd, repoIgnore);
    if (!existsSync(repoPath))
        return canonical(name);
    const merged = join(mkdtempSync(join(tmpdir(), 'dev-config-')), name);
    writeFileSync(merged, `${readFileSync(canonical(name), 'utf8')}\n${readFileSync(repoPath, 'utf8')}`);
    return merged;
};
export const tools = {
    commitlint: {
        bin: 'commitlint',
        options: () => ['--config', canonical('commitlintrc.json')]
    },
    markdownlint: {
        bin: 'markdownlint-cli2',
        options: () => ['--config', canonical('markdownlint-cli2.jsonc')]
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
    }
};
export const resolveBin = (bin) => [join(srcDir, '..', 'node_modules', '.bin', bin), join(srcDir, '..', '..', '.bin', bin)].find((path) => existsSync(path)) ?? bin;
export const runTool = ([name, ...args], { cwd = process.cwd(), spawn = spawnSync } = {}) => {
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
        return 1;
    }
    return result.status ?? 1;
};
