<template>
  <section class="admin-page">
    <header class="hero-card">
      <div>
        <p class="eyebrow">{{ text("", "Workspace Control") }}</p>
        <h1>{{ isManagerConsole ? text("销售主管管理台", "Sales manager console") : text("", "Administrator console") }}</h1>
        <p class="hero-copy">
          {{
            text(
              isManagerConsole
                ? "查看本组成员、角色矩阵和销售主管工作区容量。"
                : "",
              isManagerConsole
                ? "Review your group members, role matrix, and manager workspace capacity from one control surface."
                : "Manage user roles, maintain workspace rules, rotate role passcodes, and review the current plan limits from one admin surface.",
            )
          }}
        </p>
      </div>
      <div class="hero-actions">
        <button v-if="isManagerConsole && authStore.primaryGroupId" type="button" class="primary-button enter-group-button" @click="handleEnterMyGroup">
          {{ text("进入本组", "Enter my group") }}
        </button>
        <button type="button" class="refresh-button" :disabled="loading" @click="handleRefresh">
          {{ loading ? text("", "Refreshing...") : text("", "Refresh console") }}
        </button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">{{ text("", "Workspace users") }}</span>
        <strong>{{ summary?.totalUsers ?? 0 }}</strong>
        <small>{{ summary?.workspace?.name || authStore.companyname || text("", "Current workspace") }}</small>
      </article>
      <article class="summary-card">
        <span class="summary-label">{{ text("", "Seat capacity") }}</span>
        <strong>{{ formatQuota(summary?.maxUsers ?? authStore.maxusers ?? 0) }}</strong>
        <small>{{ summary?.seatsUsed ?? 0 }} {{ text("", "used") }} / {{ summary?.seatsRemaining ?? 0 }} {{ text("", "remaining") }}</small>
      </article>
      <article class="summary-card">
        <span class="summary-label">{{ text("", "Customer capacity") }}</span>
        <strong>{{ formatQuota(authStore.maxcustomers ?? 0) }}</strong>
        <small>{{ localizedPlanLabel }} {{ text("", "plan") }} / {{ formatPlanPrice(workspacePlan.priceMonthlyUsd, language) }}/{{ text("", "month") }}</small>
      </article>
      <article class="summary-card">
        <span class="summary-label">{{ text("", "AI call quota") }}</span>
        <strong>{{ formatQuota(authStore.aicalls ?? 0) }}</strong>
        <small>
          {{
            authStore.rolePasscodesConfigured
              ? text("", "Role passcodes configured")
              : text("", "Role passcodes pending")
          }}
        </small>
      </article>
    </section>

    <section v-if="canManageWorkspaceControls" class="governance-grid">
      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ text("", "Workspace rules") }}</p>
            <h2>{{ text("", "Governance rules") }}</h2>
          </div>
          <span class="status-pill">
            {{ summary?.workspace?.isactive === false ? text("", "Inactive") : text("", "Active") }}
          </span>
        </div>

        <p class="panel-copy">
          {{
            text(
              "",
              "Administrators can decide whether sales managers are allowed to see shared customer data, delegate tasks, and access higher-level reporting.",
            )
          }}
        </p>

        <div class="rule-toggle-list">
          <label class="rule-toggle">
            <div>
              <strong>{{ text("", "Shared customer data") }}</strong>
              <span>{{ text("", "Allow sales managers to switch from personal customers to team-wide shared customer data.") }}</span>
            </div>
            <input v-model="workspaceRulesForm.managerSharedCustomersEnabled" type="checkbox">
          </label>

          <label class="rule-toggle">
            <div>
              <strong>{{ text("", "Task delegation") }}</strong>
              <span>{{ text("", "Allow sales managers to assign task follow-ups to other workspace members.") }}</span>
            </div>
            <input v-model="workspaceRulesForm.managerTaskDelegationEnabled" type="checkbox">
          </label>

          <label class="rule-toggle">
            <div>
              <strong>{{ text("", "Manager reporting") }}</strong>
              <span>{{ text("", "Allow sales managers to open shared team dashboards and higher-level report scopes.") }}</span>
            </div>
            <input v-model="workspaceRulesForm.managerReportingEnabled" type="checkbox">
          </label>
        </div>

        <ul class="rule-list">
          <li v-for="rule in workspaceRules" :key="rule">{{ rule }}</li>
        </ul>

        <div class="toolbar-actions">
          <button type="button" class="primary-button" :disabled="workspaceRulesSaving" @click="handleSaveWorkspaceRules">
            {{ workspaceRulesSaving ? text("", "Saving...") : text("", "Save workspace rules") }}
          </button>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ text("", "Role security") }}</p>
            <h2>{{ text("", "Role passcodes") }}</h2>
          </div>
          <span class="status-pill">
            {{ authStore.rolePasscodesConfigured ? text("", "Configured") : text("", "Not configured") }}
          </span>
        </div>

        <p class="panel-copy">
          {{ text("", "Administrators can rotate the three role passcodes here. Leave a field blank to keep the current passcode.") }}
        </p>

        <div class="form-grid">
          <label>
            <span>{{ text("", "Workspace member passcode") }}</span>
            <input v-model.trim="rolePasscodes.user" type="password" />
          </label>
          <label>
            <span>{{ text("", "Sales manager passcode") }}</span>
            <input v-model.trim="rolePasscodes.manager" type="password" />
          </label>
          <label>
            <span>{{ text("", "Administrator passcode") }}</span>
            <input v-model.trim="rolePasscodes.admin" type="password" />
          </label>
        </div>

        <div class="panel-meta">
          <span>{{ text("", "Last updated") }}: {{ formatDateTime(authStore.rolePasscodesConfiguredAt) }}</span>
          <span>{{ text("", "Current plan") }}: {{ localizedPlanLabel }}</span>
        </div>

        <div class="toolbar-actions">
          <button type="button" class="primary-button" :disabled="passcodeSaving" @click="handleSaveRolePasscodes">
            {{ passcodeSaving ? text("", "Saving...") : text("", "Update passcodes") }}
          </button>
        </div>
      </article>

      <article v-if="canManageWorkspaceControls" class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ text("AI 配置", "AI integration") }}</p>
            <h2>{{ text("工作区 AI 接入", "Workspace AI access") }}</h2>
          </div>
          <span class="status-pill" :class="aiGatewayForm.configured ? 'status-pill--success' : 'status-pill--warning'">
            {{ aiGatewayForm.configured ? text("已配置", "Configured") : text("未配置", "Not configured") }}
          </span>
        </div>

        <p class="panel-copy">
          {{ text("管理员可以配置工作区级别的 AI 接入，所有 AI 调用将通过后端代理。API 密钥等敏感信息不会暴露给前端。", "Administrators can configure workspace-level AI integration. All AI calls are proxied through the backend. API keys and other sensitive information are not exposed to the frontend.") }}
        </p>

        <label class="rule-toggle">
          <div>
            <strong>{{ text("启用自定义 AI 接入", "Use custom AI integration") }}</strong>
            <span>{{ text("启用后将使用您配置的 AI 提供商，而非系统默认配置。", "Enable to use your configured AI provider instead of the system default.") }}</span>
          </div>
          <input v-model="aiGatewayForm.useCustomProvider" type="checkbox">
        </label>

        <div v-if="aiGatewayForm.useCustomProvider" class="ai-config-form">
          <div class="form-grid">
            <label>
              <span>{{ text("提供商类型", "Provider type") }}</span>
              <select v-model="aiGatewayForm.providerType" @change="handleAiProviderTypeChange">
                <option v-for="provider in aiProviderOptions" :key="provider.value" :value="provider.value">
                  {{ provider.label }}
                </option>
              </select>
            </label>
            <label>
              <span>{{ text("协议", "Protocol") }}</span>
              <input :value="aiGatewayProtocolLabel" type="text" disabled />
            </label>
            <label>
              <span>{{ text("API 地址", "Base URL") }}</span>
              <input v-model.trim="aiGatewayForm.baseURL" type="text" :placeholder="text('提供商 API 地址', 'Provider base URL')" />
            </label>
            <label>
              <span>{{ text("模型名称", "Model name") }}</span>
              <input v-model.trim="aiGatewayForm.model" type="text" :placeholder="text('模型名称', 'Model name')" />
            </label>
            <label>
              <span>{{ text("API 密钥", "API key") }}</span>
              <input v-model.trim="aiGatewayForm.apiKey" type="password" :placeholder="text('输入 API 密钥', 'Paste the provider API key')" />
            </label>
            <label>
              <span>{{ text("当前已保存密钥", "Current saved key") }}</span>
              <input :value="aiGatewayForm.maskedApiKey || text('未配置', 'Not configured')" type="text" disabled />
            </label>
          </div>

          <div class="form-grid form-grid--single">
            <label>
              <span>{{ text("自定义请求头 (JSON)", "Custom headers JSON") }}</span>
              <textarea
                v-model="aiGatewayForm.customHeadersText"
                rows="3"
                :placeholder="text('可选的 JSON 对象，用于提供商特定的请求头', 'Optional JSON object for provider-specific headers')"
              ></textarea>
            </label>
          </div>

          <div class="enterprise-ai-panel">
            <header>
              <div>
                <h4>{{ text("企业级 AI 接入", "Enterprise AI access") }}</h4>
                <p>{{ text("配置数据隔离、VPC/私有访问、审计、SSO 和预算控制。", "Configure data isolation, VPC/private access, audit, SSO, and budget controls.") }}</p>
              </div>
              <label class="toggle-field toggle-field--compact">
                <input v-model="aiGatewayForm.enterpriseEnabled" type="checkbox">
                <span>{{ text("启用企业级接入", "Enable enterprise access") }}</span>
              </label>
            </header>

            <div v-if="aiGatewayForm.enterpriseEnabled" class="form-grid">
              <label>
                <span>{{ text("部署方式", "Deployment mode") }}</span>
                <select v-model="aiGatewayForm.enterpriseDeploymentMode">
                  <option value="public">{{ text("公网 API", "Public API") }}</option>
                  <option value="vpc">{{ text("VPC / 私有云", "VPC / private cloud") }}</option>
                  <option value="private-cloud">{{ text("私有云", "Private cloud") }}</option>
                  <option value="on-premise">{{ text("线下内网", "On-premise") }}</option>
                </select>
              </label>
              <label>
                <span>{{ text("区域", "Region") }}</span>
                <input v-model.trim="aiGatewayForm.enterpriseRegion" type="text" placeholder="cn-north / global" />
              </label>
              <label>
                <span>{{ text("私有入口", "Private endpoint") }}</span>
                <input v-model.trim="aiGatewayForm.enterprisePrivateEndpoint" type="text" placeholder="https://ai-gateway.example.com/v1" />
              </label>
              <label>
                <span>{{ text("月度预算 (USD)", "Monthly budget (USD)") }}</span>
                <input v-model.number="aiGatewayForm.enterpriseMonthlyBudgetUsd" type="number" min="0" />
              </label>
              <label>
                <span>{{ text("速率限制 / 分钟", "Rate limit / minute") }}</span>
                <input v-model.number="aiGatewayForm.enterpriseRateLimitPerMinute" type="number" min="0" />
              </label>
            </div>

            <div v-if="aiGatewayForm.enterpriseEnabled" class="enterprise-feature-grid">
              <label><input v-model="aiGatewayForm.enterpriseDataIsolation" type="checkbox"> {{ text("数据绝对隔离", "Data isolation") }}</label>
              <label><input v-model="aiGatewayForm.enterpriseZeroDataRetention" type="checkbox"> {{ text("零数据保留", "Zero data retention") }}</label>
              <label><input v-model="aiGatewayForm.enterpriseAuditLogging" type="checkbox"> {{ text("审计日志", "Audit logging") }}</label>
              <label><input v-model="aiGatewayForm.enterpriseSsoEnabled" type="checkbox"> {{ text("IAM / SSO 单点登录", "IAM / SSO") }}</label>
            </div>
          </div>
        </div>

        <div class="toolbar-actions">
          <button type="button" class="primary-button" :disabled="aiGatewaySaving" @click="handleSaveAiGateway">
            {{ aiGatewaySaving ? text("保存中...", "Saving...") : text("保存 AI 配置", "Save AI integration") }}
          </button>
        </div>
      </article>
    </section>

    <section v-else class="panel-card manager-scope-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">{{ text("本组管理", "Group management") }}</p>
          <h2>{{ text("销售主管工作台", "Sales manager workspace") }}</h2>
        </div>
        <span v-if="authStore.primaryGroupId" class="status-pill status-pill--success">
          {{ text("已分配主组", "Primary group assigned") }}
        </span>
        <span v-else class="status-pill status-pill--warning">
          {{ text("未分配主组", "No primary group") }}
        </span>
      </div>
      <p class="panel-copy">
        {{ text("当前仅展示你所在销售组的成员。工作区规则、角色口令和跨公司角色调整由管理员在管理台维护。", "This console is scoped to your sales group. Workspace rules, role passcodes, and company-wide role changes stay with administrators.") }}
      </p>
      
      <div v-if="authStore.primaryGroupId" class="manager-actions">
        <button type="button" class="primary-button enter-group-button" @click="handleEnterMyGroup">
          {{ text("进入本组", "Enter my group") }}
        </button>
        <p class="action-hint">
          {{ text("点击后将跳转到您的主组页面，可以查看组成员、发送消息和管理组文件。", "Click to navigate to your primary group page where you can view members, send messages, and manage group files.") }}
        </p>
      </div>
      <div v-else class="manager-warning">
        <p class="warning-text">
          {{ text("您当前没有分配主组。请联系管理员为您分配一个销售组，以便使用完整的销售主管功能。", "You are not assigned to a primary group. Please contact an administrator to assign you to a sales group for full manager functionality.") }}
        </p>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">{{ text("", "Role matrix") }}</p>
          <h2>{{ text("", "Who can do what") }}</h2>
        </div>
      </div>

      <div class="matrix-grid">
        <article v-for="role in roleOptions" :key="role.role" class="matrix-card">
          <strong>{{ displayRoleLabel(role.role, role.label) }}</strong>
          <span>{{ displayRoleDescription(role.role, role.description) }}</span>
          <small>{{ role.permissions.join(", ") || text("", "No permissions loaded") }}</small>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="toolbar">
        <label class="field">
          <span>{{ text("", "Search") }}</span>
          <input
            v-model.trim="filters.search"
            type="text"
            :placeholder="text('', 'Search by username or email')"
            @keyup.enter="handleSearch"
          >
        </label>

        <label class="field field--compact">
          <span>{{ text("", "Role") }}</span>
          <select v-model="filters.role">
            <option value="">{{ text("", "All roles") }}</option>
            <option v-for="role in roleOptions" :key="role.role" :value="role.role">
              {{ displayRoleLabel(role.role, role.label) }}
            </option>
          </select>
        </label>

        <label v-if="canManageUsers" class="switch-field">
          <input v-model="filters.includeSystemReserved" type="checkbox">
          <span>{{ text("", "Include reserved accounts") }}</span>
        </label>

        <div class="toolbar-actions">
          <button type="button" class="secondary-button" :disabled="loading" @click="resetFilters">
            {{ text("", "Reset") }}
          </button>
          <button type="button" class="primary-button" :disabled="loading" @click="handleSearch">
            {{ text("", "Apply filters") }}
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="table-shell">
        <table class="user-table">
          <thead>
            <tr>
              <th>{{ text("", "User") }}</th>
              <th>{{ text("", "Contact") }}</th>
              <th>{{ text("", "Role") }}</th>
              <th>{{ text("", "Created") }}</th>
              <th>{{ text("", "Action") }}</th>
            </tr>
          </thead>
          <tbody v-if="users.length">
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-name">{{ user.username }}</div>
                <div class="user-subline">{{ displayRoleLabel(user.userrole, user.roleLabel) }}</div>
              </td>
              <td>
                <div>{{ user.email }}</div>
                <div class="user-subline">{{ user.phone || text("", "No phone") }}</div>
              </td>
              <td>
                <select v-model="draftRoles[user.id]" class="role-select" :disabled="!canManageUsers">
                  <option v-for="role in roleOptions" :key="role.role" :value="role.role">
                    {{ displayRoleLabel(role.role, role.label) }}
                  </option>
                </select>
              </td>
              <td>{{ formatDateTime(user.createdAt) }}</td>
              <td>
                <button
                  v-if="canManageUsers"
                  type="button"
                  class="save-button"
                  :disabled="savingUserId === user.id || draftRoles[user.id] === user.userrole"
                  @click="saveUserRole(user)"
                >
                  {{ savingUserId === user.id ? text("", "Saving...") : text("", "Save role") }}
                </button>
                <span v-else class="readonly-pill">{{ text("仅查看", "View only") }}</span>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="empty-state">
                {{ loading ? text("", "Loading workspace users...") : text("", "No users match the current filters.") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="pagination.totalPages > 1" class="pagination-bar">
        <button type="button" class="secondary-button" :disabled="pagination.page <= 1 || loading" @click="changePage(pagination.page - 1)">
          {{ text("", "Previous") }}
        </button>
        <span>{{ text("", "Page") }} {{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button
          type="button"
          class="secondary-button"
          :disabled="pagination.page >= pagination.totalPages || loading"
          @click="changePage(pagination.page + 1)"
        >
          {{ text("", "Next") }}
        </button>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { getAdminUserList, updateAdminUserRole, updateWorkspaceRules, updateWorkspaceAiGateway } from "@/api/admin";
import { updateWorkspaceRolePasscodes } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { usePermissions } from "@/composables/usePermissions";
import {
  formatPlanPrice,
  formatPlanQuota,
  getWorkspacePlanDefinition,
} from "@/constants/workspacePlans";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type {
  AdminManagedUser,
  AdminRoleMatrixEntry,
  AdminUserListResponse,
  AdminUserRole,
  AdminWorkspaceSummary,
  AdminWorkspaceAiPayload,
} from "@/types/admin";

defineOptions({
  name: "AdminConsolePage",
});

const ROLE_DESCRIPTION_COPY: Record<AdminUserRole, string> = {
  user: "Standard personal workspace access.",
  manager: "Shared team visibility and assignment access.",
  admin: "Full workspace governance and admin control.",
};

const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();
const { text, roleLabel, isChinese, language } = useLocalizedText();
const users = ref<AdminManagedUser[]>([]);
const loading = ref(false);
const savingUserId = ref("");
const passcodeSaving = ref(false);
const workspaceRulesSaving = ref(false);
const errorMessage = ref("");
const summary = ref<AdminUserListResponse["summary"] | null>(null);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});
const filters = reactive({
  search: "",
  role: "" as "" | AdminUserRole,
  includeSystemReserved: false,
});
const draftRoles = reactive<Record<string, AdminUserRole>>({});
const rolePasscodes = reactive({
  user: "",
  manager: "",
  admin: "",
});
const workspaceRulesForm = reactive({
  managerSharedCustomersEnabled: true,
  managerTaskDelegationEnabled: true,
  managerReportingEnabled: true,
});

// AI Gateway configuration
const AI_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI", protocol: "OpenAI" },
  { value: "openai-compatible", label: "OpenAI Compatible", protocol: "OpenAI" },
  { value: "anthropic", label: "Anthropic", protocol: "Anthropic" },
  { value: "anthropic-compatible", label: "Anthropic Compatible", protocol: "Anthropic" },
  { value: "gemini", label: "Google Gemini", protocol: "Gemini" },
  { value: "ark", label: "Volcengine Ark", protocol: "OpenAI" },
  { value: "zhipu", label: "Zhipu GLM", protocol: "OpenAI" },
  { value: "qianwen", label: "Tongyi Qianwen", protocol: "OpenAI" },
  { value: "moonshot", label: "Moonshot", protocol: "OpenAI" },
] as const;

const AI_PROVIDER_DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  "openai-compatible": "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  "anthropic-compatible": "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  ark: "https://ark.cn-beijing.volces.com/api/v3",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  qianwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  moonshot: "https://api.moonshot.cn/v1",
};

