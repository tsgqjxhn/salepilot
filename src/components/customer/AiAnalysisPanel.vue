<template>
  <section class="ai-panel">
    <div class="ai-panel__frame">
      <div class="ai-panel__hero">
        <div class="ai-panel__copy">
          <p class="ai-panel__eyebrow">Customer Intelligence</p>
          <div class="ai-panel__headline">
            <h2 class="ai-panel__title">AI analysis panel</h2>
            <span class="ai-panel__status">
              {{ heroStatus }}
            </span>
          </div>
          <p class="ai-panel__description">
            Run deal prediction for {{ customerName || "this customer" }} and keep the result, evidence, and next move
            inside the same API-document visual system.
          </p>
        </div>

        <div class="ai-panel__actions">
          <el-button v-permission="'ai.analysis.run'" type="primary" :loading="loading" @click="$emit('run')">
            <el-icon><DataAnalysis /></el-icon>
            {{ result ? "Refresh analysis" : "Run analysis" }}
          </el-button>
          <el-button v-permission="'ai.analysis.run'" @click="$emit('open-detail')">
            <el-icon><ArrowRight /></el-icon>
            Open AI page
          </el-button>
        </div>
      </div>

      <div class="ai-panel__strip">
        <span class="panel-pill panel-pill--active">Deal prediction</span>
        <span class="panel-pill panel-pill--muted">Churn warning in AI page</span>
        <span v-if="metadata?.cached" class="panel-pill">12h cache hit</span>
        <span v-if="providerLabel" class="panel-pill">{{ providerLabel }}</span>
      </div>

      <div v-if="loading && !result" class="panel-state panel-state--loading">
        <div class="loading-summary">
          <span class="loading-summary__orb"></span>
          <div class="loading-summary__copy">
            <h3 class="panel-state__title">Generating AI snapshot</h3>
            <p class="panel-state__text">
              The panel is calling the customer AI endpoint and preparing a structured result.
            </p>
          </div>
        </div>

        <div class="loading-grid">
          <el-skeleton animated>
            <template #template>
              <div class="loading-card">
                <el-skeleton-item variant="h3" style="width: 40%; margin-bottom: 14px" />
                <el-skeleton-item variant="text" style="width: 92%; margin-bottom: 10px" />
                <el-skeleton-item variant="text" style="width: 84%; margin-bottom: 10px" />
                <el-skeleton-item variant="text" style="width: 64%" />
              </div>
            </template>
          </el-skeleton>

          <el-skeleton animated>
            <template #template>
              <div class="loading-card">
                <el-skeleton-item variant="h3" style="width: 36%; margin-bottom: 14px" />
                <el-skeleton-item variant="text" style="width: 88%; margin-bottom: 10px" />
                <el-skeleton-item variant="text" style="width: 90%; margin-bottom: 10px" />
                <el-skeleton-item variant="text" style="width: 72%" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <div v-else-if="error && !result" class="panel-state panel-state--error">
        <div class="panel-state__icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="panel-state__copy">
          <h3 class="panel-state__title">AI analysis is unavailable</h3>
          <p class="panel-state__text">{{ error }}</p>
        </div>
        <el-button v-permission="'ai.analysis.run'" type="primary" @click="$emit('run')">Try again</el-button>
      </div>

      <div v-else-if="result" class="ai-panel__body">
        <div class="ai-panel__overview">
          <AiScoreRing
            class="score-orbit"
            :score="result.score"
            :label="scoreLabel"
            :caption="levelLabel"
          />

          <div class="ai-panel__overview-copy">
            <div class="ai-panel__badges">
              <span class="panel-pill panel-pill--solid">{{ analysisLabel }}</span>
              <span class="panel-pill panel-pill--muted">{{ levelLabel }}</span>
              <span v-if="confidenceLabel" class="panel-pill panel-pill--muted">{{ confidenceLabel }}</span>
            </div>

            <h3 class="ai-panel__result-title">{{ resultHeadline }}</h3>
            <p class="ai-panel__result-text">
              {{ result.summary || resultDescription }}
            </p>

            <div v-if="visibleMissingData.length > 0" class="missing-data">
              <span class="missing-data__label">Missing context</span>
              <div class="missing-data__items">
                <span v-for="item in visibleMissingData" :key="item" class="missing-data__pill">
                  {{ item }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-panel__meta-grid">
          <section class="mini-panel">
            <div class="mini-panel__header">
              <el-icon><InfoFilled /></el-icon>
              <span>Analysis metadata</span>
            </div>

            <div class="mini-panel__list">
              <div v-for="item in visibleMetadataItems" :key="`${item.label}-${item.value}`" class="mini-panel__row">
                <span class="mini-panel__label">{{ item.label }}</span>
                <strong class="mini-panel__value">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <section class="mini-panel">
            <div class="mini-panel__header">
              <el-icon><Clock /></el-icon>
              <span>Signal snapshot</span>
            </div>

            <div class="snapshot-grid">
              <div v-for="item in visibleSignalItems" :key="`${item.label}-${item.value}`" class="snapshot-tile">
                <span class="snapshot-tile__label">{{ item.label }}</span>
                <strong class="snapshot-tile__value">{{ item.value }}</strong>
              </div>
            </div>
          </section>
        </div>

        <AiSignalBoard
          :positives="visiblePositives"
          :risks="visibleRisks"
          :evidence="result.evidence || []"
        />

        <section class="recommendation-card">
          <div class="recommendation-card__header">
            <el-icon><DataAnalysis /></el-icon>
            <span>Recommended next move</span>
          </div>
          <p class="recommendation-card__text">{{ result.suggestion }}</p>
        </section>
      </div>

      <div v-else class="panel-state panel-state--empty">
        <div class="panel-state__icon">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="panel-state__copy">
          <h3 class="panel-state__title">No AI analysis has been generated yet</h3>
          <p class="panel-state__text">
            Trigger the backend analysis when you want a structured win-probability readout, highlighted risks, and a
            recommended next action.
          </p>
        </div>
        <el-button v-permission="'ai.analysis.run'" type="primary" @click="$emit('run')">Run analysis</el-button>
      </div>

      <div v-if="!result && visibleSignalItems.length > 0" class="snapshot-grid snapshot-grid--preview">
        <div v-for="item in visibleSignalItems" :key="`${item.label}-${item.value}`" class="snapshot-tile">
          <span class="snapshot-tile__label">{{ item.label }}</span>
          <strong class="snapshot-tile__value">{{ item.value }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight, Clock, DataAnalysis, InfoFilled, WarningFilled } from "@element-plus/icons-vue";
import AiScoreRing from "@/components/customer/AiScoreRing.vue";
import AiSignalBoard from "@/components/customer/AiSignalBoard.vue";
import type { AiAnalysisMetadata, AiDisplayMetaItem, AiResultRecord } from "@/types/ai";

const props = withDefaults(
  defineProps<{
    customerName?: string;
    result?: AiResultRecord | null;
    metadata?: AiAnalysisMetadata | null;
    metadataItems?: AiDisplayMetaItem[];
    signalItems?: AiDisplayMetaItem[];
    loading?: boolean;
    error?: string | null;
  }>(),
  {
    customerName: "",
    result: null,
    metadata: null,
    metadataItems: () => [],
    signalItems: () => [],
    loading: false,
    error: null,
  },
);

defineEmits<{
  (event: "run"): void;
  (event: "open-detail"): void;
}>();

const heroStatus = computed(() => {
  if (props.loading) {
    return "Analyzing";
  }

  if (props.error) {
    return "Needs retry";
  }

  if (props.result) {
    return "Ready";
  }

  return "Idle";
});

const analysisLabel = computed(() =>
  props.result?.type === "churn_warning" ? "Churn warning" : "Deal prediction",
);

const scoreLabel = computed(() =>
  props.result?.type === "churn_warning" ? "Churn risk" : "Win probability",
);

const levelLabel = computed(() => {
  const type = props.result?.type || "deal_prediction";
  const level = props.result?.level || "unknown";

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
});

const resultHeadline = computed(() => {
  const level = props.result?.level || "unknown";

  return {
    high: "The account is showing strong conversion momentum.",
    medium: "The account looks viable but still needs validation.",
    low: "The opportunity is still fragile and needs stronger evidence.",
    unknown: "The current customer profile is too thin for a clear reading.",
  }[level];
});

const resultDescription = computed(() => {
  if (props.result?.type === "churn_warning") {
    return "The panel reviews touchpoint freshness, relationship coverage, and retention pressure.";
  }

  return "The panel weighs customer stage, profile quality, owner coverage, and commercial signals.";
});

const confidenceLabel = computed(() => {
  if (typeof props.result?.confidence !== "number" || props.result.confidence <= 0) {
    return "";
  }

  return `Confidence ${Math.round(props.result.confidence * 100)}%`;
});

const providerLabel = computed(() => {
  if (props.metadata?.providerLabel && props.metadata?.modelUsed) {
    return `${props.metadata.providerLabel} / ${props.metadata.modelUsed}`;
  }

  return props.metadata?.modelUsed || props.result?.modelUsed || "";
});

const visibleMetadataItems = computed(() => props.metadataItems.slice(0, 6));
const visibleSignalItems = computed(() => props.signalItems.slice(0, 4));
const visibleMissingData = computed(() => (props.result?.missingData || []).slice(0, 4));
const visiblePositives = computed(() => {
  const positives = props.result?.positives || [];
  return positives.length > 0 ? positives.slice(0, 3) : ["The latest customer profile includes enough structured fields to run the model."];
});
const visibleRisks = computed(() => {
  const risks = props.result?.risks || [];
  return risks.length > 0 ? risks.slice(0, 3) : ["No explicit risk signals were returned, so follow-up discipline still matters."];
});
</script>

<style scoped>
.ai-panel {
  width: 100%;
}

.ai-panel__frame {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 26px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(235, 233, 225, 0.9), transparent 34%),
    linear-gradient(180deg, var(--surface-secondary, rgb(244, 242, 236)) 0%, var(--surface-primary, rgb(250, 249, 245)) 100%);
  box-shadow: 0 18px 42px rgba(26, 25, 23, 0.05);
}

