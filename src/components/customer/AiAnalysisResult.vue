<template>
  <div class="ai-analysis-result">
    <div v-if="error && !result" class="state-card state-card--error">
      <div class="state-card__icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      <div class="state-card__copy">
        <h2 class="state-card__title">{{ errorTitle }}</h2>
        <p class="state-card__text">{{ error }}</p>
      </div>
      <el-button type="primary" @click="$emit('retry')">{{ errorActionLabel }}</el-button>
    </div>

    <div v-else-if="loading && !result" class="loading-layout">
      <div class="loading-status">
        <span class="loading-status__spinner">
          <el-icon class="is-loading"><Loading /></el-icon>
        </span>
        <div class="loading-status__copy">
          <h2 class="loading-status__title">{{ loadingTitle }}</h2>
          <p class="loading-status__text">{{ loadingDescription }}</p>
        </div>
      </div>

      <el-card class="score-card">
        <el-skeleton animated>
          <template #template>
            <div class="loading-score">
              <el-skeleton-item variant="circle" style="width: 220px; height: 220px" />
              <div class="loading-score__copy">
                <el-skeleton-item variant="text" style="width: 120px; height: 22px" />
                <el-skeleton-item variant="h1" style="width: 85%" />
                <el-skeleton-item variant="text" style="width: 96%" />
                <el-skeleton-item variant="text" style="width: 78%" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>

      <div class="loading-grid">
        <el-card v-for="index in 4" :key="index">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 120px; height: 18px; margin-bottom: 18px" />
              <el-skeleton-item variant="text" style="width: 95%; margin-bottom: 12px" />
              <el-skeleton-item variant="text" style="width: 88%; margin-bottom: 12px" />
              <el-skeleton-item variant="text" style="width: 72%" />
            </template>
          </el-skeleton>
        </el-card>
      </div>
    </div>

    <template v-else-if="result">
      <el-alert
        v-if="loading"
        type="info"
        :closable="false"
        show-icon
        class="status-alert"
        :title="loadingTitle"
        :description="loadingDescription"
      />

      <el-alert
        v-if="warning"
        type="warning"
        :closable="false"
        show-icon
        class="status-alert"
        :title="warningTitle"
        :description="warning"
      />

      <div class="overview-grid">
        <el-card class="score-card">
          <div class="score-card__content">
            <AiScoreRing
              class="score-ring"
              :score="result.score"
              :label="scoreLabel"
              :caption="levelHeadline"
            />

            <div class="score-copy">
              <div class="score-badges">
                <span class="analysis-badge">{{ analysisLabel }}</span>
                <span class="analysis-badge analysis-badge--muted">{{ levelHeadline }}</span>
              </div>
              <h2 class="score-card__title">{{ summaryHeadline }}</h2>
              <p class="score-card__description">{{ summaryDescription }}</p>

              <div class="score-card__meta">
                <span>Model: {{ result.modelUsed }}</span>
                <span>Generated: {{ formatDate(result.createdAt) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="meta-card">
          <template #header>
            <div class="section-header">
              <el-icon><InfoFilled /></el-icon>
              <span>Analysis metadata</span>
            </div>
          </template>

          <div class="meta-list">
            <div v-for="item in metadataItems" :key="`${item.label}-${item.value}`" class="meta-row">
              <span class="meta-row__label">{{ item.label }}</span>
              <strong class="meta-row__value">{{ item.value }}</strong>
            </div>
          </div>
        </el-card>

        <el-card class="meta-card">
          <template #header>
            <div class="section-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>Signal snapshot</span>
            </div>
          </template>

          <div class="meta-list">
            <div v-for="item in signalSnapshotItems" :key="`${item.label}-${item.value}`" class="meta-row">
              <span class="meta-row__label">{{ item.label }}</span>
              <strong class="meta-row__value">{{ item.value }}</strong>
            </div>
          </div>
        </el-card>
      </div>

      <AiSignalBoard
        :positives="result.positives"
        :risks="result.risks"
        :evidence="result.evidence || []"
      />

      <el-card class="recommendation-card">
        <template #header>
          <div class="section-header">
            <el-icon><Clock /></el-icon>
            <span>{{ recommendationTitle }}</span>
          </div>
        </template>

        <p class="recommendation-text">{{ result.suggestion }}</p>
      </el-card>
    </template>

    <div v-else class="state-card">
      <div class="state-card__icon">
        <el-icon><DataAnalysis /></el-icon>
      </div>
      <div class="state-card__copy">
        <h2 class="state-card__title">{{ emptyTitle }}</h2>
        <p class="state-card__text">{{ emptyDescription }}</p>
      </div>
      <el-button type="primary" @click="$emit('primary-action')">{{ emptyActionLabel }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Clock, DataAnalysis, InfoFilled, Loading, WarningFilled } from "@element-plus/icons-vue";
import AiScoreRing from "@/components/customer/AiScoreRing.vue";
import AiSignalBoard from "@/components/customer/AiSignalBoard.vue";
import type { AiDisplayMetaItem, AiLevel, AiResultRecord } from "@/types/ai";

const props = withDefaults(
  defineProps<{
    result?: AiResultRecord | null;
    loading?: boolean;
    error?: string | null;
    warning?: string | null;
    metadataItems?: AiDisplayMetaItem[];
    signalSnapshotItems?: AiDisplayMetaItem[];
    emptyTitle?: string;
    emptyDescription?: string;
    emptyActionLabel?: string;
    loadingTitle?: string;
    loadingDescription?: string;
    errorTitle?: string;
    errorActionLabel?: string;
    warningTitle?: string;
  }>(),
  {
    result: null,
    loading: false,
    error: null,
    warning: null,
    metadataItems: () => [],
    signalSnapshotItems: () => [],
    emptyTitle: "No AI result available yet",
    emptyDescription: "Run AI analysis to generate a summary, supporting signals, and next-step guidance.",
    emptyActionLabel: "Build result",
    loadingTitle: "AI analysis is in progress",
    loadingDescription: "The workspace is assembling signals and preparing the latest result snapshot.",
    errorTitle: "Unable to load the AI result",
    errorActionLabel: "Try again",
    warningTitle: "The current result may be stale",
  },
);

defineEmits<{
  (event: "primary-action"): void;
  (event: "retry"): void;
}>();

const analysisLabel = computed(() =>
  props.result?.type === "churn_warning" ? "Churn warning" : "Deal prediction",
);

const scoreLabel = computed(() =>
  props.result?.type === "churn_warning" ? "Churn risk" : "Win probability",
);

const recommendationTitle = computed(() =>
  props.result?.type === "churn_warning" ? "Recommended retention plan" : "Recommended next move",
);

const levelHeadline = computed(() => {
  const level = props.result?.level || "unknown";
  return props.result?.type === "churn_warning" ? getRiskHeadline(level) : getPredictionHeadline(level);
});

const summaryHeadline = computed(() => {
  const level = props.result?.level || "unknown";

  if (props.result?.type === "churn_warning") {
    return {
      high: "The account needs an immediate retention intervention.",
      medium: "The relationship needs a close follow-up plan.",
      low: "The account looks stable with manageable churn pressure.",
      unknown: "The profile does not have enough data for a risk estimate.",
    }[level];
  }

  return {
    high: "The account is showing strong conversion momentum.",
    medium: "The account is promising but still needs validation.",
    low: "The opportunity is still fragile and needs more evidence.",
    unknown: "The profile does not have enough data for a clear signal.",
  }[level];
});

const summaryDescription = computed(() => {
  if (props.result?.type === "churn_warning") {
    return "The analysis focuses on inactivity, account depth, touchpoint freshness, and retention pressure.";
  }

  return "The analysis weighs customer stage, relationship quality, owner coverage, and commercial signal strength.";
});

const getPredictionHeadline = (level: AiLevel) =>
  ({
    high: "High confidence",
    medium: "Moderate confidence",
    low: "Low confidence",
    unknown: "Unknown confidence",
  })[level];

const getRiskHeadline = (level: AiLevel) =>
  ({
    high: "High risk",
    medium: "Moderate risk",
    low: "Low risk",
    unknown: "Unknown risk",
  })[level];

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
</script>

<style scoped>
.ai-analysis-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-alert :deep(.el-alert__title) {
  font-weight: 700;
}

.loading-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 18px;
  background: var(--surface-white, rgb(255, 255, 255));
}

.loading-status__spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 22px;
}

.loading-status__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loading-status__title,
.state-card__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
}

.loading-status__title {
  font-size: 18px;
}

.loading-status__text {
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.6;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr) minmax(260px, 1fr);
  gap: 20px;
}

.score-card,
.meta-card,
.recommendation-card {
  min-height: 100%;
}

.score-card__content,
.loading-score {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 22px;
  align-items: center;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.loading-score__copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.score-ring {
  --ring-size: 220px;
}

.meta-row__label {
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

.score-card__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
}

.score-card__title {
  font-size: 28px;
  line-height: 1.3;
}

.score-card__description,
.recommendation-text,
.signal-list__item,
.state-card__text {
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
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

.meta-row__value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
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

@media (max-width: 1280px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .score-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 980px) {
  .overview-grid,
  .loading-grid,
  .score-card__content,
  .loading-score {
    grid-template-columns: 1fr;
  }

  .score-ring {
    --ring-size: 180px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .state-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
