import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
};

const parseIntegerEnv = (value: string | undefined, fallback: number) => {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const normalizeMinify = (value: string | undefined) => {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalizedValue === "terser" || normalizedValue === "esbuild") {
    return normalizedValue;
  }

  if (normalizedValue === "false" || normalizedValue === "none") {
    return false;
  }

  return "esbuild";
};

const createManualChunks = (id: string) => {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("echarts")) {
    return "vendor-echarts";
  }

  if (id.includes("element-plus") || id.includes("@element-plus")) {
    return "vendor-element-plus";
  }

  if (
    id.includes("vue-router") ||
    id.includes("pinia") ||
    id.includes("/vue/")
  ) {
    return "vendor-vue";
  }

  return "vendor";
};

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devServerPort = Number.parseInt(env.VITE_DEV_SERVER_PORT || "5173", 10);
  const previewPort = parseIntegerEnv(env.VITE_PREVIEW_PORT, 4173);
  const chunkSizeWarningLimit = parseIntegerEnv(
    env.VITE_CHUNK_SIZE_WARNING_LIMIT,
    1200,
  );
  const buildSourcemap = parseBooleanEnv(env.VITE_BUILD_SOURCEMAP, false);
  const buildManifest = parseBooleanEnv(env.VITE_BUILD_MANIFEST, false);
  const buildCssCodeSplit = parseBooleanEnv(
    env.VITE_BUILD_CSS_CODE_SPLIT,
    true,
  );
  const buildReportCompressedSize = parseBooleanEnv(
    env.VITE_BUILD_REPORT_COMPRESSED_SIZE,
    true,
  );
  const dropConsole = parseBooleanEnv(env.VITE_DROP_CONSOLE, false);
  const dropDebugger = parseBooleanEnv(
    env.VITE_DROP_DEBUGGER,
    mode === "production",
  );
  const buildMinify = normalizeMinify(env.VITE_BUILD_MINIFY);
  const enableVueDevTools =
    command === "serve" && parseBooleanEnv(env.VITE_ENABLE_DEVTOOLS, true);
  const esbuildDropLabels: Array<"console" | "debugger"> = [];

  if (dropConsole) {
    esbuildDropLabels.push("console");
  }

  if (dropDebugger) {
    esbuildDropLabels.push("debugger");
  }

  return {
    plugins: [vue(), ...(enableVueDevTools ? [vueDevTools()] : [])],
    base: env.VITE_APP_BASE || "/",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
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
    preview: {
      host: env.VITE_PREVIEW_HOST || "0.0.0.0",
      port: Number.isFinite(previewPort) ? previewPort : 4173,
    },
    build: {
      target: env.VITE_BUILD_TARGET || "es2020",
      outDir: env.VITE_BUILD_OUT_DIR || "dist",
      assetsDir: env.VITE_BUILD_ASSETS_DIR || "assets",
      sourcemap: buildSourcemap,
      manifest: buildManifest,
      minify: buildMinify,
      cssCodeSplit: buildCssCodeSplit,
      reportCompressedSize: buildReportCompressedSize,
      chunkSizeWarningLimit,
      rollupOptions: {
        output: {
          manualChunks: createManualChunks,
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const extension = assetInfo.name?.split(".").pop()?.toLowerCase();

            if (extension === "css") {
              return "assets/css/[name]-[hash][extname]";
            }

            if (
              [
                "png",
                "jpg",
                "jpeg",
                "gif",
                "svg",
                "webp",
                "avif",
                "ico",
              ].includes(String(extension))
            ) {
              return "assets/img/[name]-[hash][extname]";
            }

            if (
              ["woff", "woff2", "ttf", "otf", "eot"].includes(String(extension))
            ) {
              return "assets/fonts/[name]-[hash][extname]";
            }

            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
    esbuild:
      esbuildDropLabels.length > 0
        ? {
            drop: esbuildDropLabels,
          }
        : undefined,
  };
});
