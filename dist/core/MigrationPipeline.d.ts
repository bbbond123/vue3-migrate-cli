interface MigrationOptions {
    eslint?: boolean;
    vite?: boolean;
    ai?: boolean;
    ts?: boolean;
    strictTs?: boolean;
    initTsconfig?: boolean;
    validateAi?: boolean;
    report?: boolean;
    dryRun?: boolean;
    output?: string;
}
export declare function migrate(inputPath: string, options: MigrationOptions): Promise<{
    file: string;
    status: string;
    error?: string;
}[]>;
export {};
