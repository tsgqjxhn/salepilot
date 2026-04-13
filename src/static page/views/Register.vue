<template>
  <div class="register-page">
    <section class="register-panel">
      <div class="register-copy">
        <p class="eyebrow">{{ text("产品介绍", "Why SalePilot") }}</p>
        <h1>{{ text("让销售团队少切换、多推进。", "Less switching, more closing.") }}</h1>
        <span class="intro">{{ text("客户推进、AI 洞察、团队协作和管理治理，一个工作区全部收拢。不再在表格、群聊和日报之间来回跳转。", "Customer execution, AI insight, team coordination, and governance — all in one workspace. No more jumping between spreadsheets, group chats, and daily reports.") }}</span>

        <article class="pitch-card">
          <div class="pitch-card__grid">
            <div v-for="item in pitchHighlights" :key="item.label" class="pitch-item">
              <span class="pitch-item__icon" v-html="item.icon" />
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.copy }}</p>
              </div>
            </div>
          </div>
        </article>

        <div class="trust-row">
          <div v-for="stat in trustStats" :key="stat.label" class="trust-stat">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </div>

        <div class="quote-card">
          <p class="quote-card__body">{{ text("以前客户信息散落在微信、Excel 和口头交接里，现在全在一个面板上，团队每个人看到的都是最新状态。", "Customer data used to be scattered across WeChat, spreadsheets, and verbal handoffs. Now it's all on one dashboard — everyone sees the latest state.") }}</p>
          <div class="quote-card__author">
            <span class="quote-card__avatar">陈</span>
            <div>
              <strong>{{ text("陈磊", "Chen Lei") }}</strong>
              <small>{{ text("某科技公司销售总监", "Sales Director at a tech company") }}</small>
            </div>
          </div>
        </div>

        <div class="feature-strip">
          <span v-for="feat in featureBadges" :key="feat" class="feature-badge">{{ feat }}</span>
        </div>
      </div>

      <form class="register-card" @submit.prevent="handleRegister">
        <div class="register-card__header">
          <div>
            <p class="eyebrow">{{ text("工作区设置", "Workspace setup") }}</p>
            <h2>{{ formTitle }}</h2>
          </div>
          <router-link to="/auth/login" class="register-link">{{ text("已有账号登录", "Have an account? Sign in") }}</router-link>
        </div>

        <div class="section-title">{{ text("工作区信息", "Workspace information") }}</div>
        <div class="form-rows">
          <label class="form-row">
            <span class="form-row__label">{{ text("公司名称", "Company name") }}</span>
            <div class="form-row__input">
              <input
                v-model.trim="companyname"
                type="text"
                :placeholder="text(mode === 'create' ? '请输入公司名称' : '请输入已有公司名称', mode === 'create' ? 'Enter company name' : 'Enter existing company name')"
              />
              <small v-if="errors.companyname">{{ errors.companyname }}</small>
            </div>
          </label>

          <label v-if="mode === 'join'" class="form-row">
            <span class="form-row__label">{{ text("公司 ID", "Company ID") }}</span>
            <div class="form-row__input">
              <input v-model.trim="companyPublicId" type="text" :placeholder="text('输入永久公司 ID', 'Enter the permanent company ID')" />
              <small v-if="errors.companyPublicId">{{ errors.companyPublicId }}</small>
            </div>
          </label>
        </div>

        <p class="section-hint">{{ workspaceHint }}</p>

        <div class="section-title">{{ text("账号信息", "Account information") }}</div>
        <div class="form-rows">
          <label class="form-row">
            <span class="form-row__label">{{ text("用户名", "Username") }}</span>
            <div class="form-row__input">
              <input v-model.trim="username" type="text" :placeholder="text('请输入用户名', 'Enter username')" />
              <small v-if="errors.username">{{ errors.username }}</small>
            </div>
          </label>

          <label class="form-row">
            <span class="form-row__label">{{ text("邮箱", "Email") }}</span>
            <div class="form-row__input">
              <input v-model.trim="email" type="email" :placeholder="text('请输入邮箱', 'Enter email')" />
              <small v-if="errors.email">{{ errors.email }}</small>
            </div>
          </label>

          <label class="form-row">
            <span class="form-row__label">{{ text("手机号", "Phone") }}</span>
            <div class="form-row__input">
              <div class="phone-field">
                <button type="button" class="phone-prefix" @click="showPrefixMenu = !showPrefixMenu">
                  {{ activePrefix.flag }} {{ activePrefix.code }}
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><polyline points="1,1 5,5 9,1" /></svg>
                </button>
                <div v-if="showPrefixMenu" class="prefix-menu">
                  <button v-for="item in countryPrefixes" :key="item.code" type="button" class="prefix-option" :class="{ 'prefix-option--active': phonePrefix === item.code }" @click="phonePrefix = item.code; showPrefixMenu = false">
                    <span>{{ item.flag }}</span>
                    <span>{{ item.name }}</span>
                    <span>{{ item.code }}</span>
                  </button>
                </div>
                <input v-model.trim="phone" type="tel" :placeholder="activePrefix.placeholder" @focus="showPrefixMenu = false" />
              </div>
              <small v-if="errors.phone">{{ errors.phone }}</small>
            </div>
          </label>

          <label class="form-row">
            <span class="form-row__label">{{ text("密码", "Password") }}</span>
            <div class="form-row__input">
              <div class="password-field">
                <input v-model="password" :type="showPassword ? 'text' : 'password'" :placeholder="text('请输入密码', 'Enter password')" />
                <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                  {{ showPassword ? text("隐藏", "Hide") : text("显示", "Show") }}
                </button>
              </div>
              <small v-if="errors.password">{{ errors.password }}</small>
            </div>
          </label>

          <label class="form-row">
            <span class="form-row__label">{{ text("确认密码", "Confirm password") }}</span>
            <div class="form-row__input">
              <div class="password-field">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="text('再次输入密码', 'Confirm your password')"
                />
                <button type="button" class="toggle-btn" @click="showConfirmPassword = !showConfirmPassword">
                  {{ showConfirmPassword ? text("隐藏", "Hide") : text("显示", "Show") }}
                </button>
              </div>
              <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
            </div>
          </label>
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>

        <button class="primary-btn" :disabled="submitLocked" type="submit">
          {{ isLoading ? text("提交中...", "Submitting...") : submitLabel }}
        </button>

        <div class="demo-stage">
          <transition name="demo-fade" mode="out-in">
            <!-- Phase 1: Table -->
            <div v-if="demoPhase === 0" key="table" class="demo-card">
              <p class="demo-label">{{ text("客户数据", "Customer data") }}</p>
              <div class="demo-table">
                <div class="demo-table__head">
                  <span>{{ text("客户", "Customer") }}</span>
                  <span>{{ text("状态", "Status") }}</span>
                  <span>{{ text("金额", "Amount") }}</span>
                </div>
                <div v-for="row in demoTableRows" :key="row.name" class="demo-table__row">
                  <span>{{ row.name }}</span>
                  <span class="demo-table__status" :class="'demo-table__status--' + row.status">{{ row.statusLabel }}</span>
                  <span>{{ row.amount }}</span>
                </div>
              </div>
            </div>

            <!-- Phase 2: Loading -->
            <div v-else-if="demoPhase === 1" key="loading" class="demo-card demo-card--loading">
              <div class="demo-spinner">
                <svg viewBox="0 0 40 40" class="demo-spinner__svg">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(96,171,255,0.15)" stroke-width="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(96,171,255,0.7)" stroke-width="3" stroke-linecap="round" stroke-dasharray="80" class="demo-spinner__arc" />
                </svg>
              </div>
              <p class="demo-loading-text">{{ text("正在生成分析...", "Generating analysis...") }}</p>
              <div class="demo-skeleton-row">
                <span class="demo-skeleton demo-skeleton--w60" />
                <span class="demo-skeleton demo-skeleton--w80" />
                <span class="demo-skeleton demo-skeleton--w40" />
              </div>
              <div class="demo-skeleton-row">
                <span class="demo-skeleton demo-skeleton--w50" />
                <span class="demo-skeleton demo-skeleton--w70" />
              </div>
            </div>

            <!-- Phase 3+: Charts cycling -->
            <div v-else-if="demoPhase === 2" :key="'chart-' + demoChartIndex" class="demo-card">
              <p class="demo-label">{{ demoCharts[demoChartIndex!]?.label }}</p>
              <svg viewBox="0 0 360 190" class="demo-chart-svg">
                <!-- Bar chart -->
                <template v-if="demoCharts[demoChartIndex!]?.type === 'bar'">
                  <g v-for="(bar, i) in demoCharts[demoChartIndex!].data" :key="i">
                    <rect :x="20 + i * 52" :y="178 - bar.v * 1.1" width="36" :height="bar.v * 1.1" rx="6" class="demo-bar" :style="{ animationDelay: i * 120 + 'ms' }" />
                    <text :x="38 + i * 52" y="186" text-anchor="middle" class="demo-chart-text">{{ bar.label }}</text>
                  </g>
                </template>
                <!-- Line chart -->
                <template v-if="demoCharts[demoChartIndex!]?.type === 'line'">
                  <defs>
                    <linearGradient id="demo-line-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(96,171,255,0.25)" />
                      <stop offset="100%" stop-color="rgba(96,171,255,0)" />
                    </linearGradient>
                  </defs>
                  <polyline :points="demoCharts[demoChartIndex!].line" fill="none" stroke="rgba(96,171,255,0.7)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="demo-line-path" />
                  <polygon :points="demoCharts[demoChartIndex!].area" fill="url(#demo-line-fill)" class="demo-area-path" />
                  <g v-for="(dot, i) in demoCharts[demoChartIndex!].dots" :key="i">
                    <circle :cx="dot[0]" :cy="dot[1]" r="3.5" fill="#fff" stroke="rgba(96,171,255,0.7)" stroke-width="2" class="demo-dot" :style="{ animationDelay: i * 100 + 'ms' }" />
                  </g>
                </template>
                <!-- Donut chart -->
                <template v-if="demoCharts[demoChartIndex!]?.type === 'donut'">
                  <circle cx="180" cy="90" r="52" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="18" />
                  <circle v-for="(seg, i) in demoCharts[demoChartIndex!].segments" :key="i"
                    cx="180" cy="90" r="52" fill="none"
                    :stroke="seg.color" stroke-width="18"
                    stroke-linecap="butt"
                    :stroke-dasharray="seg.dash"
                    :stroke-dashoffset="seg.offset"
                    class="demo-donut-seg"
                    :style="{ animationDelay: i * 200 + 'ms' }"
                  />
                  <text x="180" y="86" text-anchor="middle" class="demo-donut-value">{{ demoCharts[demoChartIndex!].center }}</text>
                  <text x="180" y="104" text-anchor="middle" class="demo-donut-label">{{ demoCharts[demoChartIndex!].subtitle }}</text>
                </template>
              </svg>
            </div>

            <!-- Phase 4: Summary text -->
            <div v-else key="summary" class="demo-card demo-card--summary">
              <svg viewBox="0 0 360 80" class="demo-summary-icon">
                <circle cx="180" cy="40" r="28" fill="none" stroke="rgba(76,175,80,0.2)" stroke-width="2" />
                <circle cx="180" cy="40" r="28" fill="none" stroke="rgba(76,175,80,0.6)" stroke-width="2" stroke-dasharray="176" class="demo-check-ring" />
                <polyline points="166,40 176,50 196,30" fill="none" stroke="rgba(76,175,80,0.8)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="demo-check-mark" />
              </svg>
              <strong class="demo-summary-title">{{ text("数据驱动的销售，从这里开始", "Data-driven sales starts here") }}</strong>
              <p class="demo-summary-copy">{{ text("从客户跟进到成交分析，AI 贯穿每一个关键节点。注册即可拥有完整的销售工作台，让团队的每一天都有数据支撑。", "From pipeline tracking to deal analysis, AI runs through every key moment. Sign up to get a complete sales workspace — data-backed, every single day.") }}</p>
            </div>
          </transition>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import request from "@/utils/request";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { pinia } from "@/stores/pinia";
