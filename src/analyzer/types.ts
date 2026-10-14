export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'unknown';

export interface ProjectAnalysis 
{
    projectName: string;
    projectPath: string;
    packageManager: PackageManager;
    frameworks: string[];
    dependencies: string[];
    findings: string[];
}