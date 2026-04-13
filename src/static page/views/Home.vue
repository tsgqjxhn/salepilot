<template>
  <div class="landing-page">
    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 1 — Hero（嵌入页面风格，无后端）
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">{{ bilingual("首页", "Home") }}</p>
        <div class="hero-headline">
          <span class="hero-kicker">{{
            text("统一销售工作区", "One accountable sales workspace")
          }}</span>
          <h1>
            {{
              text(
                "把客户推进、AI 分析、团队协作和角色治理收拢到同一个界面里。",
                "Bring customer execution, AI analysis, team coordination, and role governance into one operating surface.",
              )
            }}
          </h1>
        </div>
        <p class="hero-description">
          {{
            text(
              "SalePilot 面向需要统一客户执行、经理视角和管理员控制的销售团队而设计。访客看到的是清晰的产品入口，登录后进入的是完整的业务工作区。",
              "SalePilot is structured for sales teams that need customer execution, manager oversight, and administrator control without splitting the day across disconnected tools.",
            )
          }}
        </p>

        <div class="hero-actions">
          <router-link to="/workspace" class="primary-link">{{
            text("进入工作区", "Enter workspace")
          }}</router-link>
          <router-link to="/workspace" class="secondary-link">{{
            text("立即体验", "Try now")
          }}</router-link>
        </div>

        <dl class="hero-metrics">
          <div v-for="metric in heroMetrics" :key="metric.value" class="metric-card">
            <dt>{{ metric.value }}</dt>
            <dd>{{ metric.label }}</dd>
          </div>
        </dl>
      </div>

      <div class="hero-preview">
        <article class="preview-surface">
          <div class="preview-surface__header">
            <div>
              <span class="preview-label">{{ text("工作区预览", "Workspace preview") }}</span>
              <strong>{{
                text("把流程做成看得见的节奏", "Make the workflow read like a visible rhythm")
              }}</strong>
            </div>
            <span class="preview-chip">{{ text("嵌入页面", "Embedded") }}</span>
          </div>

          <div class="preview-grid">
            <article v-for="card in previewMetrics" :key="card.label" class="preview-metric">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <p>{{ card.copy }}</p>
            </article>
          </div>

          <div class="signal-stack">
            <article v-for="signal in workflowSignals" :key="signal.title" class="signal-card">
              <p>{{ signal.label }}</p>
              <strong>{{ signal.title }}</strong>
              <span>{{ signal.copy }}</span>
            </article>
          </div>
        </article>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 2 — AI 接入 Logo 展示行
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">{{ text("AI 接入", "AI Integration") }}</p>
        <h2>{{ text("一行代码接入自定义 AI", "Integrate custom AI in one line") }}</h2>
        <span>{{
          text(
            "支持接入主流 AI 服务，也可以自定义 AI Logo 和模型端点，让工作区匹配你的品牌和业务需求。",
            "Support mainstream AI services out of the box, or bring your own AI logo and model endpoint to match your brand and workflow."
          )
        }}</span>
      </div>

      <div class="ai-logo-row">
        <div v-for="ai in aiProviders" :key="ai.name" class="ai-logo-card" :title="ai.name">
          <span class="ai-logo-icon" v-html="ai.icon" />
          <strong>{{ ai.name }}</strong>
          <span class="ai-logo-type">{{ ai.type }}</span>
        </div>
        <div class="ai-logo-card ai-logo-card--custom">
          <span class="ai-logo-icon ai-logo-icon--plus">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </span>
          <strong>{{ text("自定义 AI", "Custom AI") }}</strong>
          <span class="ai-logo-type">{{ text("任意端点", "Any endpoint") }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 3 — 三栏特性展示（Linear 风格 + 图片说明）
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="section-block section-block--soft">
      <div class="section-heading">
        <p class="eyebrow">{{ text("核心能力", "Core capabilities") }}</p>
        <h2>{{
          text(
            "不是堆功能，而是把销售组织的三层工作面拼成一个连续工作流。",
            "Not a pile of features, but one continuous surface for the three working layers of a sales organization."
          )
        }}</h2>
      </div>

      <div class="feature-grid">
        <article v-for="feature in coreFeatures" :key="feature.title" class="feature-card">
          <div class="feature-visual" v-html="feature.illustration" />
          <div class="feature-body">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.copy }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 4 — AI 聊天交互演示
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">{{ text("AI 对话", "AI Conversation") }}</p>
        <h2>{{
          text(
            "在工作区内直接与 AI 对话，获取实时销售分析。",
            "Chat with AI directly inside the workspace for real-time sales analysis."
          )
        }}</h2>
      </div>

      <div class="chat-demo">
        <div class="chat-window">
          <div class="chat-header">
            <span class="chat-header-dot chat-header-dot--green" />
            <span>{{ text("SalePilot AI 助手", "SalePilot AI Assistant") }}</span>
          </div>

          <div class="chat-messages" ref="chatContainer">
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              :class="['chat-bubble', msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai']"
            >
              <span v-if="msg.role === 'ai'" class="chat-ai-avatar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </span>
              <p>{{ msg.text }}</p>
            </div>

            <div v-if="isTyping" class="chat-bubble chat-bubble--ai">
              <span class="chat-ai-avatar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </span>
              <div class="chat-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>

          <div class="chat-input-bar">
            <input
              v-model="chatInput"
              class="chat-input"
              @keydown.enter="sendMessage"
            />
            <button class="chat-send-btn" @click="sendMessage">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 5 — 产品方向（左侧卡片 + 右侧矢量背景）
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="section-block direction-section">
      <div class="direction-content">
        <div class="section-heading">
          <p class="eyebrow">{{ text("产品方向", "Product direction") }}</p>
          <h2>{{
            text(
              "不是功能堆叠，而是为销售组织量身定制的操作面板。",
              "Not a feature pile — a purpose-built operating surface for sales organizations."
            )
          }}</h2>
        </div>

        <div class="direction-cards">
          <article v-for="story in directionStories" :key="story.title" class="direction-card">
            <span class="direction-icon" v-html="story.icon" />
            <div>
              <strong>{{ story.title }}</strong>
              <p>{{ story.copy }}</p>
            </div>
          </article>
        </div>
      </div>

      <div class="direction-visual">
        <svg class="direction-svg" viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="30" width="440" height="420" rx="28" fill="var(--surface-primary)" />
          <line x1="80" y1="110" x2="440" y2="110" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4 6" />
          <line x1="80" y1="190" x2="440" y2="190" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4 6" />
          <line x1="80" y1="270" x2="440" y2="270" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4 6" />
          <line x1="80" y1="350" x2="440" y2="350" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4 6" />
          <rect x="100" y="280" width="36" height="140" rx="8" fill="var(--accent-soft)" />
          <rect x="152" y="220" width="36" height="200" rx="8" fill="rgba(35,113,196,0.18)" />
          <rect x="204" y="180" width="36" height="240" rx="8" fill="rgba(35,113,196,0.28)" />
          <rect x="256" y="140" width="36" height="280" rx="8" fill="rgba(35,113,196,0.38)" />
          <rect x="308" y="100" width="36" height="320" rx="8" fill="rgba(35,113,196,0.52)" />
          <rect x="360" y="80" width="36" height="340" rx="8" fill="var(--accent-primary)" />
          <polyline points="118,270 170,210 222,170 274,130 326,90 378,70" stroke="var(--accent-primary)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="118" cy="270" r="4" fill="var(--accent-primary)" />
          <circle cx="170" cy="210" r="4" fill="var(--accent-primary)" />
          <circle cx="222" cy="170" r="4" fill="var(--accent-primary)" />
          <circle cx="274" cy="130" r="4" fill="var(--accent-primary)" />
          <circle cx="326" cy="90" r="4" fill="var(--accent-primary)" />
          <circle cx="378" cy="70" r="5" fill="var(--accent-primary)" stroke="#fff" stroke-width="2" />
          <text x="260" y="58" text-anchor="middle" fill="var(--accent-strong)" font-size="13" font-weight="700">{{ text("销售增长趋势", "Sales Growth") }}</text>
          <rect x="370" y="370" width="80" height="32" rx="16" fill="var(--accent-gradient)" />
          <text x="410" y="391" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">AI</text>
        </svg>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Section 6 — 登录后界面预览（AI 每日分析）
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">{{ text("登录后体验", "After sign-in") }}</p>
        <h2>{{
          text(
            "AI 每日分析，推送关键洞察到你的工作区。",
            "AI daily analysis pushes key insights to your workspace every day."
          )
        }}</h2>
        <span>{{
          text(
            "登录后，AI 会自动分析你的销售数据，生成每日洞察报告。点击消息即可查看详细预示。",
            "After signing in, AI automatically analyzes your sales data and generates daily insight reports. Click any message to view detailed predictions."
          )
        }}</span>
      </div>

      <div class="workspace-preview">
        <aside class="ws-sidebar">
          <div class="ws-sidebar-header">
            <div class="ws-logo-circle">SP</div>
            <span>SalePilot</span>
          </div>
          <div class="ws-sidebar-menu">
            <div class="ws-menu-item ws-menu-item--active">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              <span>{{ text("工作台", "Dashboard") }}</span>
            </div>
            <div class="ws-menu-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span>{{ text("客户", "Customers") }}</span>
            </div>
            <div class="ws-menu-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span>{{ text("报表", "Reports") }}</span>
            </div>
            <div class="ws-menu-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>{{ text("通知", "Alerts") }}</span>
            </div>
          </div>
        </aside>

        <main class="ws-main">
          <div class="ws-main-header">
            <h3>{{ text("今日 AI 洞察", "Today's AI Insights") }}</h3>
            <span class="ws-date-badge">{{ text("今日", "Today") }}</span>
          </div>

          <div class="ws-insight-list">
            <div
              v-for="(insight, idx) in aiInsights"
              :key="idx"
              class="ws-insight-card"
              :class="{ 'ws-insight-card--expanded': expandedInsight === idx }"
              @click="toggleInsight(idx)"
            >
              <div class="ws-insight-header">
                <span :class="['ws-insight-dot', `ws-insight-dot--${insight.level}`]" />
                <strong>{{ insight.title }}</strong>
                <span class="ws-insight-time">{{ insight.time }}</span>
              </div>
              <p>{{ insight.summary }}</p>
              <div v-if="expandedInsight === idx" class="ws-insight-detail">
                <div class="ws-insight-detail-content">
                  <span class="ws-insight-ai-label">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    {{ text("AI 预示", "AI Prediction") }}
                  </span>
                  <p>{{ insight.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CTA
         ═══════════════════════════════════════════════════════════════════════
         CTA
         ═══════════════════════════════════════════════════════════════════════ -->
    <section class="cta-card">
      <div class="cta-copy">
        <p class="eyebrow">{{ text("直接进入", "Jump right in") }}</p>
        <h2>{{
          text("点击即可进入，无需注册。", "Click to enter — no registration needed.")
        }}</h2>
        <span>{{
          text(
            "点击即可直接进入演示工作区，无需注册或登录。",
            "Click to enter the demo workspace directly — no registration or sign-in required."
          )
        }}</span>
      </div>

      <div class="cta-actions">
        <router-link to="/workspace" class="primary-link">{{ text("立即进入工作区", "Enter workspace now") }}</router-link>
        <router-link to="/workspace" class="secondary-link">{{ text("开始体验", "Get started") }}</router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useLocalizedText } from "@/composables/useLocalizedText";

defineOptions({ name: "GuestHome" });

const { text, bilingual } = useLocalizedText();

/* ── Scroll-reveal ─────────────────────────────────────────────────────── */
const revealSections = [
  "hero-card",
  "section-block",
  "section-block--soft",
  "detail-grid",
  "cta-card",
];

let observer: IntersectionObserver | null = null;

onMounted(() => {
  chatInput.value = text("帮我分析本月销售趋势", "Analyze this month's sales trend for me");

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-revealed");
          observer?.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
  );

  const page = document.querySelector(".landing-page");
  if (!page) return;

  for (const child of page.children) {
    const el = child as HTMLElement;
    const shouldReveal = revealSections.some((cls) => el.classList.contains(cls));
    if (shouldReveal) {
      el.classList.add("scroll-reveal");
      observer.observe(el);
    }
  }

  const staggerSelectors = [
    ".ai-logo-row > .ai-logo-card",
    ".feature-grid > .feature-card",
    ".direction-cards > .direction-card",
    ".ws-insight-list > .ws-insight-card",

    ".hero-metrics > .metric-card",
    ".signal-stack > .signal-card",
    ".preview-grid > .preview-metric",
  ];

  for (const selector of staggerSelectors) {
    const cards = page.querySelectorAll(selector);
    cards.forEach((card, index) => {
      const htmlEl = card as HTMLElement;
      htmlEl.classList.add("scroll-reveal", "scroll-reveal--stagger");
      htmlEl.style.transitionDelay = `${index * 90}ms`;
      observer!.observe(htmlEl);
    });
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});

/* ── Hero metrics ──────────────────────────────────────────────────────── */
const heroMetrics = computed(() => [
  {
    value: text("3 层角色", "3 role layers"),
    label: text("成员、经理、管理员共享同一工作区内核。", "Members, managers, and admins share the same workspace core."),
  },
  {
    value: text("AI 嵌入流程", "AI in flow"),
    label: text("AI 直接出现在分析、预警和日报节点。", "AI lives directly inside analysis, warning, and reporting flows."),
  },
  {
    value: text("注册即上手", "Sign up to live"),
    label: text("新工作区注册后会立刻进入引导和治理设置。", "New workspaces move straight into onboarding and governance setup."),
  },
]);

const previewMetrics = computed(() => [
  {
    label: text("今日面板", "Today board"),
    value: text("12 条关键动作", "12 priority actions"),
    copy: text("跟进、提醒、分析请求和日报生成统一收口。", "Follow-ups, reminders, analysis requests, and reporting land in one place."),
  },
  {
    label: text("角色状态", "Role state"),
    value: text("经理 / 管理员", "Manager / Admin"),
    copy: text("不同视角共享同一数据底座，但权限边界明确。", "Different views share the same data base while keeping clear permission boundaries."),
  },
]);

const workflowSignals = computed(() => [
  {
    label: text("客户执行", "Customer execution"),
    title: text("客户记录、标签、跟进与提醒保持连续。", "Records, tags, follow-ups, and reminders stay continuous."),
    copy: text("不是把信息分散在表格、群聊和日报里，而是收拢进一个可追踪的工作区。", "The goal is to avoid scattering execution across sheets, chat threads, and reports."),
  },
  {
    label: text("AI 分析", "AI analysis"),
    title: text("成交判断、流失预警和日报生成都嵌在业务流里。", "Deal scoring, churn warnings, and daily reports stay embedded in the operating flow."),
    copy: text("AI 不是独立模块，而是为销售动作服务的加速层。", "AI is treated as an acceleration layer for actual sales work, not a detached module."),
  },
]);

/* ── AI Providers ──────────────────────────────────────────────────────── */
const aiProviders = computed(() => [
  {
    name: "OpenAI",
    type: text("对话 / 分析", "Chat / Analysis"),
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  },
  {
    name: "Claude",
    type: text("分析 / 总结", "Analysis / Summary"),
    icon: `<svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor"><path d="M263.33184 664.28928l161.01376-90.35776 2.70336-7.86432-2.70336-4.34176h-7.86432l-26.95168-1.6384-91.99616-2.49856-79.79008-3.35872-77.29152-4.096-19.49696-4.17792-18.2272-24.04352 1.8432-12.00128 16.384-10.97728 23.42912 2.048 51.8144 3.52256 77.70112 5.40672 56.36096 3.2768 83.51744 8.72448h13.27104l1.8432-5.36576-4.5056-3.31776-3.56352-3.31776-80.40448-54.4768-87.04-57.63072-45.58848-33.1776-24.65792-16.7936-12.45184-15.72864-5.36576-34.4064 22.36416-24.65792 30.06464 2.048 7.65952 2.08896 30.47424 23.42912 65.04448 50.3808 84.992 62.54592 12.41088 10.36288 4.99712-3.52256 0.6144-2.4576-5.61152-9.33888-46.20288-83.5584-49.31584-84.95104-21.95456-35.2256-5.81632-21.13536a101.45792 101.45792 0 0 1-3.52256-24.86272l25.47712-34.6112 14.09024-4.54656 33.9968 4.54656 14.336 12.45184 21.0944 48.29184 34.2016 76.02176 53.0432 103.424 15.5648 30.67904 8.27392 28.38528 3.11296 8.72448h5.36576v-4.99712l4.38272-58.24512 8.06912-71.4752 7.86432-92.03712 2.70336-25.88672 12.86144-31.08864 25.47712-16.7936 19.90656 9.54368 16.384 23.42912-2.29376 15.1552-9.74848 63.16032-19.0464 99.08224-12.45184 66.31424h7.24992l8.31488-8.31488 33.5872-44.52352 56.32-70.4512 24.90368-28.01664 28.99968-30.88384 18.6368-14.70464h35.2256l25.92768 38.54336-11.63264 39.81312-36.2496 45.99808-30.06464 38.95296-43.08992 58.04032-26.95168 46.40768 2.4576 3.72736 6.47168-0.6144 97.40288-20.72576 52.6336-9.54368 62.79168-10.77248 28.38528 13.27104 3.11296 13.47584-11.18208 27.56608-67.1744 16.5888-78.72512 15.72864-117.30944 27.77088-1.4336 1.024 1.6384 2.048 52.8384 4.99712 22.60992 1.2288h55.296l103.0144 7.70048 26.95168 17.8176 16.1792 21.74976-2.70336 16.5888-41.45152 21.13536-55.95136-13.27104-130.58048-31.08864-44.72832-11.18208h-6.22592v3.72736l37.2736 36.4544 68.4032 61.76768 85.6064 79.58528 4.34176 19.6608-10.97728 15.5648-11.63264-1.6384-75.20256-56.56576-28.99968-25.51808-65.69984-55.296h-4.38272v5.77536l15.1552 22.15936 79.99488 120.2176 4.13696 36.864-5.81632 12.04224-20.72576 7.24992-22.77376-4.13696-46.85824-65.69984-48.29184-73.97376-38.912-66.3552-4.79232 2.70336-23.01952 247.68512-10.77248 12.61568-24.86272 9.54368-20.72576-15.7696-10.97728-25.47712 10.97728-50.3808 13.27104-65.65888 10.77248-52.224 9.74848-64.88064 5.81632-21.54496-0.4096-1.4336-4.79232 0.6144-48.90624 67.13344-74.38336 100.51584-58.85952 62.99648-14.09024 5.61152-24.45312-12.6976 2.2528-22.528 13.68064-20.11136 81.46944-103.6288 49.11104-64.26624 31.70304-37.0688-0.2048-5.40672h-1.88416l-216.35072 140.4928-38.5024 4.99712-16.62976-15.5648 2.08896-25.47712 7.86432-8.27392 65.08544-44.76928-0.2048 0.2048z"/></svg>`,
  },
  {
    name: "Gemini",
    type: text("多模态", "Multimodal"),
    icon: `<svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor"><path d="M960 512.896A477.248 477.248 0 0 0 512.896 960h-1.792A477.184 477.184 0 0 0 64 512.896v-1.792A477.184 477.184 0 0 0 511.104 64h1.792A477.248 477.248 0 0 0 960 511.104z"/></svg>`,
  },
  {
    name: text("智谱清言", "Zhipu"),
    type: text("国产 AI", "Domestic AI"),
    icon: `<svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor"><path d="M860.750769 544.374154c-67.662769 139.027692-177.152 235.126154-323.190154 288.610461-85.149538 64.787692-180.027077 64.748308-277.779692 39.975385a257.929846 257.929846 0 0 1-68.726154-28.16C29.420308 732.396308-6.695385 573.597538 100.430769 403.022769 210.865231 227.131077 372.184615 126.030769 582.971077 118.429538c247.886769-8.979692 386.126769 203.342769 277.779692 425.944616z m-131.662769-120.910769c-107.126154-48.836923-219.175385-43.716923-330.830769-24.497231-61.833846 10.633846-120.201846 34.697846-169.944616 74.870154-60.061538 48.443077-89.718154 108.268308-66.402461 186.564923 30.011077 82.432 94.995692 109.134769 176.167384 111.104 186.486154 4.568615 365.686154-116.302769 445.203693-300.780308-7.089231-28.278154-31.744-37.060923-54.193231-47.261538zM619.913846 218.072615c-125.597538-11.421538-230.006154 40.211692-328.192 110.276923 4.253538 12.603077 11.736615 10.633846 19.140923 7.75877l4.371693-1.732923 2.126769-0.748308c146.195692-45.922462 291.446154-44.504615 435.593846 8.585846 12.524308 4.608 26.151385 16.659692 35.446154-4.450461-28.553846-78.651077-89.088-112.521846-168.487385-119.729231z"/><path d="M191.054769 844.8c116.893538 36.273231 232.566154 37.297231 346.505846-11.815385 0.708923 11.815385 8.979692 14.296615 18.432 13.90277 103.187692-4.253538 197.632-32.137846 274.156308-104.96 37.966769-36.115692 59.470769-79.556923 53.956923-134.262154-5.159385-51.003077 37.572923-87.04 39.542154-140.918154 84.676923 102.281846 80.068923 233.787077-7.207385 326.971077-111.104 118.705231-254.148923 154.151385-409.915077 151.000615-114.372923-2.284308-223.389538-25.521231-315.470769-99.918769zM783.281231 470.724923c-142.178462-105.708308-424.763077-93.814154-556.071385 23.236923-50.018462 44.544-74.279385 98.934154-65.299692 166.478769-45.922462-99.524923 7.876923-177.860923 57.344-255.212307 18.628923-29.144615 48.009846-51.436308 72.467692-76.839385 69.316923-23.355077 138.712615-39.384615 213.700923-39.424 98.146462-0.118154 192.039385 12.996923 283.017846 48.836923 19.771077 45.134769 1.811692 88.812308-5.159384 132.923077z"/></svg>`,
  },
  {
    name: "DeepSeek",
    type: text("推理 / 分析", "Reasoning"),
    icon: `<svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor"><path d="M929.678222 254.122667c-9.045333-4.323556-12.913778 3.982222-18.204444 8.192-1.763556 1.365333-3.299556 3.185778-4.835556 4.778666-13.255111 13.937778-28.672 23.096889-48.810666 21.959111-29.468444-1.592889-54.613333 7.509333-76.913778 29.809778-4.721778-27.420444-20.48-43.804444-44.373334-54.385778-12.515556-5.461333-25.144889-10.922667-33.905777-22.755555-6.144-8.476444-7.793778-17.92-10.865778-27.192889-1.934222-5.518222-3.868444-11.320889-10.410667-12.288-7.111111-1.080889-9.898667 4.778667-12.686222 9.671111-11.093333 20.081778-15.36 42.268444-15.018667 64.625778 0.967111 50.346667 22.528 90.510222 65.365334 119.011555 4.835556 3.299556 6.144 6.599111 4.551111 11.377778-2.844444 9.784889-6.371556 19.342222-9.443556 29.240889-1.877333 6.257778-4.835556 7.623111-11.662222 4.892445a196.608 196.608 0 0 1-61.724444-41.415112c-30.435556-29.013333-58.026667-61.098667-92.330667-86.243555a403.285333 403.285333 0 0 0-24.462222-16.497778c-35.043556-33.564444 4.551111-61.212444 13.710222-64.455111 9.671111-3.413333 3.356444-15.189333-27.648-15.018667-31.004444 0.113778-59.392 10.353778-95.573333 24.007111a109.681778 109.681778 0 0 1-16.497778 4.778667 345.656889 345.656889 0 0 0-102.513778-3.584c-67.015111 7.395556-120.547556 38.684444-159.914667 92.046222-47.274667 64.170667-58.424889 137.102222-44.828444 213.105778 14.392889 80.156444 55.808 146.488889 119.466667 198.428445 66.104889 53.76 142.222222 80.099556 228.920888 75.093333 52.736-3.015111 111.388444-10.012444 177.607112-65.308445 16.725333 8.192 34.190222 11.491556 63.317333 13.937778 22.357333 2.048 43.918222-1.080889 60.586667-4.494222 26.168889-5.461333 24.291556-29.354667 14.904888-33.678222-76.686222-35.271111-59.790222-20.935111-75.093333-32.540445 38.912-45.511111 97.564444-92.728889 120.547556-245.76 1.763556-12.174222 0.284444-19.797333 0-29.582222-0.113778-6.030222 1.251556-8.362667 8.192-9.102222 19.228444-1.934222 37.888-7.566222 54.954666-16.611556 49.607111-26.737778 69.688889-70.712889 74.410667-123.448889 0.682667-7.964444-0.170667-16.384-8.817778-20.593777z m-432.64 474.282666c-74.24-57.571556-110.250667-76.572444-125.155555-75.719111-13.880889 0.796444-11.377778 16.497778-8.305778 26.737778 3.242667 10.126222 7.395556 17.066667 13.255111 25.941333 3.982222 5.859556 6.826667 14.620444-4.039111 21.162667-23.893333 14.620444-65.536-4.949333-67.470222-5.859556-48.355556-28.16-88.860444-65.308444-117.361778-116.053333a350.947556 350.947556 0 0 1-46.193778-157.297778c-0.682667-13.539556 3.356444-18.318222 17.009778-20.707555 17.92-3.299556 36.408889-3.982222 54.328889-1.365334 75.776 10.922667 140.344889 44.373333 194.389333 97.28 30.890667 30.151111 54.272 66.218667 78.279111 101.489778 25.6 37.376 53.191111 73.045333 88.177778 102.229334 12.401778 10.24 22.243556 18.033778 31.744 23.779555-28.501333 3.128889-76.060444 3.811556-108.657778-21.617778z m35.669334-225.905777a10.808889 10.808889 0 0 1 14.677333-10.126223 9.728 9.728 0 0 1 4.096 2.56 10.808889 10.808889 0 0 1-7.964445 18.318223 10.695111 10.695111 0 0 1-10.808888-10.752z m110.535111 55.978666a65.024 65.024 0 0 1-21.048889 5.518222 44.657778 44.657778 0 0 1-28.330667-8.817777c-9.671111-8.078222-16.668444-12.515556-19.626667-26.624a59.278222 59.278222 0 0 1 0.568889-20.593778c2.503111-11.491556-0.284444-18.887111-8.533333-25.6-6.599111-5.404444-15.132444-6.940444-24.462222-6.940445a20.081778 20.081778 0 0 1-8.988445-2.730666c-3.868444-1.877333-7.111111-6.656-3.982222-12.515556a40.049778 40.049778 0 0 1 6.826667-7.395555c12.572444-7.054222 27.192889-4.778667 40.675555 0.568889 12.515556 5.006222 21.959111 14.336 35.612445 27.420444 13.937778 15.815111 16.384 20.252444 24.348444 32.085333 6.257778 9.329778 11.946667 18.887111 15.872 29.809778 2.275556 6.826667-0.739556 12.344889-8.931555 15.758222v0.056889z"/></svg>`,
  },
]);

/* ── Core Features (3-col) ─────────────────────────────────────────────── */
const coreFeatures = computed(() => [
  {
    title: text("客户执行面板", "Customer execution board"),
    copy: text(
      "所有客户记录、跟进、标签和状态变化都在一个操作面板里。不是表格式 CRM，而是一个面向执行节奏的工作面。",
      "All records, follow-ups, tags, and state changes live on one operating surface — a workspace built for execution rhythm, not a table-style CRM."
    ),
    illustration: `
      <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="200" rx="16" fill="var(--accent-soft)" />
        <rect x="20" y="20" width="280" height="32" rx="8" fill="var(--surface-glass)" />
        <rect x="28" y="30" width="80" height="12" rx="4" fill="var(--accent-primary)" opacity="0.5" />
        <rect x="120" y="30" width="50" height="12" rx="4" fill="var(--border-default)" opacity="0.4" />
        <rect x="20" y="64" width="132" height="120" rx="12" fill="var(--surface-glass)" />
        <rect x="168" y="64" width="132" height="56" rx="12" fill="var(--surface-glass)" />
        <rect x="168" y="128" width="132" height="56" rx="12" fill="var(--surface-glass)" />
        <circle cx="42" cy="86" r="10" fill="var(--accent-primary)" opacity="0.3" />
        <rect x="60" y="82" width="70" height="8" rx="4" fill="var(--border-default)" opacity="0.5" />
        <rect x="28" y="104" width="110" height="6" rx="3" fill="var(--border-light)" />
        <rect x="28" y="118" width="90" height="6" rx="3" fill="var(--border-light)" />
        <rect x="28" y="132" width="100" height="6" rx="3" fill="var(--border-light)" />
        <rect x="28" y="146" width="60" height="6" rx="3" fill="var(--border-light)" />
        <rect x="180" y="78" width="100" height="8" rx="4" fill="var(--accent-primary)" opacity="0.4" />
        <rect x="180" y="94" width="70" height="6" rx="3" fill="var(--border-light)" />
        <rect x="180" y="142" width="100" height="8" rx="4" fill="var(--accent-primary)" opacity="0.4" />
        <rect x="180" y="158" width="80" height="6" rx="3" fill="var(--border-light)" />
      </svg>`,
  },
  {
    title: text("AI 成交预测", "AI deal prediction"),
    copy: text(
      "AI 直接嵌入在客户详情中，点击即可获得成交概率评估、流失风险预警和建议的下一步操作。",
      "AI lives inside customer details. Click to get deal probability assessment, churn risk warnings, and suggested next steps."
    ),
    illustration: `
      <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="200" rx="16" fill="var(--accent-soft)" />
        <circle cx="80" cy="100" r="60" fill="none" stroke="var(--accent-primary)" stroke-width="8" stroke-dasharray="280 100" stroke-linecap="round" />
        <text x="80" y="96" text-anchor="middle" fill="var(--accent-strong)" font-size="28" font-weight="700">78%</text>
        <text x="80" y="118" text-anchor="middle" fill="var(--text-tertiary)" font-size="11">${text ? '成交概率' : 'Deal probability'}</text>
        <rect x="170" y="30" width="130" height="36" rx="10" fill="var(--surface-glass)" />
        <rect x="170" y="76" width="130" height="36" rx="10" fill="var(--surface-glass)" />
        <rect x="170" y="122" width="130" height="36" rx="10" fill="var(--surface-glass)" />
        <circle cx="188" cy="48" r="6" fill="var(--success-solid)" opacity="0.6" />
        <rect x="202" y="44" width="80" height="8" rx="4" fill="var(--border-default)" opacity="0.4" />
        <circle cx="188" cy="94" r="6" fill="var(--warning-solid)" opacity="0.6" />
        <rect x="202" y="90" width="70" height="8" rx="4" fill="var(--border-default)" opacity="0.4" />
        <circle cx="188" cy="140" r="6" fill="var(--accent-primary)" opacity="0.6" />
        <rect x="202" y="136" width="85" height="8" rx="4" fill="var(--border-default)" opacity="0.4" />
      </svg>`,
  },
  {
    title: text("权限驱动的导航", "Permission-driven navigation"),
    copy: text(
      "成员、经理、管理员看到的界面本身就是不同产品层。导航、功能和数据边界全部由角色权限自动决定。",
      "Members, managers, and admins see genuinely different product layers. Navigation, features, and data boundaries are all determined by role permissions."
    ),
    illustration: `
      <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="200" rx="16" fill="var(--accent-soft)" />
        <rect x="20" y="30" width="88" height="150" rx="12" fill="var(--surface-glass)" />
        <rect x="116" y="30" width="88" height="150" rx="12" fill="var(--surface-glass)" />
        <rect x="212" y="30" width="88" height="150" rx="12" fill="var(--surface-glass)" />
        <text x="64" y="60" text-anchor="middle" fill="var(--text-tertiary)" font-size="10" font-weight="700">${text ? '成员' : 'Member'}</text>
        <rect x="32" y="74" width="64" height="8" rx="4" fill="var(--accent-primary)" opacity="0.5" />
        <rect x="32" y="90" width="54" height="8" rx="4" fill="var(--border-light)" />
        <rect x="32" y="106" width="48" height="8" rx="4" fill="var(--border-light)" />
        <rect x="32" y="134" width="64" height="22" rx="6" fill="var(--accent-primary)" opacity="0.15" />
        <text x="160" y="60" text-anchor="middle" fill="var(--text-tertiary)" font-size="10" font-weight="700">${text ? '经理' : 'Manager'}</text>
        <rect x="128" y="74" width="64" height="8" rx="4" fill="var(--accent-primary)" opacity="0.5" />
        <rect x="128" y="90" width="54" height="8" rx="4" fill="var(--border-light)" />
        <rect x="128" y="106" width="48" height="8" rx="4" fill="var(--border-light)" />
        <rect x="128" y="122" width="60" height="8" rx="4" fill="var(--accent-primary)" opacity="0.3" />
        <rect x="128" y="134" width="64" height="22" rx="6" fill="var(--accent-primary)" opacity="0.15" />
        <text x="256" y="60" text-anchor="middle" fill="var(--text-tertiary)" font-size="10" font-weight="700">${text ? '管理员' : 'Admin'}</text>
        <rect x="224" y="74" width="64" height="8" rx="4" fill="var(--accent-primary)" opacity="0.5" />
        <rect x="224" y="90" width="54" height="8" rx="4" fill="var(--border-light)" />
        <rect x="224" y="106" width="48" height="8" rx="4" fill="var(--border-light)" />
        <rect x="224" y="122" width="60" height="8" rx="4" fill="var(--accent-primary)" opacity="0.3" />
        <rect x="224" y="138" width="55" height="8" rx="4" fill="var(--accent-primary)" opacity="0.3" />
        <rect x="224" y="154" width="64" height="22" rx="6" fill="var(--accent-primary)" opacity="0.15" />
      </svg>`,
  },
]);

/* ── AI Chat Demo ──────────────────────────────────────────────────────── */
const chatContainer = ref<HTMLElement | null>(null);
const isTyping = ref(false);
const chatInput = ref("");
const chatMessages = ref<{ role: string; text: string }[]>([]);

const preWrittenMessages = computed(() => [
  { role: "user", text: text("帮我分析本月销售趋势", "Analyze this month's sales trend for me") },
  { role: "ai", text: text(
    "根据数据分析，本月销售趋势呈现三个关键信号：\n\n1. 新客户转化率较上月提升 12%，主要集中在华东区域。\n2. 高意向客户流失预警新增 3 条，建议优先跟进。\n3. 签约周期平均缩短至 8.5 天，成交概率 78% 以上的客户占比 34%。",
    "Based on data analysis, this month's sales trend shows three key signals:\n\n1. New customer conversion rate increased by 12% vs last month, mainly in East China.\n2. Three new churn warnings for high-intent customers — recommend priority follow-up.\n3. Average deal cycle shortened to 8.5 days, customers above 78% deal probability account for 34%."
  ) },
  { role: "user", text: text("哪些客户需要优先跟进？", "Which customers need priority follow-up?") },
  { role: "ai", text: text(
    "根据成交概率和活跃度综合评估，以下 3 位客户建议今日优先跟进：\n\n• 王经理（华东科技）— 成交概率 85%，最后跟进 3 天前\n• 张总（鼎盛集团）— 流失预警触发，建议立即联系\n• 李总监（创新互联）— 合同谈判阶段，本周可促成签约",
    "Based on comprehensive assessment, the following 3 customers are recommended for priority follow-up today:\n\n• Manager Wang (East China Tech) — 85% deal probability, last follow-up 3 days ago\n• CEO Zhang (Dingsheng Group) — Churn warning triggered, recommend immediate contact\n• Director Li (Innovation Internet) — Contract negotiation stage, can close this week"
  ) },
]);

let messageIndex = 0;

function sendMessage() {
  if (isTyping.value || messageIndex >= preWrittenMessages.value.length) return;

  const msg = preWrittenMessages.value[messageIndex];
  chatMessages.value.push({ role: msg.role, text: msg.text });
  messageIndex++;

  // 切换到下一条用户输入
  if (messageIndex < preWrittenMessages.value.length) {
    const next = preWrittenMessages.value[messageIndex];
    chatInput.value = next.role === "user" ? next.text : "";
  } else {
    chatInput.value = "";
  }

  if (msg.role === "user" && messageIndex < preWrittenMessages.value.length) {
    isTyping.value = true;
    const aiMsg = preWrittenMessages.value[messageIndex];
    messageIndex++;

    // 延迟后开始流式输出
    setTimeout(() => {
      isTyping.value = false;
      chatMessages.value.push({ role: "ai", text: "" });
      const reactiveMsg = chatMessages.value[chatMessages.value.length - 1];

      const chars = [...aiMsg.text];
      let charIdx = 0;

      const stream = () => {
        if (charIdx < chars.length) {
          reactiveMsg.text += chars[charIdx];
          charIdx++;
          nextTick(() => scrollToBottom());
          setTimeout(stream, 18 + Math.random() * 22);
        } else {
          // 流式输出完毕，切换到下一条用户输入
          if (messageIndex < preWrittenMessages.value.length) {
            const next = preWrittenMessages.value[messageIndex];
            chatInput.value = next.role === "user" ? next.text : "";
          } else {
            chatInput.value = "";
          }
        }
      };

      stream();
    }, 800);
  }

  nextTick(() => scrollToBottom());
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

/* ── Direction Stories ─────────────────────────────────────────────────── */
const directionStories = computed(() => [
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    title: text("客户执行优先", "Customer execution first"),
    copy: text(
      "产品的核心不是管理界面，而是销售人员每天推进客户的操作体验。每一个功能都从「一线人员需要什么」出发。",
      "The core isn't admin panels — it's the daily customer-push experience for frontline sales. Every feature starts from \"what does the rep need?\""
    ),
  },
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    title: text("AI 嵌入流程", "AI embedded in flow"),
    copy: text(
      "AI 不是独立模块，而是嵌入在成交判断、流失预警和日报生成等关键节点，加速而不是打断销售节奏。",
      "AI lives inside deal scoring, churn alerts, and daily reports — accelerating, not interrupting, the sales rhythm."
    ),
  },
  {
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    title: text("权限即产品边界", "Permissions as product boundary"),
    copy: text(
      "三层角色不是事后加的权限开关，而是产品结构的骨架。成员、经理、管理员看到的界面本身就是不同产品层。",
      "Three role layers aren't bolted-on permission toggles — they're the product skeleton. Each role sees a genuinely different product layer."
    ),
  },
]);