import { useRouter } from "vue-router";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage } from "@/utils/requestError";
import { FRONTEND_ONLY_MODE, FRONTEND_ONLY_WORKSPACE_ROUTE } from "@/utils/frontendOnly";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { saveAccountSession } from "@/utils/savedAccounts";

defineOptions({ name: "UserRegister" });

const authStore = useAuthStore(pinia);
const uiStore = useUiStore(pinia);
const router = useRouter();
const { text } = useLocalizedText();

const companyname = ref("");
const companyPublicId = ref("");
const mode = ref<"create" | "join">("create");
const username = ref("");
const email = ref("");
const phone = ref("");
const phonePrefix = ref("+86");
const showPrefixMenu = ref(false);
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const countryPrefixes = [
  { code: "+86", flag: "\ud83c\udde8\ud83c\uddf3", name: text("中国大陆", "China"), regex: /^1[3-9]\d{9}$/, placeholder: text("请输入手机号", "Enter phone number") },
  { code: "+1", flag: "\ud83c\uddfa\ud83c\uddf8", name: text("美国 / 加拿大", "US / Canada"), regex: /^\d{10}$/, placeholder: text("10 位数字", "10-digit number") },
  { code: "+44", flag: "\ud83c\uddec\ud83c\udde7", name: text("英国", "UK"), regex: /^\d{10,11}$/, placeholder: text("输入手机号", "Enter phone number") },
  { code: "+81", flag: "\ud83c\uddef\ud83c\uddf5", name: text("日本", "Japan"), regex: /^\d{10,11}$/, placeholder: text("输入手机号", "Enter phone number") },
  { code: "+82", flag: "\ud83c\uddf0\ud83c\uddf7", name: text("韩国", "South Korea"), regex: /^\d{9,11}$/, placeholder: text("输入手机号", "Enter phone number") },
  { code: "+65", flag: "\ud83c\uddf8\ud83c\uddec", name: text("新加坡", "Singapore"), regex: /^\d{8}$/, placeholder: text("8 位数字", "8-digit number") },
  { code: "+852", flag: "\ud83c\udded\ud83c\uddf0", name: text("中国香港", "Hong Kong"), regex: /^\d{8}$/, placeholder: text("8 位数字", "8-digit number") },
  { code: "+886", flag: "\ud83c\uddf9\ud83c\uddfc", name: text("中国台湾", "Taiwan"), regex: /^\d{9,10}$/, placeholder: text("输入手机号", "Enter phone number") },
];