.ai-panel__hero,
.ai-panel__headline,
.ai-panel__actions,
.ai-panel__strip,
.ai-panel__badges,
.missing-data__items,
.recommendation-card__header,
.panel-state {
  display: flex;
  align-items: center;
}

.ai-panel__hero {
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.ai-panel__copy {
  max-width: 760px;
}

.ai-panel__eyebrow,
.snapshot-tile__label,
.mini-panel__label,
.missing-data__label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ai-panel__eyebrow {
  margin: 0 0 12px;
}

.ai-panel__headline {
  gap: 12px;
  flex-wrap: wrap;
}

.ai-panel__title,
.ai-panel__result-title,
.panel-state__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
}

.ai-panel__title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.ai-panel__status,
.panel-pill,
.missing-data__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border-default, rgb(195, 192, 180));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 13px;
  font-weight: 600;
}

.ai-panel__description,
.ai-panel__result-text,
.panel-state__text,
.recommendation-card__text,
.insight-list__item {
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.7;
}

.ai-panel__description {
  max-width: 720px;
}

.ai-panel__actions {
  gap: 10px;
  flex-wrap: wrap;
}

.ai-panel__strip,
.ai-panel__badges,
.missing-data__items,
.recommendation-card__header {
  gap: 10px;
  flex-wrap: wrap;
}

