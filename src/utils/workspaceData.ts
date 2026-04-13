import {
  createCustomer,
  getCustomerList,
  updateCustomer,
  type Customer,
  type CustomerFormData,
} from "@/api/customer";
import { updateCurrentUserProfile, type AuthPayload } from "@/api/auth";
import { getNotificationList } from "@/api/notification";
import type { NotificationRecord } from "@/types/notification";
import type { AppLanguage, AppTheme } from "@/stores/ui";
import { unwrapApiResponseData } from "@/utils/requestError";

export type ImportTarget = "all" | "settings" | "user" | "customers";
export type ImportMode = "normal" | "smart";

export interface SnapshotUserInfo {
  username: string;
  email: string;
  phone?: string | null;
  userrole: string;
  permissions: string[];
  companyid?: string | null;
  companyname?: string | null;
  roleLabel?: string | null;
  isSystemReserved?: boolean;
}

export interface SnapshotSettings {
  language: AppLanguage;
  theme: AppTheme;
}

export interface WorkspaceSnapshot {
  meta: {
    app: "SalePilot";
    version: string;
    exportedAt: string;
  };
  sections: {
    settings: SnapshotSettings;
    user: SnapshotUserInfo;
    customers: Customer[];
    notifications: NotificationRecord[];
  };
}

export interface SnapshotBuildContext {
  settings: SnapshotSettings;
  user: SnapshotUserInfo;
}

export interface ImportReport {
  importedSections: string[];
  updatedUser: boolean;
  importedCustomers: number;
  warnings: string[];
}

const CUSTOMER_BATCH_SIZE = 100;
const SNAPSHOT_VERSION = "2026-04-09";

const CUSTOMER_ALIASES: Record<keyof CustomerFormData, string[]> = {
  name: ["name", "客户名", "客户名称", "company", "companyName", "customerName"],
  type: ["type", "customerType", "客户类型"],
  status: ["status", "state", "客户状态", "阶段"],
  email: ["email", "邮箱", "邮件"],
  phone: ["phone", "电话", "座机"],
  mobile: ["mobile", "手机", "手机号", "mobilePhone"],
  fax: ["fax", "传真"],
  website: ["website", "url", "官网", "网站"],
  country: ["country", "国家"],
  province: ["province", "state", "省份"],
  city: ["city", "城市"],
  district: ["district", "区县", "地区"],
  street: ["street", "address", "地址", "详细地址"],
  postalCode: ["postalCode", "postcode", "zip", "邮编"],
  industry: ["industry", "行业"],
  source: ["source", "来源", "leadSource"],
  level: ["level", "grade", "等级", "客户等级"],
  annualRevenue: ["annualRevenue", "revenue", "营收", "年营收"],
  employeeCount: ["employeeCount", "employees", "人数", "员工数"],
  currency: ["currency", "币种"],
  wechat: ["wechat", "微信", "wechatId"],
  qq: ["qq"],
  linkedin: ["linkedin"],
  twitter: ["twitter", "x"],
  description: ["description", "简介", "说明"],
  remark: ["remark", "notes", "备注", "note"],
  tags: ["tags", "labels", "标签"],
  lastContactDate: ["lastContactDate", "lastContact", "最后联系时间"],
};

const VALUE_ALIASES = {
  type: {
    individual: "individual",
    enterprise: "enterprise",
    个人: "individual",
    企业: "enterprise",
    company: "enterprise",
  },
  status: {
    potential: "potential",
    active: "active",
    dormant: "dormant",
    lost: "lost",
    潜在: "potential",
    跟进中: "active",
    活跃: "active",
    休眠: "dormant",
    流失: "lost",
  },
  source: {
    advertisement: "advertisement",
    referral: "referral",
    exhibition: "exhibition",
    internet: "internet",
    coldcall: "coldcall",
    other: "other",
    广告: "advertisement",
    转介绍: "referral",
    展会: "exhibition",
    网络: "internet",
    电销: "coldcall",
    其他: "other",
  },
  level: {
    a: "A",
    b: "B",
    c: "C",
    d: "D",
  },
  currency: {
    cny: "CNY",
    usd: "USD",
    eur: "EUR",
    gbp: "GBP",
    jpy: "JPY",
    hkd: "HKD",
    twd: "TWD",
    krw: "KRW",
    aud: "AUD",
    cad: "CAD",
    人民币: "CNY",
    美元: "USD",
  },
} as const;

