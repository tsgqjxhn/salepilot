<template>
  <div class="ai-result-page" v-loading="customerLoading">
    <div class="page-header">
      <div class="header-copy">
        <div class="header-topline">
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            Back
          </el-button>
          <el-tag effect="plain" size="large" class="customer-chip">
            {{ customer.name || "Customer" }}
          </el-tag>
        </div>
        <h1 class="page-title">AI result</h1>
        <p class="page-subtitle">
          {{ pageSubtitle }}
        </p>
      </div>

      <div class="page-actions">
        <el-button @click="handleBackToCustomer">Customer detail</el-button>
        <el-button
          v-if="isDealPrediction"
          :loading="previewLoading"
          @click="loadCachedAnalysis"
        >
          Load cached result
        </el-button>
        <el-button type="primary" :loading="previewLoading" @click="handlePrimaryAnalysisAction">
          <el-icon><RefreshRight /></el-icon>
          {{ primaryActionLabel }}
        </el-button>
      </div>
    </div>

    <el-card class="hero-card">
      <div class="hero-content">
        <div class="hero-copy">
          <p class="eyebrow">Customer intelligence workspace</p>
          <h2 class="hero-title">{{ customer.name || "Customer profile" }}</h2>
          <p class="hero-description">
            {{ heroDescription }}
          </p>
        </div>

        <div class="type-switch" role="tablist" aria-label="Analysis type">
          <button
            v-for="option in analysisTypeOptions"
            :key="option.value"
            type="button"
            class="type-switch__button"
            :class="{ 'type-switch__button--active': analysisType === option.value }"
            :aria-selected="analysisType === option.value"
            @click="analysisType = option.value"
          >
            <span class="type-switch__label">{{ option.label }}</span>
            <span class="type-switch__description">{{ option.description }}</span>
          </button>
        </div>
      </div>

      <div class="hero-meta">
        <span class="hero-pill">Mode: {{ currentModeLabel }}</span>
        <span class="hero-pill">Status: {{ formatToken(customer.status || "potential") }}</span>
        <span class="hero-pill">Tier: {{ customer.level || "C" }}</span>
        <span class="hero-pill">Source: {{ formatToken(customer.source || "internet") }}</span>
      </div>
    </el-card>

    <div v-if="pageError" class="state-card state-card--error">
      <div class="state-card__icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      <div class="state-card__copy">
        <h2 class="state-card__title">Unable to build the AI preview</h2>
        <p class="state-card__text">{{ pageError }}</p>
      </div>
      <el-button type="primary" @click="loadPage">Try again</el-button>
    </div>

    <AiAnalysisResult
      v-else
      :result="currentResult"
      :loading="previewLoading"
      :error="previewError || null"
      :warning="previewWarning || null"
      :metadata-items="analysisMetaItems"
      :signal-snapshot-items="signalSnapshotItems"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
      :empty-action-label="emptyActionLabel"
      :loading-title="loadingTitle"
      :loading-description="loadingDescription"
      :error-title="errorTitle"
      error-action-label="Try again"
      :warning-title="warningTitle"
      @primary-action="handlePrimaryAnalysisAction"
      @retry="handlePrimaryAnalysisAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, RefreshRight, WarningFilled } from "@element-plus/icons-vue";
import AiAnalysisResult from "@/components/customer/AiAnalysisResult.vue";
import { getCustomerDetail, triggerCustomerAiAnalysis, type Customer } from "@/api/customer";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type { AiAnalysisMetadata, AiDisplayMetaItem, AiLevel, AiResultRecord, AiResultType } from "@/types/ai";

const router = useRouter();
const route = useRoute();

const customerLoading = ref(false);
const previewLoading = ref(false);
const pageError = ref("");
const previewError = ref("");
const previewWarning = ref("");
const analysisType = ref<AiResultType>("deal_prediction");
const lastAction = ref<"cache" | "rerun" | "analysis" | "preview">("cache");
const latestActivityAt = ref("");

const CHURN_WINDOW_DAYS = {
  healthy: 7,
  warning: 14,
  danger: 30,
} as const;

const customer = reactive<Partial<Customer>>({
  _id: "",
  name: "",
  type: "individual",
  status: "potential",
  source: "internet",
  level: "C",
  currency: "CNY",
  tags: [],
});

