import { defineStore } from "pinia";
import { computed, ref } from "vue";
import request from "@/utils/request";
import { clearSavedAccounts, updateSavedAccountRefreshToken } from "@/utils/savedAccounts";
import {
  buildFrontendOnlySessionSeed,
  FRONTEND_ONLY_MODE,
  isFrontendOnlySessionStored,
  setFrontendOnlySessionStored,
} from "@/utils/frontendOnly";

interface UserInfo {
  id: string;
  userrole: string;
  username: string;
  email: string;
  phone?: string;
  companyid: string;
  companyIdentityStatus: "verified" | "pending";
  companyIdentityVerifiedAt?: string | null;
  primaryGroupId?: string | null;
  groupIds?: string[];
  permissions?: string[];
  isSystemReserved?: boolean;
}

type WorkspaceAiDeploymentMode = "public" | "vpc" | "private-cloud" | "on-premise";

interface WorkspaceAiEnterpriseSettings {
  enabled: boolean;
  deploymentMode: WorkspaceAiDeploymentMode;
  dataIsolation: boolean;
  zeroDataRetention: boolean;
  auditLogging: boolean;
  ssoEnabled: boolean;
  privateEndpoint: string;
  region: string;
  monthlyBudgetUsd: number;
  rateLimitPerMinute: number;
}

interface CompanyInfo {
  id?: string;
  name: string;
  publicId?: string;
  plan: string;
  maxusers: number;
  maxcustomers: number;
  aicalls?: number;
  isactive?: boolean;
  founderUserId?: string | null;
  rolePasscodesConfigured?: boolean;
  rolePasscodesConfiguredAt?: string | null;
  workspaceRules?: {
    managerSharedCustomersEnabled: boolean;
    managerTaskDelegationEnabled: boolean;
    managerReportingEnabled: boolean;
  };
  aiGateway?: {
    useCustomProvider: boolean;
    providerType: string;
    providerLabel: string;
    protocol: string;
    baseURL: string;
    model: string;
    configured: boolean;
    maskedApiKey: string;
    customHeaders: Record<string, string>;
    enterprise: WorkspaceAiEnterpriseSettings;
  };
}

interface RbacRoleEntry {
  role: string;
  label: string;
  description: string;
  permissions: string[];
}

interface RbacProfile {
  version: string;
  currentRole: string;
  roleLabel: string;
  permissions: string[];
  roles: RbacRoleEntry[];
}

interface RefreshTokenResponse {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserInfo;
  company?: CompanyInfo;
  rbac?: RbacProfile;
}

interface RefreshAccessTokenOptions {
  clearOnFailure?: boolean;
  force?: boolean;
  minValidityMs?: number;
}

interface ClearTokensOptions {
  clearBoundStorage?: boolean;
}

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const ACCESS_TOKEN_FOCUS_WINDOW_MS = 2 * 60_000;
const SILENT_REFRESH_RETRY_DELAY_MS = 30_000;
const DEFAULT_AI_ENTERPRISE_SETTINGS: WorkspaceAiEnterpriseSettings = {
  enabled: false,
  deploymentMode: "public",
  dataIsolation: true,
  zeroDataRetention: true,
  auditLogging: true,
  ssoEnabled: false,
  privateEndpoint: "",
  region: "global",
  monthlyBudgetUsd: 0,
  rateLimitPerMinute: 0,
};

const parseJsonStorageValue = <T>(storageKey: string): T | null => {
  const rawValue = localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  const payloadPart = parts[1];

  if (!payloadPart) {
    return null;
  }

  try {
    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

    return JSON.parse(atob(normalizedPayload)) as { exp?: number } | null;
  } catch {
    return null;
  }
};

const readTokenExpiry = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return null;
  }

  return payload.exp * 1000;
};

const readAxiosStatusCode = (error: unknown) => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : null;
};

