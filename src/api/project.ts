import type { AxiosPromise } from "axios";
import request from "@/utils/request";

export type ProjectStatus = "active" | "completed" | "archived";
export type OrderSource = "user" | "company";
export type ImportSource = "csv" | "excel" | "json" | "api" | "manual";

export interface ProjectOrder {
  orderId: string;
  amount: number;
  date: string;
  customerName: string;
  source: OrderSource;
  productInfo?: string;
  status?: string;
  rawData?: Record<string, unknown>;
}

export interface ProjectMember {
  _id: string;
  username: string;
  email: string;
}

export interface ProjectCustomer {
  _id: string;
  name: string;
  type?: string;
  status?: string;
  level?: string;
}

export interface TopCustomer {
  customerName: string;
  totalAmount: number;
  orderCount: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  orderCount: number;
}

export interface QuarterlyTrend {
  quarter: string;
  revenue: number;
  orderCount: number;
}

export interface AnalysisTrends {
  monthlyTrend: MonthlyTrend[];
  quarterlyTrend: QuarterlyTrend[];
  growthRate: number;
  quarterOverQuarterGrowthRate?: number;
}

export interface AnalysisResults {
  totalRevenue: number;
  averageOrderValue: number;
  orderCount: number;
  topCustomers: TopCustomer[];
  trends: AnalysisTrends;
  lastAnalyzedAt?: string;
  analysisVersion?: string;
}

export interface ImportMetadata {
  lastImportAt?: string;
  lastImportedBy?: string;
  importSource?: ImportSource;
  totalImportedRecords?: number;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  company: string;
  createdBy: ProjectMember;
  members: ProjectMember[];
  customers: ProjectCustomer[];
  importedOrders: ProjectOrder[];
  analysisResults?: AnalysisResults;
  importMetadata?: ImportMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  keyword?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProjectFormData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  memberIds?: string[];
  customerIds?: string[];
}

export interface OrderImportPayload {
  orders: Array<{
    orderId?: string;
    amount: number;
    date: string;
    customerName: string;
    productInfo?: string;
    status?: string;
  }>;
  source?: OrderSource;
  importSource?: ImportSource;
}

export interface ExistingOrderImportPayload {
  scope?: OrderSource;
  customerIds?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ProjectOrderPreviewRecord {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  customerName: string;
  ownerName?: string;
  status?: string;
  source: OrderSource;
  productInfo?: string;
}

export interface ProjectOrderPreviewParams {
  scope?: OrderSource;
  customerIds?: string[] | string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  archivedProjects: number;
  totalRevenue: number;
}

export interface ListResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function getProjectList(params: ProjectListParams): AxiosPromise<ApiResponse<ListResponse<Project>>> {
  return request({
    url: "/projects",
    method: "get",
    params,
  });
}

export function getProjectStats(): AxiosPromise<ApiResponse<ProjectStats>> {
  return request({
    url: "/projects/stats",
    method: "get",
  });
}

export function getProjectDetail(id: string): AxiosPromise<ApiResponse<Project>> {
  return request({
    url: `/projects/${id}`,
    method: "get",
  });
}

export function createProject(data: ProjectFormData): AxiosPromise<ApiResponse<Project>> {
  return request({
    url: "/projects",
    method: "post",
    data,
  });
}

export function updateProject(id: string, data: ProjectFormData): AxiosPromise<ApiResponse<Project>> {
  return request({
    url: `/projects/${id}`,
    method: "put",
    data,
  });
}

export function deleteProject(id: string): AxiosPromise<ApiResponse<{ id: string }>> {
  return request({
    url: `/projects/${id}`,
    method: "delete",
  });
}

export function importProjectOrders(
  id: string,
  data: OrderImportPayload,
): AxiosPromise<ApiResponse<{ project: Project; importedCount: number; analysisResults: AnalysisResults }>> {
  return request({
    url: `/projects/${id}/import`,
    method: "post",
    data,
  });
}

export function importCompanyOrders(
  id: string,
  data: ExistingOrderImportPayload,
): AxiosPromise<ApiResponse<{ project: Project; importedCount: number; analysisResults: AnalysisResults }>> {
  return request({
    url: `/projects/${id}/import-company-orders`,
    method: "post",
    data,
  });
}

export function previewProjectOrders(
  params: ProjectOrderPreviewParams,
): AxiosPromise<ApiResponse<{ scope: OrderSource; count: number; list: ProjectOrderPreviewRecord[] }>> {
  return request({
    url: "/projects/orders/preview",
    method: "get",
    params: {
      ...params,
      customerIds: Array.isArray(params.customerIds) ? params.customerIds.join(",") : params.customerIds,
    },
  });
}

export function analyzeProject(
  id: string,
): AxiosPromise<ApiResponse<{ analysisResults: AnalysisResults; orderCount: number }>> {
  return request({
    url: `/projects/${id}/analyze`,
    method: "post",
  });
}
