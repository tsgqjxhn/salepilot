<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="min(1080px, calc(100vw - 24px))"
    class="account-dialog"
    top="4vh"
    append-to-body
  >
    <div class="dialog-shell">
      <aside class="dialog-sidebar">
        <div class="account-summary">
          <div class="account-summary__avatar">{{ avatarInitial }}</div>
          <div>
            <strong>{{ authStore.username || "Account" }}</strong>
            <span>{{ roleLabel(authStore.userrole) }}</span>
          </div>
        </div>

        <button
          v-for="item in visibleTabs"
          :key="item.key"
          type="button"
          class="tab-button"
          :class="{ 'tab-button--active': activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </button>
      </aside>

      <section class="dialog-content">
        <header class="dialog-content__head">
          <div>
            <p>{{ text("账户设置", "Account settings") }}</p>
            <h2>{{ activeTabTitle }}</h2>
          </div>
          <button type="button" class="close-dialog" @click="uiStore.closeSettingsDialog()">×</button>
        </header>

        <div v-if="activeTab === 'preferences'" class="panel-grid">
          <article class="panel-card">
            <h3>{{ text("语言", "Language") }}</h3>
            <p>{{ text("切换中文或英文界面。", "Switch the interface between Chinese and English.") }}</p>
            <div class="choice-grid">
              <button
                type="button"
                class="choice-card"
                :class="{ 'choice-card--active': uiStore.language === 'zh-CN' }"
                @click="uiStore.setLanguage('zh-CN')"
              >
                <strong>中文</strong>
                <span>Simplified Chinese</span>
              </button>
              <button
                type="button"
                class="choice-card"
                :class="{ 'choice-card--active': uiStore.language === 'en-US' }"
                @click="uiStore.setLanguage('en-US')"
              >
                <strong>English</strong>
                <span>US English</span>
              </button>
            </div>
          </article>

          <article class="panel-card">
            <h3>{{ text("主题", "Theme") }}</h3>
            <p>{{ text("切换亮色或暗色主题，工作区会立即响应。", "Switch between light and dark themes instantly.") }}</p>
            <div class="choice-grid">
              <button
                type="button"
                class="choice-card"
                :class="{ 'choice-card--active': uiStore.theme === 'light' }"
                @click="uiStore.setTheme('light')"
              >
                <strong>{{ text("亮色", "Light") }}</strong>
                <span>{{ text("高对比暖色背景", "Warm bright surfaces") }}</span>
              </button>
              <button
                type="button"
                class="choice-card"
                :class="{ 'choice-card--active': uiStore.theme === 'dark' }"
                @click="uiStore.setTheme('dark')"
              >
                <strong>{{ text("暗色", "Dark") }}</strong>
                <span>{{ text("冷色深空工作台", "Cool dark workspace") }}</span>
              </button>
              <button
                type="button"
                class="choice-card"
                :class="{ 'choice-card--active': uiStore.theme === 'system' }"
                @click="uiStore.setTheme('system')"
              >
                <strong>{{ text("", "Follow system") }}</strong>
                <span>{{ text("", "Match the operating system theme") }}</span>
              </button>
            </div>
          </article>

        </div>

        <div v-else-if="activeTab === 'profile'" class="panel-card panel-card--full">
          <div class="panel-header-with-action">
            <div>
              <h3>{{ text("当前账号资料", "Current account profile") }}</h3>
              <p>{{ text("这里修改的是当前账号本身，导入用户信息也会写到这里。", "These fields update the current account directly and are also used by user-data import.") }}</p>
            </div>
            <button type="button" class="secondary-btn" @click="handleOpenCompanySwitchDialog">
              {{ text("更改公司", "Change company") }}
            </button>
          </div>

          <div class="form-grid">
            <label>
              <span>{{ text("用户名", "Username") }}</span>
              <input v-model.trim="profileForm.username" type="text" />
            </label>
            <label>
              <span>{{ text("邮箱", "Email") }}</span>
              <input v-model.trim="profileForm.email" type="email" />
            </label>
            <label>
              <span>{{ text("手机号", "Phone") }}</span>
              <input v-model.trim="profileForm.phone" type="tel" />
            </label>
          </div>

          <div class="form-grid profile-company-grid">
            <label>
              <span>{{ text("公司名称", "Company name") }}</span>
              <input :value="authStore.companyname || text('暂无公司', 'No company')" type="text" disabled />
            </label>
            <label>
              <span>{{ text("公司公开 ID", "Company public ID") }}</span>
              <input :value="authStore.companyPublicId || text('暂无 ID', 'No ID')" type="text" disabled />
            </label>
            <label>
              <span>{{ text("公司记录 ID", "Company record ID") }}</span>
              <input :value="authStore.companyRecordId || authStore.companyid || text('暂无 ID', 'No ID')" type="text" disabled />
            </label>
            <label>
              <span>{{ text("当前套餐", "Current plan") }}</span>
              <input :value="authStore.plan || text('未配置', 'Not configured')" type="text" disabled />
            </label>
            <label>
              <span>{{ text("公司认证状态", "Company verification") }}</span>
              <input :value="authStore.companyIdentityVerified ? text('已认证', 'Verified') : text('待认证', 'Pending')" type="text" disabled />
            </label>
          </div>

          <div class="panel-actions">
            <button type="button" class="primary-btn" :disabled="profileSaving" @click="handleSaveProfile">
              {{ profileSaving ? text("保存中...", "Saving...") : text("保存资料", "Save profile") }}
            </button>
          </div>
        </div>

        <div v-else-if="activeTab === 'debug'" class="panel-card panel-card--full">
          <h3>{{ text("李太虚调试账号", "Li Taixu debug account") }}</h3>
          <p v-if="isDebugAccount">
            {{ text("当前登录的是内置调试账号，可以直接切换角色权限重新签发 token。", "You are signed in with the built-in debug account and can switch role permissions live.") }}
          </p>
          <p v-else>
            {{ text("只有内置的李太虚账号可以切换调试角色。", "Only the built-in Li Taixu account can switch debug roles.") }}
          </p>

          <div class="form-grid">
            <label>
              <span>{{ text("当前角色", "Current role") }}</span>
              <input :value="roleLabel(authStore.userrole)" type="text" disabled />
            </label>
            <label>
              <span>{{ text("切换到", "Switch to") }}</span>
              <select v-model="debugRole">
                <option value="user">{{ roleLabel("user") }}</option>
                <option value="manager">{{ roleLabel("manager") }}</option>
                <option value="admin">{{ roleLabel("admin") }}</option>
              </select>
            </label>
          </div>

          <div class="panel-actions">
            <button
              type="button"
              class="primary-btn"
              :disabled="!isDebugAccount || debugSwitching"
              @click="handleSwitchDebugRole"
            >
              {{ debugSwitching ? text("切换中...", "Switching...") : text("切换调试角色", "Switch debug role") }}
            </button>
          </div>
        </div>

        <div v-else-if="activeTab === 'data'" class="panel-grid">
          <article class="panel-card">
            <h3>{{ text("导出与本地保存", "Export and local save") }}</h3>
            <p>{{ text("导出为 JSON 快照，包含设置、当前用户、客户与通知。", "Export a JSON snapshot with settings, user info, customers, and notifications.") }}</p>

            <div class="form-grid form-grid--single">
              <label>
                <span>{{ text("文件名", "Filename") }}</span>
                <input v-model.trim="backupDraft.filename" type="text" />
              </label>
            </div>

            <div class="panel-actions">
              <button type="button" class="primary-btn" :disabled="exportingLocal" @click="handleExportLocal">
                {{ exportingLocal ? text("生成中...", "Preparing...") : text("导出到本地 JSON", "Export local JSON") }}
              </button>
            </div>
          </article>

          <article class="panel-card panel-card--full">
            <h3>{{ text("导入数据", "Import data") }}</h3>
            <p>{{ text("普通导入按已知字段直接解析；智能导入会自动识别常见别名并补默认值。", "Normal import uses direct field parsing. Smart import auto-maps common aliases and fills defaults.") }}</p>

            <div class="form-grid">
              <label>
                <span>{{ text("目标", "Target") }}</span>
                <select v-model="importTarget">
                  <option value="all">{{ text("全部", "All sections") }}</option>
                  <option value="settings">{{ text("界面设置", "UI settings") }}</option>
                  <option value="user">{{ text("用户信息", "User info") }}</option>
                  <option value="customers">{{ text("客户信息", "Customer data") }}</option>
                </select>
              </label>
              <label>
                <span>{{ text("模式", "Mode") }}</span>
                <select v-model="importMode">
                  <option value="normal">{{ text("普通导入", "Normal import") }}</option>
                  <option value="smart">{{ text("智能导入", "Smart import") }}</option>
                </select>
              </label>
              <label>
                <span>{{ text("JSON 文件", "JSON file") }}</span>
                <input type="file" accept=".json,application/json" @change="handleImportFileChange" />
              </label>
            </div>

            <div v-if="importPreview.length" class="import-preview">
              <strong>{{ text("预览", "Preview") }}</strong>
              <span v-for="line in importPreview" :key="line">{{ line }}</span>
            </div>

            <div class="panel-actions">
              <button type="button" class="primary-btn" :disabled="importingData || !rawImportPayload" @click="handleImportData">
                {{ importingData ? text("导入中...", "Importing...") : text("开始导入", "Run import") }}
              </button>
            </div>
          </article>
        </div>

        <div v-else-if="activeTab === 'ai'" class="panel-card panel-card--full">
          <h3>{{ text("AI 接入状态", "AI integration status") }}</h3>
          <p class="status-description">
            {{ text("AI 配置已移至管理台统一管理。所有 AI 调用通过后端代理，API 密钥等敏感信息不暴露给前端。", "AI configuration is now managed centrally in the admin console. All AI calls are proxied through the backend, and API keys are not exposed to the frontend.") }}
          </p>

          <div class="ai-status-card">
            <div class="ai-status-header">
              <span class="ai-status-label">{{ text("当前状态", "Current status") }}</span>
              <span class="ai-status-badge" :class="aiGatewayStatusClass">
                {{ aiGatewayStatusText }}
              </span>
            </div>

            <div class="ai-status-details">
              <div class="ai-status-row">
                <span class="ai-status-key">{{ text("提供商", "Provider") }}</span>
                <span class="ai-status-value">{{ authStore.aiGateway?.providerLabel || text("系统默认", "System default") }}</span>
              </div>
              <div class="ai-status-row">
                <span class="ai-status-key">{{ text("协议", "Protocol") }}</span>
                <span class="ai-status-value">{{ authStore.aiGateway?.protocol || "OpenAI" }}</span>
              </div>
              <div class="ai-status-row">
                <span class="ai-status-key">{{ text("模型", "Model") }}</span>
                <span class="ai-status-value">{{ authStore.aiGateway?.model || text("未配置", "Not configured") }}</span>
              </div>
              <div class="ai-status-row">
                <span class="ai-status-key">{{ text("自定义接入", "Custom integration") }}</span>
                <span class="ai-status-value">{{ authStore.aiGateway?.useCustomProvider ? text("已启用", "Enabled") : text("未启用", "Disabled") }}</span>
              </div>
              <div v-if="authStore.aiGateway?.enterprise?.enabled" class="ai-status-row">
                <span class="ai-status-key">{{ text("企业级接入", "Enterprise access") }}</span>
                <span class="ai-status-value">{{ text("已启用", "Enabled") }}</span>
              </div>
            </div>
          </div>

          <div class="ai-admin-notice">
            <p>
              {{ text("如需修改 AI 配置，请联系管理员在管理台进行设置。", "To modify AI configuration, please contact your administrator to update settings in the admin console.") }}
            </p>
            <router-link v-if="authStore.userrole === 'admin'" to="/admin" class="admin-link" @click="uiStore.closeSettingsDialog()">
              {{ text("前往管理台", "Go to admin console") }}
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </el-dialog>

  <!-- 公司选择对话框 -->
  <el-dialog
    v-model="companySwitchDialogVisible"
    :title="text('选择公司', 'Select Company')"
    width="400px"
    class="company-switch-dialog"
    append-to-body
  >
    <div v-if="companySwitchLoading" class="company-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ text('加载中...', 'Loading...') }}</span>
    </div>

    <div v-else-if="accessibleCompanies.length === 0" class="company-empty">
      <p>{{ text('没有可访问的其他公司', 'No other accessible companies') }}</p>
    </div>

    <div v-else class="company-list">
      <div
        v-for="company in accessibleCompanies"
        :key="company.id"
        class="company-item"
        :class="{ 'company-item--current': company.isCurrent }"
        @click="handleSelectCompany(company)"
      >
        <div class="company-item__info">
          <strong>{{ company.name }}</strong>
          <span v-if="company.publicId" class="company-item__public-id">{{ company.publicId }}</span>
        </div>
        <div class="company-item__meta">
          <span class="company-item__plan">{{ company.plan }}</span>
          <span v-if="company.isCurrent" class="company-item__current-badge">
            {{ text('当前', 'Current') }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="companySwitchDialogVisible = false">
        {{ text('取消', 'Cancel') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElIcon } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useLocalizedText } from "@/composables/useLocalizedText";
import {
  updateCurrentUserProfile,
  switchDebugAccountRole,
  getAccessibleCompanies,
  switchCompany,
  type AuthPayload,
  type AccessibleCompanyRecord,
} from "@/api/auth";
import {
  buildWorkspaceSnapshot,
  downloadWorkspaceSnapshot,
  importWorkspaceData,
  parseWorkspaceImportFile,
  type ImportMode,
  type ImportTarget,
} from "@/utils/workspaceData";
import {
  notifyActionError,
  notifyActionSuccess,
  notifyActionWarning,
} from "@/utils/actionFeedback";
defineOptions({
  name: "AccountSettingsDialog",
});

type SettingsTabKey = "preferences" | "profile" | "debug" | "data" | "ai";

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { text, roleLabel } = useLocalizedText();
const activeTab = ref<SettingsTabKey>("preferences");
const profileSaving = ref(false);
const debugSwitching = ref(false);
const exportingLocal = ref(false);
const importingData = ref(false);
const debugRole = ref<"user" | "manager" | "admin">("user");
const importTarget = ref<ImportTarget>("all");
const importMode = ref<ImportMode>("normal");
const rawImportPayload = ref<unknown | null>(null);
const importPreview = ref<string[]>([]);
const companySwitchDialogVisible = ref(false);
const companySwitchLoading = ref(false);
const companySwitching = ref(false);
const accessibleCompanies = ref<AccessibleCompanyRecord[]>([]);

const profileForm = reactive({
  username: "",
  email: "",
  phone: "",
});

const backupDraft = reactive({
  filename: "salepilot-backup.json",
});


const tabs = computed(() => [
  {
    key: "preferences" as SettingsTabKey,
    title: text("偏好设置", "Preferences"),
    description: text("语言与主题", "Language and theme"),
  },
  {
    key: "profile" as SettingsTabKey,
    title: text("资料", "Profile"),
    description: text("当前账号信息", "Current account info"),
  },
  {
    key: "debug" as SettingsTabKey,
    title: text("调试", "Debug"),
    description: text("李太虚角色切换", "Li Taixu role switch"),
  },
  {
    key: "data" as SettingsTabKey,
    title: text("数据中心", "Data center"),
    description: text("导入、导出、备份", "Import, export, backup"),
  },
  {
    key: "ai" as SettingsTabKey,
    title: text("AI 设置", "AI settings"),
    description: text("AI 集成配置", "AI integration config"),
  },
]);

const visible = computed({
  get: () => uiStore.settingsDialogOpen,
  set: (value: boolean) => {
    if (!value) {
      uiStore.closeSettingsDialog();
    }
  },
});

const isDebugAccount = computed(() => authStore.isSystemReserved && authStore.username === "李太虚");
const canManageWorkspaceAi = computed(() => (
  authStore.hasPermission("workspace.manage") || String(authStore.userrole || "").trim().toLowerCase() === "admin"
));
const visibleTabs = computed(() => {
  let result = tabs.value;
  if (!isDebugAccount.value) {
    result = result.filter((item) => item.key !== "debug");
  }
  if (!canManageWorkspaceAi.value) {
    result = result.filter((item) => item.key !== "ai");
  }
  return result;
});
const avatarInitial = computed(() => String(authStore.username || "A").trim().charAt(0).toUpperCase());
const activeTabTitle = computed(() => visibleTabs.value.find((item) => item.key === activeTab.value)?.title || "");
// AI status computed properties for simplified view
const aiGatewayStatusText = computed(() => {
  if (!authStore.aiGateway) {
    return text("未配置", "Not configured");
  }
  if (authStore.aiGateway.configured) {
    return text("已配置", "Configured");
  }
  return text("部分配置", "Partially configured");
});

const aiGatewayStatusClass = computed(() => {
  if (!authStore.aiGateway) {
    return "status-badge--warning";
  }
  if (authStore.aiGateway.configured) {
    return "status-badge--success";
  }
  return "status-badge--warning";
});

const applyAuthPayload = (payload: AuthPayload) => {
  if (payload.accessToken && payload.refreshToken) {
    authStore.setTokens(payload.accessToken, payload.refreshToken);
  }

  if (payload.user && payload.company) {
    authStore.setUserInfo(payload.user, payload.company, payload.rbac);
  }
};

const syncDrafts = () => {
  profileForm.username = authStore.username || "";
  profileForm.email = authStore.email || "";
  profileForm.phone = authStore.phone || "";
  debugRole.value = (authStore.userrole || "user") as "user" | "manager" | "admin";
  backupDraft.filename = backupDraft.filename || "salepilot-backup.json";
};

const isSettingsTabKey = (value: unknown): value is SettingsTabKey => (
  ["preferences", "profile", "debug", "data", "ai"].includes(String(value))
);

const applyRequestedSettingsTab = () => {
  const requestedTab = uiStore.settingsDialogInitialTab;
  if (!isSettingsTabKey(requestedTab)) {
    return;
  }

  if (visibleTabs.value.some((item) => item.key === requestedTab)) {
    activeTab.value = requestedTab;
  }
};

const buildSnapshotContext = () => ({
  settings: {
    language: uiStore.language,
    theme: uiStore.theme,
  },
  user: {
    username: authStore.username || "",
    email: authStore.email || "",
    phone: authStore.phone,
    userrole: authStore.userrole || "user",
    permissions: [...authStore.permissions],
    companyid: authStore.companyid,
    companyname: authStore.companyname,
    roleLabel: authStore.roleLabel,
    isSystemReserved: authStore.isSystemReserved,
  },
});

const updateImportPreview = (rawPayload: unknown) => {
  const preview: string[] = [];

  if (Array.isArray(rawPayload)) {
    preview.push(text(`检测到数组数据：${rawPayload.length} 行`, `Detected array payload: ${rawPayload.length} rows`));
  } else if (rawPayload && typeof rawPayload === "object") {
    const record = rawPayload as Record<string, unknown>;
    const sectionKeys = record.sections && typeof record.sections === "object"
      ? Object.keys(record.sections as Record<string, unknown>)
      : Object.keys(record);
    preview.push(text(`检测到分区：${sectionKeys.join("、")}`, `Detected sections: ${sectionKeys.join(", ")}`));

    const customers = record.sections && typeof record.sections === "object"
      ? (record.sections as Record<string, unknown>).customers
      : record.customers;
    if (Array.isArray(customers)) {
      preview.push(text(`客户数据：${customers.length} 条`, `Customer rows: ${customers.length}`));
    }
  }

  preview.push(
    importMode.value === "smart"
      ? text("当前模式：智能导入，会自动映射常见字段别名。", "Mode: smart import, with automatic alias mapping.")
      : text("当前模式：普通导入，按原字段直接解析。", "Mode: normal import, using direct field parsing."),
  );

  importPreview.value = preview;
};

const handleSaveProfile = async () => {
  profileSaving.value = true;

  try {
    const response = await updateCurrentUserProfile({
      username: profileForm.username,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    applyAuthPayload(response.data);
    notifyActionSuccess(text("资料已更新。", "Profile updated."), {
      title: text("账户设置", "Account settings"),
    });
  } catch (error) {
    notifyActionError(error, text("资料更新失败。", "Failed to update profile."), {
      title: text("账户设置", "Account settings"),
    });
  } finally {
    profileSaving.value = false;
  }
};

const handleOpenCompanySwitchDialog = async () => {
  companySwitchDialogVisible.value = true;
  companySwitchLoading.value = true;
  accessibleCompanies.value = [];

  try {
    const response = await getAccessibleCompanies();
    accessibleCompanies.value = response.data.companies || [];
  } catch (error) {
    notifyActionError(error, text("获取公司列表失败。", "Failed to get company list."), {
      title: text("更改公司", "Change company"),
    });
    companySwitchDialogVisible.value = false;
  } finally {
    companySwitchLoading.value = false;
  }
};

const handleSelectCompany = async (company: AccessibleCompanyRecord) => {
  if (company.isCurrent) {
    companySwitchDialogVisible.value = false;
    return;
  }

  companySwitching.value = true;

  try {
    const response = await switchCompany({ companyId: company.id });
    applyAuthPayload(response.data);
    companySwitchDialogVisible.value = false;
    notifyActionSuccess(text("公司已切换。", "Company switched."), {
      title: text("更改公司", "Change company"),
    });
    // 刷新页面以更新所有数据
    await router.push("/customer");
  } catch (error) {
    notifyActionError(error, text("切换公司失败。", "Failed to switch company."), {
      title: text("更改公司", "Change company"),
    });
  } finally {
    companySwitching.value = false;
  }
};

const handleSwitchDebugRole = async () => {
  debugSwitching.value = true;

  try {
    const response = await switchDebugAccountRole(debugRole.value);
    applyAuthPayload(response.data);
    notifyActionSuccess(text("调试角色已切换。", "Debug role switched."), {
      title: text("调试账号", "Debug account"),
    });
    await router.push("/customer");
  } catch (error) {
    notifyActionError(error, text("切换调试角色失败。", "Failed to switch debug role."), {
      title: text("调试账号", "Debug account"),
    });
  } finally {
    debugSwitching.value = false;
  }
};

const handleExportLocal = async () => {
  exportingLocal.value = true;

  try {
    const snapshot = await buildWorkspaceSnapshot(buildSnapshotContext());
    downloadWorkspaceSnapshot(snapshot, backupDraft.filename || "salepilot-backup.json");
    notifyActionSuccess(text("JSON 快照已导出到本地。", "JSON snapshot exported locally."), {
      title: text("数据中心", "Data center"),
    });
  } catch (error) {
    notifyActionError(error, text("导出失败。", "Failed to export snapshot."), {
      title: text("数据中心", "Data center"),
    });
  } finally {
    exportingLocal.value = false;
  }
};

const handleImportFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    rawImportPayload.value = null;
    importPreview.value = [];
    return;
  }

  try {
    rawImportPayload.value = await parseWorkspaceImportFile(file);
    updateImportPreview(rawImportPayload.value);
  } catch (error) {
    rawImportPayload.value = null;
    importPreview.value = [];
    notifyActionError(error, text("解析导入文件失败。", "Failed to parse the import file."), {
      title: text("数据中心", "Data center"),
    });
  }
};

const handleImportData = async () => {
  if (!rawImportPayload.value) {
    notifyActionWarning(text("请先选择一个 JSON 文件。", "Choose a JSON file first."), {
      title: text("数据中心", "Data center"),
    });
    return;
  }

  importingData.value = true;

  try {
    const report = await importWorkspaceData({
      rawInput: rawImportPayload.value,
      target: importTarget.value,
      mode: importMode.value,
      applySettings: (settings) => {
        if (settings.language) {
          uiStore.setLanguage(settings.language);
        }
        if (settings.theme) {
          uiStore.setTheme(settings.theme);
        }
      },
      applyImportedUser: (payload) => {
        applyAuthPayload(payload);
      },
    });

    const warningCopy = report.warnings.length
      ? text(`，其中 ${report.warnings.length} 条客户数据未能导入`, `, with ${report.warnings.length} customer warnings`)
      : "";
    notifyActionSuccess(
      text(
        `导入完成：${report.importedSections.join("、") || "无"}，客户 ${report.importedCustomers} 条${warningCopy}`,
        `Import finished: ${report.importedSections.join(", ") || "none"}, customers ${report.importedCustomers}${warningCopy}`,
      ),
      {
        title: text("数据中心", "Data center"),
        duration: report.warnings.length ? 4200 : 3000,
      },
    );
  } catch (error) {
    notifyActionError(error, text("导入失败。", "Import failed."), {
      title: text("数据中心", "Data center"),
    });
  } finally {
    importingData.value = false;
  }
};

watch(visible, (isOpen) => {
  if (isOpen) {
    syncDrafts();
    applyRequestedSettingsTab();
    if (!isDebugAccount.value && activeTab.value === "debug") {
      activeTab.value = "preferences";
    }
  }
});

watch(
  () => uiStore.settingsDialogInitialTab,
  () => {
    if (!visible.value) {
      return;
    }

    applyRequestedSettingsTab();
  },
);



watch(importMode, () => {
  if (rawImportPayload.value) {
    updateImportPreview(rawImportPayload.value);
  }
});

watch(isDebugAccount, (enabled) => {
  if (!enabled && activeTab.value === "debug") {
    activeTab.value = "preferences";
  }
});
</script>

<style scoped>
:deep(.account-dialog .el-dialog) {
  border-radius: 28px;
  overflow: hidden;
  background: var(--surface-white);
}

:deep(.account-dialog .el-dialog__header) {
  display: none;
}

:deep(.account-dialog .el-dialog__body) {
  padding: 0;
}

.dialog-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: min(760px, 84vh);
}

