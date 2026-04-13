<template>
  <div class="workspace-page">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">{{ text("静态工作台", "Static workspace") }}</p>
        <h1>
          {{
            text(
              "当前是纯前端演示模式，登录和注册都会直接进入这个工作台。",
              "This is the frontend-only demo mode. Login and registration both land here directly.",
            )
          }}
        </h1>
        <p class="hero-description">
          {{
            text(
              "这里不依赖后端身份校验或接口返回，页面只用 Vue、Element Plus 和 ECharts 组织一个可演示的工作台外观。",
              "This page does not depend on backend auth or API responses. It uses Vue, Element Plus, and ECharts to present a static workspace shell.",
            )
          }}
        </p>

        <div class="hero-actions">
          <router-link to="/home" class="secondary-link">{{
            text("返回首页", "Back to home")
          }}</router-link>
          <router-link to="/pricing" class="secondary-link">{{
            text("查看定价页", "View pricing")
          }}</router-link>
        </div>
      </div>

      <div class="hero-state">
        <div class="state-chip">
          <span>{{ text("运行模式", "Mode") }}</span>
          <strong>{{ text("Frontend Only", "Frontend Only") }}</strong>
        </div>
        <div class="state-chip">
          <span>{{ text("默认入口", "Default entry") }}</span>
          <strong>{{ text("Static Workspace", "Static Workspace") }}</strong>
        </div>
        <div class="state-chip">
          <span>{{ text("后端依赖", "Backend dependency") }}</span>
          <strong>{{ text("已关闭", "Disabled") }}</strong>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <article
        v-for="metric in topMetrics"
        :key="metric.label"
        class="metric-card"
      >
        <p>{{ metric.label }}</p>
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.copy }}</span>
      </article>
    </section>

    <section class="chart-grid">
      <article class="chart-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ text("趋势", "Trend") }}</p>
            <strong>{{ text("本周销售节奏", "Weekly sales rhythm") }}</strong>
          </div>
          <el-tag type="info" effect="light">{{
            text("静态数据", "Static data")
          }}</el-tag>
        </div>
        <EChartCanvas :option="trendOption" :height="320" />
      </article>

      <article class="chart-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ text("漏斗", "Pipeline") }}</p>
            <strong>{{
              text("线索推进阶段", "Lead progression stages")
            }}</strong>
          </div>
          <el-tag type="success" effect="light">{{
            text("ECharts", "ECharts")
          }}</el-tag>
        </div>
        <EChartCanvas :option="funnelOption" :height="320" />
      </article>
    </section>

    <section class="content-grid">
      <article class="panel-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ text("今日任务", "Today queue") }}</p>
            <strong>{{ text("销售动作清单", "Sales action queue") }}</strong>
          </div>
          <el-tag type="warning" effect="light">{{
            text("Element Plus", "Element Plus")
          }}</el-tag>
        </div>

        <div class="task-list">
          <article v-for="task in tasks" :key="task.title" class="task-card">
            <div class="task-card__head">
              <strong>{{ task.title }}</strong>
              <el-tag :type="task.tagType" effect="light">{{
                task.status
              }}</el-tag>
            </div>
            <p>{{ task.copy }}</p>
            <div class="task-card__meta">
              <span>{{ task.owner }}</span>
              <span>{{ task.deadline }}</span>
            </div>
          </article>
        </div>
      </article>

      <article class="panel-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ text("进度", "Progress") }}</p>
            <strong>{{
              text("演示模块覆盖率", "Demo module coverage")
            }}</strong>
          </div>
          <el-tag type="primary" effect="light">{{
            text("No API", "No API")
          }}</el-tag>
        </div>

        <div class="progress-stack">
          <div
            v-for="item in progressItems"
            :key="item.label"
            class="progress-row"
          >
            <div class="progress-row__copy">
              <strong>{{ item.label }}</strong>
              <span>{{ item.copy }}</span>
            </div>
            <el-progress
              :percentage="item.value"
              :stroke-width="10"
              :show-text="false"
            />
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EChartsOption } from "echarts";
import EChartCanvas from "@/components/charts/EChartCanvas.vue";
import { useLocalizedText } from "@/composables/useLocalizedText";

defineOptions({
  name: "StaticWorkbench",
});

const { text } = useLocalizedText();