const normalizeStoredRole = (value: string | null) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ["user", "manager", "admin"].includes(normalizedValue) ? normalizedValue : "user";
};

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(null);
  const accessTokenExpiresAt = ref<number | null>(null);
  const isRefreshingToken = ref(false);
  const sessionReady = ref(false);
  const lastTokenRefreshAt = ref<number | null>(null);

  const userrole = ref<string | null>(null);
  const userid = ref<string | null>(null);
  const username = ref<string | null>(null);
  const email = ref<string | null>(null);
  const phone = ref<string | null>(null);
  const companyid = ref<string | null>(null);
  const companyIdentityStatus = ref<"verified" | "pending">("verified");
  const companyIdentityVerifiedAt = ref<string | null>(null);
  const primaryGroupId = ref<string | null>(null);
  const groupIds = ref<string[]>([]);
  const permissions = ref<string[]>([]);
  const isSystemReserved = ref(false);

  const companyname = ref<string | null>(null);
  const companyRecordId = ref<string | null>(null);
  const companyPublicId = ref<string | null>(null);
  const plan = ref<string | null>(null);
  const maxusers = ref<number | null>(null);
  const maxcustomers = ref<number | null>(null);
  const aicalls = ref<number | null>(null);
  const isactive = ref<boolean | null>(null);
  const founderUserId = ref<string | null>(null);
  const rolePasscodesConfigured = ref(false);
  const rolePasscodesConfiguredAt = ref<string | null>(null);
  const workspaceRules = ref({
    managerSharedCustomersEnabled: true,
    managerTaskDelegationEnabled: true,
    managerReportingEnabled: true,
  });
  const aiGateway = ref({
    useCustomProvider: false,
    providerType: "openai",
    providerLabel: "OpenAI",
    protocol: "openai",
    baseURL: "",
    model: "",
    configured: false,
    maskedApiKey: "",
    customHeaders: {} as Record<string, string>,
    enterprise: { ...DEFAULT_AI_ENTERPRISE_SETTINGS },
  });

  const rbacVersion = ref<string | null>(null);
  const roleLabel = ref<string | null>(null);
  const roleMatrix = ref<RbacRoleEntry[]>([]);

  const REFRESH_TOKEN_KEY = "refresh_token";
  const USER_INFO_KEY = "user_info";
  const COMPANY_INFO_KEY = "company_info";
  const RBAC_PROFILE_KEY = "rbac_profile";
  let refreshTimerId: ReturnType<typeof window.setTimeout> | null = null;
  let refreshPromise: Promise<string | null> | null = null;
  let bootstrapPromise: Promise<string | null> | null = null;
  let lifecycleStarted = false;

  const clearRefreshTimer = () => {
    if (refreshTimerId !== null) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
    }
  };

  const setFrontendOnlyAccessToken = (token: string) => {
    accessToken.value = token;
    accessTokenExpiresAt.value = Date.now() + 365 * 24 * 60 * 60 * 1000;
    clearRefreshTimer();
  };

  const hasValidAccessToken = (minValidityMs = 0) => {
    if (!accessToken.value || !accessTokenExpiresAt.value) {
      return false;
    }

    return accessTokenExpiresAt.value - Date.now() > minValidityMs;
  };

  const scheduleSilentRefresh = (token = accessToken.value) => {
    clearRefreshTimer();

    if (typeof window === "undefined" || !token || !getRefreshToken()) {
      return;
    }

    const expiresAt = readTokenExpiry(token);
    accessTokenExpiresAt.value = expiresAt;

    if (!expiresAt) {
      return;
    }

    const delay = Math.max(expiresAt - Date.now() - ACCESS_TOKEN_REFRESH_WINDOW_MS, 0);
    refreshTimerId = window.setTimeout(() => {
      void refreshAccessToken({ clearOnFailure: false, force: true, minValidityMs: 0 });
    }, delay);
  };

  const applyAccessToken = (token: string | null) => {
    accessToken.value = token;
    accessTokenExpiresAt.value = token ? readTokenExpiry(token) : null;

    if (token) {
      scheduleSilentRefresh(token);
      return;
    }

    clearRefreshTimer();
  };

  const setTokens = (access: string, refresh: string) => {
    setRefreshToken(refresh);
    applyAccessToken(access);
  };

  const setAccessToken = (token: string) => {
    applyAccessToken(token);
  };

  const setRefreshToken = (token: string | null) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  };

  const getAccessToken = (): string | null => accessToken.value;
  const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

  const enableFrontendOnlySession = (overrides?: {
    username?: string | null;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    persist?: boolean;
  }) => {
    const seed = buildFrontendOnlySessionSeed({
      username: overrides?.username || username.value,
      companyName: overrides?.companyName || companyname.value,
      email: overrides?.email || email.value,
      phone: overrides?.phone || phone.value,
    });

    setFrontendOnlyAccessToken(seed.accessToken);
    setRbacProfile(seed.rbac);
    applyUserInfo(seed.user);
    applyCompanyInfo(seed.company);
    lastTokenRefreshAt.value = Date.now();
    sessionReady.value = true;
    setRefreshToken(null);

    if (overrides?.persist !== false) {
      setFrontendOnlySessionStored(true);
    }

    return seed;
  };

  const restoreFrontendOnlySession = () => {
    if (!FRONTEND_ONLY_MODE || !isFrontendOnlySessionStored()) {
      return null;
    }

    const seed = enableFrontendOnlySession({ persist: false });
    return seed.accessToken;
  };

  const applyUserInfo = (user: UserInfo) => {
    userid.value = user.id;
    userrole.value = user.userrole;
    username.value = user.username;
    email.value = user.email;
    phone.value = user.phone || null;
    companyid.value = user.companyid;
    companyIdentityStatus.value = user.companyIdentityStatus || "verified";
    companyIdentityVerifiedAt.value = typeof user.companyIdentityVerifiedAt === "string"
      ? user.companyIdentityVerifiedAt
      : null;
    primaryGroupId.value = typeof user.primaryGroupId === "string" ? user.primaryGroupId : null;
    groupIds.value = Array.isArray(user.groupIds) ? [...user.groupIds] : [];
    isSystemReserved.value = Boolean(user.isSystemReserved);
    permissions.value = Array.isArray(user.permissions) ? [...user.permissions] : permissions.value;
    localStorage.setItem(USER_INFO_KEY, JSON.stringify({
      ...user,
      id: userid.value,
      phone: phone.value,
      companyIdentityStatus: companyIdentityStatus.value,
      companyIdentityVerifiedAt: companyIdentityVerifiedAt.value,
      primaryGroupId: primaryGroupId.value,
      groupIds: [...groupIds.value],
      isSystemReserved: isSystemReserved.value,
      permissions: permissions.value,
    }));
    localStorage.setItem("user_role", user.userrole);
    localStorage.setItem("username", user.username);
  };

  const applyCompanyInfo = (company: CompanyInfo) => {
    companyRecordId.value = company.id || null;
    companyname.value = company.name;
    companyPublicId.value = company.publicId || null;
    plan.value = company.plan;
    maxusers.value = company.maxusers;
    maxcustomers.value = company.maxcustomers;
    aicalls.value = company.aicalls ?? null;
    isactive.value = typeof company.isactive === "boolean" ? company.isactive : null;
    founderUserId.value = typeof company.founderUserId === "string" ? company.founderUserId : null;
    rolePasscodesConfigured.value = Boolean(company.rolePasscodesConfigured);
    rolePasscodesConfiguredAt.value = typeof company.rolePasscodesConfiguredAt === "string"
      ? company.rolePasscodesConfiguredAt
      : null;
    workspaceRules.value = {
      managerSharedCustomersEnabled: company.workspaceRules?.managerSharedCustomersEnabled ?? true,
      managerTaskDelegationEnabled: company.workspaceRules?.managerTaskDelegationEnabled ?? true,
      managerReportingEnabled: company.workspaceRules?.managerReportingEnabled ?? true,
    };
    aiGateway.value = {
      useCustomProvider: company.aiGateway?.useCustomProvider ?? false,
      providerType: company.aiGateway?.providerType || "openai",
      providerLabel: company.aiGateway?.providerLabel || "OpenAI",
      protocol: company.aiGateway?.protocol || "openai",
      baseURL: company.aiGateway?.baseURL || "",
      model: company.aiGateway?.model || "",
      configured: Boolean(company.aiGateway?.configured),
      maskedApiKey: company.aiGateway?.maskedApiKey || "",
      customHeaders: { ...(company.aiGateway?.customHeaders || {}) },
      enterprise: {
        ...DEFAULT_AI_ENTERPRISE_SETTINGS,
        ...(company.aiGateway?.enterprise || {}),
      },
    };
    localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(company));
  };

  const setRbacProfile = (rbac?: RbacProfile | null) => {
    permissions.value = Array.isArray(rbac?.permissions) ? [...rbac.permissions] : [];
    rbacVersion.value = rbac?.version || null;
    roleLabel.value = rbac?.roleLabel || null;
    roleMatrix.value = Array.isArray(rbac?.roles) ? [...rbac.roles] : [];

    if (rbac) {
      localStorage.setItem(RBAC_PROFILE_KEY, JSON.stringify(rbac));
    } else {
      localStorage.removeItem(RBAC_PROFILE_KEY);
    }
  };

  const setUserInfo = (user: UserInfo, company: CompanyInfo, rbac?: RbacProfile | null) => {
    setRbacProfile(rbac);
    applyUserInfo({
      ...user,
      permissions: Array.isArray(user.permissions) && user.permissions.length ? user.permissions : permissions.value,
    });
    applyCompanyInfo(company);
  };

  const getUserInfo = (): UserInfo | null => {
    if (!userrole.value || !username.value) {
      return null;
    }

    return {
      id: userid.value || "",
      userrole: userrole.value,
      username: username.value,
      email: email.value || "",
      phone: phone.value || "",
      companyid: companyid.value || "",
      companyIdentityStatus: companyIdentityStatus.value,
      companyIdentityVerifiedAt: companyIdentityVerifiedAt.value,
      primaryGroupId: primaryGroupId.value,
      groupIds: [...groupIds.value],
      permissions: [...permissions.value],
      isSystemReserved: isSystemReserved.value,
    };
  };

  const getCompanyInfo = (): CompanyInfo | null => {
    if (!companyname.value) {
      return null;
    }

    return {
      id: companyRecordId.value || undefined,
      name: companyname.value,
      publicId: companyPublicId.value || undefined,
      plan: plan.value || "",
      maxusers: maxusers.value || 0,
      maxcustomers: maxcustomers.value || 0,
      aicalls: aicalls.value ?? undefined,
      isactive: isactive.value ?? undefined,
      founderUserId: founderUserId.value,
      rolePasscodesConfigured: rolePasscodesConfigured.value,
      rolePasscodesConfiguredAt: rolePasscodesConfiguredAt.value,
      workspaceRules: {
        ...workspaceRules.value,
      },
      aiGateway: {
        ...aiGateway.value,
        customHeaders: { ...aiGateway.value.customHeaders },
      },
    };
  };

  const setWorkspaceRules = (nextRules: Partial<CompanyInfo["workspaceRules"]> | null | undefined) => {
    workspaceRules.value = {
      managerSharedCustomersEnabled: nextRules?.managerSharedCustomersEnabled ?? workspaceRules.value.managerSharedCustomersEnabled,
      managerTaskDelegationEnabled: nextRules?.managerTaskDelegationEnabled ?? workspaceRules.value.managerTaskDelegationEnabled,
      managerReportingEnabled: nextRules?.managerReportingEnabled ?? workspaceRules.value.managerReportingEnabled,
    };

    const storedCompany = getCompanyInfo();
    if (storedCompany) {
      storedCompany.workspaceRules = {
        ...workspaceRules.value,
      };
      localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(storedCompany));
    }
  };

  const setWorkspaceAiGateway = (nextAiGateway: Partial<NonNullable<CompanyInfo["aiGateway"]>> | null | undefined) => {
    aiGateway.value = {
      useCustomProvider: nextAiGateway?.useCustomProvider ?? aiGateway.value.useCustomProvider,
      providerType: nextAiGateway?.providerType ?? aiGateway.value.providerType,
      providerLabel: nextAiGateway?.providerLabel ?? aiGateway.value.providerLabel,
      protocol: nextAiGateway?.protocol ?? aiGateway.value.protocol,
      baseURL: nextAiGateway?.baseURL ?? aiGateway.value.baseURL,
      model: nextAiGateway?.model ?? aiGateway.value.model,
      configured: typeof nextAiGateway?.configured === "boolean" ? nextAiGateway.configured : aiGateway.value.configured,
      maskedApiKey: nextAiGateway?.maskedApiKey ?? aiGateway.value.maskedApiKey,
      customHeaders: {
        ...(nextAiGateway?.customHeaders || aiGateway.value.customHeaders),
      },
      enterprise: {
        ...aiGateway.value.enterprise,
        ...(nextAiGateway?.enterprise || {}),
      },
    };

    const storedCompany = getCompanyInfo();
    if (storedCompany) {
      storedCompany.aiGateway = {
        ...aiGateway.value,
        customHeaders: { ...aiGateway.value.customHeaders },
      };
      localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(storedCompany));
    }
  };

  const getRbacProfile = (): RbacProfile | null => {
    if (!rbacVersion.value || !userrole.value) {
      return null;
    }

    return {
      version: rbacVersion.value,
      currentRole: userrole.value,
      roleLabel: roleLabel.value || userrole.value,
      permissions: [...permissions.value],
      roles: [...roleMatrix.value],
    };
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission);
  };

  const hasAnyPermission = (requestedPermissions: string[]): boolean => {
    return requestedPermissions.some((permission) => hasPermission(permission));
  };

  const isLogedIn = (): boolean => {
    return accessToken.value !== null;
  };

  const scheduleRetryRefresh = () => {
    clearRefreshTimer();

    if (typeof window === "undefined" || !getRefreshToken()) {
      return;
    }

    refreshTimerId = window.setTimeout(() => {
      void refreshAccessToken({ clearOnFailure: false, force: true, minValidityMs: 0 });
    }, SILENT_REFRESH_RETRY_DELAY_MS);
  };

  const clearTokens = ({ clearBoundStorage = false }: ClearTokensOptions = {}) => {
    applyAccessToken(null);
    refreshPromise = null;
    bootstrapPromise = null;
    userid.value = null;
    userrole.value = null;
    username.value = null;
    email.value = null;
    phone.value = null;
    companyid.value = null;
    companyIdentityStatus.value = "verified";
    companyIdentityVerifiedAt.value = null;
    primaryGroupId.value = null;
    groupIds.value = [];
    permissions.value = [];
    isSystemReserved.value = false;
    companyRecordId.value = null;
    companyname.value = null;
    companyPublicId.value = null;
    plan.value = null;
    maxusers.value = null;
    maxcustomers.value = null;
    aicalls.value = null;
    isactive.value = null;
    founderUserId.value = null;
    rolePasscodesConfigured.value = false;
    rolePasscodesConfiguredAt.value = null;
    workspaceRules.value = {
      managerSharedCustomersEnabled: true,
      managerTaskDelegationEnabled: true,
      managerReportingEnabled: true,
    };
    aiGateway.value = {
      useCustomProvider: false,
      providerType: "openai",
      providerLabel: "OpenAI",
      protocol: "openai",
      baseURL: "",
      model: "",
      configured: false,
      maskedApiKey: "",
      customHeaders: {},
      enterprise: { ...DEFAULT_AI_ENTERPRISE_SETTINGS },
    };
    rbacVersion.value = null;
    roleLabel.value = null;
    roleMatrix.value = [];
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(COMPANY_INFO_KEY);
    localStorage.removeItem(RBAC_PROFILE_KEY);
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    setFrontendOnlySessionStored(false);

    if (clearBoundStorage) {
      clearSavedAccounts();
    }
  };

  const initFromStorage = () => {
    const userInfo = parseJsonStorageValue<UserInfo>(USER_INFO_KEY);
    if (userInfo) {
      applyUserInfo(userInfo);
    }

    const companyInfo = parseJsonStorageValue<CompanyInfo>(COMPANY_INFO_KEY);
    if (companyInfo) {
      applyCompanyInfo(companyInfo);
    }

    const rbacProfile = parseJsonStorageValue<RbacProfile>(RBAC_PROFILE_KEY);
    if (rbacProfile) {
      setRbacProfile(rbacProfile);
    }
  };

  const refreshAccessToken = async (
    {
      clearOnFailure = true,
      force = false,
      minValidityMs = ACCESS_TOKEN_REFRESH_WINDOW_MS,
    }: RefreshAccessTokenOptions = {},
  ): Promise<string | null> => {
    if (FRONTEND_ONLY_MODE) {
      return restoreFrontendOnlySession() || accessToken.value;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    if (!force && hasValidAccessToken(minValidityMs)) {
      return accessToken.value;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    isRefreshingToken.value = true;

    refreshPromise = (async () => {
      clearRefreshTimer();

      const previousAccessToken = accessToken.value;

      try {
        const response = await request.post<RefreshTokenResponse>("/auth/refresh", {
          refreshToken,
        });

        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user,
          company,
          rbac,
        } = response.data || {};
        if (!newAccessToken) {
          return null;
        }

        setAccessToken(newAccessToken);

        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
          if (user?.username || username.value) {
            updateSavedAccountRefreshToken(user?.username || username.value || "", newRefreshToken);
          }
        }

        if (rbac) {
          setRbacProfile(rbac);
        }

        if (user) {
          applyUserInfo({
            ...user,
            permissions: Array.isArray(user.permissions) && user.permissions.length ? user.permissions : permissions.value,
          });
        }

        if (company) {
          applyCompanyInfo(company);
        }

        lastTokenRefreshAt.value = Date.now();
        sessionReady.value = true;
        return newAccessToken;
      } catch (error) {
        const statusCode = readAxiosStatusCode(error);
        const shouldClearSession = clearOnFailure || statusCode === 400 || statusCode === 401 || statusCode === 403;

        if (shouldClearSession) {
          clearTokens();
        } else if (previousAccessToken) {
          setAccessToken(previousAccessToken);
          scheduleRetryRefresh();
        } else {
          scheduleRetryRefresh();
        }

        console.error("Failed to refresh access token", error);
        return null;
      } finally {
        isRefreshingToken.value = false;
        refreshPromise = null;
      }
    })();

    try {
      return await refreshPromise;
    } finally {
      sessionReady.value = true;
    }
  };

  const ensureValidAccessToken = async (minValidityMs = ACCESS_TOKEN_REFRESH_WINDOW_MS) => {
    if (FRONTEND_ONLY_MODE) {
      return restoreFrontendOnlySession() || accessToken.value;
    }

    if (hasValidAccessToken(minValidityMs)) {
      return accessToken.value;
    }

    return refreshAccessToken({
      clearOnFailure: false,
      force: true,
      minValidityMs,
    });
  };

  const refreshSessionFromForeground = async () => {
    if (FRONTEND_ONLY_MODE) {
      return restoreFrontendOnlySession() || accessToken.value;
    }

    if (!getRefreshToken()) {
      return null;
    }

    return ensureValidAccessToken(ACCESS_TOKEN_FOCUS_WINDOW_MS);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void refreshSessionFromForeground();
    }
  };

  const handleWindowFocus = () => {
    void refreshSessionFromForeground();
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (
      event.key === USER_INFO_KEY ||
      event.key === COMPANY_INFO_KEY ||
      event.key === RBAC_PROFILE_KEY
    ) {
      initFromStorage();
      return;
    }

    if (event.key !== REFRESH_TOKEN_KEY) {
      return;
    }

    if (!event.newValue) {
      clearTokens();
      return;
    }

    if (!hasValidAccessToken(ACCESS_TOKEN_FOCUS_WINDOW_MS)) {
      void refreshSessionFromForeground();
    }
  };

  const startSilentRefresh = () => {
    if (FRONTEND_ONLY_MODE) {
      return;
    }

    if (lifecycleStarted || typeof window === "undefined") {
      return;
    }

    lifecycleStarted = true;
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowFocus);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (accessToken.value) {
      scheduleSilentRefresh(accessToken.value);
    }
  };

  const bootstrapAuthSession = async () => {
    initFromStorage();
    if (FRONTEND_ONLY_MODE) {
      const frontendAccessToken = restoreFrontendOnlySession();
      sessionReady.value = true;
      return frontendAccessToken || accessToken.value;
    }

    startSilentRefresh();

    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    if (!getRefreshToken()) {
      sessionReady.value = true;
      return accessToken.value;
    }

    bootstrapPromise = ensureValidAccessToken(0).finally(() => {
      bootstrapPromise = null;
      sessionReady.value = true;
    });

    return bootstrapPromise;
  };

  return {
    accessToken,
    accessTokenExpiresAt,
    isRefreshingToken,
    sessionReady,
    lastTokenRefreshAt,
    userrole,
    userid,
    username,
    email,
    phone,
    companyid,
    companyIdentityStatus,
    companyIdentityVerifiedAt,
    primaryGroupId,
    groupIds,
    permissions,
    isSystemReserved,
    companyname,
    companyRecordId,
    companyPublicId,
    plan,
    maxusers,
    maxcustomers,
    aicalls,
    isactive,
    founderUserId,
    rolePasscodesConfigured,
    rolePasscodesConfiguredAt,
    workspaceRules,
    aiGateway,
    rbacVersion,
    roleLabel,
    roleMatrix,
    founderNeedsRolePasscodeSetup: computed(
      () =>
        Boolean(userid.value)
        && normalizeStoredRole(userrole.value) === "admin"
        && founderUserId.value === userid.value
        && companyIdentityStatus.value === "verified"
        && !rolePasscodesConfigured.value,
    ),
    companyIdentityVerified: computed(() => companyIdentityStatus.value === "verified"),
    needsCompanyVerification: computed(() => companyIdentityStatus.value !== "verified"),
    canManageWorkspaceRolePasscodes: computed(() => normalizeStoredRole(userrole.value) === "admin"),
    setTokens,
    setAccessToken,
    setRefreshToken,
    getAccessToken,
    getRefreshToken,
    setUserInfo,
    setWorkspaceRules,
    setWorkspaceAiGateway,
    setRbacProfile,
    getUserInfo,
    getCompanyInfo,
    getRbacProfile,
    hasValidAccessToken,
    hasPermission,
    hasAnyPermission,
    isLogedIn,
    clearTokens,
    enableFrontendOnlySession,
    initFromStorage,
    ensureValidAccessToken,
    refreshAccessToken,
    startSilentRefresh,
    bootstrapAuthSession,
  };
});
