export type AuthRedirectReason = "session-expired" | "auth-required";

export interface AuthSessionNotice {
  reason: AuthRedirectReason;
  title: string;
  message: string;
  redirectTo: string | null;
  createdAt: number;
}

const AUTH_SESSION_NOTICE_KEY = "auth_session_notice";
const AUTH_ROUTE_PREFIXES = ["/auth/login", "/auth/register"];

export const sanitizeRedirectPath = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue || !trimmedValue.startsWith("/") || trimmedValue.startsWith("//")) {
    return null;
  }

  if (AUTH_ROUTE_PREFIXES.some((routePrefix) => trimmedValue.startsWith(routePrefix))) {
    return null;
  }

  return trimmedValue;
};

export const createAuthSessionNotice = (
  reason: AuthRedirectReason,
  redirectTo?: string | null,
): AuthSessionNotice => {
  const normalizedRedirect = sanitizeRedirectPath(redirectTo);

  if (reason === "session-expired") {
    return {
      reason,
      title: "Session expired",
      message: "Your login session ended and was refreshed unsuccessfully. Sign in again to continue.",
      redirectTo: normalizedRedirect,
      createdAt: Date.now(),
    };
  }

  return {
    reason,
    title: "Login required",
    message: "This page requires an active account session. Sign in to continue.",
    redirectTo: normalizedRedirect,
    createdAt: Date.now(),
  };
};

export const saveAuthSessionNotice = (notice: AuthSessionNotice) => {
  sessionStorage.setItem(AUTH_SESSION_NOTICE_KEY, JSON.stringify(notice));
};

export const readAuthSessionNotice = (): AuthSessionNotice | null => {
  const rawValue = sessionStorage.getItem(AUTH_SESSION_NOTICE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<AuthSessionNotice>;
    if (
      parsedValue.reason !== "session-expired" &&
      parsedValue.reason !== "auth-required"
    ) {
      sessionStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
      return null;
    }

    return {
      reason: parsedValue.reason,
      title: typeof parsedValue.title === "string" && parsedValue.title.trim()
        ? parsedValue.title
        : createAuthSessionNotice(parsedValue.reason).title,
      message: typeof parsedValue.message === "string" && parsedValue.message.trim()
        ? parsedValue.message
        : createAuthSessionNotice(parsedValue.reason).message,
      redirectTo: sanitizeRedirectPath(parsedValue.redirectTo || null),
      createdAt: typeof parsedValue.createdAt === "number" ? parsedValue.createdAt : Date.now(),
    };
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
    return null;
  }
};

export const consumeAuthSessionNotice = () => {
  const notice = readAuthSessionNotice();
  sessionStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
  return notice;
};

export const clearAuthSessionNotice = () => {
  sessionStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
};

export const buildLoginRedirectPath = (
  reason?: AuthRedirectReason,
  redirectTo?: string | null,
) => {
  const query = new URLSearchParams();
  const normalizedRedirect = sanitizeRedirectPath(redirectTo);

  if (reason) {
    query.set("reason", reason);
  }

  if (normalizedRedirect) {
    query.set("redirect", normalizedRedirect);
  }

  const queryString = query.toString();
  return queryString ? `/auth/login?${queryString}` : "/auth/login";
};

export const getCurrentAppPath = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return sanitizeRedirectPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  ) || "/";
};

export const redirectToLogin = (
  reason: AuthRedirectReason,
  redirectTo?: string | null,
) => {
  const nextPath = buildLoginRedirectPath(reason, redirectTo);

  if (typeof window === "undefined") {
    return nextPath;
  }

  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
    window.location.replace(nextPath);
  }

  return nextPath;
};