const activePrefix = computed(() => countryPrefixes.find((p) => p.code === phonePrefix.value) || countryPrefixes[0]);
const errors = ref({
  companyname: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  companyPublicId: "",
});
const error = ref("");
const isLoading = ref(false);
const submitGuard = useSubmitGuard();
const submitLocked = computed(() => isLoading.value || submitGuard.isBlocked.value);

/* ── Demo stage animation ───────────────────────────────────────────────── */
const demoPhase = ref(0);
const demoChartIndex = ref(0);
let demoTimer: ReturnType<typeof setTimeout> | null = null;

const demoTableRows = computed(() => [
  { name: text("星辰科技", "StarTech"), status: "active", statusLabel: text("跟进中", "Active"), amount: "¥128,000" },
  { name: text("瀚海传媒", "OceanMedia"), status: "pending", statusLabel: text("待定", "Pending"), amount: "¥86,400" },
  { name: text("云端智联", "CloudLink"), status: "won", statusLabel: text("已成交", "Won"), amount: "¥245,000" },
  { name: text("明峰工业", "BrightPeak"), status: "active", statusLabel: text("跟进中", "Active"), amount: "¥67,800" },
]);

const demoCharts = computed(() => [
  {
    label: text("月度成交趋势", "Monthly deal trend"),
    type: "line",
    line: "30,150 90,115 150,135 210,82 270,98 330,48",
    area: "30,150 90,115 150,135 210,82 270,98 330,48 330,185 30,185",
    dots: [[30, 150], [90, 115], [150, 135], [210, 82], [270, 98], [330, 48]],
  },
  {
    label: text("客户阶段分布", "Customer stage distribution"),
    type: "donut",
    center: "156",
    subtitle: text("总客户", "Total"),
    segments: [
      { color: "rgba(96,171,255,0.75)", dash: "98 229", offset: "0" },
      { color: "rgba(76,175,80,0.65)", dash: "72 255", offset: "-98" },
      { color: "rgba(255,183,77,0.7)", dash: "55 272", offset: "-170" },
      { color: "rgba(239,83,80,0.55)", dash: "36 291", offset: "-225" },
    ],
  },
  {
    label: text("团队成交排行", "Team deal ranking"),
    type: "bar",
    data: [
      { label: text("张伟", "Alex"), v: 110 },
      { label: text("李娜", "Nina"), v: 90 },
      { label: text("王磊", "Leo"), v: 72 },
      { label: text("赵敏", "Mia"), v: 55 },
      { label: text("陈静", "Jing"), v: 40 },
    ],
  },
  {
    label: text("季度营收走势", "Quarterly revenue"),
    type: "line",
    line: "30,140 100,110 170,125 240,70 310,88 340,35",
    area: "30,140 100,110 170,125 240,70 310,88 340,35 340,185 30,185",
    dots: [[30, 140], [100, 110], [170, 125], [240, 70], [310, 88], [340, 35]],
  },
]);

