<template>
  <section class="sales-dashboard">
    <header class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Performance Cockpit</p>
        <div class="hero-headline">
          <h1>Sales dashboard</h1>
          <span class="hero-pill">{{ heroStatus }}</span>
        </div>
        <p class="hero-description">
          Track pipeline health, won revenue, team momentum, and conversion flow in the same warm-neutral visual system
          used by the frontend API document.
        </p>
      </div>

      <div class="hero-actions">
        <el-button @click="handleResetFilters">Reset</el-button>
        <el-button :loading="loading" @click="handleRefreshDashboard">
          <el-icon><RefreshRight /></el-icon>
          Refresh
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleApplyFilters">
          <el-icon><DataAnalysis /></el-icon>
          Apply filters
        </el-button>
      </div>
    </header>

    <section class="toolbar-card">
      <div class="toolbar-block">
        <span class="toolbar-label">Quick windows</span>
        <div class="pill-row">
          <button
            v-for="days in rangePresets"
            :key="days"
            type="button"
            class="pill-button"
            :class="{ 'pill-button--active': selectedDays === days }"
            @click="handleQuickRange(days)"
          >
            {{ days }} days
          </button>
        </div>
      </div>

      <label class="field-block field-block--range">
        <span class="toolbar-label">Date range</span>
        <el-date-picker
          v-model="queryState.range"
          type="daterange"
          value-format="YYYY-MM-DD"
          format="MMM DD, YYYY"
          range-separator="to"
          start-placeholder="Start date"
          end-placeholder="End date"
          :clearable="false"
          unlink-panels
        />
      </label>

      <label class="field-block">
        <span class="toolbar-label">Scope</span>
        <el-select v-model="queryState.scope">
          <el-option v-for="option in scopeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </label>

      <label class="field-block">
        <span class="toolbar-label">Timezone</span>
        <el-select v-model="queryState.timezone" filterable allow-create default-first-option>
          <el-option v-for="item in timeZoneOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </label>

      <label class="field-block">
        <span class="toolbar-label">Leaderboard</span>
        <el-select v-model="queryState.rankLimit">
          <el-option v-for="item in rankLimitOptions" :key="item" :label="`Top ${item}`" :value="item" />
        </el-select>
      </label>
    </section>

    <div class="strip-row">
      <span class="strip-pill">{{ rangeLabel }}</span>
      <span class="strip-pill">{{ scopeLabel }}</span>
      <span class="strip-pill">{{ queryState.timezone }}</span>
      <span class="strip-pill">{{ leaderboardLabel }}</span>
      <span v-if="lastRefreshAt" class="strip-pill">Synced {{ formatDateTime(lastRefreshAt, queryState.timezone) }}</span>
    </div>

    <div v-if="pageWarning" class="warning-banner">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ pageWarning }}</span>
    </div>

    <PageLoadingSkeleton v-if="showLoadingState" variant="dashboard" />

    <section v-else-if="showEmptyState" class="state-card">
      <div class="state-icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      <h2>Dashboard data is unavailable</h2>
      <p>{{ emptyStateMessage }}</p>
      <el-button type="primary" @click="handleRefreshDashboard">Try again</el-button>
    </section>

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

      <section class="content-grid">
        <article class="panel-card panel-card--wide">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Revenue Motion</p>
              <h2>Won / order / paid trend</h2>
            </div>
            <div class="chip-row">
              <span class="meta-chip meta-chip--soft">{{ selectedDays }}-day series</span>
              <span v-if="revenueTrend" class="meta-chip meta-chip--outline">
                Peak {{ revenueTrend.summary.peakOrderDate ? formatDateKey(revenueTrend.summary.peakOrderDate) : "n/a" }}
              </span>
            </div>
          </header>

          <div class="compare-grid">
            <div v-for="item in comparisonCards" :key="item.label" class="compare-card">
              <span class="summary-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <p :class="['compare-note', item.tone === 'positive' ? 'compare-note--positive' : item.tone === 'negative' ? 'compare-note--negative' : '']">
                {{ item.note }}
              </p>
            </div>
          </div>

          <SalesRevenueTrendChart :data="revenueTrend" :loading="loading" :height="360" />
        </article>

        <article class="panel-card panel-card--side">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Leaderboard Pulse</p>
              <h2>Who is driving the window</h2>
            </div>
            <span class="meta-chip meta-chip--outline">
              {{ teamRanking?.summary.membersWithPerformance ?? 0 }} active rep{{ (teamRanking?.summary.membersWithPerformance ?? 0) === 1 ? "" : "s" }}
            </span>
          </header>

          <div class="spotlight-card">
            <span class="summary-label">Top performer</span>
            <strong>{{ topPerformer?.username || "No ranking yet" }}</strong>
            <p>
              {{ topPerformer ? `${formatAmount(topPerformer.metrics.wonAmount)} won across ${formatCount(topPerformer.metrics.wonCount)} closed deal${topPerformer.metrics.wonCount === 1 ? "" : "s"}.` : "Once revenue arrives, the leading rep will be highlighted here." }}
            </p>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <span class="summary-label">My rank</span>
              <strong>{{ currentUserRankLabel }}</strong>
              <p>{{ currentUserRankNote }}</p>
            </div>
            <div class="meta-card">
              <span class="summary-label">Win rate</span>
              <strong>{{ formatPercent(funnel?.summary.winRate ?? 0) }}</strong>
              <p>{{ formatCount(funnel?.summary.wonOpportunities ?? 0) }} wins from closed pipeline</p>
            </div>
            <div class="meta-card">
              <span class="summary-label">Close rate</span>
              <strong>{{ formatPercent(funnel?.summary.closeRate ?? 0) }}</strong>
              <p>{{ formatCount(funnel?.summary.closedOpportunities ?? 0) }} resolved opportunities</p>
            </div>
            <div class="meta-card">
              <span class="summary-label">Avg won ticket</span>
              <strong>{{ formatAmount(revenueTrend?.summary.averageWonTicketSize ?? 0) }}</strong>
              <p>Average value per closed-won deal</p>
            </div>
          </div>
        </article>
      </section>

      <section class="content-grid content-grid--equal">
        <article class="panel-card">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Conversion Flow</p>
              <h2>Pipeline funnel</h2>
            </div>
            <div class="chip-row">
              <span class="meta-chip meta-chip--soft">{{ formatPercent(funnel?.summary.overallToWonRate ?? 0) }} to won</span>
              <span class="meta-chip meta-chip--outline">{{ formatAmount(funnel?.summary.pipelineAmount ?? 0) }} open</span>
            </div>
          </header>

          <SalesConversionFunnelChart :data="funnel" :loading="loading" :height="360" />

          <div v-if="false" class="conversion-list">
            <article v-for="item in funnelSteps" :key="`${item.fromStage}-${item.toStage}`" class="conversion-row">
              <div class="conversion-copy">
                <strong>{{ item.fromLabel }} → {{ item.toLabel }}</strong>
                <p>{{ formatCount(item.toCount) }} moved forward · {{ formatCount(item.dropOffCount) }} dropped</p>
              </div>
              <span class="meta-chip meta-chip--outline">{{ formatPercent(item.conversionRate) }}</span>
            </article>
          </div>
        </article>

        <article class="panel-card">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Team Leaderboard</p>
              <h2>Won revenue ranking</h2>
            </div>
            <span class="meta-chip meta-chip--outline">{{ leaderboardLabel }}</span>
          </header>

          <div v-if="hasTeamRankingData" class="chart-shell">
            <EChartCanvas :option="rankingChartOption" :loading="loading" :height="360" />
          </div>
          <div v-else class="chart-empty">
            No team performance data is available for the selected filters.
          </div>

          <div class="ranking-list">
            <article v-for="member in topRankingMembers" :key="member.userId" class="ranking-row" :class="{ 'ranking-row--self': member.isCurrentUser }">
              <div class="ranking-rank">{{ member.rank }}</div>
              <div class="ranking-copy">
                <strong>{{ member.username }}</strong>
                <p>
                  {{ formatAmount(member.metrics.wonAmount) }} won · {{ formatCount(member.metrics.orderCount) }} orders ·
                  {{ formatAmount(member.metrics.pipelineAmount) }} open
                </p>
              </div>
              <span class="meta-chip" :class="member.isCurrentUser ? 'meta-chip--success' : 'meta-chip--soft'">
                {{ member.isCurrentUser ? "You" : formatCount(member.metrics.wonCount) + " win" + (member.metrics.wonCount === 1 ? "" : "s") }}
              </span>
            </article>
          </div>
        </article>
      </section>

      <section class="content-grid content-grid--equal">
        <article class="panel-card">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Pipeline Structure</p>
              <h2>Stage and order breakdown</h2>
            </div>
            <span class="meta-chip meta-chip--soft">{{ formatCount(overview?.snapshot.totalOpportunities ?? 0) }} opps</span>
          </header>

          <div class="metric-stack">
            <article v-for="row in opportunityBreakdownRows" :key="`stage-${row.key}`" class="metric-row">
              <div class="metric-copy">
                <strong>{{ row.label }}</strong>
                <p>{{ row.note }}</p>
              </div>
              <div class="metric-meter">
                <span class="metric-meter-fill" :style="{ width: `${row.share}%` }"></span>
              </div>
              <b>{{ row.value }}</b>
            </article>
          </div>

          <div class="divider"></div>

          <div class="metric-stack">
            <article v-for="row in orderBreakdownRows" :key="`order-${row.key}`" class="metric-row">
              <div class="metric-copy">
                <strong>{{ row.label }}</strong>
                <p>{{ row.note }}</p>
              </div>
              <div class="metric-meter">
                <span class="metric-meter-fill metric-meter-fill--soft" :style="{ width: `${row.share}%` }"></span>
              </div>
              <b>{{ row.value }}</b>
            </article>
          </div>
        </article>

        <article class="panel-card">
          <header class="panel-head">
            <div>
              <p class="eyebrow">Execution Rhythm</p>
              <h2>Customer source and activity cadence</h2>
            </div>
            <span class="meta-chip meta-chip--outline">{{ formatCount(overview?.period.activitiesLogged ?? 0) }} touches</span>
          </header>

          <CustomerSourcePieChart
            :items="overview?.breakdowns.customersBySource ?? []"
            :total="overview?.snapshot.customerTotal ?? 0"
            :loading="loading"
            :height="300"
          />

          <div class="cadence-grid">
            <div class="cadence-card">
              <span class="summary-label">Customer status</span>
              <div class="tag-stack">
                <span v-for="item in customerStatusTags" :key="item.key" class="meta-chip meta-chip--soft">
                  {{ item.label }} · {{ item.value }}
                </span>
              </div>
            </div>

            <div class="cadence-card">
              <span class="summary-label">Activity mix</span>
              <div class="tag-stack">
                <span v-for="item in activityTags" :key="item.key" class="meta-chip meta-chip--soft">
                  {{ item.label }} · {{ item.value }}
                </span>
              </div>
            </div>

            <div class="cadence-card">
              <span class="summary-label">Period highlights</span>
              <ul class="insight-list">
                <li>{{ formatCount(overview?.period.newCustomers ?? 0) }} new customers entered the workspace.</li>
                <li>{{ formatCount(overview?.period.followupsCompleted ?? 0) }} follow-ups were completed in the selected window.</li>
                <li>{{ formatCount(funnel?.period.opportunitiesWon ?? 0) }} deals closed won and {{ formatCount(funnel?.period.opportunitiesLost ?? 0) }} were lost.</li>
                <li>{{ formatCount(teamRanking?.summary.membersWithPerformance ?? 0) }} reps produced measurable output.</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import type { Component } from "vue";
