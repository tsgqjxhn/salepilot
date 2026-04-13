export type AdminUserRole = "user" | "manager" | "admin";

export interface AdminManagedUser {
  id: string;
  username: string;
  email: string;
  phone?: string | null;
  userrole: AdminUserRole;
  roleLabel: string;
  permissions: string[];
  companyid: string;
  isSystemReserved: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminRoleMatrixEntry {
  role: AdminUserRole;
  label: string;
  description: string;
  permissions: string[];
}

export interface AdminUserRoleCounts {
  user: number;
  manager: number;
  admin: number;
}

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  plan: string;
  isactive: boolean;
  workspaceRules: {
    managerSharedCustomersEnabled: boolean;
    managerTaskDelegationEnabled: boolean;
    managerReportingEnabled: boolean;
  };
  aiGateway: {
    useCustomProvider: boolean;
    providerType: string;
    providerLabel: string;
    protocol: string;
    baseURL: string;
    model: string;
    configured: boolean;
    maskedApiKey: string;
    customHeaders: Record<string, string>;
    enterprise: {
      enabled: boolean;
      deploymentMode: "public" | "vpc" | "private-cloud" | "on-premise";
      dataIsolation: boolean;
      zeroDataRetention: boolean;
      auditLogging: boolean;
      ssoEnabled: boolean;
      privateEndpoint: string;
      region: string;
      monthlyBudgetUsd: number;
      rateLimitPerMinute: number;
    };
  };
}

export interface AdminUserListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUserListSummary {
  totalUsers: number;
  filteredUsers: number;
  roleCounts: AdminUserRoleCounts;
  seatsUsed: number;
  maxUsers: number;
  seatsRemaining: number;
  includeSystemReserved: boolean;
  availableRoles: AdminRoleMatrixEntry[];
  workspace: AdminWorkspaceSummary | null;
}

export interface AdminUserListResponse {
  list: AdminManagedUser[];
  pagination: AdminUserListPagination;
  summary: AdminUserListSummary;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminUserRole;
  includeSystemReserved?: boolean;
}

export interface AdminUserRoleUpdatePayload {
  userrole: AdminUserRole;
}

export interface AdminUserRoleMutationResponse {
  changed: boolean;
  user: AdminManagedUser;
}

export interface AdminWorkspaceRulesPayload {
  workspaceRules: Partial<AdminWorkspaceSummary["workspaceRules"]>;
}

export interface AdminWorkspaceRulesMutationResponse {
  workspace: AdminWorkspaceSummary;
}

export interface AdminWorkspaceAiPayload {
  aiGateway: {
    useCustomProvider: boolean;
    providerType: string;
    baseURL: string;
    apiKey?: string;
    model: string;
    customHeaders?: Record<string, string>;
    enterprise?: AdminWorkspaceSummary["aiGateway"]["enterprise"];
  };
}

export interface AdminWorkspaceAiMutationResponse {
  workspace: AdminWorkspaceSummary;
}