type AiDeploymentMode = "public" | "vpc" | "private-cloud" | "on-premise";

const aiGatewaySaving = ref(false);
const aiGatewayForm = reactive({
  useCustomProvider: false,
  configured: false,
  providerType: "openai",
  baseURL: "",
  model: "",
  apiKey: "",
  maskedApiKey: "",
  customHeadersText: "",
  enterpriseEnabled: false,
  enterpriseDeploymentMode: "public" as AiDeploymentMode,
  enterpriseRegion: "global",
  enterprisePrivateEndpoint: "",
  enterpriseMonthlyBudgetUsd: 0,
  enterpriseRateLimitPerMinute: 0,
  enterpriseDataIsolation: true,
  enterpriseZeroDataRetention: true,
  enterpriseAuditLogging: true,
  enterpriseSsoEnabled: false,
});

const aiProviderOptions = computed(() => AI_PROVIDER_OPTIONS);
const aiGatewayProtocolLabel = computed(() => {
  const provider = AI_PROVIDER_OPTIONS.find((p) => p.value === aiGatewayForm.providerType);
  return provider?.protocol || "OpenAI";
});

const canManageWorkspaceControls = computed(() => permissions.can("workspace.manage", { fallbackRoles: ["admin"] }));
const canManageUsers = computed(() => permissions.can("users.manage", { fallbackRoles: ["admin"] }));
const isManagerConsole = computed(() => permissions.hasRole("manager") && !canManageWorkspaceControls.value);

