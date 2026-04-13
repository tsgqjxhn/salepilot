<template>
  <el-aside
    class="sidebar"
    :class="{ 'sidebar--collapsed': isCollapse }"
    :width="isCollapse ? '84px' : '248px'"
  >
    <div class="sidebar__top">
      <router-link
        :to="homeTarget"
        class="home-launch"
        :class="{ 'home-launch--active': homeActive }"
        :title="homeLaunchTitle"
      >
        <span class="home-launch__icon">
          <el-icon><HomeFilled /></el-icon>
        </span>
        <transition name="fade">
          <div v-if="!isCollapse" class="home-launch__copy">
            <strong>{{ homeLaunchTitle }}</strong>
            <span>{{ homeLaunchSubtitle }}</span>
          </div>
        </transition>
      </router-link>
    </div>

    <div class="sidebar__body">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item
          v-for="item in visibleMenuItems"
          :key="item.index"
          :index="item.index"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="sidebar__footer">
      <el-dropdown
        trigger="click"
        placement="top-start"
        :teleported="false"
        @command="handleAccountCommand"
      >
        <button
          type="button"
          class="account-dock"
          :class="{ 'account-dock--collapsed': isCollapse }"
          :title="text('', 'Open account menu')"
        >
          <span class="account-dock__avatar">{{ avatarInitial }}</span>
          <transition name="fade">
            <span v-if="!isCollapse" class="account-dock__meta">
              <strong>{{ authStore.username || text("", "Account") }}</strong>
              <small>{{ roleLabel(authStore.userrole) }}</small>
            </span>
          </transition>
        </button>

        <template #dropdown>
          <el-dropdown-menu class="sidebar-dropdown">
            <el-dropdown-item command="settings">
              {{ text("", "Account settings") }}
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

      <button
        v-if="canViewNotifications"
        type="button"
        class="notification-dock"
        :class="{
          'notification-dock--active': route.path.startsWith('/notifications'),
        }"
        :title="
          unreadCount > 0
            ? text('', 'Unread notifications')
            : text('', 'View notifications')
        "
        @click="router.push('/notifications')"
      >
        <span class="notification-dock__icon">
          <el-icon><Bell /></el-icon>
          <span v-if="unreadCount > 0" class="notification-dock__dot" />
        </span>
      </button>
    </div>

    <button
      type="button"
      class="sidebar-handle"
      :class="{ 'sidebar-handle--collapsed': isCollapse }"
      :title="
        isCollapse ? text('', 'Expand sidebar') : text('', 'Collapse sidebar')
      "
      @click="toggleCollapse"
    >
      <span aria-hidden="true" class="sidebar-handle__chevron">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline v-if="isCollapse" points="1,1 7,7 1,13" />
          <polyline v-else points="7,1 1,7 7,13" />
        </svg>
      </span>
    </button>
  </el-aside>
</template>

<script setup lang="ts">
import {
  computed,
  markRaw,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
} from "vue";
import { ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import {
  Bell,
  ChatLineRound,
  CollectionTag,
  DataBoard,
  Delete,
  Document,
  FolderOpened,
  HomeFilled,
  Setting,
  TrendCharts,
} from "@element-plus/icons-vue";
import { getNotificationList } from "@/api/notification";
import { usePermissions } from "@/composables/usePermissions";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import {
  FRONTEND_ONLY_MODE,
  FRONTEND_ONLY_WORKSPACE_ROUTE,
} from "@/utils/frontendOnly";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "AppSidebar",
});

