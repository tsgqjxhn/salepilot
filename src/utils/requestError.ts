import axios from "axios";

export interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data: T;
}

interface UnwrapApiResponseOptions {
  allowEmptyData?: boolean;
  successCode?: number;
  successCodes?: number[];
}

const DEFAULT_REQUEST_ERROR_MESSAGE = "The request could not be completed.";
const DEFAULT_NETWORK_ERROR_MESSAGE = "Unable to reach the server right now. Please check the connection and try again.";
const DEFAULT_TIMEOUT_ERROR_MESSAGE = "The request timed out. Please try again.";
const DEFAULT_CANCEL_ERROR_MESSAGE = "The request was canceled.";

const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: "The request parameters are invalid.",
  401: "Authentication is required to continue.",
  403: "未获得授权进入公司/销售组，或当前角色没有执行该操作的权限。",
  404: "The requested resource could not be found.",
  408: DEFAULT_TIMEOUT_ERROR_MESSAGE,
  409: "The request could not be completed because of a conflict.",
  422: "The submitted data could not be validated.",
  429: "Too many requests were sent. Please try again later.",
  500: "服务器响应错误，请稍后重试或联系管理员检查服务日志。",
  502: "The upstream service is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
  504: "The upstream service timed out.",
};

const normalizeText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const readMessageCandidate = (value: unknown): string => {
  if (!value) {
    return "";
  }

  const directMessage = normalizeText(value);
  if (directMessage) {
    return directMessage;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedMessage = readMessageCandidate(item);
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return "";
  }

  if (typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;

  for (const key of ["message", "error", "msg", "detail", "title"]) {
    const nestedMessage = readMessageCandidate(record[key]);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if ("errors" in record) {
    const nestedMessage = readMessageCandidate(record.errors);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return "";
};

const isTimeoutError = (message: string, code?: string) => {
  return code === "ECONNABORTED" || /timeout/i.test(message);
};

export function getRequestErrorMessage(
  error: unknown,
  fallback = DEFAULT_REQUEST_ERROR_MESSAGE,
): string {
  if (axios.isCancel(error)) {
    return DEFAULT_CANCEL_ERROR_MESSAGE;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return DEFAULT_CANCEL_ERROR_MESSAGE;
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = readMessageCandidate(error.response?.data);
    if (responseMessage) {
      return responseMessage;
    }

    const axiosMessage = normalizeText(error.message);
    if (isTimeoutError(axiosMessage, error.code)) {
      return DEFAULT_TIMEOUT_ERROR_MESSAGE;
    }

    if (error.code === "ERR_NETWORK") {
      return DEFAULT_NETWORK_ERROR_MESSAGE;
    }

    if (!error.response) {
      return fallback || DEFAULT_NETWORK_ERROR_MESSAGE;
    }

    const statusFallback = STATUS_ERROR_MESSAGES[error.response.status];
    if (statusFallback) {
      return statusFallback;
    }

    if (axiosMessage) {
      return axiosMessage;
    }

    return fallback;
  }

  const nestedMessage = readMessageCandidate(error);
  if (nestedMessage) {
    return nestedMessage;
  }

  if (error instanceof Error) {
    const errorMessage = normalizeText(error.message);
    if (errorMessage) {
      return errorMessage;
    }
  }

  return fallback;
}

export function applyRequestErrorMessage<T>(error: T, fallback = DEFAULT_REQUEST_ERROR_MESSAGE): T {
  const message = getRequestErrorMessage(error, fallback);

  if (error && typeof error === "object") {
    try {
      (error as { message?: string }).message = message;
    } catch {
      // Ignore immutable error objects and return the original value.
    }
  }

  return error;
}

export function unwrapApiResponseData<T>(
  response: { data?: ApiEnvelope<T> | null | undefined },
  fallback = DEFAULT_REQUEST_ERROR_MESSAGE,
  options: UnwrapApiResponseOptions = {},
): T {
  const payload = response.data;
  const successCodes = options.successCodes?.length ? options.successCodes : [options.successCode ?? 200];

  if (!payload || typeof payload !== "object") {
    throw new Error(fallback);
  }

  if (!successCodes.includes(payload.code)) {
    throw new Error(normalizeText(payload.message) || fallback);
  }

  if (!options.allowEmptyData && (payload.data === undefined || payload.data === null)) {
    throw new Error(normalizeText(payload.message) || fallback);
  }

  return payload.data as T;
}
