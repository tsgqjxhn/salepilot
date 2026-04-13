import { expect, test } from "@playwright/test";
import {
  createApiEnvelope,
  createSessionPayload,
  fulfillJson,
  mockRefreshRoute,
  seedAuthenticatedSession,
} from "./support/session";

test("sales dashboard renders report aggregates and supports manual refresh", async ({ page }) => {
  const session = createSessionPayload({
    permissions: ["reports.view"],
  });

  const windowPayload = {
    dateFrom: "2026-03-11",
    dateTo: "2026-04-09",
    timeZone: "Asia/Shanghai",
    startAt: "2026-03-11T00:00:00.000Z",
    endAt: "2026-04-09T23:59:59.999Z",
    days: 30,
    scope: "company",
    generatedAt: "2026-04-09T09:00:00.000Z",
  };

  const comparisonWindow = {
    dateFrom: "2026-02-09",
    dateTo: "2026-03-10",
    timeZone: "Asia/Shanghai",
    startAt: "2026-02-09T00:00:00.000Z",
    endAt: "2026-03-10T23:59:59.999Z",
    days: 30,
    scope: "company",
  };

  const overview = {
    window: windowPayload,
    snapshot: {
      customerTotal: 58,
      activeCustomers: 24,
      dormantCustomers: 7,
      lostCustomers: 3,
      keyCustomers: 9,
      averageAiScore: 71,
      totalOpportunities: 19,
      openOpportunities: 11,
      pipelineAmount: 84000,
      wonOpportunities: 6,
      wonAmount: 84000,
      totalOrders: 16,
      completedOrders: 10,
      totalOrderAmount: 103500,
      paidAmount: 62000,
      overdueFollowups: 4,
    },
    period: {
      newCustomers: 6,
      activitiesLogged: 42,
      completedActivities: 30,
      followupsScheduled: 17,
      followupsCompleted: 13,
      opportunitiesCreated: 7,
      opportunitiesWon: 3,
      opportunitiesLost: 1,
      ordersCreated: 5,
      orderAmount: 103500,
      paidAmount: 62000,
    },
    breakdowns: {
      customersByStatus: [
        { key: "active", label: "Active", count: 24 },
        { key: "dormant", label: "Dormant", count: 7 },
        { key: "lost", label: "Lost", count: 3 },
      ],
      customersByLevel: [
        { key: "A", label: "A", count: 6 },
        { key: "B", label: "B", count: 12 },
        { key: "C", label: "C", count: 20 },
      ],
      customersBySource: [
        { key: "referral", label: "Referral", count: 18 },
        { key: "internet", label: "Online", count: 22 },
        { key: "exhibition", label: "Exhibition", count: 8 },
      ],
      opportunitiesByStage: [
        { key: "qualified", label: "Qualified", count: 5, estimatedAmount: 28000, resolvedAmount: 0 },
        { key: "proposal", label: "Proposal", count: 4, estimatedAmount: 36000, resolvedAmount: 0 },
        { key: "closed_won", label: "Closed Won", count: 6, estimatedAmount: 0, resolvedAmount: 84000 },
      ],
      ordersByStatus: [
        { key: "processing", label: "Processing", count: 6, totalAmount: 42000, paidAmount: 12000 },
        { key: "completed", label: "Completed", count: 10, totalAmount: 61500, paidAmount: 50000 },
      ],
      activitiesByType: [
        { key: "meeting", label: "Meeting", count: 14 },
        { key: "call", label: "Call", count: 18 },
        { key: "email", label: "Email", count: 10 },
      ],
      followupsByStatus: [
        { key: "scheduled", label: "Scheduled", count: 17 },
        { key: "completed", label: "Completed", count: 13 },
      ],
    },
    trends: {
      customersCreated: [
        { date: "2026-04-07", count: 2 },
        { date: "2026-04-08", count: 1 },
        { date: "2026-04-09", count: 3 },
      ],
      activitiesLogged: [
        { date: "2026-04-07", count: 10 },
        { date: "2026-04-08", count: 14 },
        { date: "2026-04-09", count: 18 },
      ],
      wonRevenue: [
        { date: "2026-04-07", count: 1, amount: 24000 },
        { date: "2026-04-08", count: 0, amount: 0 },
        { date: "2026-04-09", count: 2, amount: 60000 },
      ],
      orderRevenue: [
        { date: "2026-04-07", count: 2, amount: 30000, paidAmount: 18000 },
        { date: "2026-04-08", count: 1, amount: 24000, paidAmount: 12000 },
        { date: "2026-04-09", count: 2, amount: 49500, paidAmount: 32000 },
      ],
    },
  };

  const funnel = {
    window: windowPayload,
    summary: {
      totalOpportunities: 19,
      openOpportunities: 11,
      closedOpportunities: 8,
      pipelineAmount: 84000,
      wonOpportunities: 6,
      lostOpportunities: 2,
      wonAmount: 84000,
      lostAmount: 11000,
      averageOpenOpportunityAmount: 7636,
      averageWonAmount: 14000,
      overallToWonRate: 0.32,
      overallToLostRate: 0.11,
      closeRate: 0.42,
      winRate: 0.75,
    },
    period: {
      opportunitiesCreated: 7,
      createdEstimatedAmount: 50000,
      createdResolvedAmount: 0,
      opportunitiesWon: 3,
      opportunitiesLost: 1,
      wonAmount: 42000,
      lostAmount: 6000,
    },
    stages: [
      { key: "lead", label: "Lead", order: 1, isClosed: false, count: 19, estimatedAmount: 95000, resolvedAmount: 0, shareRate: 1, conversionFromFirst: 1, conversionFromPrevious: 1 },
      { key: "qualified", label: "Qualified", order: 2, isClosed: false, count: 13, estimatedAmount: 84000, resolvedAmount: 0, shareRate: 0.68, conversionFromFirst: 0.68, conversionFromPrevious: 0.68 },
      { key: "proposal", label: "Proposal", order: 3, isClosed: false, count: 9, estimatedAmount: 64000, resolvedAmount: 0, shareRate: 0.47, conversionFromFirst: 0.47, conversionFromPrevious: 0.69 },
      { key: "closed_won", label: "Closed Won", order: 4, isClosed: true, count: 6, estimatedAmount: 0, resolvedAmount: 84000, shareRate: 0.32, conversionFromFirst: 0.32, conversionFromPrevious: 0.67 },
    ],
    conversions: {
      topOfFunnelStage: "lead",
      topOfFunnelLabel: "Lead",
      topOfFunnelCount: 19,
      overallToWonRate: 0.32,
      overallToLostRate: 0.11,
      stageToStage: [
        { fromStage: "lead", fromLabel: "Lead", toStage: "qualified", toLabel: "Qualified", fromCount: 19, toCount: 13, dropOffCount: 6, conversionRate: 0.68 },
        { fromStage: "qualified", fromLabel: "Qualified", toStage: "proposal", toLabel: "Proposal", fromCount: 13, toCount: 9, dropOffCount: 4, conversionRate: 0.69 },
        { fromStage: "proposal", fromLabel: "Proposal", toStage: "closed_won", toLabel: "Closed Won", fromCount: 9, toCount: 6, dropOffCount: 3, conversionRate: 0.67 },
      ],
    },
  };

  const trend = {
    window: windowPayload,
    comparisonWindow,
    summary: {
      totalWonCount: 6,
      totalWonAmount: 84000,
      totalOrderCount: 5,
      totalOrderAmount: 103500,
      totalPaidAmount: 62000,
      peakWonAmount: 60000,
      peakWonDate: "2026-04-09",
      peakOrderAmount: 49500,
      peakOrderDate: "2026-04-09",
      averageDailyWonAmount: 28000,
      averageDailyOrderAmount: 34500,
      averageDailyPaidAmount: 20666,
      averageWonTicketSize: 14000,
      averageOrderTicketSize: 20700,
    },
    comparison: {
      wonCount: { current: 6, previous: 4, delta: 2, changeRate: 0.5 },
      wonAmount: { current: 84000, previous: 54000, delta: 30000, changeRate: 0.56 },
      orderCount: { current: 5, previous: 3, delta: 2, changeRate: 0.67 },
      orderAmount: { current: 103500, previous: 72000, delta: 31500, changeRate: 0.44 },
      paidAmount: { current: 62000, previous: 45000, delta: 17000, changeRate: 0.38 },
    },
    trend: [
      { date: "2026-04-07", wonCount: 1, wonAmount: 24000, orderCount: 2, orderAmount: 30000, paidAmount: 18000 },
      { date: "2026-04-08", wonCount: 0, wonAmount: 0, orderCount: 1, orderAmount: 24000, paidAmount: 12000 },
      { date: "2026-04-09", wonCount: 2, wonAmount: 60000, orderCount: 2, orderAmount: 49500, paidAmount: 32000 },
    ],
  };

  const ranking = {
    window: windowPayload,
    summary: {
      totalMembers: 4,
      membersWithPerformance: 3,
      topLimit: 10,
      totalWonCount: 6,
      totalWonAmount: 84000,
      totalOrderCount: 5,
      totalOrderAmount: 103500,
      totalPaidAmount: 62000,
      totalPipelineCount: 11,
      totalPipelineAmount: 84000,
    },
    rankings: [
      {
        rank: 1,
        userId: "usr-1",
        username: "Alex Chen",
        email: "alex.chen@salepilot.test",
        userRole: "manager",
        isCurrentUser: false,
        metrics: {
          wonCount: 3,
          wonAmount: 42000,
          orderCount: 2,
          orderAmount: 51000,
          paidAmount: 30000,
          pipelineCount: 4,
          pipelineAmount: 36000,
        },
      },
      {
        rank: 2,
        userId: "usr-2",
        username: "Jamie Lin",
        email: "jamie.lin@salepilot.test",
        userRole: "manager",
        isCurrentUser: true,
        metrics: {
          wonCount: 2,
          wonAmount: 28000,
          orderCount: 2,
          orderAmount: 32500,
          paidAmount: 21000,
          pipelineCount: 3,
          pipelineAmount: 27000,
        },
      },
    ],
    currentUserRank: {
      rank: 2,
      userId: "usr-2",
      username: "Jamie Lin",
      email: "jamie.lin@salepilot.test",
      userRole: "manager",
      isCurrentUser: true,
      metrics: {
        wonCount: 2,
        wonAmount: 28000,
        orderCount: 2,
        orderAmount: 32500,
        paidAmount: 21000,
        pipelineCount: 3,
        pipelineAmount: 27000,
      },
    },
  };

  await seedAuthenticatedSession(page, session);
  await mockRefreshRoute(page, session);

  await page.route("**/api/reports/sales/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith("/reports/sales/overview")) {
      await fulfillJson(route, createApiEnvelope(overview));
      return;
    }

    if (pathname.endsWith("/reports/sales/funnel")) {
      await fulfillJson(route, createApiEnvelope(funnel));
      return;
    }

    if (pathname.endsWith("/reports/sales/trend")) {
      await fulfillJson(route, createApiEnvelope(trend));
      return;
    }

    if (pathname.endsWith("/reports/sales/team-rank")) {
      await fulfillJson(route, createApiEnvelope(ranking));
      return;
    }

    await route.abort();
  });

  await page.goto("/reports/sales");

  await expect(page.getByRole("heading", { name: "Sales dashboard" })).toBeVisible();
  await expect(page.getByText("Alex Chen")).toBeVisible();
  await expect(page.getByText("84,000")).toBeVisible();

  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.locator(".el-message")).toContainText("Sales dashboard refreshed.");
});
