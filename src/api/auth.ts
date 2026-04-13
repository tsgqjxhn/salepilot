import type { AxiosPromise } from "axios";
import request from "@/utils/request";

export interface AuthUserRecord {
  id: string;
  username: string;
  email: string;
  phone?: string;
  userrole: string;
  permissions: string[];
  companyid: string;
  companyIdentityStatus: "verified" | "pending";
  companyIdentityVerifiedAt?: string | null;
  primaryGroupId?: string | null;
  groupIds?: string[];
  isSystemReserved?: boolean;
}

export interface AuthCompanyRecord {
  id: string;
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
  aiGateway?: WorkspaceAiSummary;
}

export interface WorkspaceAiSummary {
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
}

export interface AuthRoleMatrixEntry {
  role: string;
  label: string;
  description: string;
  permissions: string[];
}

export interface AuthRbacProfile {
  version: string;
  currentRole: string;
  roleLabel: string;
  permissions: string[];
  roles: AuthRoleMatrixEntry[];
}

export interface AuthPayload {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUserRecord;
  company?: AuthCompanyRecord;
  rbac?: AuthRbacProfile;
}

export interface UpdateCurrentUserProfilePayload {
  username?: string;
  email?: string;
  phone?: string;
}

export interface WorkspaceRolePasscodesPayload {
  user?: string;
  manager?: string;
  admin?: string;
}

export interface CompleteWorkspaceOnboardingPayload {
  desiredRole?: "user" | "manager" | "admin";
  rolePasscode?: string;
  rolePasscodes?: WorkspaceRolePasscodesPayload;
}

export interface CompanySearchRecord {
  id: string;
  name: string;
  publicId?: string;
  plan: string;
  maxusers: number;
  maxcustomers: number;
  aicalls?: number;
  isactive?: boolean;
}

export interface CompanyGroupRecord {
  id: string;
  companyid: string;
  name: string;
  description: string;
  leaderIds: string[];
  memberIds: string[];
  memberCount: number;
  isArchived: boolean;
  isLeader: boolean;
  canManage: boolean;
  canInvite: boolean;
  invitePolicy: {
    membersCanInvite: boolean;
    specificInviterIds: string[];
    minimumInviterRole: "none" | "user" | "manager" | "admin";
  };
}

export interface CompanyAccessRequestRecord {
  id: string;
  companyid: string;
  userId: string;
  username: string;
  email: string;
  phone: string;
  requestedRole: "user" | "manager" | "admin";
  targetGroupId: string | null;
  targetGroupName: string;
  status: "pending" | "approved" | "rejected";
  requestMode: "approval" | "invite-key";
  note: string;
  reviewedByUserId: string | null;
  reviewedByUsername: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  decisionAt?: string | null;
}

export interface CompanyAccessKeyRecord {
  id: string;
  token: string;
  expiresAt: string;
  targetGroupId: string | null;
  targetGroupName: string;
  allowGroupChoice: boolean;
}

export interface CompanyAccessContextResponse {
  companyIdentityStatus: "verified" | "pending";
  verified: boolean;
  companyAccess: {
    company: AuthCompanyRecord | null;
    groups: CompanyGroupRecord[];
    pendingRequest: CompanyAccessRequestRecord | null;
  };
}

export interface WorkspaceOverviewResponse {
  workspace: {
    company: AuthCompanyRecord;
    membership: {
      role: "user" | "manager" | "admin";
      roleLabel: string;
      companyIdentityStatus: "verified" | "pending";
      companyIdentityVerifiedAt?: string | null;
      primaryGroupId?: string | null;
      primaryGroupName?: string;
    };
    usage: {
      seatsUsed: number;
      seatsRemaining: number;
      customersUsed: number;
      customersRemaining: number;
    };
  };
}

export function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload,
): AxiosPromise<AuthPayload> {
  return request({
    url: "/auth/me",
    method: "patch",
    data: payload,
  });
}

export function changeCurrentUserCompany(payload: {
  mode: "create" | "join";
  companyName?: string;
  companyPublicId?: string;
}): AxiosPromise<AuthPayload & { companyAccess?: CompanyAccessContextResponse["companyAccess"] }> {
  return request({
    url: "/auth/me/company",
    method: "post",
    data: payload,
  });
}

