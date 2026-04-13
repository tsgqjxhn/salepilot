<template>
  <div class="auth-page">
    <section class="auth-panel" :class="{ 'auth-panel--split': showVisual }">
        <div class="auth-visual">
        <div class="visual-header">
          <p class="visual-eyebrow">{{ text("产品预览", "Product preview") }}</p>
          <h1>{{ text("销售工作区，一个面板全部搞定。", "One workspace for the entire sales flow.") }}</h1>
          <span class="visual-intro">{{ text("客户推进、AI 分析、团队协作——所有销售动作在一个面板里运转。", "Pipeline, AI insights, and team coordination — all running inside one surface.") }}</span>
        </div>

        <div class="visual-stage">
          <transition name="v-fade" mode="out-in">
            <!-- Phase 0: Workflow timeline -->
            <div v-if="visualPhase === 0" key="v-timeline" class="visual-card">
              <p class="visual-label">{{ text("今日工作流", "Today's workflow") }}</p>
              <div class="v-timeline">
                <div v-for="(step, i) in timelineSteps" :key="step.title" class="v-timeline__item" :style="{ animationDelay: i * 140 + 'ms' }">
                  <span class="v-timeline__dot" :class="{ 'v-timeline__dot--active': i === 1 }"></span>
                  <div class="v-timeline__body">
                    <strong>{{ step.title }}</strong>
                    <span>{{ step.time }}</span>
                  </div>
                  <span class="v-timeline__tag" :class="'v-timeline__tag--' + step.type">{{ step.tag }}</span>
                </div>
              </div>
            </div>
            <!-- Phase 1: Loading -->
            <div v-else-if="visualPhase === 1" key="v-load" class="visual-card visual-card--center">
              <div class="v-spinner">
                <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(96,171,255,0.12)" stroke-width="3"/><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(96,171,255,0.65)" stroke-width="3" stroke-linecap="round" stroke-dasharray="80" class="v-spinner__arc"/></svg>
              </div>
              <p class="v-loading-text">{{ text("正在恢复工作区...", "Restoring workspace...") }}</p>
            </div>
            <!-- Phase 2: Stat cards cycling -->
            <div v-else-if="visualPhase === 2" :key="'vs-' + visualChartIdx" class="visual-card">
              <p class="visual-label">{{ visualStatCards[visualChartIdx]?.label }}</p>
              <div class="v-stat-grid">
                <div v-for="(metric, i) in visualStatCards[visualChartIdx]?.items" :key="i" class="v-stat-card" :style="{ animationDelay: i * 120 + 'ms' }">
                  <strong>{{ metric.value }}</strong>
                  <span>{{ metric.name }}</span>
                  <div class="v-stat-bar">
                    <div class="v-stat-bar__fill" :style="{ width: metric.pct + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Phase 3: Summary -->
            <div v-else key="v-sum" class="visual-card visual-card--center">
              <svg viewBox="0 0 48 48" class="v-check-svg">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(76,175,80,0.2)" stroke-width="2"/>
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(76,175,80,0.6)" stroke-width="2" stroke-dasharray="126" class="v-check-ring"/>
                <polyline points="14,24 22,32 36,16" fill="none" stroke="rgba(76,175,80,0.8)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="v-check-tick"/>
              </svg>
              <strong class="v-sum-title">{{ text("用数据接管你的销售节奏", "Let data run your sales rhythm") }}</strong>
              <p class="v-sum-copy">{{ text("客户状态实时可见、AI 在关键节点自动判断、团队协同不再依赖群聊。登录回到工作区，继续推进你的销售。", "Real-time pipeline visibility, AI judgment at every key moment, and team coordination without the chat noise. Sign in and pick up where you left off.") }}</p>
            </div>
          </transition>
        </div>

        <div class="visual-trust">
          <div v-for="s in visualTrustStats" :key="s.label" class="visual-trust__item">
            <strong>{{ s.value }}</strong>
            <span>{{ s.label }}</span>
          </div>
        </div>
        </div>

      <form class="auth-card" @submit.prevent="handleLogin">
        <div class="auth-card__header">
          <div>
            <p class="auth-card__eyebrow">
              {{ text("账户入口", "Account access") }}
            </p>
            <h2>
              {{
                text("登录到销售工作区", "Sign in to your sales workspace")
              }}
            </h2>
          </div>

          <router-link to="/auth/register" class="auth-card__switch">{{
            text("创建工作区", "Create workspace")
          }}</router-link>
        </div>

        <div v-if="localizedSessionNotice" class="session-banner">
          <p class="session-banner__eyebrow">
            {{ localizedSessionNotice.title }}
          </p>
          <p class="session-banner__message">
            {{ localizedSessionNotice.message }}
          </p>
          <p
            v-if="localizedSessionNotice.redirectTo"
            class="session-banner__target"
          >
            {{ text("登录后将返回", "After login you will return to") }}
            <strong>{{ localizedSessionNotice.redirectTo }}</strong>
          </p>
        </div>

        <label class="form-row">
          <span class="form-row__label">{{ text("用户名", "Username") }}</span>
          <div class="form-row__input">
            <input
              v-model.trim="username"
              type="text"
              :placeholder="text('请输入用户名', 'Enter username')"
              :class="{ 'input-error': errors.username }"
              @blur="validateUsername"
            />
            <small v-if="errors.username">{{ errors.username }}</small>
          </div>
        </label>

        <label class="form-row">
          <span class="form-row__label">{{ text("密码", "Password") }}</span>
          <div class="form-row__input">
            <div class="password-field">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="text('请输入密码', 'Enter password')"
                :class="{ 'input-error': errors.password }"
                @blur="validatePassword"
              />
              <button
                type="button"
                class="toggle-btn"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? text("隐藏", "Hide") : text("显示", "Show") }}
              </button>
            </div>
            <small v-if="errors.password">{{ errors.password }}</small>
          </div>
        </label>

        <button class="primary-btn" :disabled="submitLocked" type="submit">
          {{
            loading
              ? text("登录中...", "Signing in...")
              : text("登录", "Log in")
          }}
        </button>

        <p v-if="loginError" class="error-text">{{ loginError }}</p>

        <div class="divider-row">
          <span class="divider-line"></span>
          <span class="divider-label">{{ text("或通过以下方式继续", "Or continue with") }}</span>
          <span class="divider-line"></span>
        </div>

        <div class="social-row">
          <button type="button" class="social-btn" title="GitHub">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>GitHub</span>
          </button>
          <button type="button" class="social-btn" title="Google">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>Google</span>
          </button>
          <button type="button" class="social-btn" title="Microsoft">
            <svg viewBox="0 0 24 24" width="20" height="20"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
            <span>Microsoft</span>
          </button>
        </div>

        <div class="auth-card__footer">
          <p>
            {{ text("还没有工作区？", "No workspace yet?") }}
            <router-link to="/auth/register">{{
              text("注册并创建", "Sign up and create one")
            }}</router-link>
          </p>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import request from "@/utils/request";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores/pinia";
