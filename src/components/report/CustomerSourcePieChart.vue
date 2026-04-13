<template>
  <section class="source-pie-chart">
    <div class="source-pie-chart__summary">
      <article class="summary-card">
        <span class="summary-label">Tracked customers</span>
        <strong class="summary-value">{{ formatCount(resolvedTotal) }}</strong>
        <p class="summary-note">
          {{ activeItems.length }} active source{{ activeItems.length === 1 ? "" : "s" }} in the selected window.
        </p>
      </article>

      <article class="summary-card">
        <span class="summary-label">Largest source</span>
        <strong class="summary-value">{{ leadingItem?.label ?? "No source data" }}</strong>
        <p class="summary-note">
          {{ leadingItem ? `${formatCount(leadingItem.count)} customers / ${leadingItem.shareLabel}` : "Load customer data to see the dominant acquisition channel." }}
        </p>
      </article>
    </div>

    <div v-if="hasData" class="source-pie-chart__content">
      <div class="chart-shell">
        <EChartCanvas :option="chartOption" :loading="loading" :height="height" />
      </div>

      <div class="legend-column">
        <article v-for="item in activeItems" :key="item.key" class="legend-card">
          <div class="legend-card__top">
            <div class="legend-card__copy">
              <span class="legend-dot" :style="{ background: item.color }"></span>
              <strong>{{ item.label }}</strong>
            </div>
            <span class="legend-share">{{ item.shareLabel }}</span>
          </div>

          <div class="legend-card__meta">
            <span>{{ formatCount(item.count) }} customers</span>
            <span>{{ item.sourceLabel }}</span>
          </div>

          <div class="legend-meter">
            <span class="legend-meter__fill" :style="{ width: item.shareBarWidth, background: item.color }"></span>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="chart-empty">
      No customer-source distribution is available for the selected filters.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import EChartCanvas from "@/components/charts/EChartCanvas.vue";
import type { SalesOverviewBreakdownItem } from "@/types/report";

defineOptions({
  name: "CustomerSourcePieChart",
});

const props = withDefaults(
  defineProps<{
    items?: SalesOverviewBreakdownItem[];
    total?: number;
    loading?: boolean;
    height?: number | string;
  }>(),
  {
    items: () => [],
    total: 0,
    loading: false,
    height: 300,
  },
);

const sourcePalette: Record<string, string> = {
  advertisement: "rgb(168, 114, 59)",
  referral: "rgb(26, 25, 23)",
  exhibition: "rgb(121, 104, 66)",
  internet: "rgb(86, 120, 78)",
  coldcall: "rgb(145, 77, 63)",
  other: "rgb(138, 136, 128)",
  unknown: "rgb(166, 162, 150)",
};

function formatCount(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return new Intl.NumberFormat("en-US").format(numericValue);
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function normalizeKey(value: unknown) {
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  return normalizedValue || "unknown";
}

function normalizeLabel(item: SalesOverviewBreakdownItem) {
  const rawLabel = String(item.label ?? "").trim();
  const normalizedKey = normalizeKey(item.key);

  if (!rawLabel || rawLabel.toLowerCase() === "null" || rawLabel.toLowerCase() === "undefined") {
    return normalizedKey === "unknown" ? "Unknown" : normalizedKey;
  }

  return rawLabel;
}

const resolvedTotal = computed(() => {
  const numericTotal = Number(props.total);
  if (Number.isFinite(numericTotal) && numericTotal > 0) {
    return numericTotal;
  }

  return props.items.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
});

const activeItems = computed(() =>
  props.items
    .map((item, index) => {
      const key = normalizeKey(item.key);
      const count = Math.max(0, Number(item.count) || 0);
      const share = resolvedTotal.value > 0 ? (count / resolvedTotal.value) * 100 : 0;

      return {
        key: `${key}-${index}`,
        sourceKey: key,
        label: normalizeLabel(item),
        count,
        share,
        shareLabel: formatPercent(share),
        shareBarWidth: `${Math.max(share, count > 0 ? 8 : 0)}%`,
        color: sourcePalette[key] || sourcePalette.other,
        sourceLabel: key === "unknown" ? "Source not set" : key.replace(/_/g, " "),
        order: index,
      };
    })
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count || left.order - right.order),
);

const hasData = computed(() => activeItems.value.length > 0);
const leadingItem = computed(() => activeItems.value[0] ?? null);

const chartOption = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  animationDuration: 420,
  tooltip: {
    trigger: "item" as const,
    backgroundColor: "rgba(26, 25, 23, 0.94)",
    borderWidth: 0,
    padding: 12,
    textStyle: { color: "#fff" },
    formatter: (params: any) =>
      `${params?.name || "Unknown"}<br/>${formatCount(Number(params?.value) || 0)} customers (${formatPercent(Number(params?.percent) || 0)})`,
  },
  series: [
    {
      type: "pie" as const,
      radius: ["48%", "74%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: true,
      startAngle: 90,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: "rgba(250, 249, 245, 0.96)",
        borderWidth: 4,
      },
      emphasis: {
        scale: true,
        scaleSize: 6,
      },
      data: activeItems.value.map((item) => ({
        name: item.label,
        value: item.count,
        itemStyle: {
          color: item.color,
        },
      })),
    },
  ],
}));
</script>

<style scoped>
.source-pie-chart {
  display: grid;
  gap: 16px;
}

.source-pie-chart__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card,
.legend-card {
  border-radius: 18px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.84);
}

.summary-card {
  padding: 16px 18px;
}

.summary-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.summary-value {
  display: block;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.1;
}

.summary-note {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.source-pie-chart__content {
  display: grid;
  grid-template-columns: minmax(240px, 1.1fr) minmax(0, 0.9fr);
  gap: 14px;
  align-items: stretch;
}

.chart-shell {
  border-radius: 20px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.72);
  padding: 10px 12px 6px;
}

.legend-column {
  display: grid;
  gap: 10px;
}

.legend-card {
  padding: 14px 16px;
}

.legend-card__top,
.legend-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.legend-card__copy {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--text-primary);
}

.legend-card__copy strong {
  display: block;
  line-height: 1.3;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.legend-share,
.legend-card__meta {
  color: var(--text-secondary);
}

.legend-share {
  font-weight: 700;
}

.legend-card__meta {
  margin-top: 8px;
  font-size: 13px;
}

.legend-meter {
  position: relative;
  height: 8px;
  margin-top: 12px;
  border-radius: 999px;
  background: rgba(235, 233, 225, 0.9);
  overflow: hidden;
}

.legend-meter__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 24px;
  border-radius: 20px;
  border: 1px dashed var(--border-default);
  background: rgba(250, 249, 245, 0.72);
  text-align: center;
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 900px) {
  .source-pie-chart__content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .source-pie-chart__summary {
    grid-template-columns: 1fr;
  }
}
</style>
