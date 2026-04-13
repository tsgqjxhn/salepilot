import type { AxiosPromise } from "axios";
import request from "@/utils/request";

export interface GroupMemberRecord {
  id: string;
  username: string;
  email: string;
  phone?: string | null;
  userrole: "user" | "manager" | "admin";
}

export interface GroupRecord {
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
  members: GroupMemberRecord[];
}

export interface GroupMessageRecord {
  id: string;
  groupId: string;
  companyid: string;
  authorId: string;
  authorName: string;
  authorRole: "user" | "manager" | "admin";
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GroupFileRecord {
  id: string;
  groupId: string;
  companyid: string;
  uploaderId: string;
  uploaderName: string;
  filename: string;
  mimeType: string;
  size: number;
  contentBase64: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function getGroups(): AxiosPromise<{ groups: GroupRecord[] }> {
  return request({
    url: "/groups",
    method: "get",
  });
}

export function createGroup(payload: {
  name: string;
  description?: string;
}): AxiosPromise<{ message: string; group: GroupRecord }> {
  return request({
    url: "/groups",
    method: "post",
    data: payload,
  });
}

export function updateGroup(
  id: string,
  payload: {
    name?: string;
    description?: string;
    leaderIds?: string[];
    invitePolicy?: {
      membersCanInvite?: boolean;
      specificInviterIds?: string[];
      minimumInviterRole?: "none" | "user" | "manager" | "admin";
    };
  },
): AxiosPromise<{ message: string; group: GroupRecord }> {
  return request({
    url: `/groups/${id}`,
    method: "patch",
    data: payload,
  });
}

export function getGroupMessages(id: string, params?: { limit?: number }): AxiosPromise<{ messages: GroupMessageRecord[] }> {
  return request({
    url: `/groups/${id}/messages`,
    method: "get",
    params,
  });
}

export function sendGroupMessage(id: string, payload: {
  content: string;
}): AxiosPromise<{ message: string; groupMessage: GroupMessageRecord }> {
  return request({
    url: `/groups/${id}/messages`,
    method: "post",
    data: payload,
  });
}

export function getGroupFiles(id: string): AxiosPromise<{ files: GroupFileRecord[] }> {
  return request({
    url: `/groups/${id}/files`,
    method: "get",
  });
}

export function uploadGroupFile(id: string, payload: {
  filename: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}): AxiosPromise<{ message: string; file: GroupFileRecord }> {
  return request({
    url: `/groups/${id}/files`,
    method: "post",
    data: payload,
  });
}