const topMetrics = computed(() => [
  {
    label: text("当前角色", "Current role"),
    value: text("管理员", "Administrator"),
    copy: text(
      "静态模式默认授予完整前端演示权限。",
      "Static mode grants a full front-end demo role by default.",
    ),
  },
  {
    label: text("工作区状态", "Workspace state"),
    value: text("已就绪", "Ready"),
    copy: text(
      "点击登录或注册后会直接进入这里。",
      "Clicking login or register routes directly here.",
    ),
  },
  {
    label: text("图表支持", "Chart support"),
    value: "ECharts",
    copy: text(
      "趋势图和阶段图都在前端本地渲染。",
      "Trend and stage charts are rendered locally in the client.",
    ),
  },
  {
    label: text("UI 组件", "UI layer"),
    value: "Element Plus",
    copy: text(
      "标签、进度条和交互容器保留组件库外观。",
      "Tags, progress bars, and containers still use the component library.",
    ),
  },
]);

const tasks = computed(() => [
  {
    title: text("整理重点客户清单", "Review the priority account list"),
    copy: text(
      "把今天要推进的客户动作整理成同一批次，避免在多个页面之间来回跳转。",
      "Group today’s high-priority customer actions into one batch instead of scattering them across multiple surfaces.",
    ),
    owner: text("负责人：Demo Admin", "Owner: Demo Admin"),
    deadline: text("今日 17:30", "Today 17:30"),
    status: text("进行中", "In progress"),
    tagType: "warning" as const,
  },
  {
    title: text("复核跟进节奏", "Review follow-up cadence"),
    copy: text(
      "检查今天计划中的提醒、复访和推进动作，确认节奏是否连续。",
      "Review reminders, revisit tasks, and next actions to keep the cadence continuous.",
    ),
    owner: text("负责人：Manager View", "Owner: Manager View"),
    deadline: text("今日 19:00", "Today 19:00"),
    status: text("待处理", "Queued"),
    tagType: "info" as const,
  },
  {
    title: text("生成销售日报展示", "Prepare the sales report demo"),
    copy: text(
      "这个面板是纯前端模式，所以日报与图表都用静态示例数据演示。",
      "This panel runs in frontend-only mode, so the report and charts use static example data.",
    ),
    owner: text("负责人：Static Workspace", "Owner: Static Workspace"),
    deadline: text("今日 21:00", "Today 21:00"),
    status: text("已安排", "Scheduled"),
    tagType: "success" as const,
  },
]);

const progressItems = computed(() => [
  {
    label: text("首页与访客入口", "Home and guest entry"),
    copy: text(
      "首页、登录、注册都已归入静态前端展示流。",
      "Home, login, and registration now live in the static front-end presentation flow.",
    ),
    value: 100,
  },
  {
    label: text("工作台壳层", "Workspace shell"),
    copy: text(
      "通过静态工作台兜底，避免进入依赖后端的业务页。",
      "The static workspace acts as the safe authenticated landing page without backend dependencies.",
    ),
    value: 92,
  },
  {
    label: text("图表与可视化", "Charts and visualization"),
    copy: text(
      "ECharts 继续可用，用于演示趋势和漏斗结构。",
      "ECharts remains available for trend and funnel demos.",
    ),
    value: 88,
  },
]);

const trendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: "axis" },
  grid: { left: 18, right: 18, top: 22, bottom: 20, containLabel: true },
  xAxis: {
    type: "category",
    data: [
      text("周一", "Mon"),
      text("周二", "Tue"),
      text("周三", "Wed"),
      text("周四", "Thu"),
      text("周五", "Fri"),
      text("周六", "Sat"),
      text("周日", "Sun"),
    ],
    axisLine: { lineStyle: { color: "rgba(142, 127, 109, 0.34)" } },
    axisLabel: { color: "rgb(95, 83, 69)" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    splitLine: { lineStyle: { color: "rgba(191, 181, 167, 0.22)" } },
    axisLabel: { color: "rgb(95, 83, 69)" },
  },
  series: [
    {
      type: "line",
      smooth: true,
      data: [18, 26, 22, 34, 39, 31, 43],
      lineStyle: { color: "rgb(35, 113, 196)", width: 3 },
      areaStyle: { color: "rgba(35, 113, 196, 0.14)" },
      symbolSize: 8,
      itemStyle: { color: "rgb(20, 72, 133)" },
    },
  ],
}));

const funnelOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: "item" },
  legend: {
    bottom: 0,
    textStyle: { color: "rgb(95, 83, 69)" },
  },
  series: [
    {
      type: "funnel",
      left: "10%",
      top: 12,
      bottom: 48,
      width: "80%",
      min: 0,
      max: 100,
      sort: "descending",
      gap: 4,
      label: {
        show: true,
        color: "rgb(32, 28, 23)",
      },
      itemStyle: {
        borderColor: "#fff",
        borderWidth: 2,
      },
      data: [
        { value: 96, name: text("新线索", "New leads") },
        { value: 72, name: text("首次沟通", "First contact") },
        { value: 51, name: text("需求确认", "Qualified") },
        { value: 28, name: text("方案推进", "Proposal") },
        { value: 16, name: text("成交阶段", "Closing") },
      ],
    },
  ],
}));
</script>