.dialog-sidebar {
  padding: 22px;
  border-right: 1px solid var(--border-light);
  background:
    radial-gradient(circle at top left, rgba(96, 171, 255, 0.12), transparent 28%),
    linear-gradient(180deg, var(--surface-primary) 0%, var(--surface-secondary) 100%);
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
}

.account-summary__avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--text-primary);
  color: var(--surface-white);
  font-size: 18px;
  font-weight: 700;
}

.account-summary strong,
.account-summary span {
  display: block;
}

.account-summary strong {
  color: var(--text-primary);
}

.account-summary span {
  color: var(--text-secondary);
  font-size: 13px;
}

.tab-button {
  width: 100%;
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  margin-bottom: 10px;
}

.tab-button strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}

.tab-button span {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.tab-button--active {
  border-color: var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-soft);
}

.dialog-content {
  padding: 24px 24px 28px;
  overflow-y: auto;
}

.dialog-content__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.dialog-content__head p {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dialog-content__head h2 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.close-dialog {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 24px;
}

.panel-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--border-light);
  background: var(--surface-primary);
  box-shadow: var(--shadow-soft);
}

.panel-card--full {
  display: grid;
  gap: 18px;
}

.panel-card h3 {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.panel-card p {
  color: var(--text-secondary);
  line-height: 1.7;
}

.choice-grid,
.form-grid {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.choice-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--single {
  grid-template-columns: 1fr;
}

.choice-card,
.form-grid label {
  display: grid;
  gap: 8px;
}

.toggle-field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  color: var(--text-primary);
  font-weight: 600;
}

.choice-card {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  text-align: left;
  cursor: pointer;
}

.choice-card--active {
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 1px var(--accent-primary);
}

.choice-card strong,
.form-grid label span {
  color: var(--text-primary);
  font-weight: 700;
}

.choice-card span {
  color: var(--text-secondary);
}

.form-grid label span {
  font-size: 13px;
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  color: var(--text-primary);
  outline: none;
}

.form-grid textarea {
  resize: vertical;
  min-height: 120px;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}

.form-grid input:disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.primary-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 999px;
  background: var(--text-primary);
  color: var(--surface-white);
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.import-preview {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: var(--surface-white);
  border: 1px solid var(--border-light);
}

.import-preview strong {
  color: var(--text-primary);
}

.import-preview span {
  color: var(--text-secondary);
}

.enterprise-ai-panel {
  margin-top: 24px;
  padding: 18px;
  border-radius: 20px;
  background: var(--surface-white);
  border: 1px solid var(--border-light);
}

.enterprise-ai-panel header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.enterprise-ai-panel header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.enterprise-ai-panel header p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.toggle-field--compact {
  margin-top: 0;
}

.enterprise-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.enterprise-feature-grid label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular);
  cursor: pointer;
}

