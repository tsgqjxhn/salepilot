/**
 * Customer management API helpers.
 * This module provides the client-side request wrappers used by the customer workspace.
 */

import request from "@/utils/request";
import type { AxiosPromise, AxiosResponse } from "axios";
import type { FollowupChannel } from "@/utils/followup";
import type { CustomerAiAnalysisResponse, TriggerCustomerAiAnalysisPayload } from "@/types/ai";

// Type definitions

/** Supported customer types. */
export type CustomerType = "individual" | "enterprise";

/** Supported customer lifecycle states. */
export type CustomerStatus = "potential" | "active" | "dormant" | "lost";

/** Supported customer tiers. */
export type CustomerLevel = "A" | "B" | "C" | "D";

/** Supported customer acquisition sources. */
export type CustomerSource =
  | "advertisement"
  | "referral"
  | "exhibition"
  | "internet"
  | "coldcall"
  | "other";

/** Supported billing currencies. */
export type Currency = "CNY" | "USD" | "EUR" | "GBP" | "JPY" | "HKD" | "TWD" | "KRW" | "AUD" | "CAD";

/** Supported follow-up activity types. */
export type FollowupType = "call" | "meeting" | "email" | "visit" | "task" | "wechat" | "sms" | "note" | "other";

/** Supported follow-up statuses. */
export type FollowupStatus = "scheduled" | "completed" | "cancelled" | "missed";

/** Supported follow-up priorities. */
export type FollowupPriority = "low" | "medium" | "high" | "urgent";