/* ── AI Insights ───────────────────────────────────────────────────────── */
const expandedInsight = ref<number | null>(null);

function toggleInsight(idx: number) {
  expandedInsight.value = expandedInsight.value === idx ? null : idx;
}

const aiInsights = computed(() => [
  {
    title: text("高意向客户流失预警", "High-intent customer churn warning"),
    summary: text("华东区域 3 位高意向客户活跃度下降超过 40%，建议立即安排跟进。", "3 high-intent customers in East China saw activity drop over 40%. Recommend immediate follow-up."),
    detail: text("AI 预测：若 48 小时内未跟进，成交概率将从 78% 降至 42%。建议联系话术：「最近是否有新的采购计划？」，最佳联系时间为工作日上午 10:00-11:30。", "AI prediction: If no follow-up within 48 hours, deal probability will drop from 78% to 42%. Suggested approach: \"Any new procurement plans?\" Best contact time: weekday 10:00-11:30 AM."),
    level: "warning",
    time: text("2 小时前", "2h ago"),
  },
  {
    title: text("成交概率分析更新", "Deal probability analysis updated"),
    summary: text("鼎盛集团的成交概率从 65% 提升至 82%，签约周期预计缩短至 5 天。", "Dingsheng Group's deal probability rose from 65% to 82%. Expected signing cycle shortened to 5 days."),
    detail: text("AI 预示：客户在最近 3 次互动中表现出明确的采购意向信号。建议在下次跟进时提供最终报价方案，预计本周内可以完成签约。", "AI prediction: The customer showed clear procurement intent signals in the last 3 interactions. Recommend providing the final quote in the next follow-up. Signing expected within this week."),
    level: "success",
    time: text("4 小时前", "4h ago"),
  },
  {
    title: text("日报生成完成", "Daily report generated"),
    summary: text("今日销售日报已自动生成，包含 12 条关键动作和 3 条 AI 建议。", "Today's sales report has been auto-generated, including 12 key actions and 3 AI recommendations."),
    detail: text("AI 总结：本周整体销售节奏优于上周，新线索进入量增长 15%。建议关注华南区域的跟进频率下降问题，可以考虑增加团队协作频次。", "AI summary: This week's overall sales rhythm outperforms last week, with new lead inflow growing 15%. Recommend monitoring the decline in follow-up frequency in the South China region."),
    level: "info",
    time: text("6 小时前", "6h ago"),
  },
]);
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════
   Landing Page — Premium Style
   ══════════════════════════════════════════════════════════════════════════ */