const statistics = reactive({
  contactCount: 0,
  opportunityCount: 0,
  activityCount: 0,
  totalAmount: 0,
});

const previewResults = reactive<Record<AiResultType, AiResultRecord | null>>({
  deal_prediction: null,
  churn_warning: null,
});
const analysisMetadata = reactive<Record<AiResultType, AiAnalysisMetadata | null>>({
  deal_prediction: null,
  churn_warning: null,
});

const analysisTypeOptions: Array<{ value: AiResultType; label: string; description: string }> = [
  {
    value: "deal_prediction",
    label: "Deal prediction",
    description: "Use the backend AI endpoint to score conversion readiness.",
  },
  {
    value: "churn_warning",
    label: "Churn warning",
    description: "Run the backend churn analysis against the latest customer context.",
  },
];

const isDealPrediction = computed(() => analysisType.value === "deal_prediction");
const currentResult = computed(() => previewResults[analysisType.value]);
const currentMetadata = computed(() => analysisMetadata[analysisType.value]);
const isLocalPreviewResult = (result?: AiResultRecord | null) =>
  Boolean(result && typeof result.modelUsed === "string" && /local preview/i.test(result.modelUsed));

const pageSubtitle = computed(() =>
  isDealPrediction.value
    ? "Review the latest backend AI result and manually trigger a fresh analysis when you need one."
    : "Review the latest churn warning analysis and rerun it whenever relationship signals change.",
);

const heroDescription = computed(() =>
  isDealPrediction.value
    ? "This page is connected to the customer AI endpoint. It loads the saved result first and lets you manually rerun the analysis when you want a fresh output."
    : "This page requests the backend churn analysis endpoint and summarizes retention risk from the latest customer, activity, and follow-up signals.",
);

const currentModeLabel = computed(() => {
  const result = currentResult.value;
  if (!result) {
    return "Awaiting analysis";
  }

  if (isLocalPreviewResult(result)) {
    return "Local preview fallback";
  }

  if (result.type === "deal_prediction") {
    return currentMetadata.value?.cached ? "Cached AI result" : "Fresh AI run";
  }

  return "Fresh churn analysis";
});

const primaryActionLabel = computed(() =>
  isDealPrediction.value ? "Reanalyze now" : "Refresh analysis",
);

const emptyTitle = computed(() =>
  isDealPrediction.value ? "No AI result available yet" : "No churn analysis available yet",
);

const emptyDescription = computed(() =>
  isDealPrediction.value
    ? "Load the cached AI result or run a fresh analysis from the latest customer context."
    : "Run churn analysis from the latest customer profile and workspace activity signals.",
);

const emptyActionLabel = computed(() =>
  isDealPrediction.value ? "Run analysis" : "Run churn analysis",
);

const loadingTitle = computed(() => {
  if (!isDealPrediction.value) {
    return lastAction.value === "preview" ? "Local churn preview is building" : "Churn analysis is running";
  }

  return lastAction.value === "rerun" ? "AI analysis is being re-run" : "Loading AI analysis";
});

const loadingDescription = computed(() => {
  if (!isDealPrediction.value) {
    return lastAction.value === "preview"
      ? "The workspace is rebuilding a local fallback preview from customer activity and lifecycle signals."
      : "The workspace is calling the churn analysis endpoint and preparing the latest retention-risk result.";
  }

  return lastAction.value === "rerun"
    ? "The workspace is bypassing cache and generating a fresh AI result from the current customer context."
    : "The workspace is checking the saved AI result first and will generate a new one only if needed.";
});

const errorTitle = computed(() =>
  isDealPrediction.value ? "Unable to load the AI result" : "Unable to load the churn analysis",
);

const warningTitle = computed(() =>
  isDealPrediction.value
    ? lastAction.value === "rerun"
      ? "Reanalysis failed"
      : "AI load issue"
    : lastAction.value === "preview"
      ? "Preview fallback active"
      : "Churn analysis issue",
);

const dataCoverage = computed(() => {
  const fields = [
    customer.email,
    customer.phone,
    customer.mobile,
    customer.website,
    customer.industry,
    customer.description,
    customer.owner?._id,
    customer.lastContactDate,
  ];
  const completed = fields.filter((value) => Boolean(value)).length;

  return Math.round((completed / fields.length) * 100);
});