const normalizeKey = (value: string) => value.replace(/[\s_-]+/g, "").toLowerCase();

const readAliasedValue = (record: Record<string, unknown>, aliases: string[]) => {
  const normalizedEntries = Object.entries(record).map(([key, value]) => [normalizeKey(key), value] as const);

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const matchedEntry = normalizedEntries.find(([key]) => key === normalizedAlias);
    if (matchedEntry && matchedEntry[1] !== undefined && matchedEntry[1] !== null && matchedEntry[1] !== "") {
      return matchedEntry[1];
    }
  }

  return undefined;
};

const normalizeMappedValue = <T extends "type" | "status" | "source" | "level" | "currency">(
  field: T,
  value: unknown,
) => {
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  return VALUE_ALIASES[field][normalizedValue as keyof typeof VALUE_ALIASES[T]];
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const inferCustomerType = (record: Record<string, unknown>) => {
  const name = String(readAliasedValue(record, CUSTOMER_ALIASES.name) ?? "").trim();
  if (!name) {
    return undefined;
  }

  return /(公司|集团|科技|有限|inc|llc|corp|studio)/i.test(name) ? "enterprise" : "individual";
};

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[;,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
};

const buildCustomerPayload = (
  rawRecord: Record<string, unknown>,
  mode: ImportMode,
): CustomerFormData | null => {
  const payload: CustomerFormData = {
    name: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.name) ?? "").trim(),
    type: normalizeMappedValue("type", readAliasedValue(rawRecord, CUSTOMER_ALIASES.type))
      ?? (mode === "smart" ? inferCustomerType(rawRecord) : undefined),
    status: normalizeMappedValue("status", readAliasedValue(rawRecord, CUSTOMER_ALIASES.status)) ?? "potential",
    email: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.email) ?? "").trim() || undefined,
    phone: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.phone) ?? "").trim() || undefined,
    mobile: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.mobile) ?? "").trim() || undefined,
    fax: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.fax) ?? "").trim() || undefined,
    website: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.website) ?? "").trim() || undefined,
    country: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.country) ?? "").trim() || undefined,
    province: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.province) ?? "").trim() || undefined,
    city: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.city) ?? "").trim() || undefined,
    district: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.district) ?? "").trim() || undefined,
    street: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.street) ?? "").trim() || undefined,
    postalCode: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.postalCode) ?? "").trim() || undefined,
    industry: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.industry) ?? "").trim() || undefined,
    source: normalizeMappedValue("source", readAliasedValue(rawRecord, CUSTOMER_ALIASES.source)) ?? "other",
    level: normalizeMappedValue("level", readAliasedValue(rawRecord, CUSTOMER_ALIASES.level)) ?? "C",
    annualRevenue: toNumber(readAliasedValue(rawRecord, CUSTOMER_ALIASES.annualRevenue)),
    employeeCount: toNumber(readAliasedValue(rawRecord, CUSTOMER_ALIASES.employeeCount)),
    currency: normalizeMappedValue("currency", readAliasedValue(rawRecord, CUSTOMER_ALIASES.currency)) ?? "CNY",
    wechat: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.wechat) ?? "").trim() || undefined,
    qq: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.qq) ?? "").trim() || undefined,
    linkedin: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.linkedin) ?? "").trim() || undefined,
    twitter: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.twitter) ?? "").trim() || undefined,
    description: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.description) ?? "").trim() || undefined,
    remark: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.remark) ?? "").trim() || undefined,
    tags: normalizeTags(readAliasedValue(rawRecord, CUSTOMER_ALIASES.tags)),
    lastContactDate: String(readAliasedValue(rawRecord, CUSTOMER_ALIASES.lastContactDate) ?? "").trim() || undefined,
  };

  if (!payload.name) {
    return null;
  }

  if (mode === "smart" && !payload.remark) {
    const unknownFields = Object.keys(rawRecord).filter((key) => {
      const normalizedCandidate = normalizeKey(key);
      return !Object.values(CUSTOMER_ALIASES).flat().some((alias) => normalizeKey(alias) === normalizedCandidate);
    });

    if (unknownFields.length) {
      payload.remark = `Imported with smart mapping. Unmapped fields: ${unknownFields.join(", ")}`;
    }
  }

  return payload;
};