import type { EChartsOption } from "echarts";
import { ElMessage } from "element-plus";
import { CircleCheckFilled, DataAnalysis, Document, RefreshRight, TrendCharts, User, WarningFilled } from "@element-plus/icons-vue";
import PageLoadingSkeleton from "@/components/layout/PageLoadingSkeleton.vue";
import { getSalesFunnelAggregate, getSalesOverviewStats, getSalesRevenueTrend, getSalesTeamRanking } from "@/api/report";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type {
  SalesFunnelAggregate,
  SalesFunnelConversionStep,
  SalesOverviewBreakdownItem,
  SalesOverviewStats,
  SalesReportQueryParams,
  SalesReportScope,
  SalesRevenueTrend,
  SalesTeamRanking,
} from "@/types/report";

defineOptions({
  name: "SalesDashboardWorkspace",
});

const EChartCanvas = defineAsyncComponent(() => import("@/components/charts/EChartCanvas.vue"));
const CustomerSourcePieChart = defineAsyncComponent(
  () => import("@/components/report/CustomerSourcePieChart.vue"),
);
const SalesConversionFunnelChart = defineAsyncComponent(
  () => import("@/components/report/SalesConversionFunnelChart.vue"),
);
const SalesRevenueTrendChart = defineAsyncComponent(
  () => import("@/components/report/SalesRevenueTrendChart.vue"),
);

