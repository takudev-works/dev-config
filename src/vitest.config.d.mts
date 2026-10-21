import type { ViteUserConfig } from 'vitest/config';

type CoverageOptions = NonNullable<NonNullable<ViteUserConfig['test']>['coverage']>;

export declare const coverage: CoverageOptions & { include: string[]; exclude: string[] };

declare const config: ViteUserConfig;
export default config;