const runDemoSequence = () => {
  demoTimer = setTimeout(() => {
    demoPhase.value = 1;
    demoTimer = setTimeout(() => {
      demoPhase.value = 2;
      demoChartIndex.value = 0;
      const cycleChart = () => {
        demoTimer = setTimeout(() => {
          const next = demoChartIndex.value + 1;
          if (next < demoCharts.value.length) {
            demoChartIndex.value = next;
            cycleChart();
          } else {
            demoPhase.value = 3;
            demoTimer = setTimeout(() => {
              demoPhase.value = 0;
              runDemoSequence();
            }, 4000);
          }
        }, 3200);
      };
      cycleChart();
    }, 2200);
  }, 3000);
};

onMounted(() => {
  runDemoSequence();
});

onBeforeUnmount(() => {
  if (demoTimer !== null) clearTimeout(demoTimer);
});

watch(mode, (nextMode) => {
  error.value = "";
  errors.value.companyname = "";
  errors.value.companyPublicId = "";
  if (nextMode === "create") {
    companyPublicId.value = "";
  }
});

/* ── Marketing copy for left panel ────────────────────────────────────────── */
const pitchHighlights = computed(() => [
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    label: text("团队协同", "Team alignment"),
    copy: text("成员、经理、管理员三层角色在同一工作区里协作，不串台不漏看。", "Three role layers collaborate in one workspace — no crossed wires, no blind spots."),
  },
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    label: text("AI 驱动", "AI-powered"),
    copy: text("成交判断、流失预警、日报汇总——AI 直接嵌入销售流程，不是独立模块。", "Deal scoring, churn alerts, and daily reports are embedded in the sales flow — not a separate module."),
  },
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    label: text("看板与报表", "Dashboards"),
    copy: text("从个人客户跟进到团队整体态势，每个层级都有对应的可视化面板。", "From personal follow-ups to team-wide pipeline health — each role gets its own dashboard."),
  },
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    label: text("权限治理", "Governance"),
    copy: text("角色口令、访问边界和审批流程由管理员统一配置，安全可控。", "Role passcodes, access boundaries, and approval flows are centrally managed by admins."),
  },
]);

