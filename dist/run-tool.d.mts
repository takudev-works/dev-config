type Tool = {
    bin: string;
    options: (cwd: string) => string[];
};
type Spawn = (command: string, args: string[], options: {
    cwd: string;
    stdio: 'inherit';
}) => {
    status: number | null;
    error?: Error;
};
export declare const ignoreFile: (name: string, repoIgnore: string, cwd: string) => string;
export declare const tools: Record<string, Tool>;
export declare const resolveBin: (bin: string) => string;
export declare const runTool: ([name, ...args]: string[], { cwd, spawn }?: {
    cwd?: string;
    spawn?: Spawn;
}) => number;
export {};
