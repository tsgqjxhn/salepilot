<template>
  <section class="notice-center">
    <header class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Workspace Inbox</p>
        <div class="hero-headline">
          <h1>Notification center</h1>
          <span class="hero-pill">{{ heroStatus }}</span>
        </div>
        <p class="hero-description">
          Review churn alerts, follow-up reminders, and system updates inside the same warm-neutral visual system used
          by the frontend API document.
        </p>
      </div>

      <div class="hero-actions">
        <el-button @click="resetFilters">Reset filters</el-button>
        <el-button
          v-permission="'notifications.manage'"
          :loading="markAllLoading"
          :disabled="unreadCount === 0"
          @click="handleMarkAllAsRead"
        >
          <el-icon><CircleCheckFilled /></el-icon>
          Mark all as read
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleRefresh">
          <el-icon><RefreshRight /></el-icon>
          Refresh inbox
        </el-button>
      </div>
    </header>

    <PageLoadingSkeleton v-if="showInitialSkeleton" variant="notifications" />

    <template v-else>
      <section class="summary-grid">
        <article v-for="card in summaryCards" :key="card.label" class="summary-card" :class="`summary-card--${card.tone}`">
          <div class="summary-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div>
            <span class="summary-label">{{ card.label }}</span>
            <strong class="summary-value">{{ card.value }}</strong>
            <p class="summary-description">{{ card.description }}</p>
          </div>
        </article>
      </section>

      <section class="toolbar-card">
        <div class="toolbar-block">
          <span class="toolbar-label">Scope</span>
          <div class="pill-row">
            <button
              v-for="option in scopeOptions"
              :key="option.value"
              type="button"
              class="pill-button"
              :class="{ 'pill-button--active': filterState.scope === option.value }"
              @click="setScope(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="toolbar-block">
          <span class="toolbar-label">Read state</span>
          <div class="pill-row">
            <button
              v-for="option in readOptions"
              :key="option.value"
              type="button"
              class="pill-button"
              :class="{ 'pill-button--active': filterState.read === option.value }"
              @click="setReadFilter(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="toolbar-selects">
          <el-select v-model="filterState.category" clearable placeholder="All categories" @change="applyFilters">
            <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-select v-model="filterState.level" clearable placeholder="All levels" @change="applyFilters">
            <el-option v-for="option in levelOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <label class="switch-wrap">
            <span>Include expired</span>
            <el-switch v-model="filterState.includeExpired" @change="applyFilters" />
          </label>
        </div>
      </section>

      <div class="strip-row">
        <span class="strip-pill">{{ visibleCountLabel }}</span>
        <span class="strip-pill">{{ unreadSummaryLabel }}</span>
        <span v-if="activeFilterCount > 0" class="strip-pill">{{ activeFilterCount }} active filters</span>
      </div>

      <section class="toolbar-card">
        <div class="toolbar-block">
          <span class="toolbar-label">Alert levels</span>
          <p class="summary-description">
            Color tags stay consistent across the legend, title badges, and card accents.
          </p>
        </div>
        <div class="pill-row">
          <span v-for="item in levelLegendItems" :key="item.level" class="strip-pill chip-row">
            <span class="meta-chip" :class="`meta-chip--${item.level}`">{{ item.label }}</span>
            <strong style="color: var(--text-primary)">{{ item.count }}</strong>
            <span style="font-weight: 600; color: var(--text-tertiary)">{{ item.description }}</span>
          </span>
        </div>
      </section>

      <div v-if="inlineWarning" class="warning-banner">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ inlineWarning }}</span>
      </div>

      <section v-if="error && notifications.length === 0" class="state-card">
        <div class="state-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <h2>Notification center is unavailable</h2>
        <p>{{ error }}</p>
        <el-button type="primary" @click="handleRefresh">Try again</el-button>
      </section>

      <section v-else-if="notifications.length > 0" class="list-stack">
        <article
          v-for="notification in notifications"
          :key="notification.id"
          class="notice-card"
          :class="[
            `notice-card--${notification.level}`,
            { 'notice-card--unread': !notification.read, 'notice-card--archived': notification.archived },
          ]"
        >
          <div
            class="notice-main"
            :style="hasNotificationDestination(notification) ? { cursor: 'pointer' } : undefined"
            :role="hasNotificationDestination(notification) ? 'button' : undefined"
            :tabindex="hasNotificationDestination(notification) ? 0 : -1"
            :aria-label="hasNotificationDestination(notification) ? resolveNotificationActionLabel(notification) : undefined"
            @click="handleOpenNotification(notification)"
            @keydown.enter.prevent="handleOpenNotification(notification)"
            @keydown.space.prevent="handleOpenNotification(notification)"
          >
            <div class="notice-icon">
              <el-icon><component :is="resolveNotificationIcon(notification)" /></el-icon>
            </div>

            <div class="notice-copy">
              <div class="notice-headline">
                <div class="chip-row">
                  <span class="meta-chip" :class="`meta-chip--${notification.level}`">
                    {{ formatLevelLabel(notification.level) }}
                  </span>
                  <h2>{{ notification.title }}</h2>
                </div>
                <span v-if="!notification.read" class="unread-badge">Unread</span>
              </div>
              <p class="notice-message">{{ notification.message }}</p>

              <div class="chip-row">
                <span class="meta-chip meta-chip--soft">{{ formatCategoryLabel(notification.category) }}</span>
                <span
                  v-if="resolveNotificationDestinationType(notification) === 'customer'"
                  class="meta-chip meta-chip--outline"
                >
                  Customer detail
                </span>
                <span v-if="resolveScoreLabel(notification)" class="meta-chip meta-chip--outline">{{ resolveScoreLabel(notification) }}</span>
                <span v-if="notification.archived" class="meta-chip meta-chip--muted">Archived</span>
                <span v-if="notification.isExpired" class="meta-chip meta-chip--muted">Expired</span>
              </div>

              <div class="meta-row">
                <span>{{ formatRelativeTime(notification.createdAt) }}</span>
                <span>{{ formatDateTime(notification.createdAt) }}</span>
                <span v-if="notification.actor?.username">By {{ notification.actor.username }}</span>
                <span v-if="notification.eventKey">{{ shrinkEventKey(notification.eventKey) }}</span>
              </div>
            </div>
          </div>

          <div class="notice-side">
            <div class="chip-row chip-row--channels">
              <span v-for="channel in notification.channels" :key="`${notification.id}-${channel}`" class="channel-chip">
                {{ formatToken(channel) }}
              </span>
            </div>

            <el-button
              v-if="!notification.read"
              v-permission="'notifications.manage'"
              :loading="readActionId === notification.id"
              @click="handleMarkAsRead(notification)"
            >
              Mark as read
            </el-button>

            <el-button v-if="hasNotificationDestination(notification)" type="primary" plain @click="handleOpenNotification(notification)">
              <el-icon><ArrowRight /></el-icon>
              {{ resolveNotificationActionLabel(notification) }}
            </el-button>
          </div>
        </article>
      </section>

      <section v-else class="state-card">
        <div class="state-icon">
          <el-icon><Bell /></el-icon>
        </div>
        <h2>{{ emptyStateTitle }}</h2>
        <p>{{ emptyStateDescription }}</p>
        <el-button type="primary" @click="resetFilters">Clear filters</el-button>
      </section>

      <footer v-if="pagination.totalPages > 1" class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { Component } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowRight,
  Bell,
  ChatDotRound,
  CircleCheckFilled,
  Clock,
  DataAnalysis,
  Document,
  InfoFilled,
  RefreshRight,
  Setting,
  User,
  WarningFilled,
} from "@element-plus/icons-vue";
import PageLoadingSkeleton from "@/components/layout/PageLoadingSkeleton.vue";
import { getNotificationList, markAllNotificationsAsRead, markNotificationAsRead } from "@/api/notification";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type { NotificationCategory, NotificationLevel, NotificationListParams, NotificationRecord, NotificationScope } from "@/types/notification";