const trustStats = computed(() => [
  { value: text("< 2 分钟", "< 2 min"), label: text("注册到使用", "Setup time") },
  { value: text("3 层角色", "3 Roles"), label: text("内置权限", "Built-in RBAC") },
  { value: text("实时同步", "Realtime"), label: text("数据一致", "Data sync") },
]);

const featureBadges = computed(() => [
  text("客户跟进", "Pipeline"),
  text("AI 分析", "AI Insights"),
  text("团队看板", "Dashboards"),
  text("角色权限", "RBAC"),
  text("日报生成", "Reports"),
  text("标签管理", "Tags"),
]);

const formTitle = computed(() => mode.value === "create"
  ? text("完成基础信息后即可直接进入引导", "Complete the basics and go straight into onboarding")
  : text("先建账号，再准备公司验证和接入", "Create the account, then prepare verification and entry"));

const submitLabel = computed(() => mode.value === "create" ? text("创建工作区", "Create workspace") : text("创建账号并继续", "Create account and continue"));

const validateCompanyname = () => {
  if (!companyname.value && !companyPublicId.value && mode.value === "join") {
    errors.value.companyname = text("公司名称或公司 ID 必填其一", "Company name or company ID is required");
    return false;
  }
  if (!companyname.value && mode.value === "create") {
    errors.value.companyname = text("公司名称不能为空", "Company name is required");
    return false;
  }
  if (companyname.value && companyname.value.length < 5) {
    errors.value.companyname = text("公司名称至少 5 个字符", "Company name must be at least 5 characters");
    return false;
  }
  errors.value.companyname = "";
  return true;
};

const validateCompanyPublicId = () => {
  if (mode.value !== "join" || !companyPublicId.value) {
    errors.value.companyPublicId = "";
    return true;
  }
  if (!/^SP-[A-Z0-9]{9}$/i.test(companyPublicId.value)) {
    errors.value.companyPublicId = text("公司 ID 格式不正确", "Company ID format is invalid");
    return false;
  }
  errors.value.companyPublicId = "";
  return true;
};

const validateUsername = () => {
  if (!username.value) {
    errors.value.username = text("用户名不能为空", "Username is required");
    return false;
  }
  if (username.value.length < 2) {
    errors.value.username = text("用户名至少 2 个字符", "Username must be at least 2 characters");
    return false;
  }
  errors.value.username = "";
  return true;
};

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    errors.value.email = text("邮箱不能为空", "Email is required");
    return false;
  }
  if (!emailRegex.test(email.value)) {
    errors.value.email = text("请输入有效邮箱", "Please enter a valid email");
    return false;
  }
  errors.value.email = "";
  return true;
};

const validatePhone = () => {
  if (!phone.value) {
    errors.value.phone = text("手机号不能为空", "Phone number is required");
    return false;
  }
  const prefix = activePrefix.value;
  if (!prefix.regex.test(phone.value)) {
    errors.value.phone = text("手机号格式不正确", "Please enter a valid phone number");
    return false;
  }
  errors.value.phone = "";
  return true;
};

const validatePassword = () => {
  if (!password.value) {
    errors.value.password = text("密码不能为空", "Password is required");
    return false;
  }
  if (password.value.length < 9) {
    errors.value.password = text("密码至少 9 位", "Password must be at least 9 characters");
    return false;
  }
  if ((password.value.match(/\d/g) || []).length < 3) {
    errors.value.password = text("密码至少包含 3 个数字", "Password must contain at least 3 digits");
    return false;
  }
  if ((password.value.match(/[a-zA-Z]/g) || []).length < 3) {
    errors.value.password = text("密码至少包含 3 个字母", "Password must contain at least 3 letters");
    return false;
  }
  if ((password.value.match(/[^a-zA-Z0-9]/g) || []).length < 3) {
    errors.value.password = text("密码至少包含 3 个特殊字符", "Password must contain at least 3 special characters");
    return false;
  }
  errors.value.password = "";
  return true;
};

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = text("请再次确认密码", "Please confirm your password");
    return false;
  }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = text("两次输入的密码不一致", "Passwords do not match");
    return false;
  }
  errors.value.confirmPassword = "";
  return true;
};