.panel-pill {
  min-height: 32px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.65);
}

.panel-pill--active,
.panel-pill--solid {
  border-color: var(--text-primary, rgb(26, 25, 23));
  background: var(--surface-tertiary, rgb(235, 233, 225));
}

.panel-pill--muted {
  color: var(--text-secondary, rgb(88, 86, 80));
}

.panel-state {
  gap: 16px;
  padding: 22px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
}

.panel-state--loading,
.panel-state--empty {
  align-items: flex-start;
  flex-direction: column;
}

.panel-state__icon {
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

.panel-state__copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-state__title {
  font-size: 22px;
  line-height: 1.3;
}

.loading-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-summary__orb {
  width: 86px;
  height: 86px;
  border: 10px solid rgba(195, 192, 180, 0.28);
  border-top-color: var(--text-primary, rgb(26, 25, 23));
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.loading-summary__copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.loading-card {
  padding: 20px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.68);
}

.ai-panel__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ai-panel__overview {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 22px;
  padding: 24px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.74);
}

.score-orbit {
  --ring-size: 220px;
}

.ai-panel__overview-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.ai-panel__result-title {
  font-size: 28px;
  line-height: 1.3;
}

.ai-panel__meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.mini-panel,
.recommendation-card,
.snapshot-tile {
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: rgba(255, 255, 255, 0.7);
}

.mini-panel,
.recommendation-card {
  border-radius: 24px;
  padding: 22px;
}

.mini-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mini-panel__header,
.recommendation-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 16px;
  font-weight: 700;
}

.mini-panel__list {
  display: flex;
  flex-direction: column;
}

.mini-panel__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 0 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border-light, rgb(220, 217, 207));
}

.mini-panel__row:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}

.mini-panel__value,
.snapshot-tile__value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.snapshot-grid--preview {
  margin-top: -6px;
}

.snapshot-tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
}

.recommendation-card__text {
  font-size: 15px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .ai-panel__overview,
  .ai-panel__meta-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .ai-panel__frame {
    padding: 22px;
  }

  .ai-panel__title {
    font-size: 26px;
  }

  .ai-panel__overview {
    padding: 20px;
  }

  .score-orbit {
    --ring-size: 180px;
    margin: 0 auto;
  }

  .snapshot-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ai-panel__actions,
  .panel-state {
    width: 100%;
  }

  .ai-panel__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .ai-panel__hero,
  .ai-panel__headline,
  .panel-state {
    align-items: flex-start;
  }
}
</style>