import { useRoute, useRouter } from "vue-router";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage } from "@/utils/requestError";
import {
  clearAuthSessionNotice,
  consumeAuthSessionNotice,
  createAuthSessionNotice,
  sanitizeRedirectPath,
  type AuthSessionNotice,
} from "@/utils/authSession";
import {
  FRONTEND_ONLY_MODE,
  FRONTEND_ONLY_WORKSPACE_ROUTE,
} from "@/utils/frontendOnly";
import { useLocalizedText } from "@/composables/useLocalizedText";
import {
  loadSavedAccounts,
  saveAccountSession,
  type SavedAccount,
} from "@/utils/savedAccounts";

defineOptions({ name: "UserLogin" });

const authStore = useAuthStore(pinia);
const router = useRouter();
const route = useRoute();
const { text, language } = useLocalizedText();

/* ── Split reveal ───────────────────────────────────────────────────────── */
const showVisual = ref(false);
let splitTimer: ReturnType<typeof setTimeout> | null = null;

/* ── Visual animation ─────────────────────────────────────────────────────── */
const visualPhase = ref(0);
const visualChartIdx = ref(0);
let visualTimer: ReturnType<typeof setTimeout> | null = null;

const timelineSteps = computed(() => [
  { title: text("星辰科技 初次沟通", "StarTech — first call"), time: text("09:15", "9:15 AM"), type: "done", tag: text("已完成", "Done") },
  { title: text("瀚海传媒 方案演示", "OceanMedia — demo"), time: text("10:30", "10:30 AM"), type: "active", tag: text("进行中", "Active") },
  { title: text("云端智联 合同签署", "CloudLink — contract"), time: text("14:00", "2:00 PM"), type: "pending", tag: text("待处理", "Pending") },
  { title: text("AI 日报自动生成", "AI daily report"), time: text("18:00", "6:00 PM"), type: "pending", tag: text("待处理", "Pending") },
]);