const validateForm = () => (
  validateCompanyname()
  && validateCompanyPublicId()
  && validateUsername()
  && validateEmail()
  && validatePhone()
  && validatePassword()
  && validateConfirmPassword()
);

const handleRegister = async () => {
  error.value = "";
  if (FRONTEND_ONLY_MODE) {
    const sessionSeed = authStore.enableFrontendOnlySession({
      username: username.value,
      companyName: companyname.value || (mode.value === "create" ? "SalePilot Static Workspace" : "Joined Static Workspace"),
      email: email.value,
      phone: phone.value,
    });

    saveAccountSession({
      username: sessionSeed.user.username,
      companyName: sessionSeed.company.name,
      companyIdentityStatus: sessionSeed.user.companyIdentityStatus,
    });
    uiStore.schedulePostRegistrationOnboarding();
    notifyActionSuccess(
      text("已进入前端静态工作台。", "Entered the frontend-only static workspace."),
      { title: text("演示模式已启用", "Demo mode enabled") },
    );
    await router.push(FRONTEND_ONLY_WORKSPACE_ROUTE);
    return;
  }

  if (!validateForm()) {
    return;
  }

  await submitGuard.run(async () => {
    isLoading.value = true;
    try {
      const response = await request.post("/auth/register", {
        mode: mode.value,
        companyName: companyname.value,
        companyPublicId: companyPublicId.value || undefined,
        username: username.value,
        email: email.value,
        phone: `${phonePrefix.value}${phone.value}`,
        password: password.value,
      });

      authStore.setTokens(response.data.accessToken, response.data.refreshToken);
      authStore.setUserInfo(response.data.user, response.data.company, response.data.rbac);
      saveAccountSession({
        username: response.data.user.username,
        companyName: response.data.company.name,
        refreshToken: response.data.refreshToken,
        companyIdentityStatus: response.data.user.companyIdentityStatus,
      });
      uiStore.schedulePostRegistrationOnboarding();

      notifyActionSuccess(
        text(mode.value === "create" ? "工作区创建成功。" : "账号创建成功。", mode.value === "create" ? "Workspace created successfully." : "Account registered successfully."),
        { title: text("注册完成", "Registration complete") },
      );
    } catch (err: unknown) {
      error.value = getRequestErrorMessage(err, text("注册失败，请重试。", "Registration failed. Please try again."));
      notifyActionError(err, text("注册失败，请重试。", "Registration failed. Please try again."), {
        title: text("注册失败", "Registration failed"),
      });
    } finally {
      isLoading.value = false;
    }
  });
};
</script>

<style scoped>
.register-page { display: grid; }
.register-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.92fr);
  gap: 24px;
  align-items: stretch;
}
.register-copy,
.register-card {
  border-radius: 30px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
}
.register-copy {
  padding: 32px;
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(96, 171, 255, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 245, 238, 0.94) 100%);
}
.eyebrow,
.section-title {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.register-copy h1 {
  color: var(--text-primary);
  font-size: clamp(28px, 3.6vw, 42px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.intro,
.section-hint {
  color: var(--text-secondary);
  line-height: 1.8;
}
.register-link,
.primary-btn,
.toggle-btn {
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.register-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}
.register-card__header h2 {
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1.28;
  font-weight: 700;
}

/* ── Pitch card ────────────────────────────────────────────────────────── */
.pitch-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.74);
}
.pitch-card__grid {
  display: grid;
  gap: 18px;
}
.pitch-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.pitch-item__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(96, 171, 255, 0.1), rgba(35, 113, 196, 0.06));
  color: var(--accent-strong);
}
.pitch-item strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}
.pitch-item p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
  margin-top: 4px;
}

/* ── Trust stats ─────────────────────────────────────────────────────────── */
.trust-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.trust-stat {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  gap: 4px;
  text-align: center;
}
.trust-stat strong {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 700;
}
.trust-stat span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

/* ── Quote card ──────────────────────────────────────────────────────────── */
.quote-card {
  padding: 20px;
  border-radius: 24px;
  border: 1px solid var(--border-light);
  background: var(--surface-primary);
  display: grid;
  gap: 14px;
}
.quote-card__body {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.85;
  font-style: italic;
}
.quote-card__author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quote-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(96, 171, 255, 0.2), rgba(35, 113, 196, 0.1));
  color: var(--accent-strong);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
}
.quote-card__author strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}
.quote-card__author small {
  color: var(--text-tertiary);
  font-size: 12px;
}