const analysisMetaItems = computed<AiDisplayMetaItem[]>(() => {
  const result = currentResult.value;

  if (!result) {
    return [];
  }

  if (result.type === "deal_prediction") {
    return [
      { label: "Analysis type", value: getAnalysisLabel(result.type) },
      { label: "Source", value: currentModeLabel.value },
      { label: "Generated", value: formatDate(result.createdAt) },
      { label: "Model", value: currentMetadata.value?.modelUsed || result.modelUsed },
      { label: "Data coverage", value: `${dataCoverage.value}%` },
      { label: "Cache expires", value: formatDate(currentMetadata.value?.cacheExpiresAt || "") },
    ];
  }

  return [
    { label: "Analysis type", value: getAnalysisLabel(result.type) },
    { label: "Source", value: currentModeLabel.value },
    { label: "Generated", value: formatDate(result.createdAt) },
    { label: "Model", value: currentMetadata.value?.modelUsed || result.modelUsed },
    { label: "Data coverage", value: `${dataCoverage.value}%` },
    { label: "Last touchpoint", value: formatDate(customer.lastContactDate) },
  ];
});

const signalSnapshotItems = computed<AiDisplayMetaItem[]>(() => [
  { label: "Customer status", value: formatToken(customer.status || "potential") },
  { label: "Tier", value: customer.level || "C" },
  { label: "Tags", value: customer.tags?.length ? `${customer.tags.length} assigned` : "No tags yet" },
  { label: "Contacts", value: String(statistics.contactCount) },
  { label: "Activities", value: String(statistics.activityCount) },
  {
    label: "Order value",
    value: statistics.totalAmount > 0 ? formatCurrency(statistics.totalAmount, customer.currency || "CNY") : "No order value yet",
  },
]);

const getActivityTimestamp = (activity: unknown) => {
  if (!activity || typeof activity !== "object") {
    return "";
  }

  const startTime = "startTime" in activity && typeof activity.startTime === "string" ? activity.startTime : "";
  const createdAt = "createdAt" in activity && typeof activity.createdAt === "string" ? activity.createdAt : "";

  return startTime || createdAt || "";
};

const loadPage = async () => {
  customerLoading.value = true;
  pageError.value = "";
  previewError.value = "";
  previewWarning.value = "";
  previewResults.deal_prediction = null;
  previewResults.churn_warning = null;
  analysisMetadata.deal_prediction = null;
  analysisMetadata.churn_warning = null;

  try {
    const data = unwrapApiResponseData(
      await getCustomerDetail(route.params.id as string),
      "Failed to load customer details.",
    );
    Object.assign(customer, data.customer);
    statistics.contactCount = data.statistics.contactCount;
    statistics.opportunityCount = data.statistics.opportunityCount;
    statistics.activityCount = data.statistics.activityCount;
    statistics.totalAmount = data.statistics.totalAmount;
    latestActivityAt.value = Array.isArray(data.recentActivities) && data.recentActivities.length > 0
      ? getActivityTimestamp(data.recentActivities[0])
      : "";
    await loadDealPredictionResult({ force: false, silent: true });
  } catch (error) {
    console.error("Failed to load AI result page data:", error);
    pageError.value = getRequestErrorMessage(
      error,
      "The customer profile could not be loaded. Please refresh the page and try again.",
    );
    ElMessage.error(pageError.value);
  } finally {
    customerLoading.value = false;
  }
};

const handlePrimaryAnalysisAction = async () => {
  if (isDealPrediction.value) {
    await loadDealPredictionResult({ force: true });
    return;
  }

  await loadChurnWarningResult({ allowFallback: true });
};

const loadCachedAnalysis = async () => {
  if (!customer._id) {
    ElMessage.warning("Load the customer profile before requesting the AI result.");
    return;
  }

  await loadDealPredictionResult({ force: false });
};