const visualStatCards = computed(() => [
  {
    label: text("本周客户动态", "This week's pipeline"),
    items: [
      { value: "12", name: text("新增线索", "New leads"), pct: 75 },
      { value: "8", name: text("跟进中", "In progress"), pct: 50 },
      { value: "5", name: text("已成交", "Closed won"), pct: 90 },
      { value: "3", name: text("流失预警", "Churn risk"), pct: 30 },
    ],
  },
  {
    label: text("团队协作状态", "Team collaboration"),
    items: [
      { value: "24", name: text("今日任务", "Today's tasks"), pct: 65 },
      { value: "6", name: text("待审批", "Pending approval"), pct: 40 },
      { value: "18", name: text("已完成", "Completed"), pct: 85 },
      { value: "2", name: text("AI 建议", "AI suggestions"), pct: 20 },
    ],
  },
  {
    label: text("个人业绩概览", "Personal performance"),
    items: [
      { value: "¥128K", name: text("成交金额", "Deal value"), pct: 80 },
      { value: "87%", name: text("目标完成率", "Goal rate"), pct: 87 },
      { value: "4.2", name: text("平均跟进次数", "Avg follow-ups"), pct: 55 },
      { value: "92%", name: text("客户满意度", "Satisfaction"), pct: 92 },
    ],
  },
]);

const visualTrustStats = computed(() => [
  { value: text("< 2 分钟", "< 2 min"), label: text("注册到使用", "Setup time") },
  { value: text("3 层角色", "3 Roles"), label: text("内置权限", "Built-in RBAC") },
  { value: text("AI 驱动", "AI-Powered"), label: text("智能分析", "Smart analysis") },
]);

const runVisualSequence = () => {
  visualTimer = setTimeout(() => {
    visualPhase.value = 1;
    visualTimer = setTimeout(() => {
      visualPhase.value = 2;
      visualChartIdx.value = 0;
      const cycle = () => {
        visualTimer = setTimeout(() => {
          const next = visualChartIdx.value + 1;
          if (next < visualStatCards.value.length) {
            visualChartIdx.value = next;
            cycle();
          } else {
            visualPhase.value = 3;
            visualTimer = setTimeout(() => {
              visualPhase.value = 0;
              runVisualSequence();
            }, 4000);
          }
        }, 3200);
      };
      cycle();
    }, 2200);
  }, 3000);
};

onMounted(() => {
  splitTimer = setTimeout(() => {
    showVisual.value = true;
    runVisualSequence();
  }, 800);
});
onBeforeUnmount(() => {
  if (visualTimer) clearTimeout(visualTimer);
  if (splitTimer) clearTimeout(splitTimer);
});

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const savedAccounts = ref<SavedAccount[]>([]);
const errors = ref({
  username: "",
  password: "",
});
const loginError = ref("");
const loading = ref(false);
const submitGuard = useSubmitGuard();
const sessionNotice = ref<AuthSessionNotice | null>(consumeAuthSessionNotice());

if (!sessionNotice.value) {
  const reason = route.query.reason;
  if (reason === "session-expired" || reason === "auth-required") {
    sessionNotice.value = createAuthSessionNotice(
      reason,
      typeof route.query.redirect === "string" ? route.query.redirect : null,
    );
  }
}

onMounted(() => {
  savedAccounts.value = loadSavedAccounts();
  const prefillUsername = route.query.prefill;
  if (prefillUsername && typeof prefillUsername === "string") {
    username.value = prefillUsername;
  }
});

