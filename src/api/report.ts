import type { AxiosPromise } from "axios";
import request from "@/utils/request";
import type { ApiResponse } from "@/api/customer";
import type {
  DailyReportAggregateResult,
  DailyReportQueryParams,
  DailyReportSharePayload,
  DailyReportShareResult,
  SalesFunnelAggregate,
  SalesReportQueryParams,
  SalesRevenueTrend,
  SalesTeamRanking,
  SalesOverviewStats,
} from "@/types/report";

/** Load the structured daily-report aggregate for the selected day. */
export function getDailyReportAggregate(
  params: DailyReportQueryParams = {},
): AxiosPromise<ApiResponse<DailyReportAggregateResult>> {
  return request({
    url: "/reports/daily/aggregate",
    method: "get",
    params,
  });
}

/** Load sales overview KPIs, period metrics, breakdowns, and trends. */
export function getSalesOverviewStats(
  params: SalesReportQueryParams = {},
): AxiosPromise<ApiResponse<SalesOverviewStats>> {
  return request({
    url: "/reports/sales/overview",
    method: "get",
    params,
  });
}

/** Load funnel-stage aggregates and conversion rates. */
export function getSalesFunnelAggregate(
  params: SalesReportQueryParams = {},
): AxiosPromise<ApiResponse<SalesFunnelAggregate>> {
  return request({
    url: "/reports/sales/funnel",
    method: "get",
    params,
  });
}

/** Load time-series won/order/paid revenue trend data. */
export function getSalesRevenueTrend(
  params: SalesReportQueryParams = {},
): AxiosPromise<ApiResponse<SalesRevenueTrend>> {
  return request({
    url: "/reports/sales/trend",
    method: "get",
    params,
  });
}

/** Load team leaderboard rows for the current sales window. */
export function getSalesTeamRanking(
  params: SalesReportQueryParams & { limit?: number } = {},
): AxiosPromise<ApiResponse<SalesTeamRanking>> {
  return request({
    url: "/reports/sales/team-rank",
    method: "get",
    params,
  });
}

/** Send a prepared daily-report message to an official DingTalk or WeChat Work robot webhook. */
export function shareDailyReport(
  payload: DailyReportSharePayload,
): AxiosPromise<ApiResponse<DailyReportShareResult>> {
  return request({
    url: "/reports/daily/share",
    method: "post",
    data: payload,
  });
}
