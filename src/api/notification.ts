import type { AxiosPromise } from "axios";
import request from "@/utils/request";
import type { ApiResponse } from "@/api/customer";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
} from "@/types/notification";

/** Load the current user's notification inbox. */
export function getNotificationList(
  params: NotificationListParams = {},
): AxiosPromise<ApiResponse<NotificationListResponse>> {
  return request({
    url: "/notifications",
    method: "get",
    params,
  });
}

/** Mark a single notification as read. */
export function markNotificationAsRead(
  id: string,
): AxiosPromise<ApiResponse<NotificationMarkReadResponse>> {
  return request({
    url: `/notifications/${id}/read`,
    method: "patch",
  });
}

/** Mark every active notification as read. */
export function markAllNotificationsAsRead(): AxiosPromise<ApiResponse<NotificationMarkAllReadResponse>> {
  return request({
    url: "/notifications/read-all",
    method: "patch",
  });
}
