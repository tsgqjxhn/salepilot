export type WorkspacePlanKey = "free" | "lite" | "standard" | "pro" | "max" | "unlimited";

export interface WorkspacePlanDefinition {
  key: WorkspacePlanKey;
  label: string;
  priceMonthlyUsd: number;
  maxUsers: number;
  maxCustomers: number;
  aiCalls: number;
  spotlight?: boolean;
  summary: string;
}

export const WORKSPACE_PLAN_DEFINITIONS: WorkspacePlanDefinition[] = [
  {
    key: "free",
    label: "Free",
    priceMonthlyUsd: 0,
    maxUsers: 20,
    maxCustomers: 100,
    aiCalls: 100,
    summary: "For small teams validating the workflow with light AI usage.",
  },
  {
    key: "lite",
    label: "Lite",
    priceMonthlyUsd: 39,
    maxUsers: 100,
    maxCustomers: 500,
    aiCalls: 500,
    summary: "For growing workspaces that need more seats and customer capacity.",
  },
  {
    key: "standard",
    label: "Standard",
    priceMonthlyUsd: 99,
    maxUsers: 500,
    maxCustomers: 2500,
    aiCalls: 2500,
    spotlight: true,
    summary: "Balanced plan for active sales teams running customer ops and AI reporting daily.",
  },
  {
    key: "pro",
    label: "Pro",
    priceMonthlyUsd: 399,
    maxUsers: 2500,
    maxCustomers: 12500,
    aiCalls: 12500,
    summary: "For multi-manager organizations running shared pipeline execution at scale.",
  },
  {
    key: "max",
    label: "Max",
    priceMonthlyUsd: 1999,
    maxUsers: 12500,
    maxCustomers: 62500,
    aiCalls: 62500,
    summary: "For very large operations that need broad capacity and heavy AI throughput.",
  },
  {
    key: "unlimited",
    label: "Unlimited",
    priceMonthlyUsd: 9999,
    maxUsers: 100000000,
    maxCustomers: 10000000000,
    aiCalls: 100000000,
    summary: "Reserved for enterprise environments with effectively uncapped workspace growth.",
  },
];

const DEFAULT_WORKSPACE_PLAN_DEFINITION: WorkspacePlanDefinition = {
  key: "free",
  label: "Free",
  priceMonthlyUsd: 0,
  maxUsers: 20,
  maxCustomers: 100,
  aiCalls: 100,
  summary: "For small teams validating the workflow with light AI usage.",
};

export const WORKSPACE_PLAN_USD_TO_CNY_RATE = 7.2;

export const formatPlanPrice = (priceMonthlyUsd: number, language = "en-US") => {
  if (language === "zh-CN") {
    const priceMonthlyCny = Math.round(priceMonthlyUsd * WORKSPACE_PLAN_USD_TO_CNY_RATE);
    return priceMonthlyCny === 0 ? "¥0" : `¥${priceMonthlyCny.toLocaleString("zh-CN")}`;
  }

  return priceMonthlyUsd === 0 ? "$0" : `$${priceMonthlyUsd.toLocaleString("en-US")}`;
};

export const formatPlanPeriod = (language = "en-US") => (
  language === "zh-CN" ? "人民币 / 月" : "USD / month"
);

export const formatPlanQuota = (value: number) => {
  if (value >= 100000000) {
    return "Unlimited";
  }

  return new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
};

export const getWorkspacePlanDefinition = (plan?: string | null) =>
  WORKSPACE_PLAN_DEFINITIONS.find((item) => item.key === plan)
  || WORKSPACE_PLAN_DEFINITIONS[0]
  || DEFAULT_WORKSPACE_PLAN_DEFINITION;