type Tone = "dark" | "light" | "warning" | "success";
type CompareTone = "positive" | "negative" | "neutral";
type ErrorKey = "overview" | "funnel" | "trend" | "ranking";

interface SummaryCard {
  label: string;
  value: string;
  description: string;
  tone: Tone;
  icon: Component;
}

interface CompareCard {
  label: string;
  value: string;
  note: string;
  tone: CompareTone;
}

interface MetricRow {
  key: string;
  label: string;
  note: string;
  value: string;
  share: number;
}

interface SimpleTag {
  key: string;
  label: string;
  value: string;
}

const rangePresets = [7, 30, 90] as const;
const timeZoneOptions = ["Asia/Shanghai", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"];
const rankLimitOptions = [5, 10, 20];
const permissions = usePermissions();
const authStore = useAuthStore();
const canViewWorkspaceScope = computed(() => (
  permissions.hasPermission("reports.view_all")
  && (
    permissions.isAdmin.value
    || authStore.workspaceRules.managerReportingEnabled
  )
));
const scopeOptions = computed<Array<{ label: string; value: SalesReportScope }>>(() => (
  canViewWorkspaceScope.value
    ? [
        { label: "Shared team view", value: "company" },
        { label: "Mine only", value: "mine" },
      ]
    : [{ label: "Mine only", value: "mine" }]
));

const palette = {
  ink: "rgb(26, 25, 23)",
  body: "rgb(88, 86, 80)",
  muted: "rgb(138, 136, 128)",
  line: "rgb(195, 192, 180)",
  gold: "rgb(168, 114, 59)",
  sage: "rgb(86, 120, 78)",
  rose: "rgb(145, 77, 63)",
};

const endpointLabels: Record<ErrorKey, string> = {
  overview: "overview",
  funnel: "funnel",
  trend: "trend",
  ranking: "team ranking",
};

const fullNumberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const queryState = reactive<{
  range: [string, string];
  timezone: string;
  scope: SalesReportScope;
  rankLimit: number;
}>({
  range: buildTrailingRange(30),
  timezone: "Asia/Shanghai",
  scope: canViewWorkspaceScope.value ? "company" : "mine",
  rankLimit: 10,
});

const overview = ref<SalesOverviewStats | null>(null);
const funnel = ref<SalesFunnelAggregate | null>(null);
const revenueTrend = ref<SalesRevenueTrend | null>(null);
const teamRanking = ref<SalesTeamRanking | null>(null);
const loading = ref(false);
const lastRefreshAt = ref("");

const endpointErrors = reactive<Record<ErrorKey, string>>({
  overview: "",
  funnel: "",
  trend: "",
  ranking: "",
});

function buildDateFromParts(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return buildDateFromParts(year || 1970, month || 1, day || 1);
}

function formatDateKeyValue(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftDateKey(value: string, offsetDays: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + offsetDays);
  return formatDateKeyValue(date);
}

function buildTrailingRange(days: number): [string, string] {
  const endKey = formatDateKeyValue(new Date());
  return [shiftDateKey(endKey, -(days - 1)), endKey];
}

function diffRangeDays(range: [string, string]) {
  const start = parseDateKey(range[0]).getTime();
  const end = parseDateKey(range[1]).getTime();
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
}

function formatCount(value: unknown) {
  return fullNumberFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function formatCompactCount(value: unknown) {
  return compactNumberFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function formatAmount(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  if (Math.abs(numericValue) >= 100000) {
    return compactNumberFormatter.format(numericValue);
  }
  return fullNumberFormatter.format(Math.round(numericValue));
}

function formatPercent(value: unknown) {
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1) : "0"}%`;
}

function formatDateKey(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(parseDateKey(value));
}

function formatDateTime(value: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function takeSettledData<T>(result: PromiseSettledResult<{ data?: { code: number; message?: string; data: T } }>, fallback: string) {
  if (result.status === "rejected") {
    throw result.reason;
  }

  return unwrapApiResponseData(result.value, fallback);
}

function toChangeTone(value: number): CompareTone {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatChangeNote(value: number, subject: string) {
  if (value > 0) return `Up ${formatPercent(Math.abs(value))} vs previous ${subject}`;
  if (value < 0) return `Down ${formatPercent(Math.abs(value))} vs previous ${subject}`;
  return `Flat vs previous ${subject}`;
}

const salesQueryParams = computed<SalesReportQueryParams>(() => ({
  dateFrom: queryState.range[0],
  dateTo: queryState.range[1],
  days: diffRangeDays(queryState.range),
  timezone: queryState.timezone,
  scope: queryState.scope,
}));

const rankingQueryParams = computed(() => ({
  ...salesQueryParams.value,
  limit: queryState.rankLimit,
}));

const selectedDays = computed(() => diffRangeDays(queryState.range));
const rangeLabel = computed(() => `${formatDateKey(queryState.range[0])} to ${formatDateKey(queryState.range[1])}`);
const scopeLabel = computed(() => (queryState.scope === "company" ? "Shared team view" : "Mine only"));
const leaderboardLabel = computed(() => `Top ${queryState.rankLimit} leaderboard`);
const heroStatus = computed(() => (loading.value ? "Refreshing..." : `${selectedDays.value}-day live window`));
const hasAnyData = computed(() => Boolean(overview.value || funnel.value || revenueTrend.value || teamRanking.value));
const hasTeamRankingData = computed(() => Boolean(teamRanking.value?.rankings.length));
const failedSections = computed(() =>
  (Object.keys(endpointErrors) as ErrorKey[]).filter((key) => endpointErrors[key]).map((key) => endpointLabels[key]),
);
const pageWarning = computed(() => {
  if (!failedSections.value.length) return "";
  if (hasAnyData.value) {
    return `Some sections could not be refreshed: ${failedSections.value.join(", ")}. The latest available data is still shown.`;
  }

  const firstFailedKey = (Object.keys(endpointErrors) as ErrorKey[]).find((key) => endpointErrors[key]);
  return firstFailedKey ? endpointErrors[firstFailedKey] : "";
});
const showLoadingState = computed(() => loading.value && !hasAnyData.value);
const showEmptyState = computed(() => !loading.value && !hasAnyData.value);
const emptyStateMessage = computed(() => pageWarning.value || "The dashboard could not be loaded for the selected filters.");

const topPerformer = computed(() => teamRanking.value?.rankings[0] || null);
const topRankingMembers = computed(() => teamRanking.value?.rankings.slice(0, 5) || []);
const currentUserRankLabel = computed(() =>
  teamRanking.value?.currentUserRank ? `#${teamRanking.value.currentUserRank.rank}` : "Unranked",
);
const currentUserRankNote = computed(() => {
  const currentUser = teamRanking.value?.currentUserRank;
  if (!currentUser) return "No personal performance row is available for the selected filters.";
  return `${formatAmount(currentUser.metrics.wonAmount)} won · ${formatAmount(currentUser.metrics.pipelineAmount)} still open.`;
});

const summaryCards = computed<SummaryCard[]>(() => [
  {
    label: "Pipeline amount",
    value: formatAmount(funnel.value?.summary.pipelineAmount ?? 0),
    description: `${formatCount(funnel.value?.summary.openOpportunities ?? 0)} open opportunities`,
    tone: "dark",
    icon: DataAnalysis,
  },
  {
    label: "Won revenue",
    value: formatAmount(revenueTrend.value?.summary.totalWonAmount ?? 0),
    description: formatChangeNote(revenueTrend.value?.comparison.wonAmount.changeRate ?? 0, "window"),
    tone: "success",
    icon: CircleCheckFilled,
  },
  {
    label: "Paid amount",
    value: formatAmount(revenueTrend.value?.summary.totalPaidAmount ?? 0),
    description: formatChangeNote(revenueTrend.value?.comparison.paidAmount.changeRate ?? 0, "window"),
    tone: "light",
    icon: Document,
  },
  {
    label: "Active customers",
    value: formatCount(overview.value?.snapshot.activeCustomers ?? 0),
    description: `${formatCount(overview.value?.period.newCustomers ?? 0)} new customers in the selected range`,
    tone: "light",
    icon: User,
  },
  {
    label: "Win rate",
    value: formatPercent(funnel.value?.summary.winRate ?? 0),
    description: `${formatCount(funnel.value?.summary.wonOpportunities ?? 0)} wins from ${formatCount(funnel.value?.summary.closedOpportunities ?? 0)} resolved deals`,
    tone: "success",
    icon: TrendCharts,
  },
  {
    label: "Overdue follow-ups",
    value: formatCount(overview.value?.snapshot.overdueFollowups ?? 0),
    description: "Open items that need immediate attention",
    tone: "warning",
    icon: WarningFilled,
  },
]);

const comparisonCards = computed<CompareCard[]>(() => {
  const comparison = revenueTrend.value?.comparison;
  if (!comparison) {
    return [
      { label: "Won amount", value: "0", note: "No comparison data yet.", tone: "neutral" },
      { label: "Order amount", value: "0", note: "No comparison data yet.", tone: "neutral" },
      { label: "Paid amount", value: "0", note: "No comparison data yet.", tone: "neutral" },
    ];
  }

  return [
    {
      label: "Won amount",
      value: formatAmount(comparison.wonAmount.current),
      note: formatChangeNote(comparison.wonAmount.changeRate, "window"),
      tone: toChangeTone(comparison.wonAmount.changeRate),
    },
    {
      label: "Order amount",
      value: formatAmount(comparison.orderAmount.current),
      note: formatChangeNote(comparison.orderAmount.changeRate, "window"),
      tone: toChangeTone(comparison.orderAmount.changeRate),
    },
    {
      label: "Paid amount",
      value: formatAmount(comparison.paidAmount.current),
      note: formatChangeNote(comparison.paidAmount.changeRate, "window"),
      tone: toChangeTone(comparison.paidAmount.changeRate),
    },
  ];
});

const funnelSteps = computed<SalesFunnelConversionStep[]>(() => funnel.value?.conversions.stageToStage || []);

function buildMetricRows(items: SalesOverviewBreakdownItem[], noteBuilder: (item: SalesOverviewBreakdownItem) => string) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    note: noteBuilder(item),
    value: formatCount(item.count),
    share: Math.max(8, (item.count / maxCount) * 100),
  }));
}