defineOptions({ name: "NotificationCenterPanel" });

type NotificationReadFilter = "all" | "unread" | "read";

const router = useRouter();
const loading = ref(false);
const markAllLoading = ref(false);
const readActionId = ref("");
const error = ref("");
const unreadCount = ref(0);
const notifications = ref<NotificationRecord[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
const filterState = reactive<{ scope: NotificationScope; read: NotificationReadFilter; category: NotificationCategory | ""; level: NotificationLevel | ""; includeExpired: boolean; }>({
  scope: "active",
  read: "all",
  category: "",
  level: "",
  includeExpired: false,
});

const scopeOptions: Array<{ value: NotificationScope; label: string }> = [{ value: "active", label: "Active" }, { value: "archived", label: "Archived" }, { value: "all", label: "All" }];
const readOptions: Array<{ value: NotificationReadFilter; label: string }> = [{ value: "all", label: "Any" }, { value: "unread", label: "Unread" }, { value: "read", label: "Read" }];
const categoryOptions: Array<{ value: NotificationCategory; label: string }> = [{ value: "customer", label: "Customer" }, { value: "followup", label: "Follow-up" }, { value: "activity", label: "Activity" }, { value: "ai_analysis", label: "AI analysis" }, { value: "system", label: "System" }, { value: "opportunity", label: "Opportunity" }, { value: "order", label: "Order" }, { value: "security", label: "Security" }, { value: "custom", label: "Custom" }];
const levelOptions: Array<{ value: NotificationLevel; label: string }> = [{ value: "warning", label: "Warning" }, { value: "error", label: "Error" }, { value: "info", label: "Info" }, { value: "success", label: "Success" }];

const heroStatus = computed(() => (loading.value ? "Refreshing" : unreadCount.value > 0 ? `${unreadCount.value} unread` : "Inbox clear"));
const attentionCount = computed(() => notifications.value.filter((item) => item.level === "warning" || item.level === "error").length);
const actionableCount = computed(() => notifications.value.filter((item) => hasNotificationDestination(item) && !item.archived).length);
const activeFilterCount = computed(() => Number(filterState.scope !== "active") + Number(filterState.read !== "all") + Number(Boolean(filterState.category)) + Number(Boolean(filterState.level)) + Number(filterState.includeExpired));
const hasActiveFilters = computed(() => activeFilterCount.value > 0);
const showInitialSkeleton = computed(() => loading.value && notifications.value.length === 0 && !error.value);
const visibleCountLabel = computed(() => (pagination.total === 0 ? "No notifications in view" : `Showing ${notifications.value.length} of ${pagination.total}`));
const unreadSummaryLabel = computed(() => (unreadCount.value > 0 ? `${unreadCount.value} notifications still unread` : "Everything in the active inbox is read"));
const inlineWarning = computed(() => (error.value && notifications.value.length > 0 ? error.value : ""));
const emptyStateTitle = computed(() => (hasActiveFilters.value ? "No notifications match the current filters" : "Your notification center is quiet"));
const emptyStateDescription = computed(() => (hasActiveFilters.value ? "Try widening the scope or clearing one of the active filters to bring more items back into view." : "New churn alerts, follow-up reminders, and system updates will appear here as soon as the backend generates them."));
const summaryCards = computed(() => [{ label: "Unread inbox", value: String(unreadCount.value), description: "Live unread count across the active inbox.", icon: Bell, tone: "dark" }, { label: "Needs attention", value: String(attentionCount.value), description: "Visible warning and error items on this page.", icon: WarningFilled, tone: "warning" }, { label: "Actionable now", value: String(actionableCount.value), description: "Visible notifications that can open a detail view.", icon: CircleCheckFilled, tone: "light" }]);
const LEVEL_LABEL_MAP: Record<NotificationLevel, string> = { info: "Info", success: "Success", warning: "Warning", error: "Critical" };
const LEVEL_DESCRIPTION_MAP: Record<NotificationLevel, string> = { error: "Immediate action required", warning: "Needs attention soon", success: "Positive or resolved signal", info: "General update" };
const levelLegendItems = computed(() =>
  (["error", "warning", "success", "info"] as NotificationLevel[]).map((level) => ({
    level,
    label: LEVEL_LABEL_MAP[level],
    description: LEVEL_DESCRIPTION_MAP[level],
    count: notifications.value.filter((item) => item.level === level).length,
  })),
);

const CATEGORY_ICON_MAP: Record<NotificationCategory, Component> = { system: Bell, customer: User, followup: Clock, activity: ChatDotRound, opportunity: DataAnalysis, order: Document, ai_analysis: DataAnalysis, security: Setting, custom: InfoFilled };
type NotificationDestination = { url: string; label: string; isExternal: boolean; type: "customer" | "link" };

const resolveCustomerIdFromActionUrl = (actionUrl?: string | null) => {
  if (!actionUrl) {
    return "";
  }

  const match = actionUrl.match(/^\/customer\/([^/]+)/);
  return match?.[1] || "";
};

const resolveNotificationDestination = (notification: NotificationRecord): NotificationDestination | null => {
  const relatedCustomerId = notification.relatedModel === "Customer" && notification.relatedId ? notification.relatedId : "";
  const metadataCustomerId = typeof notification.metadata?.customerId === "string" ? notification.metadata.customerId : "";
  const actionCustomerId = resolveCustomerIdFromActionUrl(notification.actionUrl);
  const customerId = relatedCustomerId || metadataCustomerId || actionCustomerId;

  if (customerId) {
    return {
      url: `/customer/${customerId}`,
      label: "View customer",
      isExternal: false,
      type: "customer",
    };
  }

  if (!notification.actionUrl) {
    return null;
  }

  return {
    url: notification.actionUrl,
    label: notification.actionLabel || "Open",
    isExternal: !notification.actionUrl.startsWith("/"),
    type: "link",
  };
};

const hasNotificationDestination = (notification: NotificationRecord) => Boolean(resolveNotificationDestination(notification));
const resolveNotificationActionLabel = (notification: NotificationRecord) => resolveNotificationDestination(notification)?.label || "Open";
const resolveNotificationDestinationType = (notification: NotificationRecord) => resolveNotificationDestination(notification)?.type || "";

const buildRequestParams = (): NotificationListParams => {
  const params: NotificationListParams = { page: pagination.page, limit: pagination.limit, scope: filterState.scope };
  if (filterState.read === "read") params.read = true;
  if (filterState.read === "unread") params.read = false;
  if (filterState.category) params.category = filterState.category;
  if (filterState.level) params.level = filterState.level;
  if (filterState.includeExpired) params.includeExpired = true;
  return params;
};

const loadNotifications = async ({ showErrorToast = false } = {}) => {
  loading.value = true;
  try {
    const data = unwrapApiResponseData(
      await getNotificationList(buildRequestParams()),
      "Failed to load notifications.",
    );
    notifications.value = data.list;
    unreadCount.value = data.unreadCount;
    pagination.page = data.page;
    pagination.limit = data.limit;
    pagination.total = data.total;
    pagination.totalPages = data.totalPages;
    pagination.hasMore = data.hasMore;
    error.value = "";
  } catch (err) {
    error.value = getRequestErrorMessage(err, "Notification center could not be loaded right now.");
    if (showErrorToast) ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const replaceNotification = (updatedNotification: NotificationRecord) => {
  notifications.value = notifications.value.map((item) =>
    item.id === updatedNotification.id ? updatedNotification : item,
  );
};

const markNotificationRead = async (
  notification: NotificationRecord,
  { silent = false, reload = true } = {},
) => {
  if (notification.read) {
    return true;
  }

  readActionId.value = notification.id;

  try {
    const data = unwrapApiResponseData(
      await markNotificationAsRead(notification.id),
      "Failed to mark notification as read.",
    );

    unreadCount.value = data.unreadCount;
    replaceNotification(data.notification);

    if (reload) {
      await loadNotifications();
    }

    if (!silent) {
      ElMessage.success("Notification marked as read.");
    }

    return true;
  } catch (err) {
    const message = getRequestErrorMessage(err, "Notification could not be marked as read.");

    if (!silent) {
      ElMessage.error(message);
    }

    return false;
  } finally {
    if (readActionId.value === notification.id) {
      readActionId.value = "";
    }
  }
};

const applyFilters = () => { pagination.page = 1; void loadNotifications(); };
const resetFilters = () => { filterState.scope = "active"; filterState.read = "all"; filterState.category = ""; filterState.level = ""; filterState.includeExpired = false; pagination.page = 1; pagination.limit = 20; void loadNotifications(); };
const setScope = (scope: NotificationScope) => { if (filterState.scope !== scope) { filterState.scope = scope; applyFilters(); } };
const setReadFilter = (read: NotificationReadFilter) => { if (filterState.read !== read) { filterState.read = read; applyFilters(); } };
const handlePageChange = (page: number) => { pagination.page = page; void loadNotifications(); };
const handleSizeChange = (size: number) => { pagination.limit = size; pagination.page = 1; void loadNotifications(); };
const handleRefresh = () => { void loadNotifications({ showErrorToast: true }); };
const handleMarkAsRead = async (notification: NotificationRecord) => {
  await markNotificationRead(notification, { reload: filterState.read === "unread" });
};
const handleMarkAllAsRead = async () => {
  if (markAllLoading.value || unreadCount.value === 0) {
    return;
  }

  markAllLoading.value = true;

  try {
    const data = unwrapApiResponseData(
      await markAllNotificationsAsRead(),
      "Failed to mark notifications as read.",
    );

    unreadCount.value = data.unreadCount;
    pagination.page = 1;
    await loadNotifications();
    ElMessage.success(
      data.updatedCount > 0
        ? `Marked ${data.updatedCount} notifications as read.`
        : "There were no unread notifications to update.",
    );
  } catch (err) {
    ElMessage.error(getRequestErrorMessage(err, "Notifications could not be marked as read."));
  } finally {
    markAllLoading.value = false;
  }
};
const resolveNotificationIcon = (notification: NotificationRecord) => CATEGORY_ICON_MAP[notification.category] || Bell;
const formatLevelLabel = (level: NotificationLevel) => LEVEL_LABEL_MAP[level];
const formatCategoryLabel = (category: NotificationCategory) => ({ system: "System", customer: "Customer", followup: "Follow-up", activity: "Activity", opportunity: "Opportunity", order: "Order", ai_analysis: "AI analysis", security: "Security", custom: "Custom" })[category];
const formatToken = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDateTime = (value?: string | null) => { if (!value) return "-"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "-"; return date.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); };
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const formatRelativeTime = (value?: string | null) => { if (!value) return "Unknown time"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "Unknown time"; const diffMinutes = Math.round((date.getTime() - Date.now()) / (60 * 1000)); if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, "minute"); const diffHours = Math.round(diffMinutes / 60); if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, "hour"); const diffDays = Math.round(diffHours / 24); if (Math.abs(diffDays) < 30) return relativeTimeFormatter.format(diffDays, "day"); const diffMonths = Math.round(diffDays / 30); if (Math.abs(diffMonths) < 12) return relativeTimeFormatter.format(diffMonths, "month"); return relativeTimeFormatter.format(Math.round(diffMonths / 12), "year"); };
const resolveScoreLabel = (notification: NotificationRecord) => { const value = notification.metadata?.score; const score = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN; return Number.isFinite(score) ? `Score ${Math.round(score)}` : ""; };
const shrinkEventKey = (eventKey: string) => { const parts = eventKey.split("."); return parts.length <= 2 ? eventKey : parts.slice(-2).join(" / "); };
const handleOpenNotification = async (notification: NotificationRecord) => {
  const destination = resolveNotificationDestination(notification);
  if (!destination) return;
  if (!notification.read) await markNotificationRead(notification, { silent: true, reload: false });
  if (!destination.isExternal) { await router.push(destination.url); return; }
  window.open(destination.url, "_blank", "noopener,noreferrer");
};