<style scoped>
/* ── Page shell ── */
.workspace-page {
  display: grid;
  gap: 24px;
  animation: sp-fade-in 0.4s ease both;
}

/* ── Shared card surface ── */
.hero-card,
.metric-card,
.chart-card,
.panel-card {
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  transition:
    box-shadow var(--transition-base),
    border-color var(--transition-base),
    transform var(--transition-base);
}

/* ── Hero card — mesh gradient ── */
.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 20px;
  padding: 28px;
  background: var(--gradient-mesh), var(--surface-white);
  border-color: var(--border-light);
  animation: sp-scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hero-card:hover {
  box-shadow: var(--shadow-elevated);
}

/* ── Eyebrow label ── */
.eyebrow {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── Hero copy block ── */
.hero-copy {
  display: grid;
  gap: 14px;
}

.hero-copy h1 {
  color: var(--text-primary);
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.hero-description,
.metric-card span,
.task-card p,
.progress-row__copy span {
  color: var(--text-secondary);
  line-height: 1.8;
}

/* ── Hero actions ── */
.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: var(--surface-glass);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.secondary-link:hover {
  border-color: var(--border-default);
  background: var(--surface-white);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

/* ── State chips — frosted glass ── */
.hero-state {
  display: grid;
  gap: 12px;
}

.state-chip {
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--surface-glass);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  display: grid;
  gap: 8px;
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.state-chip:hover {
  border-color: var(--border-accent);
  background: var(--surface-glass-strong);
  box-shadow:
    0 0 0 1px var(--border-accent),
    var(--shadow-sm);
}

.state-chip span,
.metric-card p {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.state-chip strong,
.metric-card strong,
.section-head strong,
.task-card__head strong,
.progress-row__copy strong {
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* ── Grids ── */
.metric-grid,
.chart-grid,
.content-grid {
  display: grid;
  gap: 18px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  animation: sp-slide-up 0.5s ease both;
  animation-delay: 0.08s;
}

.chart-grid,
.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* ── Metric cards — hover lift ── */
.metric-card {
  padding: 20px;
  display: grid;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.metric-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--gradient-shine);
  opacity: 0;
  transform: translateX(-120%);
  transition:
    transform 600ms ease,
    opacity 400ms ease;
  pointer-events: none;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.metric-card:hover::after {
  opacity: 1;
  transform: translateX(120%);
}

/* ── Chart & panel cards ── */
.chart-card,
.panel-card {
  padding: 22px;
  display: grid;
  gap: 16px;
}

.chart-card {
  animation: sp-slide-up 0.5s ease both;
  animation-delay: 0.15s;
}

.chart-card:hover,
.panel-card:hover {
  box-shadow: var(--shadow-soft);
  border-color: var(--border-default);
}

/* ── Section heads — visual hierarchy ── */
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-light);
}

.section-head .eyebrow {
  margin-bottom: 2px;
}

.section-head strong {
  font-size: 18px;
}

/* ── Task list ── */
.task-list,
.progress-stack {
  display: grid;
  gap: 14px;
}

.task-card {
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--surface-glass-weak);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  display: grid;
  gap: 10px;
  transition:
    background var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-base);
}

.task-card:hover {
  transform: translateY(-1px);
  border-color: var(--border-accent);
  background: var(--surface-glass);
  box-shadow: var(--shadow-sm);
}

.task-card__head,
.task-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.task-card__meta {
  color: var(--text-tertiary);
  font-size: 13px;
}

/* ── Progress bars — accent gradient ── */
.progress-row {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.progress-row:hover {
  background: var(--surface-glass-weak);
  border-color: var(--border-light);
}

.progress-row__copy {
  display: grid;
  gap: 4px;
}

.progress-row :deep(.el-progress-bar__outer) {
  border-radius: var(--radius-full);
  background: var(--surface-tertiary);
}

.progress-row :deep(.el-progress-bar__inner) {
  background: var(--accent-gradient) !important;
  border-radius: var(--radius-full);
  transition: width var(--transition-smooth);
}

/* ── Responsive ── */
@media (max-width: 1080px) {
  .metric-grid,
  .chart-grid,
  .content-grid,
  .hero-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-card,
  .chart-card,
  .panel-card,
  .metric-card {
    padding: 20px;
  }

  .section-head {
    flex-direction: column;
  }

  .hero-card {
    background: var(--surface-white);
  }
}
</style>