const fallbackRoleOptions: AdminRoleMatrixEntry[] = [
  { role: "user", label: "Workspace Member", description: ROLE_DESCRIPTION_COPY.user, permissions: [] },
  { role: "manager", label: "Sales Manager", description: ROLE_DESCRIPTION_COPY.manager, permissions: [] },
  { role: "admin", label: "Administrator", description: ROLE_DESCRIPTION_COPY.admin, permissions: [] },
];

const roleOptions = computed(() => summary.value?.availableRoles?.length
  ? summary.value.availableRoles
  : fallbackRoleOptions);

const workspacePlan = computed(() => getWorkspacePlanDefinition(summary.value?.workspace?.plan || authStore.plan));
const localizedPlanLabel = computed(() => text("", workspacePlan.value.label));
const workspaceRules = computed(() => [
  text("", "The first user in each company is created as the company administrator."),
  text("", "Administrators can rotate workspace role passcodes; sales managers can open the console for their own group."),
  text("", "The last remaining administrator cannot be downgraded through role management."),
  text("", "Managers get shared team visibility, customer reassignment, task delegation, and higher-level reporting."),
  text("", "System reserved accounts stay protected and cannot be edited from normal user management flows."),
]);

const displayRoleLabel = (role: string, fallback?: string) => {
  const normalizedRole = String(role || "").trim().toLowerCase() as AdminUserRole;
  if (["user", "manager", "admin"].includes(normalizedRole)) {
    return roleLabel(normalizedRole);
  }

  return text("", fallback || "Member");
};