const localizedSessionNotice = computed(() => {
  if (!sessionNotice.value) {
    return null;
  }

  if (sessionNotice.value.reason === "session-expired") {
    return {
      ...sessionNotice.value,
      title: text("会话已过期", "Session expired"),
      message: text(
        "你的登录会话已经结束，静默刷新没有恢复成功。请重新登录继续。",
        "Your login session ended and was refreshed unsuccessfully. Sign in again to continue.",
      ),
    };
  }

  return {
    ...sessionNotice.value,
    title: text("需要登录", "Login required"),
    message: text(
      "这个页面需要有效会话后才能进入。请先登录继续。",
      "This page requires an active account session. Sign in to continue.",
    ),
  };
});

const loginMetrics = computed(() => [
  {
    label: text("会话恢复", "Session restore"),
    title: text("静默刷新优先", "Silent refresh first"),
    copy: text(
      "只有在自动恢复失败时，才把用户送回登录入口。",
      "Users are only returned here when automatic recovery can no longer resume the session.",
    ),
  },
  {
    label: text("角色导航", "Role-aware navigation"),
    title: text("登录后回到正确路径", "Return to the right route"),
    copy: text(
      "登录成功后会优先回到刚才想访问的页面，而不是固定跳到某个无关位置。",
      "After sign-in, the app returns users to the page they were trying to access instead of a generic fallback.",
    ),
  },
]);

const workspaceHighlights = computed(() => [
  {
    label: text("客户推进", "Customer flow"),
    title: text(
      "继续处理客户、标签、跟进和提醒。",
      "Resume customers, tags, follow-ups, and reminders.",
    ),
    copy: text(
      "入口页先提醒用户，他们回来的不是一套孤立表单，而是连续中的销售动作。",
      "The entrance should remind users that they are returning to an ongoing stream of sales work, not a detached screen.",
    ),
  },
  {
    label: text("AI 节奏", "AI rhythm"),
    title: text(
      "AI 洞察依然在关键节点上工作。",
      "AI insight stays attached to the important moments.",
    ),
    copy: text(
      "客户分析、流失预警和日报生成都应该被描述成流程的一部分。",
      "Customer analysis, churn warnings, and daily reports should read like part of the operating flow.",
    ),
  },
  {
    label: text("团队协同", "Team coordination"),
    title: text(
      "角色与权限决定你看到的工作层。",
      "Roles and permissions define the layer of work you return to.",
    ),
    copy: text(
      "成员、经理和管理员在同一工作区中协作，但入口感知应该足够明确。",
      "Members, managers, and admins work in the same workspace, but the entrance should still feel deliberate.",
    ),
  },
]);

const sessionSteps = computed(() => [
  {
    title: text("输入账号", "Enter your account"),
    copy: text(
      "用户名和密码是回到工作区的最短路径。",
      "Username and password are the shortest route back into the workspace.",
    ),
  },
  {
    title: text("恢复会话", "Restore the session"),
    copy: text(
      "系统会恢复 token、角色信息和工作区上下文。",
      "The app restores tokens, role state, and workspace context.",
    ),
  },
  {
    title: text("回到原路径", "Return to the intended route"),
    copy: text(
      "如果之前因为会话失效被拦下，登录后会直接回到目标页面。",
      "If the session expired on a protected page, sign-in sends you straight back there.",
    ),
  },
]);

const redirectTarget = computed(() => {
  return (
    sanitizeRedirectPath(
      typeof route.query.redirect === "string" ? route.query.redirect : null,
    ) || (FRONTEND_ONLY_MODE ? FRONTEND_ONLY_WORKSPACE_ROUTE : "/customer")
  );
});

const submitLocked = computed(
  () => loading.value || submitGuard.isBlocked.value,
);

const validateUsername = () => {
  if (!username.value) {
    errors.value.username = text("用户名不能为空", "Username is required");
    return false;
  }

  errors.value.username = "";
  return true;
};

const validatePassword = () => {
  if (!password.value) {
    errors.value.password = text("密码不能为空", "Password is required");
    return false;
  }

  if (password.value.length < 6) {
    errors.value.password = text(
      "密码至少 6 位",
      "Password must be at least 6 characters",
    );
    return false;
  }

  errors.value.password = "";
  return true;
};

