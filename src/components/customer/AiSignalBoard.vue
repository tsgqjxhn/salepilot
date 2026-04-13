<template>
  <div class="signal-board">
    <section class="signal-column signal-column--positive">
      <header class="signal-column__header">
        <div class="signal-column__title-wrap">
          <span class="signal-column__icon">
            <el-icon><TrendCharts /></el-icon>
          </span>
          <div class="signal-column__copy">
            <h3 class="signal-column__title">{{ positiveTitle }}</h3>
            <p class="signal-column__subtitle">What is helping the current account signal.</p>
          </div>
        </div>
        <span class="signal-column__count">{{ positiveItems.length }}</span>
      </header>

      <ul class="signal-list">
        <li v-for="(item, index) in positiveItems" :key="item" class="signal-list__item">
          <span class="signal-list__index">{{ index + 1 }}</span>
          <span class="signal-list__text">{{ item }}</span>
        </li>
      </ul>

      <div v-if="positiveEvidence.length > 0" class="evidence-strip">
        <span class="evidence-strip__label">Evidence</span>
        <div class="evidence-strip__items">
          <div v-for="item in positiveEvidence" :key="`${item.signal}-${item.reason}`" class="evidence-chip">
            <strong v-if="item.signal" class="evidence-chip__signal">{{ item.signal }}</strong>
            <span class="evidence-chip__reason">{{ item.reason || "Supporting model evidence." }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="signal-column signal-column--risk">
      <header class="signal-column__header">
        <div class="signal-column__title-wrap">
          <span class="signal-column__icon signal-column__icon--risk">
            <el-icon><WarningFilled /></el-icon>
          </span>
          <div class="signal-column__copy">
            <h3 class="signal-column__title">{{ riskTitle }}</h3>
            <p class="signal-column__subtitle">What could slow the account or push it off track.</p>
          </div>
        </div>
        <span class="signal-column__count signal-column__count--risk">{{ riskItems.length }}</span>
      </header>

      <ul class="signal-list">
        <li v-for="(item, index) in riskItems" :key="item" class="signal-list__item">
          <span class="signal-list__index signal-list__index--risk">{{ index + 1 }}</span>
          <span class="signal-list__text">{{ item }}</span>
        </li>
      </ul>

      <div v-if="riskEvidence.length > 0" class="evidence-strip">
        <span class="evidence-strip__label">Evidence</span>
        <div class="evidence-strip__items">
          <div v-for="item in riskEvidence" :key="`${item.signal}-${item.reason}`" class="evidence-chip evidence-chip--risk">
            <strong v-if="item.signal" class="evidence-chip__signal">{{ item.signal }}</strong>
            <span class="evidence-chip__reason">{{ item.reason || "Potential model risk evidence." }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TrendCharts, WarningFilled } from "@element-plus/icons-vue";
import type { AiEvidenceItem } from "@/types/ai";

const props = withDefaults(
  defineProps<{
    positives?: string[];
    risks?: string[];
    evidence?: AiEvidenceItem[];
    positiveTitle?: string;
    riskTitle?: string;
  }>(),
  {
    positives: () => [],
    risks: () => [],
    evidence: () => [],
    positiveTitle: "Positive signals",
    riskTitle: "Risk points",
  },
);

const positiveItems = computed(() =>
  props.positives.length > 0
    ? props.positives.slice(0, 4)
    : ["The current profile includes enough structured information to produce a usable analysis."],
);

const riskItems = computed(() =>
  props.risks.length > 0
    ? props.risks.slice(0, 4)
    : ["No explicit risk point was returned, but follow-up discipline still needs to stay tight."],
);

const positiveEvidence = computed(() =>
  props.evidence.filter((item) => item?.impact === "positive" && (item.signal || item.reason)).slice(0, 2),
);

const riskEvidence = computed(() =>
  props.evidence.filter((item) => item?.impact === "negative" && (item.signal || item.reason)).slice(0, 2),
);
</script>

<style scoped>
.signal-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.signal-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding: 22px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(250, 249, 245, 0.9) 100%);
  box-shadow: 0 14px 28px rgba(26, 25, 23, 0.04);
}

.signal-column--positive {
  background:
    radial-gradient(circle at top right, rgba(235, 233, 225, 0.9), transparent 35%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(244, 242, 236, 0.96) 100%);
}

.signal-column--risk {
  background:
    radial-gradient(circle at top right, rgba(220, 217, 207, 0.55), transparent 35%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(250, 249, 245, 0.98) 100%);
}

.signal-column__header,
.signal-column__title-wrap,
.signal-column__icon,
.evidence-strip__items {
  display: flex;
  align-items: center;
}

.signal-column__header {
  justify-content: space-between;
  gap: 16px;
}

.signal-column__title-wrap {
  gap: 12px;
}

.signal-column__icon {
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 20px;
}

.signal-column__icon--risk {
  background: var(--surface-tertiary, rgb(235, 233, 225));
  color: var(--text-secondary, rgb(88, 86, 80));
}

.signal-column__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.signal-column__title,
.signal-list__text,
.evidence-chip__signal {
  color: var(--text-primary, rgb(26, 25, 23));
}

.signal-column__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.signal-column__subtitle,
.evidence-chip__reason {
  color: var(--text-secondary, rgb(88, 86, 80));
}

.signal-column__subtitle {
  margin: 0;
  line-height: 1.6;
  font-size: 13px;
}

.signal-column__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border-default, rgb(195, 192, 180));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 14px;
  font-weight: 700;
}

.signal-column__count--risk {
  color: var(--text-secondary, rgb(88, 86, 80));
}

.signal-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.signal-list__item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
}

.signal-list__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 13px;
  font-weight: 700;
}

.signal-list__index--risk {
  background: var(--surface-tertiary, rgb(235, 233, 225));
  color: var(--text-secondary, rgb(88, 86, 80));
}

.signal-list__text {
  line-height: 1.7;
}

.evidence-strip {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evidence-strip__label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.evidence-strip__items {
  gap: 10px;
  flex-wrap: wrap;
}

.evidence-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  padding: 12px 14px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
}

.evidence-chip--risk {
  background: rgba(250, 249, 245, 0.92);
}

.evidence-chip__signal {
  font-size: 13px;
  font-weight: 700;
}

.evidence-chip__reason {
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 980px) {
  .signal-board {
    grid-template-columns: 1fr;
  }
}
</style>
