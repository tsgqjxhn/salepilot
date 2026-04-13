<template>
  <div class="account-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">{{ text("", "Account workspace") }}</p>
        <h1 class="page-title">{{ text("", "Identity and access") }}</h1>
        <p class="page-copy">
          {{ text("", "Review your current role, account name, and session status in one place.") }}
        </p>
      </div>
      <button class="logout-btn" @click="handleLogout">{{ text("", "Log out") }}</button>
    </section>

    <section class="details-grid">
      <article class="detail-card">
        <h2>{{ text("", "Profile") }}</h2>
        <dl class="detail-list">
          <div>
            <dt>{{ text("", "Username") }}</dt>
            <dd>{{ username }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Role") }}</dt>
            <dd>{{ roleLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("公司名称", "Company name") }}</dt>
            <dd>{{ workspaceCompanyName }}</dd>
          </div>
          <div>
            <dt>{{ text("公司 ID", "Company ID") }}</dt>
            <dd>{{ workspaceCompanyId }}</dd>
          </div>
          <div>
            <dt>{{ text("当前套餐", "Current plan") }}</dt>
            <dd>{{ workspacePlanLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("公司身份", "Company identity") }}</dt>
            <dd>{{ workspaceIdentityLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Refresh token") }}</dt>
            <dd>{{ hasRefreshToken ? text("", "Available") : text("", "Missing") }}</dd>
          </div>
        </dl>
      </article>

      <article class="detail-card">
        <h2>{{ text("", "Session health") }}</h2>
        <dl class="detail-list">
          <div>
            <dt>{{ text("", "Refresh mode") }}</dt>
            <dd>{{ text("", "Automatic") }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Session state") }}</dt>
            <dd>{{ sessionState }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Access token") }}</dt>
            <dd>{{ accessTokenState }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Next refresh window") }}</dt>
            <dd>{{ nextRefreshWindow }}</dd>
          </div>
          <div>
            <dt>{{ text("", "Last refresh") }}</dt>
            <dd>{{ lastRefreshLabel }}</dd>
          </div>
        </dl>
      </article>

      <article class="detail-card">
        <h2>{{ text("", "Workspace guidance") }}</h2>
        <ul class="guidance-list">
          <li>{{ text("", "Use Customers to manage active records and create new accounts.") }}</li>
          <li>{{ text("", "Use Deleted to restore archived customer records.") }}</li>
          <li>{{ text("", "Your current permissions are controlled by the role shown above.") }}</li>
        </ul>
      </article>

      <article class="detail-card">
        <h2>{{ text("工作区概览", "Workspace overview") }}</h2>
        <dl class="detail-list">
          <div>
            <dt>{{ text("我的职务", "My role") }}</dt>
            <dd>{{ roleLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("所在小组", "Primary group") }}</dt>
            <dd>{{ workspacePrimaryGroupLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("席位使用量", "Seat usage") }}</dt>
            <dd>{{ workspaceSeatsUsageLabel }}</dd>
          </div>
          <div>
            <dt>{{ text("客户使用量", "Customer usage") }}</dt>
            <dd>{{ workspaceCustomersUsageLabel }}</dd>
          </div>
        </dl>
        <p v-if="workspaceOverviewLoading" class="loading-copy">
          {{ text("正在刷新工作区概览...", "Refreshing workspace overview...") }}
        </p>
      </article>
    </section>

    <section class="matrix-grid">
      <article class="detail-card">
        <h2>{{ text("", "Current permissions") }}</h2>
        <div class="permission-stack">
          <span v-for="permission in currentPermissions" :key="permission" class="permission-chip">
            {{ permission }}
          </span>
          <p v-if="!currentPermissions.length" class="empty-copy">
            {{ text("", "No permissions were resolved for this account.") }}
          </p>
        </div>
      </article>

      <article class="detail-card">
        <h2>{{ text("", "RBAC matrix") }}</h2>
        <div class="matrix-stack">
          <section
            v-for="entry in roleMatrix"
            :key="entry.role"
            class="matrix-role"
            :class="{ 'matrix-role--active': entry.role === userRole }"
          >
            <div class="matrix-role__head">
              <div>
                <strong>{{ formatRoleLabel(entry.role) }}</strong>
                <p>{{ text("", entry.description) }}</p>
              </div>
              <span class="role-pill">{{ entry.role }}</span>
            </div>

            <div class="permission-stack">
              <span v-for="permission in entry.permissions" :key="`${entry.role}-${permission}`" class="permission-chip">
                {{ permission }}
              </span>
            </div>
          </section>
          <p v-if="!roleMatrix.length" class="empty-copy">
            {{ text("", "RBAC matrix metadata is not available yet.") }}
          </p>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getWorkspaceOverview, type WorkspaceOverviewResponse } from "@/api/auth";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const permissions = usePermissions();
const { text, language, roleLabel: formatRoleLabel } = useLocalizedText();

const username = computed(() => authStore.username || localStorage.getItem("username") || text("", "Unknown user"));
const userRole = computed(() => permissions.currentRole.value || "user");
const hasRefreshToken = computed(() => Boolean(localStorage.getItem("refresh_token")));
const currentPermissions = computed(() => permissions.currentPermissions.value);
const roleMatrix = computed(() => permissions.roleMatrix.value);
const roleLabel = computed(() => formatRoleLabel(userRole.value));
const workspaceOverview = ref<WorkspaceOverviewResponse["workspace"] | null>(null);
const workspaceOverviewLoading = ref(false);

const workspaceCompanyName = computed(() => (
  workspaceOverview.value?.company?.name
  || authStore.companyname
  || text("暂无公司", "No workspace")
));
const workspaceCompanyId = computed(() => (
  workspaceOverview.value?.company?.publicId
  || authStore.companyPublicId
  || text("暂不可用", "Not available")
));
const workspacePlanLabel = computed(() => (
  workspaceOverview.value?.company?.plan
  || authStore.plan
  || text("暂未配置", "Not configured")
));
const workspaceIdentityLabel = computed(() => (
  authStore.companyIdentityVerified
    ? text("已认证", "Verified")
    : text("未认证", "Pending")
));
const workspacePrimaryGroupLabel = computed(() => (
  workspaceOverview.value?.membership?.primaryGroupName
  || text("未加入小组", "No group yet")
));
const workspaceSeatsUsageLabel = computed(() => {
  const usage = workspaceOverview.value?.usage;
  if (!usage) {
    return text("暂不可用", "Not available");
  }

  return `${usage.seatsUsed} / ${usage.seatsUsed + usage.seatsRemaining}`;
});
const workspaceCustomersUsageLabel = computed(() => {
  const usage = workspaceOverview.value?.usage;
  if (!usage) {
    return text("暂不可用", "Not available");
  }

  return `${usage.customersUsed} / ${usage.customersUsed + usage.customersRemaining}`;
});

const sessionState = computed(() => {
  if (authStore.isRefreshingToken) {
    return text("", "Refreshing silently");
  }

  if (!hasRefreshToken.value) {
    return text("", "Signed out");
  }

  if (!authStore.sessionReady) {
    return text("", "Restoring session");
  }

  if (authStore.hasValidAccessToken(0)) {
    return text("", "Active");
  }

  return text("", "Awaiting refresh");
});

const accessTokenState = computed(() => {
  if (authStore.hasValidAccessToken(0)) {
    return text("", "Healthy");
  }

  return hasRefreshToken.value ? text("", "Refreshing on demand") : text("", "Unavailable");
});

const formatDateTime = (value: number | null) => {
  if (!value) {
    return text("", "Not available");
  }

  return new Intl.DateTimeFormat(language.value === "zh-CN" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
};

const nextRefreshWindow = computed(() => {
  const expiresAt = authStore.accessTokenExpiresAt;
  if (!expiresAt) {
    return hasRefreshToken.value ? text("", "Scheduled after silent restore") : text("", "No session");
  }

  const refreshAt = expiresAt - 60_000;
  if (refreshAt <= Date.now()) {
    return text("", "Refreshing soon");
  }

  return formatDateTime(refreshAt);
});

const lastRefreshLabel = computed(() => formatDateTime(authStore.lastTokenRefreshAt));

const loadWorkspaceOverview = async () => {
  workspaceOverviewLoading.value = true;

  try {
    const response = await getWorkspaceOverview();
    workspaceOverview.value = response.data?.workspace ?? null;
  } catch {
    workspaceOverview.value = null;
  } finally {
    workspaceOverviewLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.clearTokens({ clearBoundStorage: true });
  localStorage.removeItem("user_role");
  localStorage.removeItem("username");
  router.push("/auth/login");
};

onMounted(() => {
  void loadWorkspaceOverview();
});
</script>

<style scoped>
.account-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-card,
.detail-card {
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 22px;
  background: var(--surface-white, rgb(255, 255, 255));
  box-shadow: 0 16px 34px rgba(26, 25, 23, 0.05);
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0 0 8px;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.page-copy {
  margin: 0;
  max-width: 640px;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
}

.logout-btn {
  flex-shrink: 0;
  padding: 12px 18px;
  border: none;
  border-radius: 999px;
  background: var(--text-primary, rgb(26, 25, 23));
  color: var(--surface-white, rgb(255, 255, 255));
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.logout-btn:hover {
  background: var(--text-secondary, rgb(88, 86, 80));
  transform: translateY(-1px);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.matrix-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);
  gap: 24px;
}

.detail-card {
  padding: 24px 26px;
}

.detail-card h2 {
  margin: 0 0 18px;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 20px;
  font-weight: 700;
}

.detail-list {
  display: grid;
  gap: 18px;
  margin: 0;
}

.detail-list div {
  display: grid;
  gap: 6px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-light, rgb(220, 217, 207));
}

.detail-list div:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.detail-list dt {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-list dd {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 18px;
  font-weight: 600;
}

.guidance-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.6;
}

.permission-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.permission-chip,
.role-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-weight: 600;
}

.permission-chip {
  padding: 8px 12px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 13px;
}

.matrix-stack {
  display: grid;
  gap: 16px;
}

.matrix-role {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-primary, rgb(250, 249, 245));
}

.matrix-role--active {
  border-color: var(--text-primary, rgb(26, 25, 23));
  box-shadow: inset 3px 0 0 var(--text-primary, rgb(26, 25, 23));
}

.matrix-role__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.matrix-role__head strong {
  display: block;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 17px;
}

.matrix-role__head p,
.empty-copy {
  margin: 6px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
}

.loading-copy {
  margin: 18px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.6;
}

.role-pill {
  padding: 8px 12px;
  background: var(--text-primary, rgb(26, 25, 23));
  color: var(--surface-white, rgb(255, 255, 255));
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .hero-card {
    flex-direction: column;
  }

  .details-grid,
  .matrix-grid {
    grid-template-columns: 1fr;
  }
}
</style>