const opportunityBreakdownRows = computed<MetricRow[]>(() =>
  buildMetricRows(
    overview.value?.breakdowns.opportunitiesByStage || [],
    (item) => `${formatAmount(item.estimatedAmount ?? 0)} estimated · ${formatAmount(item.resolvedAmount ?? 0)} resolved`,
  ),
);

const orderBreakdownRows = computed<MetricRow[]>(() =>
  buildMetricRows(
    overview.value?.breakdowns.ordersByStatus || [],
    (item) => `${formatAmount(item.totalAmount ?? 0)} total · ${formatAmount(item.paidAmount ?? 0)} paid`,
  ),
);

const customerStatusTags = computed<SimpleTag[]>(() =>
  (overview.value?.breakdowns.customersByStatus || []).map((item) => ({
    key: item.key,
    label: item.label,
    value: formatCount(item.count),
  })),
);

const activityTags = computed<SimpleTag[]>(() =>
  (overview.value?.breakdowns.activitiesByType || [])
    .filter((item) => item.count > 0)
    .slice(0, 6)
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: formatCount(item.count),
    })),
);

const rankingChartOption = computed<EChartsOption>(() => {
  const rankingRows = [...(teamRanking.value?.rankings || [])]
    .slice(0, queryState.rankLimit)
    .reverse();

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis" as const,
      axisPointer: { type: "shadow" as const },
      backgroundColor: "rgba(26, 25, 23, 0.92)",
      borderWidth: 0,
      textStyle: { color: "#fff" },
    },
    grid: {
      left: 8,
      right: 24,
      top: 10,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: "value" as const,
      axisLabel: {
        color: palette.muted,
        formatter: (value: number) => formatCompactCount(value),
      },
      splitLine: {
        lineStyle: { color: "rgba(195, 192, 180, 0.35)" },
      },
    },
    yAxis: {
      type: "category" as const,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: palette.body },
      data: rankingRows.map((item) => item.username),
    },
    series: [
      {
        type: "bar" as const,
        barWidth: 18,
        itemStyle: {
          color: palette.ink,
          borderRadius: [0, 12, 12, 0],
        },
        data: rankingRows.map((item) => item.metrics.wonAmount),
      },
    ],
  };
});

