<template>
  <div class="dev-page">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">{{ bilingual("开发者", "Developers") }}</p>
        <h1>{{ text("由独立开发者打造的销售工作区", "A sales workspace built by an independent developer") }}</h1>
        <span class="hero-intro">{{
          text(
            "SalePilot 由李太虚独立设计并开发，专注解决销售团队在客户执行、AI 分析和权限治理上的真实痛点。",
            "SalePilot is designed and built by Li Taixu, focused on solving real pain points in customer execution, AI analysis, and permission governance for sales teams."
          )
        }}</span>

        <div class="hero-actions">
          <router-link to="/workspace" class="primary-link">{{ text("进入工作区", "Enter workspace") }}</router-link>
          <router-link to="/pricing" class="secondary-link">{{ text("查看定价", "View pricing") }}</router-link>
        </div>
      </div>

      <article class="hero-preview">
        <div class="preview-header">
          <div>
            <span class="preview-label">{{ text("开发者档案", "Developer profile") }}</span>
            <strong>{{ text("李太虚", "Li Taixu") }}</strong>
          </div>
          <span class="preview-chip">{{ text("独立开发", "Indie") }}</span>
        </div>

        <div class="preview-stats">
          <div class="preview-stat">
            <strong>{{ text("全栈", "Full-stack") }}</strong>
            <span>{{ text("前后端独立交付", "End-to-end delivery") }}</span>
          </div>
          <div class="preview-stat">
            <strong>{{ text("AI + 工作流", "AI + Workflow") }}</strong>
            <span>{{ text("嵌入式智能分析", "Embedded intelligence") }}</span>
          </div>
          <div class="preview-stat">
            <strong>{{ text("权限架构", "RBAC") }}</strong>
            <span>{{ text("三层角色治理", "Three-role governance") }}</span>
          </div>
        </div>

        <div class="preview-tags">
          <span v-for="tag in devTags" :key="tag" class="preview-tag">{{ tag }}</span>
        </div>
      </article>
    </section>

    <section class="section-block section-block--soft">
      <div class="section-heading">
        <p class="eyebrow">{{ text("技术架构", "Tech stack") }}</p>
        <h2>{{ text("前端、后端、AI 各层的技术选型和设计取向。", "Technology choices and design decisions across front-end, back-end, and AI layers.") }}</h2>
      </div>

      <div class="stack-grid">
        <article v-for="layer in techLayers" :key="layer.title" class="stack-card">
          <p class="stack-label">{{ layer.label }}</p>
          <strong>{{ layer.title }}</strong>
          <span>{{ layer.copy }}</span>
          <div class="stack-badges">
            <span v-for="badge in layer.badges" :key="badge" class="stack-badge">{{ badge }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">{{ text("产品方向", "Product direction") }}</p>
        <h2>{{ text("不是功能堆叠，而是为销售组织量身定制的操作面板。", "Not a feature pile — a purpose-built operating surface for sales organizations.") }}</h2>
      </div>

      <div class="story-grid">
        <article v-for="story in directionStories" :key="story.title" class="story-card">
          <span class="story-icon" v-html="story.icon" />
          <h3>{{ story.title }}</h3>
          <p>{{ story.copy }}</p>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">{{ text("开发原则", "Principles") }}</p>
        <h2>{{ text("指导产品设计和工程决策的核心原则。", "Core principles guiding product design and engineering decisions.") }}</h2>
      </div>

      <div class="principles-grid">
        <article v-for="p in principles" :key="p.title" class="principle-card">
          <span class="principle-index">{{ p.index }}</span>
          <div>
            <strong>{{ p.title }}</strong>
            <p>{{ p.copy }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="detail-grid">
      <router-link to="/home" class="detail-card">
        <p>{{ bilingual("首页", "Home") }}</p>
        <strong>{{ text("了解产品的整体结构和角色设计。", "Understand the product structure and role design.") }}</strong>
        <span>{{ text("三层角色、日常工作流、访客入口设计。", "Three role layers, daily workflow, guest shell design.") }}</span>
      </router-link>

      <router-link to="/pricing" class="detail-card">
        <p>{{ bilingual("定价", "Pricing") }}</p>
        <strong>{{ text("查看与工作区配额对应的套餐层级。", "Review plan tiers mapped to workspace limits.") }}</strong>
        <span>{{ text("席位、客户容量和 AI 调用额度。", "Seats, customer capacity, and AI call quotas.") }}</span>
      </router-link>
    </section>

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
import { computed, onMounted, onBeforeUnmount } from "vue";
import { useLocalizedText } from "@/composables/useLocalizedText";

defineOptions({ name: "DevelopersPage" });

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

  const page = document.querySelector(".dev-page");
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
    ".stack-grid > .stack-card",
    ".story-grid > .story-card",
    ".principles-grid > .principle-card",
    ".detail-grid > .detail-card",
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

/* ── Data ──────────────────────────────────────────────────────────────── */
const devTags = computed(() => [
  text("Vue 3", "Vue 3"),
  text("TypeScript", "TypeScript"),
  text("Node.js", "Node.js"),
  text("AI 集成", "AI Integration"),
  text("RBAC", "RBAC"),
  text("Element Plus", "Element Plus"),
]);

const techLayers = computed(() => [
  {
    label: text("前端", "Front-end"),
    title: text("Vue 3 + TypeScript", "Vue 3 + TypeScript"),
    copy: text("组件化架构、Composition API、响应式状态管理，配合 Element Plus 构建高一致性的操作界面。", "Component architecture, Composition API, reactive state management, with Element Plus for high-consistency UI."),
    badges: ["Vue 3", "TypeScript", "Vite", "Pinia", "Element Plus"],
  },
  {
    label: text("后端", "Back-end"),
    title: text("Node.js 服务层", "Node.js service layer"),
    copy: text("RESTful API、JWT 认证、角色权限中间件、数据库 ORM，支撑工作区的业务逻辑和数据持久化。", "RESTful API, JWT auth, role middleware, ORM — powering workspace business logic and data persistence."),
    badges: ["Node.js", "Express", "JWT", "ORM", "REST API"],
  },
  {
    label: text("AI", "AI layer"),
    title: text("嵌入式分析引擎", "Embedded analysis engine"),
    copy: text("成交预测、流失预警、日报自动生成——AI 直接嵌入业务节点，不是独立工具。", "Deal prediction, churn alerts, auto-generated daily reports — AI embedded in business nodes, not a standalone tool."),
    badges: [text("成交预测", "Deal scoring"), text("流失预警", "Churn alerts"), text("日报生成", "Reports")],
  },
]);

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

const principles = computed(() => [
  {
    index: "01",
    title: text("功能服务于操作", "Features serve operations"),
    copy: text("不堆功能。每个能力都对应一个具体的销售操作节点，没有「看起来有用但没人用」的模块。", "No feature piles. Every capability maps to a concrete sales operation — no \"looks useful, nobody uses it\" modules."),
  },
  {
    index: "02",
    title: text("确定性界面 + 智能辅助", "Deterministic UI + intelligent assist"),
    copy: text("核心操作界面保持确定性，AI 以分析和建议的形式嵌入，不改变用户的操作预期。", "Core UI stays deterministic. AI enters as analysis and suggestions, never changing the user's operation expectations."),
  },
  {
    index: "03",
    title: text("最小权限设计", "Least-privilege design"),
    copy: text("每个角色只能看到和操作自己层级应该接触的数据和功能，边界清晰，不越权。", "Each role sees and touches only the data and functions appropriate for their level — clear boundaries, no overreach."),
  },
  {
    index: "04",
    title: text("独立开发，持续迭代", "Indie-built, continuously iterated"),
    copy: text("一个人完成全栈设计、开发和维护。决策链条短，用户反馈直接影响产品方向。", "One person handles full-stack design, development, and maintenance. Short decision chain, user feedback directly shapes direction."),
  },
]);
</script>

<style scoped>
.dev-page {
  display: grid;
  gap: 28px;
}

/* ── Shared card base ────────────────────────────────────────────────────── */
.hero-card,
.story-card,
.stack-card,
.principle-card,
.detail-card,
.cta-card {
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

/* ── Hero card ───────────────────────────────────────────────────────────── */
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

.hero-copy {
  display: grid;
  gap: 20px;
  align-content: start;
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card h1 {
  color: var(--text-primary);
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: -0.05em;
}

.hero-intro {
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

/* ── Hero preview panel ──────────────────────────────────────────────────── */
.hero-preview {
  position: relative;
  z-index: 1;
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

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.preview-label {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-header strong {
  display: block;
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 4px;
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

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.preview-stat {
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(var(--blur-sm));
  display: grid;
  gap: 4px;
}
.preview-stat strong { color: var(--text-primary); font-size: 15px; font-weight: 700; }
.preview-stat span { color: var(--text-secondary); font-size: 12px; }

.preview-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.preview-tag {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: rgba(255,255,255,0.6);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

/* ── Section block ───────────────────────────────────────────────────────── */
.section-block { display: grid; gap: 20px; }

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
  position: relative;
  z-index: 1;
}

.section-heading h2 {
  color: var(--text-primary);
  font-size: clamp(28px, 3.8vw, 42px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}

/* ── Story grid ──────────────────────────────────────────────────────────── */
.story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.story-card {
  padding: 24px;
  display: grid;
  gap: 12px;
}
.story-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.story-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(96,171,255,0.1), rgba(35,113,196,0.06));
  color: var(--accent-strong);
}
.story-card h3 { color: var(--text-primary); font-size: 22px; font-weight: 700; line-height: 1.28; }
.story-card p { color: var(--text-secondary); font-size: 15px; line-height: 1.75; margin: 0; }

/* ── Stack grid ──────────────────────────────────────────────────────────── */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stack-card {
  padding: 24px;
  display: grid;
  gap: 10px;
}
.stack-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.stack-label {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stack-card strong { color: var(--text-primary); font-size: 20px; font-weight: 700; line-height: 1.3; }
.stack-card > span { color: var(--text-secondary); font-size: 14px; line-height: 1.75; }

.stack-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.stack-badge {
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(96,171,255,0.08);
  color: var(--accent-strong);
  font-size: 11px;
  font-weight: 700;
}

/* ── Principles grid ─────────────────────────────────────────────────────── */
.principles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.principle-card {
  padding: 24px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.principle-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-default);
}

.principle-index {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  color: var(--text-inverse, #fff);
  font-size: 12px;
  font-weight: 700;
  box-shadow: var(--shadow-xs), 0 0 8px var(--accent-glow);
}
.principle-card strong { color: var(--text-primary); font-size: 18px; font-weight: 700; line-height: 1.3; }
.principle-card p { color: var(--text-secondary); font-size: 14px; line-height: 1.75; margin: 6px 0 0; }

/* ── Detail cards ────────────────────────────────────────────────────────── */
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
  position: relative; z-index: 1;
  color: var(--accent-strong);
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.detail-card > strong {
  position: relative; z-index: 1;
  color: var(--text-primary);
  font-size: 20px; font-weight: 700; line-height: 1.3;
}
.detail-card > span {
  position: relative; z-index: 1;
  color: var(--text-secondary);
  font-size: 14px; line-height: 1.7;
}

/* ── CTA card ────────────────────────────────────────────────────────────── */
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
  position: relative;
  z-index: 1;
}
.cta-copy h2 {
  color: var(--text-primary);
  font-size: clamp(28px, 3.8vw, 42px);
  line-height: 1.08; font-weight: 700;
  letter-spacing: -0.04em;
}
.cta-copy span {
  color: var(--text-secondary);
  font-size: 16px; line-height: 1.8;
}

/* ── Scroll-reveal ───────────────────────────────────────────────────────── */
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

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 1080px) {
  .hero-card { grid-template-columns: 1fr; }
  .principles-grid { grid-template-columns: 1fr; }
}

@media (max-width: 960px) {
  .story-grid,
  .stack-grid,
  .detail-grid { grid-template-columns: 1fr; }
  .preview-stats { grid-template-columns: 1fr; }
  .hero-card { padding: 28px; }
  .section-block--soft { padding: 24px; }
}

@media (max-width: 720px) {
  .principle-card { grid-template-columns: 1fr; }
  .hero-card { padding: 22px; gap: 18px; }
  .cta-card { padding: 22px; grid-template-columns: 1fr; }
}
</style>
