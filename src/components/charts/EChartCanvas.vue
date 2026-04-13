<template>
  <div ref="chartRootRef" class="chart-canvas" :style="{ height: resolvedHeight }"></div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BarChart, FunnelChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

echarts.use([BarChart, FunnelChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

defineOptions({
  name: "EChartCanvas",
});

const props = withDefaults(
  defineProps<{
    option: EChartsOption;
    height?: number | string;
    loading?: boolean;
  }>(),
  {
    height: 320,
    loading: false,
  },
);

const chartRootRef = ref<HTMLDivElement | null>(null);
const resolvedHeight = computed(() => (typeof props.height === "number" ? `${props.height}px` : props.height));

let chartInstance: ReturnType<typeof echarts.init> | null = null;
let resizeObserver: ResizeObserver | null = null;

const ensureChart = async () => {
  await nextTick();
  if (!chartRootRef.value) return null;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
  }

  return chartInstance;
};

const renderChart = async () => {
  const chart = await ensureChart();
  if (!chart) return;

  chart.setOption(props.option, true);

  if (props.loading) {
    chart.showLoading("default", {
      text: "Loading chart...",
      color: "rgb(26, 25, 23)",
      textColor: "rgb(88, 86, 80)",
      maskColor: "rgba(250, 249, 245, 0.72)",
    });
  } else {
    chart.hideLoading();
  }

  chart.resize();
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(async () => {
  await renderChart();

  if (typeof ResizeObserver !== "undefined" && chartRootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(chartRootRef.value);
  }

  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});

watch(
  () => props.option,
  () => {
    void renderChart();
  },
  { deep: true },
);

watch(
  () => props.loading,
  () => {
    void renderChart();
  },
);
</script>

<style scoped>
.chart-canvas {
  width: 100%;
  min-height: 240px;
}
</style>