async function fetchDashboard({ silent = false } = {}) {
  loading.value = true;

  const nextErrors: Record<ErrorKey, string> = {
    overview: "",
    funnel: "",
    trend: "",
    ranking: "",
  };

  let successCount = 0;

  const [overviewResult, funnelResult, trendResult, rankingResult] = await Promise.allSettled([
    getSalesOverviewStats(salesQueryParams.value),
    getSalesFunnelAggregate(salesQueryParams.value),
    getSalesRevenueTrend(salesQueryParams.value),
    getSalesTeamRanking(rankingQueryParams.value),
  ] as const);

  try {
    overview.value = takeSettledData(overviewResult, "Sales overview data could not be loaded.");
    successCount += 1;
  } catch (error) {
    nextErrors.overview = getRequestErrorMessage(error, "Sales overview data could not be loaded.");
  }

  try {
    funnel.value = takeSettledData(funnelResult, "Sales funnel data could not be loaded.");
    successCount += 1;
  } catch (error) {
    nextErrors.funnel = getRequestErrorMessage(error, "Sales funnel data could not be loaded.");
  }

  try {
    revenueTrend.value = takeSettledData(trendResult, "Sales trend data could not be loaded.");
    successCount += 1;
  } catch (error) {
    nextErrors.trend = getRequestErrorMessage(error, "Sales trend data could not be loaded.");
  }

  try {
    teamRanking.value = takeSettledData(rankingResult, "Sales team ranking could not be loaded.");
    successCount += 1;
  } catch (error) {
    nextErrors.ranking = getRequestErrorMessage(error, "Sales team ranking could not be loaded.");
  }

  Object.assign(endpointErrors, nextErrors);

  if (successCount > 0) {
    lastRefreshAt.value = new Date().toISOString();
  }

  loading.value = false;

  if (silent) return;

  if (successCount === 0) {
    ElMessage.error(pageWarning.value || "Sales dashboard could not be loaded.");
    return;
  }

  if (failedSections.value.length) {
    ElMessage.warning(`Dashboard refreshed with partial data: ${failedSections.value.join(", ")}.`);
    return;
  }

  ElMessage.success("Sales dashboard refreshed.");
}