/* ── Feature badges ──────────────────────────────────────────────────────── */
.feature-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.feature-badge {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}
.register-card {
  padding: 28px;
  display: grid;
  gap: 18px;
}
.register-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 999px;
  text-decoration: none;
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  font-weight: 700;
  white-space: nowrap;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.register-link:hover {
  border-color: var(--accent-primary);
  background: linear-gradient(135deg, rgba(96, 171, 255, 0.1), var(--surface-secondary));
  color: var(--accent-strong);
  transform: translateY(-1px);
}
/* ── Form rows (horizontal label + input) ────────────────────────────────── */
.form-rows {
  display: grid;
  gap: 12px;
}
.form-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 0;
  align-items: start;
  border-radius: var(--radius-lg, 16px);
  border: 1.5px solid var(--border-light);
  overflow: hidden;
  background: linear-gradient(135deg, var(--surface-white) 0%, var(--surface-primary) 100%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-row:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px var(--accent-glow, rgba(96, 171, 255, 0.15));
}
.form-row__label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 14px;
  min-height: 100%;
  background: linear-gradient(135deg, rgba(96, 171, 255, 0.06), rgba(35, 113, 196, 0.03));
  border-right: 1px solid var(--border-light);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-align: center;
  user-select: none;
}
.form-row__input {
  display: grid;
  gap: 0;
  padding: 0;
}
.form-row__input input {
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  letter-spacing: 0.01em;
  outline: none;
}
.form-row__input input::placeholder {
  color: var(--text-quaternary);
  font-weight: 500;
}
.form-row__input small {
  padding: 4px 16px 10px;
  color: rgb(214, 78, 78);
  font-size: 12px;
}
.password-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

/* ── Phone prefix selector ─────────────────────────────────────────────── */
.phone-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0;
  position: relative;
}
.phone-prefix {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 0;
  border: none;
  border-right: 1px solid var(--border-light);
  background:
    linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-primary) 100%);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}
.phone-prefix:hover {
  background: linear-gradient(135deg, rgba(96, 171, 255, 0.08), var(--surface-secondary));
}
.phone-prefix svg {
  opacity: 0.5;
}
.phone-field input {
  border-radius: 0 !important;
}
.prefix-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 200px;
  max-height: 240px;
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  z-index: 30;
  padding: 6px;
}
.prefix-option {
  width: 100%;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}
.prefix-option:hover {
  background: var(--surface-secondary);
}
.prefix-option--active {
  background: rgba(96, 171, 255, 0.08);
  font-weight: 700;
}
.prefix-option span:nth-child(3) {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
}
.toggle-btn {
  padding: 0 14px;
  border-radius: var(--radius-lg, 16px);
  border: 1px solid var(--border-light);
  background:
    linear-gradient(135deg, var(--surface-white) 0%, var(--surface-primary) 100%);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
.toggle-btn:hover {
  border-color: var(--border-default);
  background:
    linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-primary) 100%);
  box-shadow: var(--shadow-sm);
}
.password-panel {
  display: grid;
  gap: 12px;
  background: var(--surface-primary);
}
.password-rules { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.password-rules__item {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-secondary);
  text-align: center;
}
.password-rules__item--active {
  border-color: rgba(76, 126, 86, 0.24);
  background: rgba(76, 126, 86, 0.12);
  color: var(--text-primary);
}
.after-panel {
  display: grid;
  gap: 10px;
}
.after-panel ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  color: var(--text-secondary);
  line-height: 1.75;
}
.primary-btn {
  padding: 13px 18px;
  border-radius: 999px;
  border: none;
  background: #1a2b42;
  color: var(--surface-white);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}
.primary-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #1d5fa0, #2371c4);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(35, 113, 196, 0.28);
}
.primary-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.error-text {
  color: rgb(214, 78, 78);
  font-size: 13px;
}
@media (max-width: 1120px) {
  .register-panel { grid-template-columns: 1fr; }
}
@media (max-width: 820px) {
  .form-row { grid-template-columns: 90px minmax(0, 1fr); }
  .trust-row { grid-template-columns: 1fr; }
  .register-copy,
  .register-card { padding: 24px; }
  .register-card__header { flex-direction: column; }
}
@media (max-width: 560px) {
  .form-row { grid-template-columns: 1fr; }
  .form-row__label { justify-content: flex-start; padding: 10px 14px; border-right: none; border-bottom: 1px solid var(--border-light); }
  .password-field { grid-template-columns: 1fr; }
  .toggle-btn { min-height: 44px; }
  .pitch-card__grid { gap: 14px; }
}