.enterprise-feature-grid input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

@media (max-width: 980px) {
  .dialog-shell {
    grid-template-columns: 1fr;
  }

  .dialog-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
}

@media (max-width: 720px) {
  .panel-grid,
  .choice-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* AI Status Card Styles */
.ai-status-card {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: var(--surface-secondary);
  border: 1px solid var(--border-light);
}

.ai-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ai-status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge--success {
  background: rgb(220, 252, 220);
  border: 1px solid rgb(34, 139, 34);
  color: rgb(34, 139, 34);
}

.status-badge--warning {
  background: rgb(255, 239, 199);
  border: 1px solid rgb(180, 130, 50);
  color: rgb(140, 90, 20);
}

.ai-status-details {
  display: grid;
  gap: 12px;
}

.ai-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.ai-status-row:last-child {
  border-bottom: none;
}

.ai-status-key {
  font-size: 13px;
  color: var(--text-secondary);
}

.ai-status-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.ai-admin-hint {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
}

.ai-admin-hint p {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-contrast);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.admin-link:hover {
  opacity: 0.9;
}

.panel-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-header-with-action h3 {
  margin: 0 0 4px 0;
}

.panel-header-with-action p {
  margin: 0;
}

.secondary-btn {
  padding: 10px 16px;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  background: var(--surface-white);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background: var(--surface-secondary);
  border-color: var(--accent-primary);
}

.company-switch-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.company-loading,
.company-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: var(--text-secondary);
}

.company-list {
  display: grid;
  gap: 12px;
}

.company-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  cursor: pointer;
  transition: all 0.2s ease;
}

.company-item:hover {
  border-color: var(--accent-primary);
  background: var(--surface-secondary);
}

.company-item--current {
  border-color: var(--accent-primary);
  background: rgba(96, 171, 255, 0.08);
}

.company-item__info {
  display: grid;
  gap: 4px;
}

.company-item__info strong {
  color: var(--text-primary);
  font-weight: 700;
}

.company-item__public-id {
  color: var(--text-tertiary);
  font-size: 12px;
}

.company-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.company-item__plan {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--surface-secondary);
}

.company-item__current-badge {
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(96, 171, 255, 0.15);
}

</style>