function handleQuickRange(days: number) {
  queryState.range = buildTrailingRange(days);
  void fetchDashboard();
}

function handleResetFilters() {
  queryState.range = buildTrailingRange(30);
  queryState.timezone = "Asia/Shanghai";
  queryState.scope = canViewWorkspaceScope.value ? "company" : "mine";
  queryState.rankLimit = 10;
  void fetchDashboard();
}

watch(canViewWorkspaceScope, (allowed) => {
  if (!allowed && queryState.scope === "company") {
    queryState.scope = "mine";
  }
});

function handleRefreshDashboard() {
  void fetchDashboard();
}

function handleApplyFilters() {
  void fetchDashboard();
}

onMounted(() => {
  void fetchDashboard({ silent: true });
});
</script>

<style scoped>
.sales-dashboard {
  display: flex;
  flex-direction: column;
  gap: 22px;
  color: var(--text-primary);
}

.hero-card,
.toolbar-card,
.panel-card,
.state-card,
.summary-card {
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 32px rgba(26, 25, 23, 0.04);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 30px 32px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(195, 192, 180, 0.22), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(244, 242, 236, 0.96));
}

.eyebrow,
.toolbar-label,
.summary-label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.hero-headline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0 0 12px;
}

.hero-headline h1,
.panel-head h2,
.state-card h2 {
  margin: 0;
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.hero-headline h1 {
  font-size: clamp(32px, 4vw, 46px);
}

.hero-pill,
.strip-pill,
.meta-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-weight: 700;
}