.landing-page {
  display: grid;
  gap: 28px;
}

/* ── Shared card base ────────────────────────────────────────────────────── */
.hero-card,
.signal-card,
.direction-card,
.preview-metric,
.metric-card,
.detail-card,
.cta-card,
.ai-logo-card,
.feature-card {
  position: relative;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

/* ── Shine pseudo ────────────────────────────────────────────────────────── */
.hero-card::after,
.cta-card::after,
.detail-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--gradient-shine);
  transform: translateX(-120%);
  transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  z-index: 0;
}
.hero-card:hover::after,
.cta-card:hover::after,
.detail-card:hover::after { transform: translateX(120%); }

/* ══════════════════════════════════════════════════════════════════════════
   Hero card
   ══════════════════════════════════════════════════════════════════════════ */
.hero-card {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
  gap: 24px;
  padding: 38px;
  background: var(--gradient-mesh), var(--gradient-card);
  border-color: var(--border-light);
  box-shadow: var(--shadow-elevated);
}

.hero-card::before {
  content: "";
  position: absolute;
  inset: auto -12% -32% auto;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96,171,255,0.22) 0%, rgba(35,113,196,0.06) 50%, transparent 72%);
  pointer-events: none;
  animation: sp-float 6s ease-in-out infinite;
}