const displayRoleDescription = (role: string, fallback?: string) => {
  const normalizedRole = String(role || "").trim().toLowerCase() as AdminUserRole;
  if (ROLE_DESCRIPTION_COPY[normalizedRole]) {
    return text("", ROLE_DESCRIPTION_COPY[normalizedRole]);
  }

  return text("", fallback || "");
};

const syncWorkspaceRulesForm = (rules?: AdminWorkspaceSummary["workspaceRules"] | null) => {
  workspaceRulesForm.managerSharedCustomersEnabled = rules?.managerSharedCustomersEnabled ?? true;
  workspaceRulesForm.managerTaskDelegationEnabled = rules?.managerTaskDelegationEnabled ?? true;
  workspaceRulesForm.managerReportingEnabled = rules?.managerReportingEnabled ?? true;
};

const syncDraftRoles = (list: AdminManagedUser[]) => {
  for (const key of Object.keys(draftRoles)) {
    delete draftRoles[key];
  }

  for (const user of list) {
    draftRoles[user.id] = user.userrole;
  }
};

const loadUsers = async (page = pagination.page) => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getAdminUserList({
      page,
      limit: pagination.limit,
      search: filters.search || undefined,
      role: filters.role || undefined,
      includeSystemReserved: canManageUsers.value ? filters.includeSystemReserved || undefined : undefined,
    });
    const payload = unwrapApiResponseData(response, "Failed to load workspace users.");
    users.value = payload.list;
    summary.value = payload.summary;
    pagination.page = payload.pagination.page;
    pagination.limit = payload.pagination.limit;
    pagination.total = payload.pagination.total;
    pagination.totalPages = payload.pagination.totalPages;
    syncDraftRoles(payload.list);
    syncWorkspaceRulesForm(payload.summary.workspace?.workspaceRules);
    syncAiGatewayForm(payload.summary.workspace?.aiGateway);
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to load workspace users."));
  } finally {
    loading.value = false;
  }
};

