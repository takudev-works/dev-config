import { defineConfig } from 'vitest/config';
import { coverage } from './src/vitest/vitest.config.mjs';

export default defineConfig({
  test: {
    coverage: {
      ...coverage,
      // cli.mts を数えないのは、テストが子プロセスで dist の cli.mjs を動かして確かめていて、子プロセスは測れないため
      exclude: [...coverage.exclude, 'src/cli/cli.mts']
    }
  }
});
