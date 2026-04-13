import type { AxiosPromise } from "axios";
import request from "@/utils/request";
import type { ApiResponse } from "@/api/customer";
import type {
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserRoleMutationResponse,
  AdminUserRoleUpdatePayload,
  AdminWorkspaceAiMutationResponse,
  AdminWorkspaceAiPayload,
  AdminWorkspaceRulesMutationResponse,
  AdminWorkspaceRulesPayload,
} from "@/types/admin";

export function getAdminUserList(
  params: AdminUserListParams = {},
): AxiosPromise<ApiResponse<AdminUserListResponse>> {
  return request({
    url: "/admin/users",
    method: "get",
    params,
  });
}

export function updateAdminUserRole(
  id: string,
  payload: AdminUserRoleUpdatePayload,
): AxiosPromise<ApiResponse<AdminUserRoleMutationResponse>> {
  return request({
    url: `/admin/users/${id}/role`,
    method: "patch",
    data: payload,
  });
}

export function updateWorkspaceRules(
  payload: AdminWorkspaceRulesPayload,
): AxiosPromise<ApiResponse<AdminWorkspaceRulesMutationResponse>> {
  return request({
    url: "/admin/workspace/rules",
    method: "patch",
    data: payload,
  });
}

export function updateWorkspaceAiGateway(
  payload: AdminWorkspaceAiPayload,
): AxiosPromise<ApiResponse<AdminWorkspaceAiMutationResponse>> {
  return request({
    url: "/admin/workspace/ai",
    method: "patch",
    data: payload,
  });
}
