
import * as fs from "node:fs";
import * as path from "node:path";
import type { ProjectAnalysis, PackageManager } from "./types";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".nuxt",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
]);

interface PackageInfo {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

interface DiscoveredPackage {
  relativePath: string;
  info: PackageInfo;
}

function discoverPackages(root: string): DiscoveredPackage[] {
  const results: DiscoveredPackage[] = [];
  const MAX_FILES = 5000;
  let visited = 0;

  function walk(directory: string): void {
    if (visited >= MAX_FILES) {return;}

    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (visited >= MAX_FILES) {return;}

      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      if (!entry.isFile() || entry.name !== "package.json") {
        continue;
      }

      visited++;

      try {
        const info = JSON.parse(
          fs.readFileSync(fullPath, "utf8")
        ) as PackageInfo;

        results.push({
          relativePath:
            path.relative(root, path.dirname(fullPath)) || ".",
          info,
        });
      } catch {
        // Ignore malformed nested manifests; report the root separately.
      }
    }
  }

  walk(root);
  return results;
}

function detectPackageManager(root: string): PackageManager {
  if (
    fs.existsSync(path.join(root, "bun.lock")) ||
    fs.existsSync(path.join(root, "bun.lockb"))
  )  {return "unknown";}

  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) {return "pnpm";}
  if (fs.existsSync(path.join(root, "yarn.lock"))) {return "yarn";}
  if (fs.existsSync(path.join(root, "package-lock.json"))) {return "npm";}

  return "unknown";
}

export function scanProject(projectPath: string): ProjectAnalysis {
  const root = path.resolve(projectPath);
  const rootManifest = path.join(root, "package.json");

  if (!fs.existsSync(rootManifest)) {
    throw new Error(
      "No package.json found at the workspace root. Nested manifests will be scanned only when the root manifest exists."
    );
  }

  let rootInfo: PackageInfo;

  try {
    rootInfo = JSON.parse(
      fs.readFileSync(rootManifest, "utf8")
    ) as PackageInfo;
  } catch {
    throw new Error("The root package.json contains invalid JSON.");
  }

  const packages = discoverPackages(root);

  // A root package can exist even if traversal skipped it due to an error.
  if (!packages.some((item) => item.relativePath === ".")) {
    packages.unshift({ relativePath: ".", info: rootInfo });
  }

  const allDependencyNames = new Set<string>();
  const frameworks = new Set<string>();
  const findings: string[] = [];

  for (const pkg of packages) {
    const deps = {
      ...pkg.info.dependencies,
      ...pkg.info.devDependencies,
    };

    for (const name of Object.keys(deps)) {
      allDependencyNames.add(name);
    }

    if (deps.express) { frameworks.add("Express"); }
    if (deps.fastify) { frameworks.add("Fastify"); }
    if (deps["@nestjs/core"]) { frameworks.add("NestJS"); }
    if (deps.next) { frameworks.add("Next.js"); }
    if (deps.koa) { frameworks.add("Koa"); }
    if (deps.hono) { frameworks.add("Hono"); }
    if (deps.react) { frameworks.add("React"); }
    if (deps.vite) { frameworks.add("Vite"); }

    if (deps.bullmq) {
      findings.push(
        `[${pkg.relativePath}] BullMQ detected. Review worker configuration and whether long-running tasks are offloaded from request handlers.`
      );
    }

    if (deps.redis || deps.ioredis) {
      findings.push(
        `[${pkg.relativePath}] Redis client detected. Review cache usage, key expiration, and failure handling.`
      );
    }

    if (
      deps.pg || deps.mysql2 || deps.mysql || deps.mongoose ||
      deps["@prisma/client"] || deps.sequelize || deps.knex ||
      deps.mongodb
    ) {
      findings.push(
        `[${pkg.relativePath}] Database tooling detected. Query patterns and connection-pool usage can be analyzed next.`
      );
    }
  }

  if (frameworks.size === 0) {
    findings.push("No supported frameworks were identified in discovered manifests.");
  }

  return {
    projectName: rootInfo.name || path.basename(root),
    projectPath: root,
    packageManager: detectPackageManager(root),
    frameworks: [...frameworks].sort(),
    dependencies: [...allDependencyNames].sort(),
    findings,
  };
}