.hero-copy,
.hero-preview,
.section-heading,
.cta-copy {
  position: relative;
  z-index: 1;
}

.hero-copy {
  display: grid;
  gap: 20px;
  align-content: start;
}

.eyebrow {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-headline {
  display: grid;
  gap: 14px;
}

.hero-kicker {
  width: fit-content;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-accent);
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
}

.hero-card h1 {
  color: var(--text-primary);
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.hero-description {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

.hero-actions,
.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primary-link,
.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 24px;
  border-radius: var(--radius-full);
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base),
    background var(--transition-base),
    opacity var(--transition-fast);
}

.primary-link {
  background: var(--accent-gradient);
  color: var(--text-inverse);
  box-shadow: var(--shadow-accent);
  border: 1px solid transparent;
}
.primary-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(35,113,196,0.28), 0 4px 12px rgba(35,113,196,0.14);
  opacity: 0.96;
}

.secondary-link {
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-sm));
}
.secondary-link:hover {
  transform: translateY(-2px);
  border-color: var(--border-default);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-sm);
}

/* ── Hero metrics ────────────────────────────────────────────────────────── */
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 18px 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--gradient-card);
  backdrop-filter: blur(var(--blur-sm));
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
.metric-card dt {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}
.metric-card dd {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

/* ── Hero preview ────────────────────────────────────────────────────────── */
.hero-preview {
  display: flex;
  align-items: stretch;
}

.preview-surface {
  width: 100%;
  padding: 24px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  background: var(--gradient-mesh), var(--gradient-glass);
  backdrop-filter: blur(var(--blur-md));
  display: grid;
  gap: 18px;
  box-shadow: var(--shadow-soft);
}

.preview-surface__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.preview-label,
.preview-metric span,
.signal-card p {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-surface__header strong {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.preview-chip {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  border: 1px solid var(--border-accent);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.preview-metric {
  padding: 18px;
  border-radius: var(--radius-lg);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-sm));
  display: grid;
  gap: 8px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.preview-metric:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
.preview-metric strong {
  color: var(--text-primary);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.12;
}
.preview-metric p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.signal-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.signal-card {
  padding: 18px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-accent);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-sm));
  display: grid;
  gap: 8px;
}
.signal-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover), 0 0 0 1px var(--accent-glow);
  border-color: rgba(35,113,196,0.32);
}
.signal-card strong {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.28;
}
.signal-card span {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

/* ══════════════════════════════════════════════════════════════════════════
   Section block
   ══════════════════════════════════════════════════════════════════════════ */
.section-block {
  display: grid;
  gap: 20px;
}

.section-block--soft {
  padding: 28px;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  background: var(--gradient-mesh), var(--gradient-card);
  box-shadow: var(--shadow-soft);
}

.section-heading {
  display: grid;
  gap: 12px;
  max-width: 860px;
}

.section-heading h2 {
  color: var(--text-primary);
  font-size: clamp(28px, 3.8vw, 42px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.section-heading span {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

/* ══════════════════════════════════════════════════════════════════════════
   AI Logo Row
   ══════════════════════════════════════════════════════════════════════════ */
.ai-logo-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.ai-logo-card {
  display: grid;
  gap: 8px;
  padding: 20px 16px;
  place-items: center;
  text-align: center;
  cursor: default;
}
.ai-logo-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-accent);
}

.ai-logo-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(96,171,255,0.1), rgba(35,113,196,0.06));
  color: var(--accent-strong);
}

