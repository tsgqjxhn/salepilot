import { onUnmounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useLoadingStore } from "@/stores/loading";
import { pinia } from "@/stores/pinia";
import request from "@/utils/request";
import { getRequestErrorMessage } from "@/utils/requestError";
import type { SseEventType, SsePayload, UseSSEStartOptions } from "@/types/ai";

const DEFAULT_TIMEOUT_MS = 35_000;

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const resolveRequestUrl = (url: string) => {
  if (isAbsoluteUrl(url)) {
    return url;
  }

  const baseURL = request.defaults.baseURL;
  if (!baseURL) {
    return url;
  }

  const normalizedBaseUrl = `${normalizeBaseUrl(String(baseURL))}/`;
  const normalizedPath = url.replace(/^\/+/, "");
  return new URL(normalizedPath, normalizedBaseUrl).toString();
};

const normalizeEventType = (value: string): SseEventType | null => {
  if (value === "start" || value === "chunk" || value === "done" || value === "error") {
    return value;
  }

  return null;
};

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const normalizePayload = (rawData: string, rawEventType: string): SsePayload | null => {
  const explicitEventType = normalizeEventType(rawEventType);
  const parsedValue = tryParseJson(rawData);

  if (parsedValue && typeof parsedValue === "object" && "type" in parsedValue) {
    const payloadType = normalizeEventType(String((parsedValue as { type?: unknown }).type ?? ""));

    if (payloadType) {
      return parsedValue as SsePayload;
    }
  }

  if (explicitEventType === "chunk") {
    return { type: "chunk", content: rawData };
  }

  if (explicitEventType === "start") {
    return { type: "start", message: rawData };
  }

  if (explicitEventType === "done") {
    if (parsedValue && typeof parsedValue === "object" && "totalTokens" in parsedValue) {
      const totalTokens = Number((parsedValue as { totalTokens?: unknown }).totalTokens);
      return { type: "done", totalTokens: Number.isFinite(totalTokens) ? totalTokens : undefined };
    }

    return { type: "done" };
  }

  if (explicitEventType === "error") {
    if (parsedValue && typeof parsedValue === "object") {
      const code = String((parsedValue as { code?: unknown }).code ?? "SSE_ERROR");
      const message = String((parsedValue as { message?: unknown }).message ?? rawData);
      return { type: "error", code, message };
    }

    return { type: "error", code: "SSE_ERROR", message: rawData };
  }

  return null;
};

const readErrorMessage = async (response: Response) => {
  try {
    const text = await response.text();
    const parsedValue = tryParseJson(text);

    if (parsedValue && typeof parsedValue === "object" && "message" in parsedValue) {
      return String((parsedValue as { message?: unknown }).message ?? `HTTP ${response.status}`);
    }

    return text || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

export function useSSE() {
  const authStore = useAuthStore(pinia);
  const loadingStore = useLoadingStore(pinia);

  const streaming = ref(false);
  const content = ref("");
  const error = ref<string | null>(null);
  const lastEvent = ref<SseEventType | null>(null);
  const totalTokens = ref<number | null>(null);

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let loadingToken: string | null = null;

  const clearTimeoutGuard = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const stop = () => {
    clearTimeoutGuard();
    controller?.abort();
    controller = null;
    streaming.value = false;
    loadingStore.endTask(loadingToken);
    loadingToken = null;
  };

  const ensureAccessToken = async () => {
    return authStore.ensureValidAccessToken(30_000);
  };

  const requestStream = async (
    url: string,
    body: unknown,
    options: UseSSEStartOptions,
    retryOnUnauthorized = true,
  ) => {
    const token = await ensureAccessToken();
    if (!token) {
      throw new Error("Authentication is required before opening the SSE stream.");
    }

    const method = options.method || (body === undefined ? "GET" : "POST");
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const response = await fetch(resolveRequestUrl(url), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller?.signal,
    });

    if (response.status === 401 && retryOnUnauthorized) {
      const refreshedToken = await authStore.refreshAccessToken();

      if (refreshedToken) {
        headers.Authorization = `Bearer ${refreshedToken}`;
        return fetch(resolveRequestUrl(url), {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller?.signal,
        });
      }
    }

    return response;
  };

  const handlePayload = (payload: SsePayload, options: UseSSEStartOptions) => {
    lastEvent.value = payload.type;
    options.onMessage?.(payload);

    switch (payload.type) {
      case "start":
        if (!options.preserveContent) {
          content.value = "";
        }
        break;
      case "chunk":
        content.value += payload.content;
        break;
      case "done":
        totalTokens.value = payload.totalTokens ?? null;
        streaming.value = false;
        break;
      case "error":
        error.value = payload.message;
        streaming.value = false;
        break;
    }
  };

  const parseSseBuffer = (buffer: string, options: UseSSEStartOptions) => {
    let workingBuffer = buffer;

    while (true) {
      const separatorIndex = workingBuffer.indexOf("\n\n");

      if (separatorIndex === -1) {
        break;
      }

      const rawBlock = workingBuffer.slice(0, separatorIndex).trim();
      workingBuffer = workingBuffer.slice(separatorIndex + 2);

      if (!rawBlock) {
        continue;
      }

      let rawEventType = "";
      const dataLines: string[] = [];

      rawBlock.split("\n").forEach((line) => {
        if (!line || line.startsWith(":")) {
          return;
        }

        if (line.startsWith("event:")) {
          rawEventType = line.slice(6).trim();
          return;
        }

        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      });

      const rawData = dataLines.join("\n");
      if (!rawData) {
        continue;
      }

      const payload = normalizePayload(rawData, rawEventType);
      if (payload) {
        handlePayload(payload, options);
      }
    }

    return workingBuffer;
  };

  const start = async (url: string, body?: object, options: UseSSEStartOptions = {}) => {
    stop();

    streaming.value = true;
    error.value = null;
    lastEvent.value = null;
    totalTokens.value = null;

    if (!options.preserveContent) {
      content.value = "";
    }

    controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let abortedByTimeout = false;
    loadingToken = loadingStore.beginTask({
      source: "stream",
      label: options.loadingLabel || "Receiving live output",
      blocking: Boolean(options.loadingBlocking),
    });

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        abortedByTimeout = true;
        controller?.abort();
      }, timeoutMs);
    }

    try {
      const response = await requestStream(url, body, options);
      clearTimeoutGuard();

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      if (!response.body) {
        throw new Error("The SSE response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (streaming.value) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        buffer = parseSseBuffer(buffer, options);
      }

      buffer += decoder.decode();
      parseSseBuffer(`${buffer}\n\n`, options);

      if (streaming.value && lastEvent.value !== "error") {
        streaming.value = false;
      }
    } catch (caughtError) {
      if ((caughtError as Error).name === "AbortError") {
        if (abortedByTimeout) {
          error.value = "The SSE connection timed out. Please try again.";
        }
      } else {
        error.value = getRequestErrorMessage(caughtError, "The SSE connection was interrupted.");
      }

      streaming.value = false;
    } finally {
      clearTimeoutGuard();
      controller = null;
      loadingStore.endTask(loadingToken);
      loadingToken = null;
    }
  };

  onUnmounted(stop);

  return {
    streaming,
    content,
    error,
    lastEvent,
    totalTokens,
    start,
    stop,
  };
}
