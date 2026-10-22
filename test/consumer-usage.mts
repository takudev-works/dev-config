import { defineConfig } from 'vitest/config';
import eslintBase from '../dist/eslint.mjs';
import { coverage } from '../dist/vitest.config.mjs';

export const vitestConfig = defineConfig({
  test: {
    coverage: { ...coverage, exclude: [...coverage.exclude, 'src/routeTree.gen.ts'] }
  }
});

export const eslintConfig = [...eslintBase, { ignores: ['python/**'] }];