const handleSaveWorkspaceRules = async () => {
  if (!canManageWorkspaceControls.value) {
    return;
  }

  workspaceRulesSaving.value = true;

  try {
    const response = await updateWorkspaceRules({
      workspaceRules: {
        managerSharedCustomersEnabled: workspaceRulesForm.managerSharedCustomersEnabled,
        managerTaskDelegationEnabled: workspaceRulesForm.managerTaskDelegationEnabled,
        managerReportingEnabled: workspaceRulesForm.managerReportingEnabled,
      },
    });
    const payload = unwrapApiResponseData(response, text("", "Failed to update workspace rules."));
    if (summary.value?.workspace) {
      summary.value.workspace = payload.workspace;
    }
    authStore.setWorkspaceRules(payload.workspace.workspaceRules);
    notifyActionSuccess(text("", "Workspace rules updated."));
  } catch (error) {
    notifyActionError(error, text("", "Failed to update workspace rules."));
  } finally {
    workspaceRulesSaving.value = false;
  }
};

const handleSearch = () => {
  void loadUsers(1);
};

const handleRefresh = () => {
  void loadUsers(pagination.page);
};

const handleEnterMyGroup = () => {
  if (!authStore.primaryGroupId) {
    notifyActionError(new Error("No primary group"), text("您没有分配主组，无法进入。", "You are not assigned to a primary group."));
    return;
  }
  router.push({ name: "Groups" });
};