export function switchDebugAccountRole(userrole: "user" | "manager" | "admin"): AxiosPromise<AuthPayload> {
  return request({
    url: "/auth/debug/switch-role",
    method: "post",
    data: { userrole },
  });
}

export function completeWorkspaceOnboarding(
  payload: CompleteWorkspaceOnboardingPayload,
): AxiosPromise<AuthPayload> {
  return request({
    url: "/auth/onboarding/complete",
    method: "post",
    data: payload,
  });
}

export function updateWorkspaceRolePasscodes(
  payload: { rolePasscodes: WorkspaceRolePasscodesPayload },
): AxiosPromise<AuthPayload> {
  return request({
    url: "/auth/workspace/role-passcodes",
    method: "patch",
    data: payload,
  });
}

export function searchCompanies(params: {
  q?: string;
  companyPublicId?: string;
  limit?: number;
}): AxiosPromise<{ companies: CompanySearchRecord[] }> {
  return request({
    url: "/auth/companies/search",
    method: "get",
    params,
  });
}

export function getCompanyAccessContext(): AxiosPromise<CompanyAccessContextResponse> {
  return request({
    url: "/auth/company-access/context",
    method: "get",
  });
}

export function getWorkspaceOverview(): AxiosPromise<WorkspaceOverviewResponse> {
  return request({
    url: "/auth/workspace-overview",
    method: "get",
  });
}

export function selectCompanyAccessTarget(payload: {
  companyName?: string;
  companyPublicId?: string;
}): AxiosPromise<AuthPayload & { companyAccess: CompanyAccessContextResponse["companyAccess"] }> {
  return request({
    url: "/auth/company-access/target",
    method: "post",
    data: payload,
  });
}

export function submitCompanyAccessRequest(payload: {
  targetGroupId: string;
  note?: string;
}): AxiosPromise<{ message: string; request: CompanyAccessRequestRecord }> {
  return request({
    url: "/auth/company-access/request",
    method: "post",
    data: payload,
  });
}

export function listCompanyAccessRequests(params?: {
  status?: "pending" | "approved" | "rejected";
}): AxiosPromise<{ requests: CompanyAccessRequestRecord[] }> {
  return request({
    url: "/auth/company-access/requests",
    method: "get",
    params,
  });
}

export function approveCompanyAccessRequest(id: string): AxiosPromise<{ message: string; request: CompanyAccessRequestRecord }> {
  return request({
    url: `/auth/company-access/requests/${id}/approve`,
    method: "post",
  });
}

export function rejectCompanyAccessRequest(id: string): AxiosPromise<{ message: string; request: CompanyAccessRequestRecord }> {
  return request({
    url: `/auth/company-access/requests/${id}/reject`,
    method: "post",
  });
}

export function createCompanyAccessKey(payload: {
  targetGroupId?: string;
  allowGroupChoice?: boolean;
}): AxiosPromise<{ message: string; key: CompanyAccessKeyRecord }> {
  return request({
    url: "/auth/company-access/keys",
    method: "post",
    data: payload,
  });
}

export function redeemCompanyAccessKey(payload: {
  token: string;
  targetGroupId?: string;
}): AxiosPromise<AuthPayload & { companyAccess: CompanyAccessContextResponse["companyAccess"] }> {
  return request({
    url: "/auth/company-access/redeem-key",
    method: "post",
    data: payload,
  });
}

export interface AccessibleCompanyRecord {
  id: string;
  name: string;
  publicId?: string;
  plan: string;
  maxusers: number;
  maxcustomers: number;
  aicalls?: number;
  isactive?: boolean;
  isCurrent: boolean;
}

export interface AccessibleCompaniesResponse {
  companies: AccessibleCompanyRecord[];
  currentCompanyId: string;
}

export function getAccessibleCompanies(): AxiosPromise<AccessibleCompaniesResponse> {
  return request({
    url: "/auth/accessible-companies",
    method: "get",
  });
}

export function switchCompany(payload: {
  companyId: string;
}): AxiosPromise<AuthPayload> {
  return request({
    url: "/auth/switch-company",
    method: "post",
    data: payload,
  });
}