const loadDealPredictionResult = async ({
  force = false,
  silent = false,
}: {
  force?: boolean;
  silent?: boolean;
} = {}) => {
  if (!customer._id) {
    return;
  }

  previewLoading.value = true;
  previewError.value = "";
  previewWarning.value = "";
  lastAction.value = force ? "rerun" : "cache";

  try {
    const data = unwrapApiResponseData(
      await triggerCustomerAiAnalysis(customer._id, {
        analysisType: "deal_prediction",
        useCache: !force,
      }),
      "The AI result could not be loaded.",
    );

    if (!data.result) {
      throw new Error("The AI result could not be loaded.");
    }

    previewResults.deal_prediction = data.result;
    analysisMetadata.deal_prediction = data.metadata || null;

    if (!silent) {
      ElMessage.success(
        force
          ? "AI analysis reanalyzed."
          : data.metadata?.cached
            ? "Loaded cached AI analysis."
            : "Loaded latest AI analysis.",
      );
    }
  } catch (error) {
    console.error("Failed to load the AI result:", error);
    const message = getRequestErrorMessage(error, "The AI result could not be loaded right now.");

    if (previewResults.deal_prediction) {
      previewWarning.value = `${message} The previously generated result is still being shown.`;
      if (!silent) {
        ElMessage.warning(previewWarning.value);
      }
    } else {
      previewError.value = message;
      if (!silent) {
        ElMessage.error(previewError.value);
      }
    }
  } finally {
    previewLoading.value = false;
  }
};

const loadChurnWarningResult = async ({
  silent = false,
  allowFallback = false,
}: {
  silent?: boolean;
  allowFallback?: boolean;
} = {}) => {
  if (!customer._id) {
    return;
  }

  previewLoading.value = true;
  previewError.value = "";
  previewWarning.value = "";
  lastAction.value = "analysis";

  try {
    const data = unwrapApiResponseData(
      await triggerCustomerAiAnalysis(customer._id, {
        analysisType: "churn_warning",
        useCache: false,
      }),
      "The churn analysis could not be loaded.",
    );

    if (!data.result) {
      throw new Error("The churn analysis could not be loaded.");
    }

    previewResults.churn_warning = data.result;
    analysisMetadata.churn_warning = data.metadata || null;

    if (!silent) {
      ElMessage.success("Churn warning analysis refreshed.");
    }
  } catch (error) {
    console.error("Failed to load the churn analysis:", error);
    const message = getRequestErrorMessage(error, "The churn analysis could not be loaded right now.");

    if (allowFallback && !previewResults.churn_warning) {
      buildLocalChurnPreview(new Date().toISOString());
      previewWarning.value = `${message} A local preview is being shown instead.`;
      lastAction.value = "preview";
      if (!silent) {
        ElMessage.warning(previewWarning.value);
      }
      return;
    }

    if (previewResults.churn_warning) {
      previewWarning.value = `${message} The previous churn result is still being shown.`;
      if (!silent) {
        ElMessage.warning(previewWarning.value);
      }
    } else {
      previewError.value = message;
      if (!silent) {
        ElMessage.error(previewError.value);
      }
    }
  } finally {
    previewLoading.value = false;
  }
};

const buildLocalChurnPreview = (createdAt: string) => {
  previewResults.churn_warning = buildChurnWarningPreview(createdAt);
  analysisMetadata.churn_warning = {
    modelUsed: "Local preview heuristic (7/14/30-day windows)",
    generatedAt: createdAt,
  };
};

