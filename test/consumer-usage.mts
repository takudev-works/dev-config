import { defineConfig } from 'vitest/config';
import eslintBase from '../dist/eslint.mjs';
import markdownlintBase from '../dist/markdownlint-cli2.mjs';
import { coverage } from '../dist/vitest.config.mjs';

export const vitestConfig = defineConfig({
  test: {
    coverage: { ...coverage, exclude: [...coverage.exclude, 'src/routeTree.gen.ts'] }
  }
});

export const eslintConfig = [...eslintBase, { ignores: ['python/**'] }];

export const markdownlintConfig = {
  ...markdownlintBase,
  ignores: [...markdownlintBase.ignores, 'python/reference/**']
};
