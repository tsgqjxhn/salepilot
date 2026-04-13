import { expect, test } from "@playwright/test";
import {
  createApiEnvelope,
  createSessionPayload,
  fulfillJson,
  mockRefreshRoute,
  seedAuthenticatedSession,
} from "./support/session";

test("user can create and archive a customer from the directory", async ({ page }) => {
  const session = createSessionPayload({
    permissions: [
      "customers.view",
      "customers.create",
      "customers.update",
      "customers.soft_delete",
    ],
  });

  const customers: Array<Record<string, unknown>> = [];

  await seedAuthenticatedSession(page, session);
  await mockRefreshRoute(page, session);

  await page.route("**/api/customers**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();

    if (pathname.endsWith("/customers/tags") && method === "GET") {
      await fulfillJson(
        route,
        createApiEnvelope({
          list: [],
          summary: {
            totalTags: 0,
            usedTags: 0,
            unusedTags: 0,
            activeAssignments: 0,
            archivedAssignments: 0,
          },
        }),
      );
      return;
    }

    if (pathname.endsWith("/customers") && method === "GET") {
      await fulfillJson(
        route,
        createApiEnvelope({
          list: [...customers],
          total: customers.length,
          page: 1,
          limit: 10,
        }),
      );
      return;
    }

    if (pathname.endsWith("/customers") && method === "POST") {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      const createdAt = new Date("2026-04-09T09:00:00.000Z").toISOString();
      const customer = {
        _id: "cus-e2e-1",
        name: String(payload.name || ""),
        type: String(payload.type || "individual"),
        status: String(payload.status || "potential"),
        level: String(payload.level || "C"),
        source: String(payload.source || "internet"),
        industry: String(payload.industry || ""),
        currency: String(payload.currency || "CNY"),
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        owner: {
          _id: "usr-e2e-1",
          username: session.user.username,
          email: session.user.email,
          userrole: session.user.userrole,
        },
        createdAt,
        updatedAt: createdAt,
      };

      customers.unshift(customer);
      await fulfillJson(route, createApiEnvelope(customer, 201, "Created"), 201);
      return;
    }

    if (pathname.endsWith("/customers/cus-e2e-1/soft") && method === "DELETE") {
      customers.splice(
        customers.findIndex((item) => item._id === "cus-e2e-1"),
        1,
      );
      await fulfillJson(
        route,
        createApiEnvelope({
          id: "cus-e2e-1",
          deletedAt: new Date("2026-04-09T10:00:00.000Z").toISOString(),
        }),
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/customer");

  await expect(page.getByRole("heading", { name: "Customer directory" })).toBeVisible();
  await page.getByRole("button", { name: "New customer" }).click();

  const dialog = page.locator(".el-dialog").last();
  await dialog.getByPlaceholder("Enter the customer name").fill("E2E Retail");
  await dialog.getByRole("button", { name: "Create customer" }).click();

  await expect(page.locator(".app-feedback-notification").last()).toContainText("Customer created");
  await expect(page.locator(".el-table__row", { hasText: "E2E Retail" })).toBeVisible();

  const customerRow = page.locator(".el-table__row", { hasText: "E2E Retail" });
  await customerRow.getByRole("button", { name: "Archive" }).click();

  const confirmDialog = page.locator(".el-message-box").last();
  await expect(confirmDialog).toContainText("Archive customer");
  await confirmDialog.getByRole("button", { name: "Archive" }).click();

  await expect(page.locator(".app-feedback-notification").last()).toContainText("Customer archived");
  await expect(page.locator(".el-table__row", { hasText: "E2E Retail" })).toHaveCount(0);
});
