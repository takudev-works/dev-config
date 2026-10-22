import { type ViteUserConfig } from 'vitest/config';
export declare const coverage: {
    provider: "v8";
    include: string[];
    exclude: string[];
    reporter: ("lcov" | "text")[];
    thresholds: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
};
declare const _default: ViteUserConfig;
export default _default;