const buildDealPredictionPreview = (createdAt: string): AiResultRecord => {
  let score = 34;
  const positives: string[] = [];
  const risks: string[] = [];

  if (customer.status === "active") {
    score += 28;
    positives.push("The account is already in an active relationship stage.");
  } else if (customer.status === "potential") {
    score += 18;
    positives.push("The account is still in a live pipeline stage.");
  } else if (customer.status === "dormant") {
    score -= 12;
    risks.push("The account is dormant, which weakens immediate conversion momentum.");
  } else if (customer.status === "lost") {
    score -= 22;
    risks.push("The account is marked as lost and needs a restart plan before closing.");
  }

  if (customer.type === "enterprise") {
    score += 10;
    positives.push("Enterprise profile depth improves commercial potential.");
  }

  if (customer.level === "A") {
    score += 16;
    positives.push("Top-tier customer grading suggests a strong strategic fit.");
  } else if (customer.level === "B") {
    score += 10;
    positives.push("Upper-mid tier grading supports the current opportunity.");
  } else if (customer.level === "D") {
    score -= 6;
    risks.push("Lower customer tier signals weaker prioritization.");
  }

  if (hasRecentContact(30)) {
    score += 10;
    positives.push("A recent touchpoint keeps the account warm.");
  } else {
    score -= 8;
    risks.push("Recent engagement is missing, so the opportunity may cool off.");
  }

  if (customer.owner?._id) {
    score += 6;
    positives.push("The customer already has clear owner coverage.");
  } else {
    risks.push("No explicit owner is attached to the account.");
  }

  if (statistics.opportunityCount > 0) {
    score += 8;
    positives.push("Existing opportunity records show active deal motion.");
  }

  if (statistics.totalAmount > 0) {
    score += 6;
    positives.push("Revenue history adds commercial confidence.");
  }

  if (!customer.email && !customer.phone && !customer.mobile) {
    score -= 12;
    risks.push("Core contact channels are incomplete.");
  }

  if (!customer.description && !customer.remark) {
    score -= 5;
    risks.push("Context notes are thin, which weakens forecast confidence.");
  }

  const normalizedScore = clampScore(score);

  return {
    id: `${customer._id || "customer"}-deal-${createdAt}`,
    customerId: customer._id || "",
    type: "deal_prediction",
    score: normalizedScore,
    level: getPredictionLevel(normalizedScore),
    positives: fillSignals(positives, [
      "Customer profile coverage is improving across commercial data fields.",
      "Relationship data is sufficient to support the next sales step.",
    ]),
    risks: fillSignals(risks, [
      "Stakeholder depth still looks limited in the current workspace snapshot.",
      "Follow-up discipline should stay tight to protect pipeline momentum.",
    ]),
    suggestion: buildDealSuggestion(normalizedScore),
    modelUsed: "Local preview heuristic",
    createdAt,
  };
};

const buildChurnWarningPreview = (createdAt: string): AiResultRecord => {
  let score = 22;
  const positives: string[] = [];
  const risks: string[] = [];
  const lastContactDays = getDaysSince(customer.lastContactDate);
  const lastActivityDays = getDaysSince(latestActivityAt.value);
  const lastContactWindow = getChurnWindow(lastContactDays);
  const lastActivityWindow = getChurnWindow(lastActivityDays);

  if (customer.status === "dormant") {
    score += 34;
    risks.push("Dormant lifecycle status is a strong churn signal.");
  } else if (customer.status === "lost") {
    score += 56;
    risks.push("Lost lifecycle status indicates severe retention pressure.");
  } else if (customer.status === "active") {
    score -= 12;
    positives.push("Active lifecycle status reduces immediate churn pressure.");
  }

  if (lastContactWindow === "healthy") {
    score -= 12;
    positives.push(`Recent customer contact was recorded within ${CHURN_WINDOW_DAYS.healthy} days.`);
  } else if (lastContactWindow === "warning") {
    score += 6;
    risks.push(`The last customer touchpoint is already ${CHURN_WINDOW_DAYS.healthy}-${CHURN_WINDOW_DAYS.warning} days old.`);
  } else if (lastContactWindow === "danger") {
    score += 16;
    risks.push(`No customer touchpoint has been recorded for ${CHURN_WINDOW_DAYS.warning}-${CHURN_WINDOW_DAYS.danger} days.`);
  } else {
    score += 26;
    risks.push(`No customer touchpoint has been recorded for more than ${CHURN_WINDOW_DAYS.danger} days.`);
  }

  if (lastActivityWindow === "healthy") {
    score -= 6;
    positives.push(`Recent activity was logged within ${CHURN_WINDOW_DAYS.healthy} days.`);
  } else if (lastActivityWindow === "warning") {
    score += 3;
    risks.push(`No activity has been logged for ${CHURN_WINDOW_DAYS.healthy}-${CHURN_WINDOW_DAYS.warning} days.`);
  } else if (lastActivityWindow === "danger") {
    score += 10;
    risks.push(`No activity has been logged for ${CHURN_WINDOW_DAYS.warning}-${CHURN_WINDOW_DAYS.danger} days.`);
  } else {
    score += 18;
    risks.push(`No activity has been logged for more than ${CHURN_WINDOW_DAYS.danger} days.`);
  }

  if (statistics.contactCount > 1) {
    score -= 6;
    positives.push("Multiple contacts reduce single-threaded relationship risk.");
  } else {
    score += 8;
    risks.push("Relationship depth is concentrated in too few contacts.");
  }

  if (customer.owner?._id) {
    score -= 4;
    positives.push("Named ownership improves accountability for retention.");
  } else {
    score += 8;
    risks.push("Missing ownership makes churn harder to prevent early.");
  }

  if (customer.tags?.length) {
    score -= 3;
    positives.push("Tagged segmentation helps the team act on customer context.");
  }

  if (!customer.email && !customer.phone && !customer.mobile) {
    score += 10;
    risks.push("Limited contact paths can delay recovery actions.");
  }

  const normalizedScore = clampScore(score);

  return {
    id: `${customer._id || "customer"}-churn-${createdAt}`,
    customerId: customer._id || "",
    type: "churn_warning",
    score: normalizedScore,
    level: getRiskLevel(normalizedScore),
    positives: fillSignals(positives, [
      "The current workspace still contains enough account data for retention planning.",
      "There is room to improve the relationship before risk becomes critical.",
    ]),
    risks: fillSignals(risks, [
      "Next follow-up timing should stay disciplined to avoid silence gaps.",
      "Relationship quality should be checked with a direct customer conversation.",
    ]),
    suggestion: buildChurnSuggestion(normalizedScore),
    modelUsed: "Local preview heuristic",
    createdAt,
  };
};