.hero-pill {
  padding: 8px 14px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-secondary);
  font-size: 13px;
}

.hero-description,
.summary-description,
.state-card p,
.spotlight-card p,
.metric-copy p,
.ranking-copy p,
.compare-note,
.chart-empty,
.conversion-copy p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.hero-actions,
.pill-row,
.strip-row,
.chip-row,
.tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-actions {
  align-items: center;
}

.toolbar-card {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(280px, 1.7fr) repeat(3, minmax(150px, 1fr));
  gap: 16px;
  align-items: end;
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(244, 242, 236, 0.82);
}

.toolbar-block,
.field-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.field-block--range {
  min-width: 240px;
}

.pill-button {
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-secondary);
  padding: 10px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background-color 0.2s, color 0.2s;
}

.pill-button:hover {
  transform: translateY(-1px);
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.pill-button--active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--surface-white);
}

.strip-pill,
.meta-chip {
  padding: 8px 12px;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.strip-pill {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.meta-chip--soft {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.meta-chip--outline {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.meta-chip--success {
  background: rgba(222, 231, 216, 0.92);
  color: rgb(71, 102, 64);
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(168, 114, 59, 0.12);
  border: 1px solid rgba(168, 114, 59, 0.18);
  color: rgb(124, 79, 34);
  font-weight: 600;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 260px;
  padding: 40px 24px;
  border-radius: 24px;
  text-align: center;
}

.state-icon,
.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.state-icon {
  width: 66px;
  height: 66px;
  border-radius: 22px;
  background: var(--surface-secondary);
  color: var(--text-primary);
  font-size: 28px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 22px;
}

.summary-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  font-size: 20px;
}

.summary-card--dark .summary-icon {
  background: var(--text-primary);
  color: var(--surface-white);
}

.summary-card--success .summary-icon {
  background: rgba(222, 231, 216, 0.92);
  color: rgb(71, 102, 64);
}

.summary-card--warning .summary-icon {
  background: rgba(250, 233, 206, 0.92);
  color: rgb(124, 79, 34);
}

.summary-card--light .summary-icon {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.summary-value {
  display: block;
  margin: 8px 0;
  font-size: 28px;
  line-height: 1;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.95fr);
  gap: 18px;
}

.content-grid--equal {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-head h2 {
  margin-top: 8px;
  font-size: 28px;
}

.compare-grid,
.meta-grid,
.cadence-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.compare-card,
.meta-card,
.spotlight-card,
.cadence-card {
  border-radius: 18px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.84);
  padding: 16px 18px;
}

.compare-card strong,
.meta-card strong,
.spotlight-card strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 22px;
  line-height: 1.1;
  color: var(--text-primary);
}

.compare-note--positive {
  color: rgb(71, 102, 64);
}

.compare-note--negative {
  color: rgb(121, 65, 55);
}

.chart-shell {
  border-radius: 20px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.72);
  padding: 10px 12px 6px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 24px;
  border-radius: 20px;
  border: 1px dashed var(--border-default);
  background: rgba(250, 249, 245, 0.72);
  text-align: center;
}

.conversion-list,
.ranking-list,
.metric-stack {
  display: grid;
  gap: 12px;
}

.conversion-row,
.ranking-row,
.metric-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.84);
}

