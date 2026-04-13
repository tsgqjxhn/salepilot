import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";

const require = createRequire(import.meta.url);
const childProcess = require("node:child_process");
const originalExec = childProcess.exec.bind(childProcess);

childProcess.exec = (command, options, callback) => {
  const normalizedCommand = String(command || "").trim().toLowerCase();

  if (normalizedCommand === "net use") {
    const resolvedCallback = typeof options === "function" ? options : callback;
    queueMicrotask(() => {
      if (typeof resolvedCallback === "function") {
        resolvedCallback(null, "", "");
      }
    });

    return {
      pid: 0,
      killed: false,
      kill() {
        return true;
      },
    };
  }

  return originalExec(command, options, callback);
};

const { createServer, loadEnv } = await import("vite");
const { default: vue } = await import("@vitejs/plugin-vue");

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const srcRoot = fileURLToPath(new URL("../src", import.meta.url));
const mode = process.env.MODE || "development";
const env = loadEnv(mode, frontendRoot, "");

const devServerPort = Number.parseInt(env.VITE_DEV_SERVER_PORT || "5173", 10);

const server = await createServer({
  configFile: false,
  root: frontendRoot,
  plugins: [vue()],
  base: env.VITE_APP_BASE || "/",
  resolve: {
    alias: {
      "@": srcRoot,
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  server: {
    host: env.VITE_DEV_SERVER_HOST || "127.0.0.1",
    port: Number.isFinite(devServerPort) ? devServerPort : 5173,
    proxy: {
      "/api": {
        target: env.VITE_DEV_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

const closeServer = async () => {
  await server.close();
  process.exit(0);
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

await server.listen();
server.printUrls();