const resetFilters = () => {
  filters.search = "";
  filters.role = "";
  filters.includeSystemReserved = false;
  void loadUsers(1);
};

const changePage = (page: number) => {
  if (page < 1 || page > pagination.totalPages || loading.value) {
    return;
  }

  void loadUsers(page);
};

const saveUserRole = async (user: AdminManagedUser) => {
  if (!canManageUsers.value) {
    return;
  }

  const nextRole = draftRoles[user.id];
  if (!nextRole || nextRole === user.userrole) {
    return;
  }

  savingUserId.value = user.id;

  try {
    const response = await updateAdminUserRole(user.id, {
      userrole: nextRole,
    });
    const payload = unwrapApiResponseData(response, text("", "Failed to update workspace role."));
    const target = users.value.find((entry) => entry.id === user.id);
    if (target) {
      Object.assign(target, payload.user);
    }
    draftRoles[user.id] = payload.user.userrole;
    notifyActionSuccess(
      text("", "Workspace role updated successfully."),
      { title: `${payload.user.username} · ${displayRoleLabel(payload.user.userrole, payload.user.roleLabel)}` },
    );
  } catch (error) {
    draftRoles[user.id] = user.userrole;
    notifyActionError(error, text("", "Failed to update workspace role."));
  } finally {
    savingUserId.value = "";
  }
};

const handleSaveRolePasscodes = async () => {
  if (!canManageWorkspaceControls.value) {
    return;
  }

  passcodeSaving.value = true;

  try {
    const response = await updateWorkspaceRolePasscodes({
      rolePasscodes: {
        user: rolePasscodes.user || undefined,
        manager: rolePasscodes.manager || undefined,
        admin: rolePasscodes.admin || undefined,
      },
    });

    if (response.data.user && response.data.company) {
      authStore.setUserInfo(response.data.user, response.data.company, response.data.rbac);
    }

    rolePasscodes.user = "";
    rolePasscodes.manager = "";
    rolePasscodes.admin = "";
    notifyActionSuccess(text("", "Workspace role passcodes updated."));
  } catch (error) {
    notifyActionError(error, text("", "Failed to update workspace role passcodes."));
  } finally {
    passcodeSaving.value = false;
  }
};

const syncAiGatewayForm = (aiGateway?: AdminWorkspaceSummary["aiGateway"] | null) => {
  if (!aiGateway) {
    aiGatewayForm.useCustomProvider = false;
    aiGatewayForm.configured = false;
    aiGatewayForm.providerType = "openai";
    aiGatewayForm.baseURL = "";
    aiGatewayForm.model = "";
    aiGatewayForm.apiKey = "";
    aiGatewayForm.maskedApiKey = "";
    aiGatewayForm.customHeadersText = "";
    aiGatewayForm.enterpriseEnabled = false;
    aiGatewayForm.enterpriseDeploymentMode = "public";
    aiGatewayForm.enterpriseRegion = "global";
    aiGatewayForm.enterprisePrivateEndpoint = "";
    aiGatewayForm.enterpriseMonthlyBudgetUsd = 0;
    aiGatewayForm.enterpriseRateLimitPerMinute = 0;
    aiGatewayForm.enterpriseDataIsolation = true;
    aiGatewayForm.enterpriseZeroDataRetention = true;
    aiGatewayForm.enterpriseAuditLogging = true;
    aiGatewayForm.enterpriseSsoEnabled = false;
    return;
  }

  aiGatewayForm.useCustomProvider = aiGateway.useCustomProvider ?? false;
  aiGatewayForm.configured = aiGateway.configured ?? false;
  aiGatewayForm.providerType = aiGateway.providerType ?? "openai";
  aiGatewayForm.baseURL = aiGateway.baseURL ?? AI_PROVIDER_DEFAULT_BASE_URLS[aiGateway.providerType] ?? "";
  aiGatewayForm.model = aiGateway.model ?? "";
  aiGatewayForm.apiKey = "";
  aiGatewayForm.maskedApiKey = aiGateway.maskedApiKey ?? "";
  aiGatewayForm.customHeadersText = aiGateway.customHeaders ? JSON.stringify(aiGateway.customHeaders, null, 2) : "";
  aiGatewayForm.enterpriseEnabled = aiGateway.enterprise?.enabled ?? false;
  aiGatewayForm.enterpriseDeploymentMode = (aiGateway.enterprise?.deploymentMode ?? "public") as AiDeploymentMode;
  aiGatewayForm.enterpriseRegion = aiGateway.enterprise?.region ?? "global";
  aiGatewayForm.enterprisePrivateEndpoint = aiGateway.enterprise?.privateEndpoint ?? "";
  aiGatewayForm.enterpriseMonthlyBudgetUsd = aiGateway.enterprise?.monthlyBudgetUsd ?? 0;
  aiGatewayForm.enterpriseRateLimitPerMinute = aiGateway.enterprise?.rateLimitPerMinute ?? 0;
  aiGatewayForm.enterpriseDataIsolation = aiGateway.enterprise?.dataIsolation ?? true;
  aiGatewayForm.enterpriseZeroDataRetention = aiGateway.enterprise?.zeroDataRetention ?? true;
  aiGatewayForm.enterpriseAuditLogging = aiGateway.enterprise?.auditLogging ?? true;
  aiGatewayForm.enterpriseSsoEnabled = aiGateway.enterprise?.ssoEnabled ?? false;
};