const validateForm = () => validateUsername() && validatePassword();

const formatSavedAccountTime = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) {
    return text("刚刚访问", "Visited recently");
  }

  return new Intl.DateTimeFormat(
    language.value === "zh-CN" ? "zh-CN" : "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(timestamp));
};

const formatIdentityStatus = (status?: "verified" | "pending") => {
  return status === "pending"
    ? text("待认证", "Pending verification")
    : text("已认证", "Verified");
};

const applySavedAccount = (account: SavedAccount) => {
  username.value = account.username;
  errors.value.username = "";
  loginError.value = "";
};

const handleLogin = async () => {
  loginError.value = "";
  if (FRONTEND_ONLY_MODE) {
    const matchedAccount = savedAccounts.value.find(
      (account) => account.username === username.value.trim(),
    );
    const sessionSeed = authStore.enableFrontendOnlySession({
      username: username.value,
      companyName: matchedAccount?.companyName,
    });

    saveAccountSession({
      username: sessionSeed.user.username,
      companyName: sessionSeed.company.name,
      companyIdentityStatus: sessionSeed.user.companyIdentityStatus,
    });
    clearAuthSessionNotice();
    notifyActionSuccess(
      text(
        "已进入前端静态工作台。",
        "Entered the frontend-only static workspace.",
      ),
      { title: text("演示模式已启用", "Demo mode enabled") },
    );
    await router.push(redirectTarget.value);
    return;
  }

  if (!validateForm()) {
    return;
  }

  await submitGuard.run(async () => {
    loading.value = true;

    try {
      const response = await request.post("/auth/login", {
        username: username.value,
        password: password.value,
      });

      const { accessToken, refreshToken, user, company, rbac } = response.data;
      authStore.setTokens(accessToken, refreshToken);
      authStore.setUserInfo(user, company, rbac);
      saveAccountSession({
        username: user.username,
        companyName: company.name,
        refreshToken,
        companyIdentityStatus: user.companyIdentityStatus,
      });
      clearAuthSessionNotice();
      notifyActionSuccess(
        text(
          "欢迎回来，工作区已恢复。",
          "Welcome back, your workspace is ready.",
        ),
        {
          title: text("登录成功", "Signed in"),
        },
      );
      await router.push(redirectTarget.value);
    } catch (error) {
      loginError.value = getRequestErrorMessage(
        error,
        text("登录失败，请重试。", "Login failed. Please try again."),
      );
      notifyActionError(
        error,
        text("登录失败，请重试。", "Login failed. Please try again."),
        {
          title: text("登录失败", "Log in failed"),
        },
      );
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.auth-page { display: grid; }

.auth-panel {
  position: relative;
}

/* ── Visual panel (left) — absolute, fades in after form slides ────────── */
.auth-visual {
  position: absolute;
  top: 0;
  left: 0;
  right: calc(420px + 24px);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  padding: 32px;
  display: grid;
  gap: 20px;
  grid-template-rows: auto 1fr auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease 1.5s;
  background:
    radial-gradient(circle at top right, rgba(96, 171, 255, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 245, 238, 0.94) 100%);
}
.auth-panel--split .auth-visual {
  opacity: 1;
  pointer-events: auto;
}
.visual-eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.auth-visual h1 {
  color: var(--text-primary);
  font-size: clamp(24px, 3.2vw, 36px);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.visual-intro { color: var(--text-secondary); line-height: 1.8; }
.visual-header { display: grid; gap: 12px; }

/* Stage */
.visual-stage {
  border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface-primary);
  overflow: hidden;
  height: 260px;
  position: relative;
}
.visual-card {
  padding: 18px;
  display: grid;
  gap: 12px;
  position: absolute;
  inset: 0;
}
.visual-card--center { place-items: center; text-align: center; }
.visual-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Timeline */
.v-timeline { display: grid; gap: 2px; }
.v-timeline__item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  animation: v-row-in 0.4s ease both;
}
.v-timeline__item:nth-child(2) { animation-delay: 0.1s; }
.v-timeline__item:nth-child(3) { animation-delay: 0.2s; }
.v-timeline__item:nth-child(4) { animation-delay: 0.3s; }
.v-timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(96, 171, 255, 0.3);
  border: 2px solid rgba(96, 171, 255, 0.5);
}
.v-timeline__dot--active {
  background: rgba(96, 171, 255, 0.7);
  border-color: rgba(96, 171, 255, 0.9);
  box-shadow: 0 0 8px rgba(96, 171, 255, 0.4);
  animation: v-pulse 2s ease infinite;
}
.v-timeline__body { display: grid; gap: 2px; min-width: 0; }
.v-timeline__body strong { color: var(--text-primary); font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v-timeline__body span { color: var(--text-tertiary); font-size: 11px; }
.v-timeline__tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.v-timeline__tag--done { background: rgba(76, 175, 80, 0.12); color: rgba(56, 142, 60, 0.85); }
.v-timeline__tag--active { background: rgba(96, 171, 255, 0.12); color: rgba(35, 113, 196, 0.85); }
.v-timeline__tag--pending { background: rgba(255, 183, 77, 0.15); color: rgba(180, 130, 20, 0.85); }
@keyframes v-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes v-pulse { 0%, 100% { box-shadow: 0 0 4px rgba(96, 171, 255, 0.3); } 50% { box-shadow: 0 0 12px rgba(96, 171, 255, 0.6); } }

/* Loading */
.v-spinner { width: 40px; height: 40px; }
.v-spinner svg { width: 100%; height: 100%; animation: v-spin 1.2s linear infinite; }
.v-spinner__arc { animation: v-spin-dash 1.5s ease-in-out infinite; }
.v-loading-text { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
@keyframes v-spin { to { transform: rotate(360deg); } }
@keyframes v-spin-dash { 0% { stroke-dasharray: 1,80; stroke-dashoffset: 0; } 50% { stroke-dasharray: 40,80; stroke-dashoffset: -20; } 100% { stroke-dasharray: 1,80; stroke-dashoffset: -80; } }

/* Stat cards */
.v-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.v-stat-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.6);
  display: grid;
  gap: 4px;
  animation: v-stat-in 0.45s ease both;
}
.v-stat-card strong { color: var(--text-primary); font-size: 22px; font-weight: 700; }
.v-stat-card span { color: var(--text-secondary); font-size: 12px; font-weight: 600; }
.v-stat-bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(96, 171, 255, 0.1);
  margin-top: 4px;
  overflow: hidden;
}
.v-stat-bar__fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(96, 171, 255, 0.5), rgba(35, 113, 196, 0.7));
  animation: v-bar-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: left;
}
@keyframes v-stat-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes v-bar-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Summary */
.v-check-svg { width: 56px; height: auto; }
.v-check-ring { stroke-dasharray: 126; stroke-dashoffset: 126; animation: v-draw-ring 0.8s ease 0.2s forwards; }
.v-check-tick { stroke-dasharray: 50; stroke-dashoffset: 50; animation: v-draw 0.4s ease 0.8s forwards; }
.v-sum-title { color: var(--text-primary); font-size: 15px; font-weight: 700; }
.v-sum-copy { color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin: 0; }
@keyframes v-draw-ring { to { stroke-dashoffset: 0; } }