const buildDealSuggestion = (score: number) => {
  if (score >= 75) {
    return "Move the account into a decisive closing sequence: confirm the economic buyer, lock the next meeting, and convert the current momentum into a dated commercial commitment.";
  }

  if (score >= 55) {
    return "Keep the opportunity warm with a structured follow-up plan, enrich account notes, and resolve the remaining commercial gaps before pushing for the close.";
  }

  return "Treat the account as early-stage: improve contact coverage, gather stronger qualification signals, and avoid forecasting a close until engagement becomes consistent.";
};

const buildChurnSuggestion = (score: number) => {
  if (score >= 70) {
    return "Trigger a retention save plan now: contact the customer directly, surface blockers, assign an accountable owner, and schedule a concrete recovery follow-up within the next business day.";
  }

  if (score >= 45) {
    return "Run a preventive retention check-in, refresh the relationship map, and tighten follow-up cadence before the account drifts further.";
  }

  return "Keep the account in a healthy maintenance rhythm: preserve touchpoint consistency, document context after every interaction, and monitor signal drift over time.";
};

const fillSignals = (items: string[], fallbacks: string[]) => {
  const merged = [...items];

  for (const fallback of fallbacks) {
    if (merged.length >= 3) {
      break;
    }

    if (!merged.includes(fallback)) {
      merged.push(fallback);
    }
  }

  return merged.slice(0, 3);
};

const clampScore = (score: number) => Math.min(100, Math.max(0, Math.round(score)));

const getAnalysisLabel = (type: AiResultType) => (type === "churn_warning" ? "Churn warning" : "Deal prediction");

const getLevelLabel = (type: AiResultType, level: AiLevel) => {
  if (type === "churn_warning") {
    return {
      high: "High risk",
      medium: "Moderate risk",
      low: "Low risk",
      unknown: "Unknown risk",
    }[level];
  }

  return {
    high: "High confidence",
    medium: "Moderate confidence",
    low: "Low confidence",
    unknown: "Unknown confidence",
  }[level];
};

const getPredictionLevel = (score: number): AiLevel => {
  if (score >= 75) {
    return "high";
  }

  if (score >= 55) {
    return "medium";
  }

  if (score > 0) {
    return "low";
  }

  return "unknown";
};

const getRiskLevel = (score: number): AiLevel => {
  if (score >= 70) {
    return "high";
  }

  if (score >= 45) {
    return "medium";
  }

  if (score >= 0) {
    return "low";
  }

  return "unknown";
};