const handleAiProviderTypeChange = () => {
  const defaultBaseUrl = AI_PROVIDER_DEFAULT_BASE_URLS[aiGatewayForm.providerType];
  if (defaultBaseUrl && !aiGatewayForm.baseURL) {
    aiGatewayForm.baseURL = defaultBaseUrl;
  }
};

const handleSaveAiGateway = async () => {
  if (!canManageWorkspaceControls.value) {
    return;
  }

  aiGatewaySaving.value = true;

  try {
    let customHeaders: Record<string, string> = {};
    if (aiGatewayForm.customHeadersText) {
      try {
        const parsed = JSON.parse(aiGatewayForm.customHeadersText);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          customHeaders = parsed;
        }
      } catch {
        notifyActionError(new Error("Invalid JSON"), text("自定义请求头 JSON 格式无效", "Custom headers JSON is invalid"));
        aiGatewaySaving.value = false;
        return;
      }
    }

    const payload: AdminWorkspaceAiPayload = {
      aiGateway: {
        useCustomProvider: aiGatewayForm.useCustomProvider,
        providerType: aiGatewayForm.providerType,
        baseURL: aiGatewayForm.baseURL,
        model: aiGatewayForm.model,
        apiKey: aiGatewayForm.apiKey || undefined,
        customHeaders,
        enterprise: {
          enabled: aiGatewayForm.enterpriseEnabled,
          deploymentMode: aiGatewayForm.enterpriseDeploymentMode,
          region: aiGatewayForm.enterpriseRegion,
          privateEndpoint: aiGatewayForm.enterprisePrivateEndpoint,
          monthlyBudgetUsd: aiGatewayForm.enterpriseMonthlyBudgetUsd,
          rateLimitPerMinute: aiGatewayForm.enterpriseRateLimitPerMinute,
          dataIsolation: aiGatewayForm.enterpriseDataIsolation,
          zeroDataRetention: aiGatewayForm.enterpriseZeroDataRetention,
          auditLogging: aiGatewayForm.enterpriseAuditLogging,
          ssoEnabled: aiGatewayForm.enterpriseSsoEnabled,
        },
      },
    };

    const response = await updateWorkspaceAiGateway(payload);
    const result = unwrapApiResponseData(response, text("保存 AI 配置失败", "Failed to update workspace AI integration."));
    
    if (summary.value?.workspace) {
      summary.value.workspace = result.workspace;
    }
    
    syncAiGatewayForm(result.workspace?.aiGateway);
    notifyActionSuccess(text("AI 配置已保存", "Workspace AI integration updated."));
  } catch (error) {
    notifyActionError(error, text("保存 AI 配置失败", "Failed to update workspace AI integration."));
  } finally {
    aiGatewaySaving.value = false;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return text("", "Not available");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return text("", "Not available");
  }

  return new Intl.DateTimeFormat(isChinese.value ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatQuota = (value: number) => text("", formatPlanQuota(value));

onMounted(() => {
  void loadUsers();
});
</script>

<style scoped>
.admin-page {
  min-height: 100%;
  padding: 28px;
  background: rgb(250, 249, 245);
  color: rgb(26, 25, 23);
  display: grid;
  gap: 18px;
}

.hero-card,
.panel-card,
.summary-card {
  border: 1px solid rgb(220, 217, 207);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 36px rgba(26, 25, 23, 0.05);
}

.hero-card,
.panel-card {
  border-radius: 28px;
  padding: 24px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(120, 113, 93);
}

h1,
h2 {
  margin: 0;
}

h1 {
  font-size: clamp(28px, 4vw, 40px);
}

h2 {
  font-size: 24px;
}

.hero-copy,
.panel-copy {
  margin: 12px 0 0;
  line-height: 1.7;
  color: rgb(88, 86, 80);
}

.refresh-button,
.primary-button,
.secondary-button,
.save-button {
  border-radius: 999px;
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button,
.primary-button,
.save-button {
  border: 1px solid rgb(26, 25, 23);
  background: rgb(26, 25, 23);
  color: rgb(250, 249, 245);
}

.secondary-button {
  border: 1px solid rgb(195, 192, 180);
  background: rgb(255, 255, 255);
  color: rgb(26, 25, 23);
}

.refresh-button:disabled,
.primary-button:disabled,
.secondary-button:disabled,
.save-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.summary-grid,
.governance-grid,
.matrix-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.governance-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.matrix-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  padding: 20px 22px;
  border-radius: 22px;
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 32px;
}

.summary-card small,
.summary-label,
.panel-meta,
.matrix-card span,
.matrix-card small,
.rule-list li,
.user-subline,
.field span,
.switch-field,
.pagination-bar,
.status-pill {
  color: rgb(88, 86, 80);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.status-pill {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(245, 243, 236);
  font-size: 12px;
  font-weight: 700;
}

.readonly-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(245, 243, 236);
  padding: 8px 12px;
  color: rgb(88, 86, 80);
  font-size: 12px;
  font-weight: 700;
}

.rule-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  line-height: 1.7;
}

