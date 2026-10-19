import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectPath = path.join(__dirname, "..");

async function buildProject() {
  await build({
    bundle: true,
    platform: "node",
    target: "node24",
    format: "cjs",
    sourcemap: false,
    minify: true,
    entryPoints: [path.join(projectPath, 'src', "index.ts")],
    outfile: path.join(projectPath, 'dist', "index.js"),
    alias: {
        '@': path.join(__dirname, "..", 'src'),
      },
      banner:{
        js: `import { createRequire as __createRequire } from 'module';
    const require = __createRequire(import.meta.url);`
  }
  })
}

buildProject()