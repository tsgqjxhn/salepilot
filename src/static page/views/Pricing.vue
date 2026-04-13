<template>
  <div class="pricing-page">
    <section class="hero-section">
      <p class="eyebrow">{{ bilingual("", "Pricing") }}</p>
      <h1 class="hero-title">
        {{ text("", "Choose the right plan for your team") }}
      </h1>
      <p class="hero-subtitle">
        {{
          text(
            "",
            "All plans include customer management, AI-powered insights, and team collaboration features. Scale up as your business grows.",
          )
        }}
      </p>
    </section>

    <section class="plan-grid">
      <article v-for="plan in plans" :key="plan.key" class="plan-card">
        <div class="plan-header">
          <p class="plan-label">{{ text("", plan.label) }}</p>
          <div class="plan-pricing">
            <strong class="plan-price">{{
              formatPlanPrice(plan.priceMonthlyUsd, language)
            }}</strong>
            <span class="plan-period">{{ formatPlanPeriod(language) }}</span>
          </div>
          <p class="plan-summary">{{ text("", plan.summary) }}</p>
        </div>

        <dl class="plan-metrics">
          <div class="metric-item">
            <dt>{{ text("", "Seats") }}</dt>
            <dd>{{ formatPlanQuota(plan.maxUsers) }}</dd>
          </div>
          <div class="metric-item">
            <dt>{{ text("", "Customers") }}</dt>
            <dd>{{ formatPlanQuota(plan.maxCustomers) }}</dd>
          </div>
          <div class="metric-item">
            <dt>{{ text("", "AI calls") }}</dt>
            <dd>{{ formatPlanQuota(plan.aiCalls) }}</dd>
          </div>
        </dl>

        <ul class="plan-features">
          <li>
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>{{ text("", "Customer management") }}</span>
          </li>
          <li>
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>{{ text("", "Team collaboration") }}</span>
          </li>
          <li>
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>{{ text("", "AI-powered insights") }}</span>
          </li>
          <li>
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>{{ text("", "Daily reporting") }}</span>
          </li>
        </ul>

        <router-link to="/auth/register" class="plan-cta">
          {{ text("", "Start with") }} {{ text("", plan.label) }}
        </router-link>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { useLocalizedText } from "@/composables/useLocalizedText";
import {
  WORKSPACE_PLAN_DEFINITIONS,
  formatPlanPeriod,
  formatPlanPrice,
  formatPlanQuota,
} from "@/constants/workspacePlans";

defineOptions({
  name: "PricingPage",
});

const { text, bilingual, language } = useLocalizedText();
const plans = WORKSPACE_PLAN_DEFINITIONS;
</script>

<style scoped>
/* ── Page Layout ── */
.pricing-page {
  display: grid;
  gap: 32px;
  animation: sp-fade-in 0.4s ease both;
}

/* ── Hero Section ── */
.hero-section {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  padding: 12px 0 4px;
  animation: sp-slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.eyebrow {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-title {
  color: var(--text-primary);
  font-size: clamp(32px, 5vw, 46px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto;
}

/* ── Plan Grid ── */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  animation: sp-slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}

/* ── Plan Card ── */
.plan-card {
  position: relative;
  background: var(--gradient-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-base);
}

.plan-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-shine);
  transform: translateX(-120%);
  transition: transform 600ms ease;
  pointer-events: none;
}

.plan-card:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-4px);
}

.plan-card:hover::after {
  transform: translateX(120%);
}

/* ── Recommended Plan (middle card) ── */
.plan-card:nth-child(2) {
  border-color: var(--border-accent);
  box-shadow:
    var(--shadow-card),
    0 0 0 1px var(--border-accent),
    0 0 24px var(--accent-glow);
}

.plan-card:nth-child(2):hover {
  box-shadow:
    var(--shadow-card-hover),
    0 0 0 1px var(--accent-primary),
    0 0 32px var(--accent-glow),
    0 0 64px rgba(35, 113, 196, 0.06);
  transform: translateY(-6px);
}

/* ── Plan Header ── */
.plan-header {
  display: grid;
  gap: 12px;
}

.plan-label {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.plan-pricing {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.plan-price {
  color: var(--text-primary);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.plan-period {
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 600;
}

.plan-summary {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

/* ── Plan Metrics ── */
.plan-metrics {
  display: grid;
  gap: 10px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--surface-glass-weak);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.metric-item:hover {
  background: var(--surface-glass);
  border-color: var(--border-default);
}

.metric-item dt {
  color: var(--text-secondary);
  font-size: 14px;
}

.metric-item dd {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

/* ── Plan Features ── */
.plan-features {
  display: grid;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 14px;
}

.feature-icon {
  font-size: 16px;
  flex-shrink: 0;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ── Plan CTA ── */
.plan-cta {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 14px 20px;
  border-radius: var(--radius-full);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  margin-top: auto;
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  transition:
    background var(--transition-base),
    color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-base);
}

.plan-cta:hover {
  background: var(--accent-gradient);
  border-color: transparent;
  box-shadow: var(--shadow-accent);
  color: #fff;
  transform: translateY(-2px);
}

.plan-card:nth-child(2) .plan-cta {
  background: var(--accent-gradient);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--shadow-accent);
}

.plan-card:nth-child(2) .plan-cta:hover {
  box-shadow:
    var(--shadow-accent),
    0 4px 16px rgba(35, 113, 196, 0.16);
  transform: translateY(-2px);
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .plan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }

  .hero-section {
    text-align: left;
  }
}
</style>