.conversion-copy strong,
.metric-copy strong,
.ranking-copy strong {
  display: block;
  color: var(--text-primary);
  line-height: 1.4;
}

.ranking-row {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.ranking-row--self {
  box-shadow: inset 3px 0 0 var(--text-primary);
}

.ranking-rank {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--text-primary);
  color: var(--surface-white);
  font-size: 14px;
  font-weight: 700;
}

.metric-row {
  grid-template-columns: minmax(0, 1.2fr) minmax(120px, 1fr) auto;
}

.metric-meter {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: rgba(235, 233, 225, 0.9);
  overflow: hidden;
}

.metric-meter-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(26, 25, 23, 0.92), rgba(88, 86, 80, 0.92));
}

.metric-meter-fill--soft {
  background: linear-gradient(90deg, rgba(168, 114, 59, 0.92), rgba(195, 162, 115, 0.92));
}

.divider {
  height: 1px;
  background: rgba(195, 192, 180, 0.45);
}

.insight-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 1220px) {
  .toolbar-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-grid,
  .compare-grid,
  .meta-grid,
  .cadence-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid,
  .content-grid--equal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 880px) {
  .hero-card {
    flex-direction: column;
    padding: 26px 24px;
  }

  .hero-actions {
    width: 100%;
  }

  .toolbar-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .sales-dashboard {
    gap: 18px;
  }

  .summary-grid,
  .compare-grid,
  .meta-grid,
  .cadence-grid {
    grid-template-columns: 1fr;
  }

  .panel-card,
  .summary-card,
  .toolbar-card {
    padding: 18px;
  }

  .panel-head {
    flex-direction: column;
  }

  .metric-row,
  .conversion-row,
  .ranking-row {
    grid-template-columns: 1fr;
  }
}
</style>
