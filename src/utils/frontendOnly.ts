const normalizeBoolean = (value: unknown, fallback: boolean) => {
  const normalizedValue = String(value ?? "").trim().toLowerCase();

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

export const FRONTEND_ONLY_MODE = normalizeBoolean(import.meta.env.VITE_FRONTEND_ONLY_MODE, true);
export const FRONTEND_ONLY_WORKSPACE_ROUTE = "/workspace";
export const FRONTEND_ONLY_SESSION_STORAGE_KEY = "salepilot_frontend_only_session";

const FRONTEND_ONLY_PERMISSIONS = [
  "admin.access",
  "users.manage",
  "groups.view",
  "notifications.view",
  "reports.view",
  "customers.view",
  "customers.restore",
  "customers.tags.manage",
  "customers.create",
  "customers.assign",
  "followups.create",
  "ai.analysis.run",
];

export const isFrontendOnlySessionStored = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(FRONTEND_ONLY_SESSION_STORAGE_KEY) === "1";
};

export const setFrontendOnlySessionStored = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    localStorage.setItem(FRONTEND_ONLY_SESSION_STORAGE_KEY, "1");
    return;
  }

  localStorage.removeItem(FRONTEND_ONLY_SESSION_STORAGE_KEY);
};

export const buildFrontendOnlySessionSeed = (overrides?: {
  username?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
}) => {
  const normalizedUsername = String(overrides?.username || "").trim() || "demo";
  const normalizedCompanyName = String(overrides?.companyName || "").trim() || "SalePilot Static Workspace";
  const normalizedEmail = String(overrides?.email || "").trim() || `${normalizedUsername}@salepilot.local`;
  const normalizedPhone = String(overrides?.phone || "").trim() || "13800138000";

  return {
    accessToken: "frontend-only-static-session",
    user: {
      id: "frontend-only-user",
      userrole: "admin",
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      companyid: "frontend-only-company",
      companyIdentityStatus: "verified" as const,
      companyIdentityVerifiedAt: new Date().toISOString(),
      primaryGroupId: "frontend-only-group",
      groupIds: ["frontend-only-group"],
      permissions: [...FRONTEND_ONLY_PERMISSIONS],
      isSystemReserved: false,
    },
    company: {
      id: "frontend-only-company-record",
      name: normalizedCompanyName,
      publicId: "SP-STATIC001",
      plan: "pro",
      maxusers: 25,
      maxcustomers: 2000,
      aicalls: 5000,
      isactive: true,
      founderUserId: "frontend-only-user",
      rolePasscodesConfigured: true,
      rolePasscodesConfiguredAt: new Date().toISOString(),
      workspaceRules: {
        managerSharedCustomersEnabled: true,
        managerTaskDelegationEnabled: true,
        managerReportingEnabled: true,
      },
      aiGateway: {
        useCustomProvider: false,
        providerType: "openai",
        providerLabel: "OpenAI",
        protocol: "openai",
        baseURL: "",
        model: "gpt-5.4-mini",
        configured: false,
        maskedApiKey: "",
        customHeaders: {},
        enterprise: {
          enabled: false,
          deploymentMode: "public" as const,
          dataIsolation: true,
          zeroDataRetention: true,
          auditLogging: true,
          ssoEnabled: false,
          privateEndpoint: "",
          region: "global",
          monthlyBudgetUsd: 0,
          rateLimitPerMinute: 0,
        },
      },
    },
    rbac: {
      version: "frontend-only",
      currentRole: "admin",
      roleLabel: "Administrator",
      permissions: [...FRONTEND_ONLY_PERMISSIONS],
      roles: [
        {
          role: "user",
          label: "Workspace Member",
          description: "Own personal follow-ups, reminders, and customer execution tasks.",
          permissions: ["customers.view", "followups.create"],
        },
        {
          role: "manager",
          label: "Sales Manager",
          description: "Review shared visibility, reporting, and coordination flows.",
          permissions: ["customers.view", "customers.assign", "reports.view", "groups.view"],
        },
        {
          role: "admin",
          label: "Administrator",
          description: "Control workspace governance, access, and static demo mode.",
          permissions: [...FRONTEND_ONLY_PERMISSIONS],
        },
      ],
    },
  };
};