.rule-toggle-list {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.rule-toggle {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(250, 249, 245);
}

.rule-toggle div {
  display: grid;
  gap: 6px;
}

.rule-toggle strong {
  color: rgb(26, 25, 23);
}

.rule-toggle span {
  color: rgb(88, 86, 80);
  line-height: 1.6;
}

.rule-toggle input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.form-grid label,
.field {
  display: grid;
  gap: 8px;
}

.form-grid input,
.field input,
.field select,
.role-select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgb(214, 210, 198);
  background: rgb(250, 249, 245);
  padding: 12px 14px;
  color: rgb(26, 25, 23);
}

.panel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
  font-size: 13px;
}

.matrix-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(250, 249, 245);
}

.matrix-card strong {
  color: rgb(26, 25, 23);
  font-size: 18px;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(160px, 0.7fr) auto auto;
  gap: 14px;
  align-items: end;
}

.field--compact {
  min-width: 180px;
}

.switch-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.error-banner {
  margin: 18px 0;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgb(255, 239, 239);
  color: rgb(145, 52, 52);
}

.table-shell {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 16px 12px;
  border-bottom: 1px solid rgb(234, 230, 221);
  text-align: left;
  vertical-align: middle;
}

.user-name {
  font-weight: 700;
  color: rgb(26, 25, 23);
}

.pagination-bar {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.empty-state {
  text-align: center;
  color: rgb(120, 113, 93);
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .governance-grid,
  .matrix-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .admin-page {
    padding: 16px;
  }

  .hero-card {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.enter-group-button {
  background: rgb(34, 139, 34);
  border-color: rgb(34, 139, 34);
}

.enter-group-button:hover:not(:disabled) {
  background: rgb(46, 160, 46);
  border-color: rgb(46, 160, 46);
}

.manager-scope-card {
  border-left: 4px solid rgb(34, 139, 34);
}

.status-pill--success {
  background: rgb(220, 252, 220);
  border-color: rgb(34, 139, 34);
  color: rgb(34, 139, 34);
}

.status-pill--warning {
  background: rgb(255, 239, 199);
  border-color: rgb(180, 130, 50);
  color: rgb(140, 90, 20);
}

.manager-actions {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.action-hint {
  font-size: 13px;
  color: rgb(88, 86, 80);
  line-height: 1.6;
}

.manager-warning {
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgb(255, 239, 199);
  border: 1px solid rgb(180, 130, 50);
}

.warning-text {
  margin: 0;
  color: rgb(140, 90, 20);
  line-height: 1.6;
}

.ai-config-form {
  margin-top: 18px;
  display: grid;
  gap: 16px;
}

.form-grid--single {
  grid-template-columns: 1fr;
}

.form-grid textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgb(214, 210, 198);
  background: rgb(250, 249, 245);
  padding: 12px 14px;
  color: rgb(26, 25, 23);
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.enterprise-ai-panel {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(250, 249, 245);
}

.enterprise-ai-panel header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.enterprise-ai-panel header h4 {
  margin: 0;
  font-size: 18px;
  color: rgb(26, 25, 23);
}

.enterprise-ai-panel header p {
  margin: 6px 0 0;
  color: rgb(88, 86, 80);
  font-size: 13px;
}

.toggle-field--compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(255, 255, 255);
}

.enterprise-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.enterprise-feature-grid label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgb(220, 217, 207);
  background: rgb(255, 255, 255);
  font-size: 13px;
  color: rgb(88, 86, 80);
}

.enterprise-feature-grid input {
  width: 16px;
  height: 16px;
}

@media (max-width: 720px) {
  .enterprise-feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
