import type { Page, Route } from "@playwright/test";

export interface E2eSessionOptions {
  permissions?: string[];
  role?: string;
  roleLabel?: string;
  username?: string;
  email?: string;
  companyId?: string;
  companyName?: string;
}

export interface E2eSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    userrole: string;
    username: string;
    email: string;
    companyid: string;
    permissions: string[];
  };
  company: {
    name: string;
    plan: string;
    maxusers: number;
    maxcustomers: number;
    aicalls: number;
    isactive: boolean;
  };
  rbac: {
    version: string;
    currentRole: string;
    roleLabel: string;
    permissions: string[];
    roles: Array<{
      role: string;
      label: string;
      description: string;
      permissions: string[];
    }>;
  };
}

const DEFAULT_PERMISSIONS = [
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.soft_delete",
  "customers.delete",
  "customers.restore",
  "customers.tags.manage",
  "followups.create",
  "notifications.view",
  "notifications.manage",
  "reports.view",
  "admin.access",
];

const encodeBase64Url = (value: string) => Buffer.from(value).toString("base64url");

export const createApiEnvelope = <T>(data: T, code = 200, message = "OK") => ({
  code,
  message,
  data,
});

export const buildFakeJwt = (expiresInSeconds = 60 * 60) => {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: "e2e-user",
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  );

  return `${header}.${payload}.e2e-signature`;
};

export const createSessionPayload = (options: E2eSessionOptions = {}): E2eSessionPayload => {
  const permissions = options.permissions?.length ? [...options.permissions] : [...DEFAULT_PERMISSIONS];
  const role = options.role || "admin";
  const roleLabel = options.roleLabel || "Admin";
  const username = options.username || "E2E Admin";
  const email = options.email || "e2e.admin@salepilot.test";
  const companyId = options.companyId || "company-e2e";

  return {
    accessToken: buildFakeJwt(),
    refreshToken: "refresh-token-e2e",
    user: {
      userrole: role,
      username,
      email,
      companyid: companyId,
      permissions,
    },
    company: {
      name: options.companyName || "SalePilot Labs",
      plan: "pro",
      maxusers: 20,
      maxcustomers: 5000,
      aicalls: 120,
      isactive: true,
    },
    rbac: {
      version: "e2e-v1",
      currentRole: role,
      roleLabel,
      permissions,
      roles: [
        {
          role,
          label: roleLabel,
          description: "E2E session role",
          permissions,
        },
      ],
    },
  };
};

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

export async function seedAuthenticatedSession(page: Page, session: E2eSessionPayload) {
  await page.addInitScript((payload: E2eSessionPayload) => {
    localStorage.setItem("refresh_token", payload.refreshToken);
    localStorage.setItem("user_info", JSON.stringify(payload.user));
    localStorage.setItem("company_info", JSON.stringify(payload.company));
    localStorage.setItem("rbac_profile", JSON.stringify(payload.rbac));
    localStorage.setItem("user_role", payload.user.userrole);
    localStorage.setItem("username", payload.user.username);
  }, session);
}

export async function mockRefreshRoute(page: Page, session: E2eSessionPayload) {
  await page.route("**/api/auth/refresh", async (route) => {
    await fulfillJson(
      route,
      createApiEnvelope({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        company: session.company,
        rbac: session.rbac,
      }),
    );
  });
}