/* Trust */
.visual-trust {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.visual-trust__item {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: rgba(255,255,255,0.7);
  text-align: center;
  display: grid;
  gap: 4px;
}
.visual-trust__item strong { color: var(--text-primary); font-size: 15px; font-weight: 700; }
.visual-trust__item span { color: var(--text-secondary); font-size: 11px; font-weight: 600; }

/* Transition */
.v-fade-enter-active { transition: opacity 0.45s ease, transform 0.45s ease; }
.v-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.v-fade-enter-from { opacity: 0; transform: translateY(10px); }
.v-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Auth card — fixed 420px, margin-left slides from center to right ─── */
.auth-card {
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-card);
  padding: 32px;
  display: grid;
  gap: 18px;
  background: var(--surface-white);
  align-content: start;
  width: 420px;
  margin-left: calc(50% - 210px);
  transition: margin-left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.auth-panel--split .auth-card {
  margin-left: calc(100% - 420px);
}
.auth-card__header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}
.auth-card__eyebrow,
.session-banner__eyebrow {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.auth-card__header h2 {
  color: var(--text-primary);
  font-size: 22px;
  line-height: 1.28;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.auth-card__switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  text-decoration: none;
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
  background: var(--surface-primary);
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    background-color var(--transition-base);
}
.auth-card__switch:hover {
  transform: translateY(-1px);
  border-color: var(--accent-primary);
  background: var(--accent-soft);
  box-shadow: var(--shadow-sm);
}

/* Session banner */
.session-banner {
  padding: 18px 20px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-accent);
  background:
    radial-gradient(ellipse at top right, rgba(96,171,255,0.08), transparent 40%),
    var(--surface-primary);
}
.session-banner__message,
.session-banner__target { color: var(--text-secondary); line-height: 1.8; }
.session-banner__target strong { color: var(--text-primary); }