const getDaysSince = (dateString?: string) => {
  if (!dateString) {
    return Number.POSITIVE_INFINITY;
  }

  const diff = Date.now() - new Date(dateString).getTime();

  if (!Number.isFinite(diff)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const getChurnWindow = (days: number): "healthy" | "warning" | "danger" | "critical" => {
  if (!Number.isFinite(days)) {
    return "critical";
  }

  if (days <= CHURN_WINDOW_DAYS.healthy) {
    return "healthy";
  }

  if (days <= CHURN_WINDOW_DAYS.warning) {
    return "warning";
  }

  if (days <= CHURN_WINDOW_DAYS.danger) {
    return "danger";
  }

  return "critical";
};

const hasRecentContact = (days: number) => {
  if (!customer.lastContactDate) {
    return false;
  }

  const diff = Date.now() - new Date(customer.lastContactDate).getTime();

  return Number.isFinite(diff) && diff <= days * 24 * 60 * 60 * 1000;
};

const formatToken = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const handleBack = () => {
  router.back();
};

const handleBackToCustomer = () => {
  router.push(`/customer/${route.params.id}`);
};

watch(
  analysisType,
  (value) => {
    previewError.value = "";
    previewWarning.value = "";

    if (!customer._id) {
      return;
    }

    if (value === "churn_warning" && !previewResults.churn_warning) {
      void loadChurnWarningResult({ silent: true, allowFallback: true });
      return;
    }

    if (value === "deal_prediction" && !previewResults.deal_prediction) {
      void loadDealPredictionResult({ force: false, silent: true });
    }
  },
);

watch(
  () => route.params.id,
  () => {
    loadPage();
  },
  { immediate: true },
);
</script>

<style scoped>
.ai-result-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.header-copy,
.page-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-actions {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}

.header-topline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.customer-chip {
  border-radius: 999px;
}

.page-title,
.hero-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  letter-spacing: -0.03em;
}

.page-title {
  font-size: 30px;
  font-weight: 700;
}

.page-subtitle,
.hero-description,
.score-card__description,
.recommendation-text,
.state-card__text {
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-content {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: start;
}

.type-switch {
  display: grid;
  gap: 12px;
}

.type-switch__button {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 18px;
  background: var(--surface-primary, rgb(250, 249, 245));
  color: var(--text-secondary, rgb(88, 86, 80));
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.type-switch__button:hover {
  border-color: var(--text-secondary, rgb(88, 86, 80));
  transform: translateY(-1px);
}

.type-switch__button--active {
  border-color: var(--text-primary, rgb(26, 25, 23));
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
}

.type-switch__label {
  font-size: 16px;
  font-weight: 700;
}

.type-switch__description {
  font-size: 13px;
  line-height: 1.6;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-pill,
.analysis-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border-default, rgb(195, 192, 180));
  border-radius: 999px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 13px;
  font-weight: 600;
}

.analysis-badge--muted {
  background: var(--surface-white, rgb(255, 255, 255));
  color: var(--text-secondary, rgb(88, 86, 80));
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr) minmax(260px, 1fr);
  gap: 20px;
}

.score-card,
.meta-card,
.signal-card,
.recommendation-card {
  min-height: 100%;
}

.score-card__content {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 22px;
  align-items: center;
}

.score-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 220px;
  padding: 16px;
  border-radius: 50%;
}

.score-ring__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--surface-white, rgb(255, 255, 255));
  box-shadow: inset 0 0 0 1px rgba(220, 217, 207, 0.9);
}

.score-ring__value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.score-ring__label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.score-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.score-badges,
.score-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.score-card__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 28px;
  line-height: 1.3;
}

.score-card__meta {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 16px;
  font-weight: 700;
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light, rgb(220, 217, 207));
}

.meta-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.meta-row__label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meta-row__value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.signal-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.signal-list__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
}

.signal-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 50%;
  background: var(--text-primary, rgb(26, 25, 23));
}

.signal-dot--risk {
  background: var(--text-secondary, rgb(88, 86, 80));
}

.recommendation-text {
  font-size: 15px;
}

.state-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 26px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 20px;
  background: var(--surface-white, rgb(255, 255, 255));
  box-shadow: 0 14px 32px rgba(26, 25, 23, 0.05);
}

.state-card--error {
  border-color: var(--border-default, rgb(195, 192, 180));
}

.state-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 24px;
}

.state-card__copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.state-card__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 22px;
}

@media (max-width: 1280px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .score-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 980px) {
  .hero-content,
  .score-card__content,
  .insight-grid {
    grid-template-columns: 1fr;
  }

  .score-ring {
    width: 180px;
    height: 180px;
    margin: 0 auto;
  }

  .score-ring__value {
    font-size: 46px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-actions,
  .state-card {
    width: 100%;
  }

  .page-actions {
    justify-content: flex-start;
  }

  .state-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
