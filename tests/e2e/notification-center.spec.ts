import { expect, test } from "@playwright/test";
import {
  createApiEnvelope,
  createSessionPayload,
  fulfillJson,
  mockRefreshRoute,
  seedAuthenticatedSession,
} from "./support/session";

test("user can mark all notifications as read", async ({ page }) => {
  const session = createSessionPayload({
    permissions: ["notifications.view", "notifications.manage"],
  });

  const notifications = [
    {
      id: "notice-1",
      recipientId: "usr-e2e-1",
      actorId: null,
      actor: null,
      companyId: session.user.companyid,
      category: "customer",
      eventKey: "customer.churn.warning",
      level: "warning",
      title: "Dormant account risk",
      message: "Northwind Trading has gone 14 days without a follow-up.",
      channels: ["in_app"],
      actionLabel: "View customer",
      actionUrl: "/customer/cus-1001",
      relatedId: "cus-1001",
      relatedModel: "Customer",
      metadata: { score: 78, customerId: "cus-1001" },
      dedupeKey: "notice-1",
      read: false,
      readAt: null,
      archived: false,
      archivedAt: null,
      expiresAt: null,
      isExpired: false,
      createdAt: "2026-04-09T08:00:00.000Z",
      updatedAt: "2026-04-09T08:00:00.000Z",
    },
  ];

  const buildListResponse = () => ({
    list: notifications.map((item) => ({ ...item })),
    total: notifications.length,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false,
    unreadCount: notifications.filter((item) => !item.read).length,
    filters: {
      scope: "active",
      read: null,
      category: null,
      level: null,
      eventKey: null,
      relatedModel: null,
      relatedId: null,
      includeExpired: false,
    },
  });

  await seedAuthenticatedSession(page, session);
  await mockRefreshRoute(page, session);

  await page.route("**/api/notifications**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();

    if (pathname.endsWith("/notifications") && method === "GET") {
      await fulfillJson(route, createApiEnvelope(buildListResponse()));
      return;
    }

    if (pathname.endsWith("/notifications/read-all") && method === "PATCH") {
      notifications.forEach((item) => {
        item.read = true;
        item.readAt = new Date("2026-04-09T08:30:00.000Z").toISOString();
      });
      await fulfillJson(
        route,
        createApiEnvelope({
          updatedCount: 1,
          unreadCount: 0,
        }),
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/notifications");

  await expect(page.getByRole("heading", { name: "Notification center" })).toBeVisible();
  await expect(page.getByText("1 unread")).toBeVisible();

  await page.getByRole("button", { name: "Mark all as read" }).click();

  await expect(page.locator(".el-message")).toContainText("Marked 1 notifications as read.");
  await expect(page.locator(".unread-badge")).toHaveCount(0);
  await expect(page.getByText("Everything in the active inbox is read")).toBeVisible();
});