interface SidebarMenuItem {
  index: string;
  label: string;
  icon: Component;
  permission?: string | string[];
  fallbackRoles?: string[];
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const permissions = usePermissions();
const { text, roleLabel } = useLocalizedText();
const isCollapse = ref(false);
const unreadCount = ref(0);
let unreadTimer: number | null = null;

const avatarInitial = computed(() =>
  String(authStore.username || "A")
    .trim()
    .charAt(0)
    .toUpperCase(),
);
const canViewNotifications = computed(
  () =>
    !FRONTEND_ONLY_MODE &&
    authStore.isLogedIn() &&
    permissions.can("notifications.view", {
      fallbackRoles: ["user", "manager", "admin"],
    }),
);
const homeLaunchTitle = computed(() =>
  FRONTEND_ONLY_MODE ? text("工作台", "Workspace") : text("", "Home"),
);
const homeLaunchSubtitle = computed(() => {
  if (FRONTEND_ONLY_MODE) {
    return text("前端静态演示模式", "Frontend-only static demo");
  }

  return authStore.needsCompanyVerification
    ? text("完成引导", "Finish onboarding")
    : text("", "Customer Workspace");
});
const canUseStaticWorkspace = computed(
  () => FRONTEND_ONLY_MODE && authStore.isLogedIn(),
);
const homeTarget = computed(() =>
  canUseStaticWorkspace.value
    ? FRONTEND_ONLY_WORKSPACE_ROUTE
    : authStore.needsCompanyVerification
      ? "/company/verify"
      : "/customer",
);
const homeActive = computed(() =>
  canUseStaticWorkspace.value
    ? route.path.startsWith(FRONTEND_ONLY_WORKSPACE_ROUTE)
    : route.path === "/company/verify" ||
      route.path === "/customer" ||
      (route.path.startsWith("/customer/") &&
        !route.path.startsWith("/customer/board") &&
        !route.path.startsWith("/customer/deleted") &&
        !route.path.startsWith("/customer/tags")),
);

const staticMenuItems = computed<SidebarMenuItem[]>(() => [
  {
    index: FRONTEND_ONLY_WORKSPACE_ROUTE,
    label: text("工作台", "Workspace"),
    icon: markRaw(DataBoard),
  },
]);

const canViewWorkspaceNotifications = computed(
  () =>
    authStore.isLogedIn() &&
    permissions.can("notifications.view", {
      fallbackRoles: ["user", "manager", "admin"],
    }),
);

const fullMenuItems = computed<SidebarMenuItem[]>(() => [
  {
    index: "/groups",
    label: text("", "Groups"),
    icon: markRaw(ChatLineRound),
    permission: "groups.view",
    fallbackRoles: ["user", "manager", "admin"],
  },
  {
    index: "/customer/board",
    label: text("", "Board"),
    icon: markRaw(DataBoard),
    permission: "customers.view",
    fallbackRoles: ["user", "manager", "admin"],
  },
  {
    index: "/customer/deleted",
    label: text("", "Deleted"),
    icon: markRaw(Delete),
    permission: "customers.restore",
    fallbackRoles: ["manager", "admin"],
  },
  {
    index: "/customer/tags",
    label: text("", "Tags"),
    icon: markRaw(CollectionTag),
    permission: "customers.tags.manage",
    fallbackRoles: ["manager", "admin"],
  },
  {
    index: "/project",
    label: text("", "Projects"),
    icon: markRaw(FolderOpened),
    permission: "customers.view",
    fallbackRoles: ["user", "manager", "admin"],
  },
  {
    index: "/reports/daily",
    label: text("", "Daily report"),
    icon: markRaw(Document),
    permission: "reports.view",
    fallbackRoles: ["user", "manager", "admin"],
  },
  {
    index: "/reports/sales",
    label: text("", "Dashboard"),
    icon: markRaw(TrendCharts),
    permission: "reports.view",
    fallbackRoles: ["user", "manager", "admin"],
  },
  {
    index: "/admin",
    label: text("", "Admin"),
    icon: markRaw(Setting),
    permission: "admin.access",
    fallbackRoles: ["manager", "admin"],
  },
]);

const sidebarMenuItems = computed<SidebarMenuItem[]>(() => {
  if (FRONTEND_ONLY_MODE) {
    return fullMenuItems.value;
  }

  if (authStore.needsCompanyVerification) {
    return [];
  }

  return fullMenuItems.value;
});

const activeMenu = computed(() => {
  if (route.path.startsWith("/company/verify")) {
    return "/company/verify";
  }

  if (route.path.startsWith("/groups")) {
    return "/groups";
  }

  if (route.path.startsWith("/customer/board")) {
    return "/customer/board";
  }

  if (route.path.startsWith("/customer/deleted")) {
    return "/customer/deleted";
  }

  if (route.path.startsWith("/customer/tags")) {
    return "/customer/tags";
  }

  if (route.path.startsWith("/project")) {
    return "/project";
  }

  if (route.path.startsWith("/reports/sales")) {
    return "/reports/sales";
  }

  if (route.path.startsWith("/reports")) {
    return "/reports/daily";
  }

  if (route.path.startsWith("/admin")) {
    return "/admin";
  }

  return route.path;
});

const visibleMenuItems = computed(() =>
  sidebarMenuItems.value.filter(
    (item) =>
      !item.permission ||
      permissions.can(item.permission, { fallbackRoles: item.fallbackRoles }),
  ),
);

const loadUnreadCount = async () => {
  if (FRONTEND_ONLY_MODE) {
    unreadCount.value = 0;
    return;
  }

  if (!authStore.isLogedIn() || !canViewWorkspaceNotifications.value) {
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

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const handleAccountCommand = async (command: string | number | object) => {
  switch (command) {
    case "settings":
      uiStore.openSettingsDialog();
      return;
    case "admin":
      await router.push("/admin");
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
        await router.push("/auth/login");
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
/* ── Sidebar Shell ─────────────────────────────────────────────────────── */
.sidebar {
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 12px;
  background: var(--gradient-mesh), var(--gradient-warm);
  border-right: 1px solid var(--border-light);
  box-shadow:
    18px 0 40px rgba(24, 20, 16, 0.04),
    6px 0 16px rgba(24, 20, 16, 0.02);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  overflow: visible;
  z-index: 5;
  transition:
    background var(--transition-smooth),
    box-shadow var(--transition-smooth);
}

.sidebar__top {
  display: grid;
  gap: 10px;
  position: relative;
}

/* ── Home Launch Card ──────────────────────────────────────────────────── */
.home-launch {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  background: var(--gradient-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.home-launch::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-shine);
  transform: translateX(-120%);
  transition: transform 600ms ease;
  pointer-events: none;
  z-index: 1;
}

.home-launch:hover::after {
  transform: translateX(120%);
}

.home-launch:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.home-launch--active {
  border-color: var(--accent-primary);
  box-shadow:
    inset 3px 0 0 var(--accent-primary),
    var(--shadow-card);
}

.home-launch--active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  background: var(--accent-gradient);
  box-shadow: 0 0 12px var(--accent-glow);
}

.sidebar--collapsed .home-launch {
  justify-content: center;
  padding: 12px;
}

/* ── Shared Circular Elements ──────────────────────────────────────────── */
.home-launch__icon,
.notification-dock__icon,
.account-dock__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.home-launch__icon {
  background: var(--surface-glass-strong);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  font-size: 18px;
  box-shadow: var(--shadow-xs);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.home-launch:hover .home-launch__icon {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.home-launch__copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.home-launch__copy strong,
.account-dock__meta strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}

.home-launch__copy span,
.account-dock__meta small {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

/* ── Interactive Shared Base ───────────────────────────────────────────── */
.sidebar-handle,
.notification-dock,
.account-dock {
  border: 1px solid var(--border-light);
  background: var(--surface-glass-strong);
  color: var(--text-primary);
  cursor: pointer;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    background var(--transition-base),
    border-color var(--transition-base);
}

/* ── Sidebar Handle ────────────────────────────────────────────────────── */
.sidebar-handle {
  position: absolute;
  top: 50%;
  right: -19px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 84px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  border: 1px solid var(--border-light);
  border-left: none;
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow:
    3px 0 10px rgba(24, 20, 16, 0.04),
    1px 0 3px rgba(24, 20, 16, 0.02);
  transform: translateY(-50%);
  z-index: 6;
  cursor: pointer;
  color: var(--text-tertiary);
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    color var(--transition-base);
}

.sidebar-handle__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transition: opacity var(--transition-base);
}

.sidebar-handle:hover .sidebar-handle__chevron {
  opacity: 1;
}

.sidebar-handle--collapsed {
  right: -19px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.sidebar-handle:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: var(--border-default);
  box-shadow:
    4px 0 14px rgba(24, 20, 16, 0.07),
    2px 0 6px rgba(24, 20, 16, 0.03);
  color: var(--accent-primary);
}

.notification-dock:hover,
.account-dock:hover {
  background: var(--surface-white);
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ── Sidebar Body / Menu ───────────────────────────────────────────────── */
.sidebar__body {
  min-height: 0;
  flex: 1;
}

:deep(.sidebar-menu) {
  background: transparent;
  border-right: none;
  padding: 4px 0;
}

:deep(.sidebar-menu .el-menu-item) {
  height: 48px;
  margin-bottom: 6px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 600;
  transition:
    background var(--transition-base),
    color var(--transition-base),
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

:deep(.sidebar-menu .el-menu-item:hover) {
  background-color: var(--surface-glass) !important;
  color: var(--text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

:deep(.sidebar-menu .el-menu-item.is-active) {
  background: var(--accent-soft);
  color: var(--accent-primary);
  font-weight: 700;
  border-radius: var(--radius-md);
  box-shadow:
    inset 3px 0 0 var(--accent-primary),
    var(--shadow-xs);
  position: relative;
}

:deep(.sidebar-menu .el-menu-item.is-active::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 55%;
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
  background: var(--accent-gradient);
  box-shadow: 0 0 8px var(--accent-glow);
}

:deep(.sidebar-menu .el-menu-item .el-icon) {
  color: inherit;
  font-size: 18px;
  transition: transform var(--transition-base);
}

:deep(.sidebar-menu .el-menu-item:hover .el-icon) {
  transform: scale(1.08);
}

:deep(.sidebar-menu.el-menu--collapse .el-menu-item) {
  justify-content: center;
  padding: 0 !important;
}

/* ── Sidebar Footer ────────────────────────────────────────────────────── */
.sidebar__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 10px;
  align-items: center;
}

/* ── Account Dock ──────────────────────────────────────────────────────── */
.account-dock {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: var(--radius-lg);
  text-align: left;
}

.account-dock__avatar {
  background: var(--accent-gradient);
  color: var(--text-inverse);
  font-size: 16px;
  font-weight: 700;
  box-shadow:
    0 2px 8px rgba(35, 113, 196, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.account-dock:hover .account-dock__avatar {
  transform: scale(1.06);
  box-shadow:
    0 4px 14px rgba(35, 113, 196, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.account-dock__meta {
  min-width: 0;
  display: grid;
}

.account-dock__meta strong,
.account-dock__meta small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Notification Dock ─────────────────────────────────────────────────── */
.notification-dock {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
}

.notification-dock--active {
  background: var(--accent-soft);
  border-color: var(--border-accent);
}

.notification-dock__icon {
  width: 100%;
  height: 100%;
  background: transparent;
  color: var(--text-primary);
  font-size: 18px;
  position: relative;
}

.notification-dock__dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--danger-solid);
  border: 2px solid var(--surface-white);
  box-shadow: 0 0 6px rgba(220, 60, 60, 0.4);
  animation: sp-pulse-soft 2s ease infinite;
}

/* ── Collapsed State ───────────────────────────────────────────────────── */
.sidebar--collapsed .sidebar__footer {
  grid-template-columns: 1fr;
}

.sidebar--collapsed .account-dock,
.sidebar--collapsed .notification-dock {
  width: 100%;
  justify-content: center;
}

.sidebar--collapsed .account-dock {
  padding: 8px 0;
}

/* ── Fade Transition ───────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sidebar {
    padding: 12px 10px;
  }
}
</style>