const fetchAllCustomers = async () => {
  const customers: Customer[] = [];
  let page = 1;

  while (true) {
    const response = await getCustomerList({
      page,
      limit: CUSTOMER_BATCH_SIZE,
    });
    const payload = unwrapApiResponseData(response, "Failed to export customers.");
    customers.push(...payload.list);

    if (payload.list.length < CUSTOMER_BATCH_SIZE) {
      break;
    }

    page += 1;
  }

  return customers;
};

const fetchNotifications = async () => {
  const response = await getNotificationList({
    page: 1,
    limit: 100,
    scope: "all",
    includeExpired: true,
  });
  const payload = unwrapApiResponseData(response, "Failed to export notifications.");
  return payload.list;
};

export async function buildWorkspaceSnapshot(context: SnapshotBuildContext): Promise<WorkspaceSnapshot> {
  const [customers, notifications] = await Promise.all([
    fetchAllCustomers(),
    fetchNotifications(),
  ]);

  return {
    meta: {
      app: "SalePilot",
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
    },
    sections: {
      settings: context.settings,
      user: context.user,
      customers,
      notifications,
    },
  };
}

export function downloadWorkspaceSnapshot(snapshot: WorkspaceSnapshot, filename: string) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "salepilot-backup.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function parseWorkspaceImportFile(file: File) {
  const rawText = await file.text();
  return JSON.parse(rawText) as unknown;
}

const normalizeImportSource = (rawInput: unknown) => {
  if (Array.isArray(rawInput)) {
    return {
      settings: null,
      user: null,
      customers: rawInput,
    };
  }

  if (!rawInput || typeof rawInput !== "object") {
    return {
      settings: null,
      user: null,
      customers: [],
    };
  }

  const record = rawInput as Record<string, unknown>;
  const sections = record.sections && typeof record.sections === "object"
    ? (record.sections as Record<string, unknown>)
    : record;

  const customers = Array.isArray(sections.customers)
    ? sections.customers
    : Array.isArray(record.customers)
      ? record.customers
      : [];

  return {
    settings: sections.settings && typeof sections.settings === "object"
      ? (sections.settings as Record<string, unknown>)
      : null,
    user: sections.user && typeof sections.user === "object"
      ? (sections.user as Record<string, unknown>)
      : null,
    customers,
  };
};

export async function importWorkspaceData(options: {
  rawInput: unknown;
  target: ImportTarget;
  mode: ImportMode;
  applySettings: (settings: Partial<SnapshotSettings>) => void;
  applyImportedUser?: (payload: AuthPayload) => void;
}): Promise<ImportReport> {
  const normalizedInput = normalizeImportSource(options.rawInput);
  const report: ImportReport = {
    importedSections: [],
    updatedUser: false,
    importedCustomers: 0,
    warnings: [],
  };

  if ((options.target === "all" || options.target === "settings") && normalizedInput.settings) {
    options.applySettings({
      language: normalizedInput.settings.language === "zh-CN" ? "zh-CN" : "en-US",
      theme: normalizedInput.settings.theme === "dark" ? "dark" : "light",
    });
    report.importedSections.push("settings");
  }

  if ((options.target === "all" || options.target === "user") && normalizedInput.user) {
    const profilePayload = {
      username: typeof normalizedInput.user.username === "string" ? normalizedInput.user.username.trim() : undefined,
      email: typeof normalizedInput.user.email === "string" ? normalizedInput.user.email.trim() : undefined,
      phone: typeof normalizedInput.user.phone === "string" ? normalizedInput.user.phone.trim() : undefined,
    };

    if (profilePayload.username || profilePayload.email || profilePayload.phone) {
      const response = await updateCurrentUserProfile(profilePayload);
      options.applyImportedUser?.(response.data);
      report.updatedUser = true;
      report.importedSections.push("user");
    }
  }

  if (options.target === "all" || options.target === "customers") {
    const normalizedCustomers = normalizedInput.customers
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        id: typeof item._id === "string" ? item._id : undefined,
        payload: buildCustomerPayload(item, options.mode),
      }))
      .filter((item) => Boolean(item.payload));

    for (const item of normalizedCustomers) {
      try {
        if (item.id) {
          await updateCustomer(item.id, item.payload as CustomerFormData);
        } else {
          await createCustomer(item.payload as CustomerFormData);
        }
        report.importedCustomers += 1;
      } catch (error) {
        report.warnings.push(error instanceof Error ? error.message : "A customer row could not be imported.");
      }
    }

    if (normalizedCustomers.length) {
      report.importedSections.push("customers");
    }
  }

  return report;
}