/** Core customer record returned by the backend. */
export interface Customer {
  _id: string;
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  industry?: string;
  source: CustomerSource;
  level: CustomerLevel;
  owner?: {
    _id: string;
    username: string;
    email: string;
    userrole: string;
  };
  company?: {
    _id: string;
    name: string;
    plan: string;
  };
  annualRevenue?: number;
  employeeCount?: number;
  currency: Currency;
  wechat?: string;
  qq?: string;
  linkedin?: string;
  twitter?: string;
  description?: string;
  remark?: string;
  tags?: string[];
  lastContactDate?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Query parameters accepted by customer list endpoints. */
export interface CustomerListParams {
  page?: number;
  limit?: number;
  scope?: "mine" | "company";
  keyword?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  level?: CustomerLevel;
  source?: CustomerSource;
  tag?: string;
  industry?: string;
  owner?: string;
  company?: string;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

/** Payload used to create or update a customer record. */
export interface CustomerFormData {
  name: string;
  type?: CustomerType;
  status?: CustomerStatus;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  industry?: string;
  source?: CustomerSource;
  level?: CustomerLevel;
  annualRevenue?: number;
  employeeCount?: number;
  currency?: Currency;
  wechat?: string;
  qq?: string;
  linkedin?: string;
  twitter?: string;
  description?: string;
  remark?: string;
  tags?: string[];
  lastContactDate?: string;
}

/** Payload used to transition a customer to a new status. */
export interface CustomerStatusTransitionPayload {
  status: CustomerStatus;
  reason?: string;
  nextStep?: string;
}

/** Payload used to assign multiple customers to a new owner. */
export interface BatchCustomerAssignPayload {
  ids: string[];
  ownerId: string;
}

/** Response payload returned by the batch assign endpoint. */
export interface BatchCustomerAssignResponse {
  ids: string[];
  requestedCount: number;
  matchedCount: number;
  assignedCount: number;
  owner: {
    _id: string;
    username: string;
    email: string;
    userrole: string;
  };
}

/** Delete mode supported by the batch delete endpoint. */
export type BatchDeleteMode = "hard" | "soft";

/** Export formats supported by the customer export endpoint. */
export type CustomerExportFormat = "csv" | "excel";

/** Response payload returned by the batch delete endpoint. */
export interface BatchCustomerDeleteResponse {
  ids: string[];
  mode: BatchDeleteMode;
  requestedCount: number;
  deletedCount: number;
  skippedCount?: number;
}

/** Detail payload returned by the customer detail endpoint. */
export interface CustomerDetailResponse {
  customer: Customer;
  statistics: {
    contactCount: number;
    opportunityCount: number;
    activityCount: number;
    totalAmount: number;
  };
  contacts: unknown[];
  recentActivities: unknown[];
  opportunities: unknown[];
  recentOrders: unknown[];
  dynamics: {
    recentFollowUps: unknown[];
    recentOrderInfo: unknown[];
    statusChangeHistory: unknown[];
  };
}

/** Response payload returned by the status transition endpoint. */
export interface CustomerStatusTransitionResponse {
  customer: Customer;
  previousStatus: CustomerStatus;
  currentStatus: CustomerStatus;
  allowedNextStatuses: CustomerStatus[];
}

/** Customer tag record returned by the tag management endpoints. */
export interface CustomerTagRecord {
  _id: string;
  name: string;
  normalizedName: string;
  usageCount: number;
  activeCustomerCount: number;
  archivedCustomerCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Aggregated tag summary used by the tag management page. */
export interface CustomerTagSummary {
  totalTags: number;
  usedTags: number;
  unusedTags: number;
  activeAssignments: number;
  archivedAssignments: number;
}

/** Tag list response returned by the tag management endpoint. */
export interface CustomerTagListResponse {
  list: CustomerTagRecord[];
  summary: CustomerTagSummary;
}

/** Follow-up record returned by the follow-up create endpoint. */
export interface FollowupRecord {
  _id: string;
  title: string;
  type: FollowupType;
  status: FollowupStatus;
  priority: FollowupPriority;
  channel?: FollowupChannel;
  scheduledAt: string;
  completedAt?: string;
  remindAt?: string;
  remindBy?: "system" | "email" | "sms" | "wechat";
  duration?: number;
  customer: string;
  contact?: {
    _id: string;
    name: string;
    mobile?: string;
    email?: string;
  };
  opportunity?: {
    _id: string;
    name: string;
    stage?: string;
  };
  order?: {
    _id: string;
    orderNo: string;
    status?: string;
  };
  owner?: {
    _id: string;
    username: string;
    email: string;
    userrole?: string;
  };
  participants?: Array<{
    _id: string;
    username: string;
    email: string;
  }>;
  description?: string;
  outcome?: string;
  nextStep?: string;
  nextFollowupAt?: string;
  location?: string;
  tags?: string[];
  attachments?: Array<{
    name?: string;
    url?: string;
    size?: number;
    type?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/** Payload used to create a customer follow-up. */
export interface FollowupCreatePayload {
  title: string;
  type?: FollowupType;
  status?: FollowupStatus;
  priority?: FollowupPriority;
  channel?: FollowupChannel;
  scheduledAt: string;
  ownerId?: string;
  completedAt?: string;
  remindAt?: string;
  remindBy?: "system" | "email" | "sms" | "wechat";
  duration?: number;
  contact?: string;
  opportunity?: string;
  order?: string;
  description?: string;
  outcome?: string;
  nextStep?: string;
  nextFollowupAt?: string;
  location?: string;
  participants?: string[];
  tags?: string[];
  attachments?: Array<{
    name?: string;
    url?: string;
    size?: number;
    type?: string;
  }>;
}

/** Query parameters accepted by the grouped follow-up list endpoint. */
export interface GroupedFollowupListParams {
  page?: number;
  limit?: number;
  itemLimit?: number;
  keyword?: string;
  status?: FollowupStatus;
  type?: FollowupType;
  priority?: FollowupPriority;
  ownerId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  overdueOnly?: boolean;
}

/** Lightweight customer summary returned in a grouped follow-up bucket. */
export interface FollowupGroupCustomer {
  _id: string;
  name: string;
  type?: CustomerType;
  status?: CustomerStatus;
  level?: CustomerLevel;
  owner?: Customer["owner"];
  tags?: string[];
  lastContactDate?: string;
  deleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Per-customer grouped follow-up summary. */
export interface FollowupGroupSummary {
  total: number;
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  missedCount: number;
  overdueCount: number;
  latestScheduledAt?: string | null;
  nextScheduledAt?: string | null;
}

/** Group bucket returned by the grouped follow-up list endpoint. */
export interface FollowupCustomerGroup {
  customer: FollowupGroupCustomer;
  summary: FollowupGroupSummary;
  followups: FollowupRecord[];
}

/** Aggregated response payload returned by the grouped follow-up list endpoint. */
export interface GroupedFollowupListResponse {
  list: FollowupCustomerGroup[];
  total: number;
  page: number;
  limit: number;
  itemLimit: number;
  summary: {
    followupCount: number;
    scheduledCount: number;
    completedCount: number;
    cancelledCount: number;
    missedCount: number;
    overdueCount: number;
  };
}

/** Supported event types returned by the customer timeline endpoint. */
export type CustomerTimelineEventType =
  | "customer"
  | "activity"
  | "status_change"
  | "followup"
  | "opportunity"
  | "order";

/** Query parameters accepted by the customer timeline endpoint. */
export interface CustomerTimelineParams {
  page?: number;
  limit?: number;
  types?: CustomerTimelineEventType[];
  startDate?: string;
  endDate?: string;
}

/** Timeline actor summary. */
export interface CustomerTimelineActor {
  _id?: string;
  username?: string;
  email?: string;
  userrole?: string;
}

/** Timeline related entity summary. */
export interface CustomerTimelineRelatedEntity {
  _id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  stage?: string;
  orderNo?: string;
  status?: string;
}

/** Single event returned by the customer timeline endpoint. */
export interface CustomerTimelineItem {
  id: string;
  sourceId: string;
  sourceModel: "Customer" | "Activity" | "Followup" | "Opportunity" | "Order";
  eventType: CustomerTimelineEventType;
  occurredAt: string | null;
  createdAt: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  subtype?: string | null;
  actor?: CustomerTimelineActor | null;
  related?: {
    contact?: CustomerTimelineRelatedEntity | null;
    opportunity?: CustomerTimelineRelatedEntity | null;
    order?: CustomerTimelineRelatedEntity | null;
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/** Response payload returned by the customer timeline endpoint. */
export interface CustomerTimelineResponse {
  customer: Customer;
  list: CustomerTimelineItem[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalEvents: number;
    customerCount: number;
    activityCount: number;
    statusChangeCount: number;
    followupCount: number;
    opportunityCount: number;
    orderCount: number;
  };
}

/** Generic list response returned by list endpoints. */
export interface ListResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

/** Generic backend API response envelope. */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// API methods

/** Load the active customer list. */
export function getCustomerList(params: CustomerListParams): AxiosPromise<ApiResponse<ListResponse<Customer>>> {
  return request({
    url: "/customers",
    method: "get",
    params,
  });
}

/** Load a single customer by id. */
export function getCustomerDetail(id: string): AxiosPromise<ApiResponse<CustomerDetailResponse>> {
  return request({
    url: `/customers/${id}`,
    method: "get",
  });
}

/** Load the unified timeline for a customer. */
export function getCustomerTimeline(
  id: string,
  params: CustomerTimelineParams = {},
): AxiosPromise<ApiResponse<CustomerTimelineResponse>> {
  return request({
    url: `/customers/${id}/timeline`,
    method: "get",
    params: {
      ...params,
      types: Array.isArray(params.types) ? params.types.join(",") : undefined,
    },
  });
}

/** Create a new customer record. */
export function createCustomer(data: CustomerFormData): AxiosPromise<ApiResponse<Customer>> {
  return request({
    url: "/customers",
    method: "post",
    data,
  });
}

/** Update an existing customer record. */
export function updateCustomer(id: string, data: CustomerFormData): AxiosPromise<ApiResponse<Customer>> {
  return request({
    url: `/customers/${id}`,
    method: "put",
    data,
  });
}

/** Transition a customer to a new lifecycle status. */
export function transitionCustomerStatus(
  id: string,
  data: CustomerStatusTransitionPayload,
): AxiosPromise<ApiResponse<CustomerStatusTransitionResponse>> {
  return request({
    url: `/customers/${id}/status`,
    method: "patch",
    data,
  });
}

/** Permanently delete a customer record. */
export function deleteCustomer(id: string): AxiosPromise<ApiResponse<{ id: string }>> {
  return request({
    url: `/customers/${id}`,
    method: "delete",
  });
}

/** Archive a customer record without removing it permanently. */
export function softDeleteCustomer(id: string): AxiosPromise<ApiResponse<{ id: string; deletedAt: string }>> {
  return request({
    url: `/customers/${id}/soft`,
    method: "delete",
  });
}

/** Restore a previously archived customer record. */
export function restoreCustomer(id: string): AxiosPromise<ApiResponse<Customer>> {
  return request({
    url: `/customers/${id}/restore`,
    method: "put",
  });
}

/** Load archived customer records. */
export function getDeletedCustomers(params: CustomerListParams): AxiosPromise<ApiResponse<ListResponse<Customer>>> {
  return request({
    url: "/customers/deleted",
    method: "get",
    params,
  });
}

/** Permanently delete multiple customer records. */
export function batchDeleteCustomers(
  ids: string[],
  mode: BatchDeleteMode = "hard",
): AxiosPromise<ApiResponse<BatchCustomerDeleteResponse>> {
  return request({
    url: "/customers/batch",
    method: "delete",
    data: { ids, mode },
  });
}

/** Assign multiple customers to a new owner. */
export function batchAssignCustomers(
  data: BatchCustomerAssignPayload,
): AxiosPromise<ApiResponse<BatchCustomerAssignResponse>> {
  return request({
    url: "/customers/batch/assign",
    method: "patch",
    data,
  });
}

/** Load the customer tag library for the current company. */
export function getCustomerTags(): AxiosPromise<ApiResponse<CustomerTagListResponse>> {
  return request({
    url: "/customers/tags",
    method: "get",
  });
}

/** Create a new customer tag. */
export function createCustomerTag(name: string): AxiosPromise<ApiResponse<CustomerTagRecord>> {
  return request({
    url: "/customers/tags",
    method: "post",
    data: { name },
  });
}

/** Rename an existing customer tag. */
export function updateCustomerTag(
  id: string,
  name: string,
): AxiosPromise<ApiResponse<{ tag: CustomerTagRecord; modifiedCustomerCount: number }>> {
  return request({
    url: `/customers/tags/${id}`,
    method: "patch",
    data: { name },
  });
}

/** Delete a customer tag and remove it from related customers. */
export function deleteCustomerTag(
  id: string,
): AxiosPromise<ApiResponse<{ id: string; modifiedCustomerCount: number }>> {
  return request({
    url: `/customers/tags/${id}`,
    method: "delete",
  });
}

/** Export customers matching the current filters as CSV or Excel. */
export function exportCustomers(
  params: CustomerListParams,
  format: CustomerExportFormat,
): Promise<AxiosResponse<Blob>> {
  return request({
    url: "/customers/export",
    method: "get",
    params: {
      ...params,
      format,
    },
    responseType: "blob",
  });
}

/** Create a follow-up record for a customer. */
export function createCustomerFollowup(
  customerId: string,
  data: FollowupCreatePayload,
): AxiosPromise<ApiResponse<FollowupRecord>> {
  return request({
    url: `/customers/${customerId}/followups`,
    method: "post",
    data,
  });
}

/** Load follow-up records grouped by customer. */
export function getGroupedCustomerFollowups(
  params: GroupedFollowupListParams,
): AxiosPromise<ApiResponse<GroupedFollowupListResponse>> {
  return request({
    url: "/customers/followups/grouped",
    method: "get",
    params,
  });
}

/** Trigger a customer AI analysis run. */
export function triggerCustomerAiAnalysis(
  id: string,
  data: TriggerCustomerAiAnalysisPayload,
): AxiosPromise<ApiResponse<CustomerAiAnalysisResponse>> {
  return request({
    url: `/customers/${id}/ai/analysis`,
    method: "post",
    data,
  });
}
