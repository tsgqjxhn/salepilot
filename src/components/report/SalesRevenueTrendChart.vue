<template>
  <section class="trend-chart">
    <div class="legend-row">
      <article v-for="item in legendItems" :key="item.key" class="legend-card">
        <span class="legend-dot" :style="{ background: item.color }"></span>
        <div>
          <span class="legend-label">{{ item.label }}</span>
          <strong class="legend-value">{{ item.value }}</strong>
        </div>
      </article>
    </div>

    <div v-if="hasData" class="chart-shell">
      <EChartCanvas :option="chartOption" :loading="loading" :height="height" />
    </div>
    <div v-else class="chart-empty">
      No time-series revenue data is available for the selected window.
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import EChartCanvas from "@/components/charts/EChartCanvas.vue";
import type { SalesRevenueTrend } from "@/types/report";

defineOptions({
  name: "SalesRevenueTrendChart",
});

const props = withDefaults(
  defineProps<{
    data?: SalesRevenueTrend | null;
    loading?: boolean;
    height?: number | string;
  }>(),
  {
    data: null,
    loading: false,
    height: 360,
  },
);

const palette = {
  ink: "rgb(26, 25, 23)",
  body: "rgb(88, 86, 80)",
  muted: "rgb(138, 136, 128)",
  line: "rgb(195, 192, 180)",
  gold: "rgb(168, 114, 59)",
  sage: "rgb(86, 120, 78)",
};

function formatCompact(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(numericValue) >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function formatDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year || 1970, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

const hasData = computed(() => Boolean(props.data?.trend.length));

const legendItems = computed(() => [
  {
    key: "won",
    label: "Won revenue",
    value: formatCompact(props.data?.summary.totalWonAmount ?? 0),
    color: palette.ink,
  },
  {
    key: "order",
    label: "Order amount",
    value: formatCompact(props.data?.summary.totalOrderAmount ?? 0),
    color: palette.gold,
  },
  {
    key: "paid",
    label: "Paid amount",
    value: formatCompact(props.data?.summary.totalPaidAmount ?? 0),
    color: palette.sage,
  },
]);

const chartOption = computed<EChartsOption>(() => ({
  backgroundColor: "transparent",
  animationDuration: 420,
  tooltip: {
    trigger: "axis" as const,
    axisPointer: {
      type: "line" as const,
      lineStyle: {
        color: "rgba(26, 25, 23, 0.18)",
      },
    },
    backgroundColor: "rgba(26, 25, 23, 0.94)",
    borderWidth: 0,
    padding: 12,
    textStyle: { color: "#fff" },
  },
  grid: {
    left: 8,
    right: 14,
    top: 20,
    bottom: 14,
    containLabel: true,
  },
  xAxis: {
    type: "category" as const,
    boundaryGap: false,
    axisLine: { lineStyle: { color: palette.line } },
    axisTick: { show: false },
    axisLabel: {
      color: palette.muted,
      formatter: (value: string) => formatDateKey(value),
    },
    data: props.data?.trend.map((item) => item.date) || [],
  },
  yAxis: {
    type: "value" as const,
    axisLabel: {
      color: palette.muted,
      formatter: (value: number) => formatCompact(value),
    },
    splitLine: {
      lineStyle: {
        color: "rgba(195, 192, 180, 0.35)",
      },
    },
  },
  series: [
    {
      name: "Won revenue",
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      symbolSize: 8,
      itemStyle: { color: palette.ink },
      lineStyle: { width: 3, color: palette.ink },
      areaStyle: { color: "rgba(26, 25, 23, 0.08)" },
      data: props.data?.trend.map((item) => item.wonAmount) || [],
    },
    {
      name: "Order amount",
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      symbolSize: 7,
      itemStyle: { color: palette.gold },
      lineStyle: { width: 2, color: palette.gold, type: "dashed" as const },
      data: props.data?.trend.map((item) => item.orderAmount) || [],
    },
    {
      name: "Paid amount",
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      symbolSize: 7,
      itemStyle: { color: palette.sage },
      lineStyle: { width: 2, color: palette.sage },
      data: props.data?.trend.map((item) => item.paidAmount) || [],
    },
  ],
}));
</script>

<style scoped>
.trend-chart {
  display: grid;
  gap: 16px;
}

.legend-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.legend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  background: rgba(250, 249, 245, 0.84);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.legend-label {
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
  line-height: 1.1;
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
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 720px) {
  .legend-row {
    grid-template-columns: 1fr;
  }
}
</style>
