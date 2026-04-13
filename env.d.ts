/// <reference types="vite/client" />
import "vue-router";

export {};

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_APP_BASE?: string;
  readonly VITE_DEV_SERVER_HOST?: string;
  readonly VITE_DEV_SERVER_PORT?: string;
  readonly VITE_DEV_PROXY_TARGET?: string;
  readonly VITE_PREVIEW_HOST?: string;
  readonly VITE_PREVIEW_PORT?: string;
  readonly VITE_BUILD_TARGET?: string;
  readonly VITE_BUILD_OUT_DIR?: string;
  readonly VITE_BUILD_ASSETS_DIR?: string;
  readonly VITE_BUILD_SOURCEMAP?: string;
  readonly VITE_BUILD_MANIFEST?: string;
  readonly VITE_BUILD_CSS_CODE_SPLIT?: string;
  readonly VITE_BUILD_REPORT_COMPRESSED_SIZE?: string;
  readonly VITE_BUILD_MINIFY?: string;
  readonly VITE_CHUNK_SIZE_WARNING_LIMIT?: string;
  readonly VITE_DROP_CONSOLE?: string;
  readonly VITE_DROP_DEBUGGER?: string;
  readonly VITE_ENABLE_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresPermission?: string | string[];
    requiresRole?: string;
    loadingLabel?: string;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string;
      type?: "website" | "article";
      image?: string;
      noindex?: boolean;
    };
  }
}
