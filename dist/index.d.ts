#!/usr/bin/env node
interface MigrationOptions {
    source: string;
    target: string;
    eslint: boolean;
    vite: boolean;
    ai: boolean;
    report: boolean;
    dryRun: boolean;
    interactive: boolean;
    ts: boolean;
}
interface MigrationReport {
    file: string;
    status: 'success' | 'skipped' | 'error';
    error?: string;
}
declare function migrateDir(sourceDir: string, targetDir: string, options: MigrationOptions): Promise<MigrationReport[]>;
export { migrateDir };