.ai-logo-icon--plus {
  background: var(--accent-soft);
  border: 1.5px dashed var(--border-accent);
}

.ai-logo-card strong {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.ai-logo-type {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 600;
}

.ai-logo-card--custom {
  border-style: dashed;
  background: repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--accent-soft) 6px, var(--accent-soft) 6px, var(--accent-soft) 7px);
}

/* ══════════════════════════════════════════════════════════════════════════
   Feature Grid (3-col)
   ══════════════════════════════════════════════════════════════════════════ */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  overflow: hidden;
  display: grid;
}
.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.feature-visual {
  width: 100%;
  aspect-ratio: 16/10;
  overflow: hidden;
}
.feature-visual :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.feature-body {
  padding: 22px 24px 26px;
  display: grid;
  gap: 10px;
}
.feature-body h3 {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.28;
}
.feature-body p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

/* ══════════════════════════════════════════════════════════════════════════
   AI Chat Demo
   ══════════════════════════════════════════════════════════════════════════ */
.chat-demo { max-width: 720px; }

.chat-window {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border-light);
  background: var(--gradient-card);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.chat-header-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-default);
}
.chat-header-dot--green {
  background: var(--success-solid);
  box-shadow: 0 0 8px rgba(46,160,67,0.3);
}

.chat-messages {
  padding: 20px 22px;
  display: grid;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
  min-height: 180px;
}