onMounted(() => { void loadNotifications(); });
</script>

<style scoped>
.notice-center{display:flex;flex-direction:column;gap:22px;color:var(--text-primary)}.hero-card,.toolbar-card,.state-card,.notice-card,.summary-card{border:1px solid var(--border-light);background:rgba(255,255,255,.92);box-shadow:0 14px 32px rgba(26,25,23,.04)}.hero-card{display:flex;justify-content:space-between;gap:24px;padding:30px 32px;border-radius:28px;background:radial-gradient(circle at top right,rgba(195,192,180,.24),transparent 28%),linear-gradient(145deg,rgba(255,255,255,.95),rgba(244,242,236,.96))}.eyebrow,.toolbar-label,.summary-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-tertiary)}.eyebrow{margin:0 0 10px}.hero-headline{display:flex;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:12px}.hero-headline h1{margin:0;font-size:clamp(30px,4vw,44px);line-height:1.02;letter-spacing:-.05em}.hero-pill,.strip-pill,.meta-chip,.channel-chip,.unread-badge{display:inline-flex;align-items:center;border-radius:999px;font-weight:700}.hero-pill{padding:8px 14px;border:1px solid rgba(26,25,23,.08);background:rgba(255,255,255,.76);color:var(--text-secondary);font-size:13px}.hero-description,.summary-description,.notice-message,.state-card p{margin:0;color:var(--text-secondary);line-height:1.7}.hero-actions{display:flex;align-items:center;gap:12px}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.summary-card{display:flex;gap:16px;padding:20px 22px;border-radius:22px}.summary-icon,.notice-icon,.state-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.summary-icon{width:46px;height:46px;border-radius:16px;font-size:20px}.summary-card--dark .summary-icon{background:var(--text-primary);color:var(--surface-white)}.summary-card--warning .summary-icon{background:rgba(168,114,59,.14);color:rgb(124,79,34)}.summary-card--light .summary-icon{background:var(--surface-secondary);color:var(--text-primary)}.summary-value{display:block;margin:8px 0;font-size:28px;line-height:1}.toolbar-card{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;justify-content:space-between;padding:20px 22px;border-radius:22px;background:rgba(244,242,236,.82)}.toolbar-block{display:flex;flex-direction:column;gap:10px}.pill-row,.chip-row,.meta-row,.strip-row{display:flex;flex-wrap:wrap;gap:10px}.pill-button{border:1px solid var(--border-default);border-radius:999px;background:rgba(255,255,255,.86);color:var(--text-secondary);padding:10px 16px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:transform .2s,border-color .2s,background-color .2s,color .2s}.pill-button:hover{transform:translateY(-1px);border-color:var(--text-secondary);color:var(--text-primary)}.pill-button--active{background:var(--text-primary);border-color:var(--text-primary);color:var(--surface-white)}.toolbar-selects{display:grid;grid-template-columns:minmax(160px,1fr) minmax(140px,1fr) auto;gap:12px;align-items:center;min-width:min(100%,420px)}.switch-wrap{display:inline-flex;align-items:center;gap:12px;color:var(--text-secondary);font-weight:600;white-space:nowrap}.strip-pill{padding:9px 14px;background:rgba(255,255,255,.84);border:1px solid var(--border-light);color:var(--text-secondary);font-size:13px}.warning-banner{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:18px;background:rgba(168,114,59,.12);border:1px solid rgba(168,114,59,.18);color:rgb(124,79,34);font-weight:600}.state-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;min-height:260px;padding:40px 24px;border-radius:24px;text-align:center}.state-icon{width:66px;height:66px;border-radius:22px;background:var(--surface-secondary);color:var(--text-primary);font-size:28px}.state-card h2{margin:0;font-size:24px;letter-spacing:-.04em}.skeleton-stack{width:100%;display:grid;gap:16px}.skeleton-row{display:flex;gap:16px;padding:22px;border-radius:22px;border:1px solid var(--border-light);background:rgba(250,249,245,.82)}.skeleton-copy{flex:1}.list-stack{display:grid;gap:16px}.notice-card{display:flex;justify-content:space-between;gap:18px;padding:22px;border-radius:24px;transition:transform .2s,box-shadow .2s}.notice-card:hover{transform:translateY(-2px);box-shadow:0 18px 36px rgba(26,25,23,.06)}.notice-card--unread{border-color:var(--border-default)}.notice-card--warning{box-shadow:inset 4px 0 0 rgba(168,114,59,.7),0 14px 32px rgba(26,25,23,.04)}.notice-card--error{box-shadow:inset 4px 0 0 rgba(145,77,63,.7),0 14px 32px rgba(26,25,23,.04)}.notice-card--success{box-shadow:inset 4px 0 0 rgba(86,120,78,.7),0 14px 32px rgba(26,25,23,.04)}.notice-card--archived{background:rgba(244,242,236,.72)}.notice-main{display:flex;gap:16px;min-width:0;flex:1}.notice-icon{width:48px;height:48px;border-radius:18px;background:var(--surface-secondary);color:var(--text-primary);font-size:22px}.notice-copy{display:flex;flex-direction:column;gap:12px;min-width:0}.notice-headline{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.notice-headline h2{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.03em}.unread-badge{padding:6px 10px;background:var(--text-primary);color:var(--surface-white);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.meta-chip,.channel-chip{padding:7px 11px;font-size:12px;letter-spacing:.04em}.meta-chip--info{background:rgba(235,233,225,.9);color:var(--text-secondary)}.meta-chip--success{background:rgba(222,231,216,.92);color:rgb(71,102,64)}.meta-chip--warning{background:rgba(250,233,206,.92);color:rgb(124,79,34)}.meta-chip--error{background:rgba(239,222,217,.92);color:rgb(121,65,55)}.meta-chip--soft{background:rgba(255,255,255,.84);border:1px solid var(--border-light);color:var(--text-secondary)}.meta-chip--outline{background:transparent;border:1px solid var(--border-default);color:var(--text-primary)}.meta-chip--muted{background:rgba(235,233,225,.84);color:var(--text-tertiary)}.channel-chip{background:rgba(244,242,236,.94);color:var(--text-tertiary)}.meta-row{color:var(--text-tertiary);font-size:13px}.notice-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:16px;min-width:150px}.pagination-wrap{display:flex;justify-content:flex-end;padding-top:4px}@media (max-width:1120px){.summary-grid{grid-template-columns:1fr}.toolbar-card{flex-direction:column;align-items:stretch}.toolbar-selects{grid-template-columns:1fr}}@media (max-width:880px){.hero-card,.notice-card{flex-direction:column}.hero-card{padding:26px 24px}.hero-actions{width:100%;flex-wrap:wrap}.notice-side{align-items:flex-start;min-width:0}}@media (max-width:640px){.notice-center{gap:18px}.hero-headline h1{font-size:30px}.summary-card,.toolbar-card,.notice-card{padding:18px}.notice-headline h2{font-size:18px}.pagination-wrap{justify-content:center}}
</style>
