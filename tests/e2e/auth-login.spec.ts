import { expect, test } from "@playwright/test";
import { createApiEnvelope, createSessionPayload, fulfillJson } from "./support/session";

test("user can log in and land on the customer directory", async ({ page }) => {
  const session = createSessionPayload({
    permissions: ["customers.view", "customers.create", "customers.update"],
  });

  await page.route("**/api/auth/login", async (route) => {
    await fulfillJson(
      route,
      createApiEnvelope({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        company: session.company,
        rbac: session.rbac,
      }),
    );
  });

  await page.route("**/api/customers/tags**", async (route) => {
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
  });

  await page.route("**/api/customers**", async (route) => {
    const url = new URL(route.request().url());

    if (route.request().method() === "GET" && url.pathname.endsWith("/customers")) {
      await fulfillJson(
        route,
        createApiEnvelope({
          list: [],
          total: 0,
          page: 1,
          limit: 10,
        }),
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/auth/login?redirect=%2Fcustomer");

  await page.getByLabel("User name").fill("e2e-admin");
  await page.getByLabel("Password").fill("Strong123!!!");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/customer$/);
  await expect(page.getByRole("heading", { name: "Customer directory" })).toBeVisible();
  await expect(page.locator(".app-feedback-notification")).toContainText("Welcome back");
});