.chat-bubble {
  display: grid;
  gap: 8px;
  max-width: 88%;
}
.chat-bubble--user { justify-self: end; }
.chat-bubble--user p {
  background: var(--accent-gradient);
  color: var(--text-inverse);
  padding: 12px 18px;
  border-radius: 18px 18px 4px 18px;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.chat-bubble--ai {
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
}

.chat-ai-avatar {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.chat-bubble--ai p {
  background: var(--surface-primary);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  padding: 12px 18px;
  border-radius: 4px 18px 18px 18px;
  font-size: 14px;
  line-height: 1.75;
  margin: 0;
  white-space: pre-line;
}

.chat-typing {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 14px 18px;
  background: var(--surface-primary);
  border: 1px solid var(--border-light);
  border-radius: 4px 18px 18px 18px;
}
.chat-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-primary);
  opacity: 0.4;
  animation: sp-dot-blink 1.4s infinite;
}
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }

.chat-input-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--border-light);
  background: var(--gradient-card);
}

.chat-input {
  padding: 12px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}
.chat-input:hover {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.chat-send-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  border: none;
  background: var(--accent-gradient);
  color: var(--text-inverse);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.chat-send-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

/* ══════════════════════════════════════════════════════════════════════════
   Direction Section
   ══════════════════════════════════════════════════════════════════════════ */
.direction-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.85fr);
  gap: 28px;
  align-items: start;
}