/* ── Form rows (horizontal label + input) ────────────────────────────────── */
.form-row {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 0;
  align-items: start;
  border-radius: var(--radius-lg);
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
  color: var(--danger-solid);
  font-size: 12px;
}
.password-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }

/* Buttons */
.toggle-btn, .primary-btn {
  transition: transform var(--transition-base), border-color var(--transition-base), background-color var(--transition-base), box-shadow var(--transition-base);
}
.toggle-btn {
  padding: 0 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.toggle-btn:hover { transform: translateY(-1px); border-color: var(--border-default); background: var(--surface-primary); }

.primary-btn {
  padding: 14px 20px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--accent-gradient);
  color: var(--text-inverse);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: var(--shadow-accent);
  letter-spacing: 0.01em;
}
.primary-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(35,113,196,0.28), 0 4px 12px rgba(35,113,196,0.14); filter: brightness(1.06); }
.primary-btn:not(:disabled):active { transform: translateY(0); box-shadow: var(--shadow-sm); }
.primary-btn:disabled { opacity: 0.55; cursor: not-allowed; filter: saturate(0.6); }

/* Errors */
.input-error { border-color: var(--danger-solid) !important; box-shadow: 0 0 0 4px var(--danger-soft) !important; }
.error-text { color: var(--danger-solid); font-size: 13px; font-weight: 500; }

/* Divider */
.divider-row { display: flex; align-items: center; gap: 14px; }
.divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--border-light), transparent); }
.divider-label { color: var(--text-tertiary); font-size: 12px; font-weight: 600; letter-spacing: 0.04em; white-space: nowrap; }

/* Social */
.social-row { display: grid; gap: 10px; }
.social-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 13px 18px; border-radius: var(--radius-lg); border: 1.5px solid var(--border-light);
  background: linear-gradient(135deg, var(--surface-white) 0%, var(--surface-primary) 100%);
  color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(24,20,16,0.03), var(--shadow-xs);
  transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base), background-color var(--transition-base);
}
.social-btn svg { flex-shrink: 0; }
.social-btn:hover { transform: translateY(-2px); border-color: var(--border-default); box-shadow: var(--shadow-soft); background: linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-primary) 100%); }

/* Footer */
.auth-card__footer { display: grid; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 16px; }
.auth-card__footer p { color: var(--text-secondary); }
.auth-card__footer a { color: var(--accent-primary); font-weight: 700; text-decoration: none; transition: color var(--transition-fast); }
.auth-card__footer a:hover { color: var(--accent-primary-hover); }

/* Responsive */
@media (max-width: 960px) {
  .auth-visual { display: none; }
  .auth-card { width: 100%; margin-left: 0; }
}
@media (max-width: 520px) {
  .form-row { grid-template-columns: 1fr; }
  .form-row__label { justify-content: flex-start; padding: 10px 14px; border-right: none; border-bottom: 1px solid var(--border-light); }
  .password-field { grid-template-columns: 1fr; }
  .toggle-btn { min-height: 46px; border-radius: var(--radius-md); }
  .visual-trust { grid-template-columns: 1fr; }
}
</style>