/* ── Demo stage ──────────────────────────────────────────────────────────── */
.demo-stage {
  border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface-primary);
  overflow: hidden;
  height: 280px;
  position: relative;
}
.demo-card {
  padding: 18px;
  display: grid;
  gap: 14px;
  position: absolute;
  inset: 0;
}
.demo-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Transition */
.demo-fade-enter-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.demo-fade-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.demo-fade-enter-from { opacity: 0; transform: translateY(12px); }
.demo-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* Table */
.demo-table {
  display: grid;
  gap: 2px;
}
.demo-table__head {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(96, 171, 255, 0.08);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.demo-table__row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  animation: demo-row-in 0.4s ease both;
}
.demo-table__row:nth-child(2) { animation-delay: 0.08s; }
.demo-table__row:nth-child(3) { animation-delay: 0.16s; }
.demo-table__row:nth-child(4) { animation-delay: 0.24s; }
.demo-table__row:nth-child(5) { animation-delay: 0.32s; }
.demo-table__status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.demo-table__status--active {
  background: rgba(96, 171, 255, 0.12);
  color: rgba(35, 113, 196, 0.85);
}
.demo-table__status--pending {
  background: rgba(255, 183, 77, 0.15);
  color: rgba(180, 130, 20, 0.85);
}
.demo-table__status--won {
  background: rgba(76, 175, 80, 0.12);
  color: rgba(56, 142, 60, 0.85);
}
@keyframes demo-row-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Loading */
.demo-card--loading {
  place-items: center;
}
.demo-spinner {
  width: 44px;
  height: 44px;
}
.demo-spinner__svg {
  width: 100%;
  height: 100%;
  animation: demo-spin 1.2s linear infinite;
}
.demo-spinner__arc {
  animation: demo-spin-dash 1.5s ease-in-out infinite;
}
.demo-loading-text {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}
.demo-skeleton-row {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 280px;
}
.demo-skeleton {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg, rgba(96, 171, 255, 0.08) 25%, rgba(96, 171, 255, 0.18) 50%, rgba(96, 171, 255, 0.08) 75%);
  background-size: 200% 100%;
  animation: demo-shimmer 1.6s ease infinite;
}
.demo-skeleton--w60 { flex: 0 0 60px; }
.demo-skeleton--w80 { flex: 0 0 80px; }
.demo-skeleton--w40 { flex: 0 0 40px; }
.demo-skeleton--w50 { flex: 0 0 50px; }
.demo-skeleton--w70 { flex: 0 0 70px; }
@keyframes demo-spin {
  to { transform: rotate(360deg); }
}
@keyframes demo-spin-dash {
  0% { stroke-dasharray: 1, 80; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 40, 80; stroke-dashoffset: -20; }
  100% { stroke-dasharray: 1, 80; stroke-dashoffset: -80; }
}
@keyframes demo-shimmer {
  to { background-position: -200% 0; }
}

/* Charts */
.demo-chart-svg {
  width: 100%;
  height: auto;
}
.demo-bar {
  fill: rgba(96, 171, 255, 0.55);
  animation: demo-bar-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.demo-chart-text {
  fill: var(--text-secondary);
  font-size: 9px;
  font-weight: 600;
}
@keyframes demo-bar-grow {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); transform-origin: bottom; }
}

.demo-line-path {
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: demo-draw-line 1.2s ease forwards;
}
.demo-area-path {
  opacity: 0;
  animation: demo-fade-in 0.6s ease 0.8s forwards;
}
.demo-dot {
  opacity: 0;
  animation: demo-fade-in 0.35s ease both;
}
@keyframes demo-draw-line {
  to { stroke-dashoffset: 0; }
}
@keyframes demo-fade-in {
  to { opacity: 1; }
}

.demo-donut-seg {
  opacity: 0;
  animation: demo-donut-in 0.5s ease both;
}
.demo-donut-value {
  fill: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
}
.demo-donut-label {
  fill: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
}
@keyframes demo-donut-in {
  from { opacity: 0; stroke-width: 0; }
  to { opacity: 1; stroke-width: 18; }
}

/* ── Summary phase ──────────────────────────────────────────────────────── */
.demo-card--summary {
  place-items: center;
  text-align: center;
  padding: 24px 28px;
}
.demo-summary-icon {
  width: 64px;
  height: auto;
}
.demo-check-ring {
  stroke-dasharray: 176;
  stroke-dashoffset: 176;
  animation: demo-draw-ring 0.8s ease 0.2s forwards;
}
.demo-check-mark {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: demo-draw-line 0.4s ease 0.8s forwards;
}
.demo-summary-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}
.demo-summary-copy {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}
@keyframes demo-draw-ring {
  to { stroke-dashoffset: 0; }
}
@keyframes demo-draw-line {
  to { stroke-dashoffset: 0; }
}
</style>
