import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { context } from "esbuild";
import treekill from "tree-kill";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outfile = path.join(__dirname, "..", 'dev-dist', "index.js");
const config = {
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  sourcemap: true,
  entryPoints: [path.join(__dirname, "..", 'src', "index.ts")],
  outfile,
  alias: {
    '@': path.join(__dirname, "..", 'src'),
  },
  banner:{
    js: `import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);`
  }
};

// nodejs运行时进程 
let process = null;

const startServer = () => {
  if (process) {
    treekill(process.pid);
    process = null;
  }

  console.log("🚀 start server...");
  process = spawn('node', [outfile], {
    stdio: "inherit",
    shell: true,
  });
}

const main = async () => {
  const ctxHook = await context({
    ...config,
    plugins: [
      {
        name: "restart",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.log("📝 Main build end, restart server");
              startServer();
            } else {
              console.error("⚠️ Main build error", result.errors);
            }
          });
        },
      }
    ]
  })

  // 启动watch
  await ctxHook.watch()
}

main()