.direction-content {
  display: grid;
  gap: 20px;
}

.direction-cards {
  display: grid;
  gap: 16px;
}

.direction-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  padding: 22px;
  align-items: start;
}
.direction-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.direction-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(96,171,255,0.1), rgba(35,113,196,0.06));
  color: var(--accent-strong);
}
.direction-card strong {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.direction-card p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
  margin: 6px 0 0;
}

.direction-visual {
  position: sticky;
  top: 100px;
}
.direction-svg {
  width: 100%;
  height: auto;
}

/* ══════════════════════════════════════════════════════════════════════════
   Workspace Preview
   ══════════════════════════════════════════════════════════════════════════ */
.workspace-preview {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  min-height: 420px;
}

.ws-sidebar {
  background: var(--gradient-card);
  border-right: 1px solid var(--border-light);
  padding: 20px 14px;
  display: grid;
  gap: 20px;
  align-content: start;
}

.ws-sidebar-header {
  display: grid;
  gap: 8px;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr);
}
.ws-logo-circle {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent-gradient);
  color: var(--text-inverse);
  font-size: 11px;
  font-weight: 700;
}
.ws-sidebar-header span {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.ws-sidebar-menu {
  display: grid;
  gap: 4px;
}
.ws-menu-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: default;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.ws-menu-item--active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.ws-main {
  display: grid;
  gap: 18px;
  padding: 24px;
  align-content: start;
}

.ws-main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.ws-main-header h3 {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
}
.ws-date-badge {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  border: 1px solid var(--border-accent);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.ws-insight-list {
  display: grid;
  gap: 12px;
}

.ws-insight-card {
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--gradient-card);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}
.ws-insight-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.ws-insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.ws-insight-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ws-insight-dot--warning { background: var(--warning-solid); }
.ws-insight-dot--success { background: var(--success-solid); }
.ws-insight-dot--info    { background: var(--accent-primary); }

.ws-insight-header strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}
.ws-insight-time {
  margin-left: auto;
  color: var(--text-quaternary);
  font-size: 12px;
  font-weight: 600;
}
.ws-insight-card > p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.ws-insight-detail {
  margin-top: 14px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  border: 1px solid var(--border-accent);
  animation: sp-slide-up 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.ws-insight-ai-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.ws-insight-detail-content p {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.75;
  margin: 0;
}

/* ══════════════════════════════════════════════════════════════════════════
   Detail cards
   ══════════════════════════════════════════════════════════════════════════ */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.detail-card {
  display: grid;
  gap: 10px;
  padding: 24px;
  text-decoration: none;
}
.detail-card > p {
  position: relative;
  z-index: 1;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.detail-card > strong {
  position: relative;
  z-index: 1;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}
.detail-card > span {
  position: relative;
  z-index: 1;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

/* ══════════════════════════════════════════════════════════════════════════
   CTA card
   ══════════════════════════════════════════════════════════════════════════ */
.cta-card {
  padding: 30px 32px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  background: var(--gradient-mesh), var(--gradient-warm);
  border-color: var(--border-light);
  box-shadow: var(--shadow-elevated);
}
.cta-copy {
  display: grid;
  gap: 12px;
}
.cta-copy h2 {
  color: var(--text-primary);
  font-size: clamp(28px, 3.8vw, 42px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.cta-copy span {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

/* ══════════════════════════════════════════════════════════════════════════
   Scroll-reveal
   ══════════════════════════════════════════════════════════════════════════ */
.scroll-reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.scroll-reveal.scroll-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ══════════════════════════════════════════════════════════════════════════
   Responsive
   ══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1180px) {
  .hero-card,
  .cta-card { grid-template-columns: 1fr; }
  .direction-section { grid-template-columns: 1fr; }
  .direction-visual { position: static; }
}

@media (max-width: 1080px) {
  .ai-logo-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 960px) {
  .feature-grid { grid-template-columns: 1fr; }
  .ai-logo-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hero-metrics,
  .preview-grid,
  .signal-stack,
  .detail-grid { grid-template-columns: 1fr; }
  .hero-card { padding: 28px; }
  .section-block--soft,
  .cta-card { padding: 24px; }
  .workspace-preview { grid-template-columns: 1fr; }
  .ws-sidebar { display: none; }
}

@media (max-width: 720px) {
  .ai-logo-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .direction-card { grid-template-columns: 1fr; }
  .hero-card { padding: 22px; gap: 18px; }
  .cta-card { padding: 22px; grid-template-columns: 1fr; }
  .preview-surface__header { flex-direction: column; }
  .metric-card { padding: 14px 14px 16px; }
}
</style>
