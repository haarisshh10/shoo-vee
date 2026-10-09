import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const pnpmDir = path.join(projectRoot, "node_modules", ".pnpm");
const pluginDir = readdirSync(pnpmDir).find((entry) =>
  entry.startsWith("@tanstack+router-plugin@"),
);
if (!pluginDir) throw new Error("Could not find @tanstack/router-plugin in the pnpm store.");
const pluginNodeModules = path.join(pnpmDir, pluginDir, "node_modules");

const generatorPath = require.resolve("@tanstack/router-generator", {
  paths: [pluginNodeModules],
});
const { Generator, getConfig } = await import(pathToFileURL(generatorPath));

const config = getConfig({}, projectRoot);
console.log(
  "routesDirectory:",
  config.routesDirectory,
  "| generatedRouteTree:",
  config.generatedRouteTree,
);
config.routeTreeFileFooter = () => [
  "import type { getRouter } from './router.tsx'\nimport type { createStart } from '@tanstack/react-start'\ndeclare module '@tanstack/react-start' {\n  interface Register {\n    ssr: true\n    router: Awaited<ReturnType<typeof getRouter>>\n  }\n}",
];
const generator = new Generator({ config, root: projectRoot });
await generator.run({ type: "rerun" });
