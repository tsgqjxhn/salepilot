<template>
  <section class="funnel-chart">
    <div class="legend-row">
      <article v-for="item in legendItems" :key="item.key" class="legend-card">
        <span class="legend-dot" :style="{ background: item.color }"></span>
        <div>
          <span class="legend-label">{{ item.label }}</span>
          <strong class="legend-value">{{ item.value }}</strong>
        </div>
      </article>
    </div>

    <div v-if="hasData" class="funnel-layout">
      <div class="chart-shell">
        <EChartCanvas :option="chartOption" :loading="loading" :height="height" />
      </div>

      <div class="stage-column">
        <article v-for="stage in stageCards" :key="stage.key" class="stage-card">
          <div class="stage-card__head">
            <div class="stage-card__copy">
              <span class="stage-dot" :style="{ background: stage.color }"></span>
              <strong>{{ stage.label }}</strong>
            </div>
            <span class="stage-chip">{{ stage.shareLabel }}</span>
          </div>

          <div class="stage-card__metrics">
            <div>
              <span class="stage-metric-label">Volume</span>
              <strong>{{ stage.countLabel }}</strong>
            </div>
            <div>
              <span class="stage-metric-label">{{ stage.amountLabel }}</span>
              <strong>{{ stage.valueLabel }}</strong>
            </div>
            <div>
              <span class="stage-metric-label">From previous</span>
              <strong>{{ stage.previousLabel }}</strong>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="chart-empty">
      No opportunity-stage data is available for the selected window.
    </div>

    <div v-if="hasConversions" class="conversion-list">
      <article v-for="item in conversionCards" :key="`${item.fromStage}-${item.toStage}`" class="conversion-row">
        <div class="conversion-copy">
          <strong>{{ item.fromLabel }} -> {{ item.toLabel }}</strong>
          <p>{{ item.forwardLabel }} moved forward / {{ item.dropLabel }} dropped out</p>
        </div>
        <div class="conversion-side">
          <span class="conversion-rate">{{ item.rateLabel }}</span>
          <span class="conversion-drop">{{ item.dropShareLabel }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import EChartCanvas from "@/components/charts/EChartCanvas.vue";
import type { SalesFunnelAggregate, SalesFunnelConversionStep, SalesFunnelStage } from "@/types/report";

defineOptions({
  name: "SalesConversionFunnelChart",
});

const props = withDefaults(
  defineProps<{
    data?: SalesFunnelAggregate | null;
    loading?: boolean;
    height?: number | string;
  }>(),
  {
    data: null,
    loading: false,
    height: 360,
  },
);

const palette = [
  "rgb(26, 25, 23)",
  "rgb(168, 114, 59)",
  "rgb(121, 104, 66)",
  "rgb(86, 120, 78)",
  "rgb(145, 77, 63)",
  "rgb(108, 98, 94)",
];

function formatCount(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return new Intl.NumberFormat("en-US").format(numericValue);
}

function formatAmount(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(numericValue) >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function formatPercent(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0%";
  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1)}%`;
}

const activeStages = computed(() => (props.data?.stages || []).filter((item) => item.count > 0));
const hasData = computed(() => activeStages.value.length > 0);
const hasConversions = computed(() => Boolean(props.data?.conversions.stageToStage.length));

const leadingStage = computed(() => activeStages.value[0] || null);
const mostEfficientStage = computed(() => {
  const comparableStages = activeStages.value.filter((stage) => stage.order > 0);
  if (!comparableStages.length) return null;

  return [...comparableStages].sort((left, right) => right.conversionFromPrevious - left.conversionFromPrevious)[0] || null;
});

const legendItems = computed(() => [
  {
    key: "entry",
    label: "Top of funnel",
    value: `${leadingStage.value?.label || "No stage"} / ${formatCount(props.data?.conversions.topOfFunnelCount ?? 0)}`,
    color: palette[0],
  },
  {
    key: "won",
    label: "Overall to won",
    value: formatPercent(props.data?.summary.overallToWonRate ?? 0),
    color: palette[3],
  },
  {
    key: "best",
    label: "Best stage lift",
    value: mostEfficientStage.value ? `${mostEfficientStage.value.label} / ${formatPercent(mostEfficientStage.value.conversionFromPrevious)}` : "No progression yet",
    color: palette[1],
  },
]);

const stageCards = computed(() =>
  activeStages.value.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    countLabel: formatCount(stage.count),
    shareLabel: formatPercent(stage.shareRate),
    valueLabel: formatAmount(stage.isClosed ? stage.resolvedAmount : stage.estimatedAmount),
    amountLabel: stage.isClosed ? "Resolved value" : "Pipeline value",
    previousLabel: stage.order === 0 ? "Entry stage" : formatPercent(stage.conversionFromPrevious),
    color: palette[index % palette.length],
  })),
);

const conversionCards = computed(() =>
  (props.data?.conversions.stageToStage || []).map((item: SalesFunnelConversionStep) => ({
    ...item,
    forwardLabel: formatCount(item.toCount),
    dropLabel: formatCount(item.dropOffCount),
    rateLabel: formatPercent(item.conversionRate),
    dropShareLabel: item.fromCount > 0 ? `${formatPercent((item.dropOffCount / item.fromCount) * 100)} drop` : "0% drop",
  })),
);

const chartOption = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item" as const,
    backgroundColor: "rgba(26, 25, 23, 0.92)",
    borderWidth: 0,
    padding: 12,
    textStyle: { color: "#fff" },
    formatter: (params: any) => {
      const currentStage = activeStages.value.find((stage) => stage.label === params?.name) as SalesFunnelStage | undefined;
      const amountValue = currentStage?.isClosed ? currentStage.resolvedAmount : currentStage?.estimatedAmount;
      return `${params?.name || "Stage"}<br/>${formatCount(params?.value)} opportunities<br/>${formatAmount(amountValue)} value`;
    },
  },
  series: [
    {
      type: "funnel" as const,
      left: "4%",
      top: 10,
      bottom: 10,
      width: "92%",
      minSize: "18%",
      maxSize: "96%",
      sort: "descending" as const,
      gap: 8,
      label: {
        show: true,
        position: "inside" as const,
        color: "#fff",
        fontWeight: 700,
        formatter: (params: any) => `${params?.name}\n${formatCount(params?.value)}`,
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: "rgba(250, 249, 245, 0.96)",
        borderWidth: 2,
      },
      emphasis: {
        label: {
          fontSize: 14,
        },
      },
      data: activeStages.value.map((item, index) => ({
        name: item.label,
        value: item.count,
        itemStyle: {
          color: palette[index % palette.length],
        },
      })),
    },
  ],
}));
</script>

<style scoped>
.funnel-chart {
  display: grid;
  gap: 16px;
}

.legend-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.legend-card,
.stage-card,
.conversion-row {
  border-radius: 18px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.84);
}

.legend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.legend-dot,
.stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.legend-label,
.stage-metric-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.legend-value {
  display: block;
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1.2;
}

.funnel-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
  gap: 14px;
  align-items: start;
}

.chart-shell {
  border-radius: 20px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.72);
  padding: 10px 12px 6px;
}

.stage-column,
.conversion-list {
  display: grid;
  gap: 12px;
}

.stage-card {
  padding: 14px 16px;
}

.stage-card__head,
.stage-card__copy,
.conversion-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-card__head {
  justify-content: space-between;
  gap: 16px;
}

.stage-card__copy strong,
.conversion-copy strong {
  display: block;
  color: var(--text-primary);
  line-height: 1.4;
}

.stage-chip,
.conversion-rate {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.stage-chip {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(26, 25, 23, 0.08);
  color: var(--text-secondary);
}

.stage-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.stage-card__metrics strong {
  display: block;
  color: var(--text-primary);
  font-size: 18px;
  line-height: 1.2;
}

.conversion-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
}

.conversion-copy p,
.conversion-drop {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.conversion-side {
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.conversion-rate {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.conversion-drop {
  font-size: 12px;
  font-weight: 600;
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
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .funnel-layout,
  .legend-row,
  .stage-card__metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .conversion-row {
    grid-template-columns: 1fr;
  }

  .conversion-side {
    align-items: flex-start;
  }
}
</style>
