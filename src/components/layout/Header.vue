<template>
  <el-header class="header">
    <div class="header-left">
      <router-link to="/customer" class="header-home">
        {{ text("", "Home") }}
      </router-link>

      <div class="header-copy">
        <p>{{ text("", "Workspace") }}</p>
        <strong>{{ pageTitle }}</strong>
      </div>
    </div>

    <div class="header-right">
      <button
        v-if="canViewNotifications"
        type="button"
        class="notification-btn"
        :class="{
          'notification-btn--active': route.path.startsWith('/notifications'),
        }"
        :title="
          unreadCount > 0
            ? text('', 'Unread notifications')
            : text('', 'View notifications')
        "
        @click="router.push('/notifications')"
      >
        <el-icon><Bell /></el-icon>
        <span v-if="unreadCount > 0" class="notification-badge">{{
          unreadCount > 9 ? "9+" : unreadCount
        }}</span>
      </button>

      <el-dropdown trigger="hover" @command="handleCommand">
        <button type="button" class="avatar-button">
          <span>{{ avatarInitial }}</span>
        </button>

        <template #dropdown>
          <el-dropdown-menu class="account-dropdown">
            <el-dropdown-item command="noop" disabled>
              <div class="dropdown-head">
                <strong>{{ authStore.username || text("", "Account") }}</strong>
                <span>{{ roleLabel(authStore.userrole) }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              {{ text("", "Account settings") }}
            </el-dropdown-item>
            <el-dropdown-item v-if="canOpenAdminConsole" command="admin">
              {{ text("", "Admin console") }}
            </el-dropdown-item>
            <el-dropdown-item command="command">
              {{ text("", "Open command menu") }}
            </el-dropdown-item>
            <el-dropdown-item command="onboarding">
              {{ text("", "Welcome tour") }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              {{ text("", "Log out") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { Bell } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { getNotificationList } from "@/api/notification";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "AppHeader",
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUiStore();
const permissions = usePermissions();
const { text, roleLabel } = useLocalizedText();
const unreadCount = ref(0);
let unreadTimer: number | null = null;

const avatarInitial = computed(() =>
  String(authStore.username || "A")
    .trim()
    .charAt(0)
    .toUpperCase(),
);
const canOpenAdminConsole = computed(() =>
  authStore.permissions.includes("admin.access"),
);
const canViewNotifications = computed(
  () =>
    authStore.companyIdentityVerified &&
    permissions.can("notifications.view", {
      fallbackRoles: ["user", "manager", "admin"],
    }),
);

const pageTitle = computed(() => {
  const seoTitle =
    typeof route.meta?.seo === "object" &&
    route.meta.seo &&
    "title" in route.meta.seo
      ? String(route.meta.seo.title || "").trim()
      : "";

  if (seoTitle) {
    return text("", seoTitle);
  }

  return text("", "Sales workspace");
});

const loadUnreadCount = async () => {
  if (!authStore.isLogedIn()) {
    unreadCount.value = 0;
    return;
  }

  if (!canViewNotifications.value) {
    unreadCount.value = 0;
    return;
  }

  try {
    const response = await getNotificationList({
      page: 1,
      limit: 1,
      scope: "active",
    });
    const payload = unwrapApiResponseData(
      response,
      "Failed to load notifications.",
    );
    unreadCount.value = payload.unreadCount ?? 0;
  } catch {
    unreadCount.value = 0;
  }
};

const startUnreadPolling = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (unreadTimer !== null) {
    window.clearInterval(unreadTimer);
  }

  unreadTimer = window.setInterval(() => {
    void loadUnreadCount();
  }, 60_000);
};

const stopUnreadPolling = () => {
  if (typeof window === "undefined" || unreadTimer === null) {
    return;
  }

  window.clearInterval(unreadTimer);
  unreadTimer = null;
};

const handleCommand = async (command: string | number | object) => {
  switch (command) {
    case "settings":
      uiStore.openSettingsDialog();
      return;
    case "admin":
      router.push("/admin");
      return;
    case "command":
      uiStore.openCommandPalette();
      return;
    case "onboarding":
      uiStore.openOnboarding();
      return;
    case "logout":
      try {
        await ElMessageBox.confirm(
          text("", "Do you want to log out of this account?"),
          text("", "Log out"),
          {
            confirmButtonText: text("", "Log out"),
            cancelButtonText: text("", "Cancel"),
            type: "warning",
          },
        );
        authStore.clearTokens({ clearBoundStorage: true });
        unreadCount.value = 0;
        router.push("/auth/login");
      } catch {
        return;
      }
      return;
    default:
      return;
  }
};

watch(
  () => route.path,
  () => {
    void loadUnreadCount();
  },
);

watch(
  () => authStore.accessToken,
  () => {
    void loadUnreadCount();
  },
);

onMounted(() => {
  void loadUnreadCount();
  startUnreadPolling();
});

onBeforeUnmount(() => {
  stopUnreadPolling();
});
</script>

<style scoped>
/* ── Header — Premium Glassmorphism Bar ─────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 28px;
  background: var(--surface-glass-strong);
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  box-shadow:
    0 1px 3px rgba(24, 20, 16, 0.03),
    0 4px 16px rgba(24, 20, 16, 0.04);
  z-index: 10;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* ── Copy / Title Block ──────────────────────────────────────────────── */
.header-copy p {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.header-copy strong {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* ── Home Link Pill ──────────────────────────────────────────────────── */
.header-home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  padding: 10px 18px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.header-home:hover {
  background: var(--surface-secondary);
  border-color: var(--border-default);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.header-home.router-link-active {
  background: var(--surface-secondary);
  border-color: var(--border-default);
}

/* ── Avatar Button ───────────────────────────────────────────────────── */
.avatar-button {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-light);
  background: var(--surface-white);
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition-smooth),
    box-shadow var(--transition-smooth),
    transform var(--transition-base);
  position: relative;
}

.avatar-button:hover {
  border-color: var(--accent-primary);
  box-shadow:
    var(--shadow-soft),
    0 0 0 3px var(--accent-glow);
  transform: translateY(-1px);
}

/* ── Dropdown Header ─────────────────────────────────────────────────── */
.dropdown-head {
  display: grid;
  gap: 4px;
}

.dropdown-head strong {
  color: var(--text-primary);
}

.dropdown-head span {
  color: var(--text-secondary);
  font-size: 12px;
}

/* ── Notification Button ─────────────────────────────────────────────── */
.notification-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}

.notification-btn:hover {
  background: var(--surface-secondary);
  border-color: var(--border-default);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.notification-btn--active {
  background: var(--accent-soft);
  border-color: var(--accent-primary);
  box-shadow:
    inset 0 0 0 1px var(--accent-primary),
    0 0 0 3px var(--accent-glow);
}

/* ── Notification Badge ──────────────────────────────────────────────── */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  color: var(--text-inverse);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: var(--shadow-accent);
  animation: sp-pulse-soft 2s ease-in-out infinite;
  border: 2px solid var(--surface-white);
}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 720px) {
  .header {
    padding: 0 16px;
  }
}
</style>
