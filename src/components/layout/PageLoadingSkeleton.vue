<template>
  <section class="page-skeleton" aria-hidden="true">
    <template v-if="variant === 'report'">
      <section class="page-skeleton__summary-grid">
        <article v-for="index in summaryCards" :key="`report-summary-${index}`" class="page-skeleton__summary-card">
          <span class="page-skeleton__icon"></span>
          <div class="page-skeleton__summary-copy">
            <span class="page-skeleton__block page-skeleton__block--label"></span>
            <span class="page-skeleton__block page-skeleton__block--value" :style="{ width: summaryValueWidths[index % summaryValueWidths.length] }"></span>
            <span class="page-skeleton__block page-skeleton__block--text" :style="{ width: summaryTextWidths[index % summaryTextWidths.length] }"></span>
          </div>
        </article>
      </section>

      <section class="page-skeleton__content-grid page-skeleton__content-grid--report">
        <article class="page-skeleton__panel page-skeleton__panel--primary">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline page-skeleton__block--headline-lg"></span>
            </div>
            <div class="page-skeleton__pill-row">
              <span class="page-skeleton__pill"></span>
              <span class="page-skeleton__pill page-skeleton__pill--short"></span>
            </div>
          </div>

          <div class="page-skeleton__hero-block">
            <span class="page-skeleton__block page-skeleton__block--label" style="width: 26%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 100%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 92%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 78%"></span>
          </div>

          <div class="page-skeleton__two-up">
            <div v-for="index in 2" :key="`report-section-${index}`" class="page-skeleton__subpanel">
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 100%"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 86%"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 72%"></span>
            </div>
          </div>

          <div class="page-skeleton__subpanel">
            <div class="page-skeleton__panel-head">
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
              <span class="page-skeleton__pill page-skeleton__pill--short"></span>
            </div>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 100%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 94%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 76%"></span>
          </div>
        </article>

        <article class="page-skeleton__panel">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
            </div>
            <span class="page-skeleton__pill"></span>
          </div>

          <div v-for="index in 2" :key="`report-signal-${index}`" class="page-skeleton__signal-group">
            <span class="page-skeleton__pill page-skeleton__pill--short"></span>
            <span class="page-skeleton__block page-skeleton__block--text" style="width: 94%"></span>
            <span class="page-skeleton__block page-skeleton__block--text" style="width: 82%"></span>
            <span class="page-skeleton__block page-skeleton__block--text" style="width: 74%"></span>
          </div>

          <div class="page-skeleton__mini-grid">
            <div v-for="index in 2" :key="`report-meta-${index}`" class="page-skeleton__mini-card">
              <span class="page-skeleton__block page-skeleton__block--label"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 74%"></span>
            </div>
          </div>
        </article>
      </section>

      <section class="page-skeleton__record-head">
        <div class="page-skeleton__panel-copy">
          <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
          <span class="page-skeleton__block page-skeleton__block--headline page-skeleton__block--headline-lg" style="width: 240px"></span>
        </div>
        <span class="page-skeleton__pill"></span>
      </section>

      <section class="page-skeleton__records-grid">
        <article v-for="index in 3" :key="`report-record-${index}`" class="page-skeleton__record-card">
          <div class="page-skeleton__record-headline">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--label" style="width: 72px"></span>
              <span class="page-skeleton__block page-skeleton__block--value" style="width: 84px"></span>
            </div>
            <span class="page-skeleton__icon page-skeleton__icon--small"></span>
          </div>
          <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 100%"></span>
          <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 84%"></span>
          <div class="page-skeleton__record-stack">
            <div v-for="row in 2" :key="`report-record-row-${index}-${row}`" class="page-skeleton__record-item">
              <div class="page-skeleton__record-copy">
                <span class="page-skeleton__block page-skeleton__block--headline"></span>
                <span class="page-skeleton__block page-skeleton__block--text" style="width: 86%"></span>
                <span class="page-skeleton__block page-skeleton__block--text" style="width: 58%"></span>
              </div>
              <span class="page-skeleton__pill page-skeleton__pill--short"></span>
            </div>
          </div>
        </article>
      </section>
    </template>

    <template v-else-if="variant === 'dashboard'">
      <section class="page-skeleton__summary-grid">
        <article v-for="index in summaryCards" :key="`dashboard-summary-${index}`" class="page-skeleton__summary-card">
          <span class="page-skeleton__icon"></span>
          <div class="page-skeleton__summary-copy">
            <span class="page-skeleton__block page-skeleton__block--label"></span>
            <span class="page-skeleton__block page-skeleton__block--value" :style="{ width: summaryValueWidths[index % summaryValueWidths.length] }"></span>
            <span class="page-skeleton__block page-skeleton__block--text" :style="{ width: summaryTextWidths[(index + 2) % summaryTextWidths.length] }"></span>
          </div>
        </article>
      </section>

      <section class="page-skeleton__content-grid page-skeleton__content-grid--dashboard">
        <article class="page-skeleton__panel page-skeleton__panel--primary">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline page-skeleton__block--headline-lg" style="width: 260px"></span>
            </div>
            <div class="page-skeleton__pill-row">
              <span class="page-skeleton__pill"></span>
              <span class="page-skeleton__pill"></span>
            </div>
          </div>

          <div class="page-skeleton__three-up">
            <div v-for="index in 3" :key="`dashboard-compare-${index}`" class="page-skeleton__mini-card">
              <span class="page-skeleton__block page-skeleton__block--label"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 68%"></span>
            </div>
          </div>

          <div class="page-skeleton__chart"></div>
        </article>

        <article class="page-skeleton__panel">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline" style="width: 180px"></span>
            </div>
            <span class="page-skeleton__pill"></span>
          </div>

          <div class="page-skeleton__hero-block page-skeleton__hero-block--compact">
            <span class="page-skeleton__block page-skeleton__block--label" style="width: 30%"></span>
            <span class="page-skeleton__block page-skeleton__block--headline page-skeleton__block--headline-lg" style="width: 54%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 100%"></span>
            <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 84%"></span>
          </div>

          <div class="page-skeleton__mini-grid page-skeleton__mini-grid--quad">
            <div v-for="index in 4" :key="`dashboard-meta-${index}`" class="page-skeleton__mini-card">
              <span class="page-skeleton__block page-skeleton__block--label"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
              <span class="page-skeleton__block page-skeleton__block--text" style="width: 72%"></span>
            </div>
          </div>
        </article>
      </section>

      <section class="page-skeleton__content-grid page-skeleton__content-grid--equal">
        <article v-for="index in 2" :key="`dashboard-row-two-${index}`" class="page-skeleton__panel">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
            </div>
            <span class="page-skeleton__pill"></span>
          </div>
          <div class="page-skeleton__chart"></div>
          <div class="page-skeleton__row-stack">
            <div v-for="row in 3" :key="`dashboard-row-two-${index}-${row}`" class="page-skeleton__metric-row">
              <div class="page-skeleton__metric-copy">
                <span class="page-skeleton__block page-skeleton__block--headline"></span>
                <span class="page-skeleton__block page-skeleton__block--text" style="width: 70%"></span>
              </div>
              <span class="page-skeleton__meter"></span>
              <span class="page-skeleton__block page-skeleton__block--value" style="width: 64px"></span>
            </div>
          </div>
        </article>
      </section>

      <section class="page-skeleton__content-grid page-skeleton__content-grid--equal">
        <article v-for="index in 2" :key="`dashboard-row-three-${index}`" class="page-skeleton__panel">
          <div class="page-skeleton__panel-head">
            <div class="page-skeleton__panel-copy">
              <span class="page-skeleton__block page-skeleton__block--eyebrow"></span>
              <span class="page-skeleton__block page-skeleton__block--headline"></span>
            </div>
            <span class="page-skeleton__pill"></span>
          </div>
          <div class="page-skeleton__chart page-skeleton__chart--compact"></div>
          <div class="page-skeleton__row-stack">
            <div v-for="row in 3" :key="`dashboard-row-three-${index}-${row}`" class="page-skeleton__metric-row">
              <div class="page-skeleton__metric-copy">
                <span class="page-skeleton__block page-skeleton__block--headline"></span>
                <span class="page-skeleton__block page-skeleton__block--text" style="width: 74%"></span>
              </div>
              <span class="page-skeleton__meter page-skeleton__meter--soft"></span>
              <span class="page-skeleton__block page-skeleton__block--value" style="width: 58px"></span>
            </div>
          </div>
        </article>
      </section>
    </template>

    <template v-else>
      <section class="page-skeleton__summary-grid">
        <article v-for="index in summaryCards" :key="`notification-summary-${index}`" class="page-skeleton__summary-card">
          <span class="page-skeleton__icon"></span>
          <div class="page-skeleton__summary-copy">
            <span class="page-skeleton__block page-skeleton__block--label"></span>
            <span class="page-skeleton__block page-skeleton__block--value" :style="{ width: summaryValueWidths[index % summaryValueWidths.length] }"></span>
            <span class="page-skeleton__block page-skeleton__block--text" :style="{ width: summaryTextWidths[index % summaryTextWidths.length] }"></span>
          </div>
        </article>
      </section>

      <section class="page-skeleton__toolbar-grid">
        <article class="page-skeleton__toolbar-card">
          <span class="page-skeleton__block page-skeleton__block--label" style="width: 82px"></span>
          <div class="page-skeleton__pill-row">
            <span v-for="index in 3" :key="`notification-filter-left-${index}`" class="page-skeleton__pill"></span>
          </div>
        </article>
        <article class="page-skeleton__toolbar-card">
          <span class="page-skeleton__block page-skeleton__block--label" style="width: 96px"></span>
          <div class="page-skeleton__pill-row">
            <span v-for="index in 4" :key="`notification-filter-right-${index}`" class="page-skeleton__pill"></span>
          </div>
        </article>
      </section>

      <div class="page-skeleton__strip-row">
        <span v-for="index in 3" :key="`notification-strip-${index}`" class="page-skeleton__pill"></span>
      </div>

      <section class="page-skeleton__toolbar-card">
        <div class="page-skeleton__panel-copy">
          <span class="page-skeleton__block page-skeleton__block--label" style="width: 88px"></span>
          <span class="page-skeleton__block page-skeleton__block--text" style="width: 240px"></span>
        </div>
        <div class="page-skeleton__pill-row">
          <span v-for="index in 4" :key="`notification-level-${index}`" class="page-skeleton__pill"></span>
        </div>
      </section>

      <section class="page-skeleton__list-stack">
        <article v-for="index in 4" :key="`notification-card-${index}`" class="page-skeleton__notice-card">
          <div class="page-skeleton__notice-main">
            <span class="page-skeleton__icon"></span>
            <div class="page-skeleton__notice-copy">
              <div class="page-skeleton__notice-head">
                <div class="page-skeleton__pill-row">
                  <span class="page-skeleton__pill page-skeleton__pill--short"></span>
                  <span class="page-skeleton__block page-skeleton__block--headline page-skeleton__block--headline-lg" :style="{ width: notificationHeadlineWidths[index % notificationHeadlineWidths.length] }"></span>
                </div>
                <span class="page-skeleton__pill page-skeleton__pill--short"></span>
              </div>
              <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 100%"></span>
              <span class="page-skeleton__block page-skeleton__block--paragraph" style="width: 92%"></span>
              <div class="page-skeleton__pill-row">
                <span v-for="chipIndex in 3" :key="`notification-chip-${index}-${chipIndex}`" class="page-skeleton__pill"></span>
              </div>
              <div class="page-skeleton__meta-row">
                <span v-for="metaIndex in 4" :key="`notification-meta-${index}-${metaIndex}`" class="page-skeleton__block page-skeleton__block--meta"></span>
              </div>
            </div>
          </div>
          <div class="page-skeleton__notice-side">
            <div class="page-skeleton__pill-row">
              <span v-for="channelIndex in 2" :key="`notification-channel-${index}-${channelIndex}`" class="page-skeleton__pill page-skeleton__pill--short"></span>
            </div>
            <span class="page-skeleton__button"></span>
            <span class="page-skeleton__button page-skeleton__button--primary"></span>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({
  name: "PageLoadingSkeleton",
});

type SkeletonVariant = "report" | "dashboard" | "notifications";

const props = defineProps<{
  variant: SkeletonVariant;
}>();

const buildRange = (count: number) => Array.from({ length: count }, (_, index) => index);

const summaryCardCount = computed(() => {
  if (props.variant === "dashboard") return 6;
  return 3;
});

const summaryCards = computed(() => buildRange(summaryCardCount.value));
const summaryValueWidths = ["54%", "62%", "48%", "58%", "52%", "60%"];
const summaryTextWidths = ["74%", "68%", "72%", "64%", "78%", "70%"];
const notificationHeadlineWidths = ["44%", "58%", "51%", "63%"];
</script>

<style scoped>
.page-skeleton {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-skeleton__summary-grid,
.page-skeleton__records-grid,
.page-skeleton__toolbar-grid,
.page-skeleton__content-grid,
.page-skeleton__two-up,
.page-skeleton__three-up,
.page-skeleton__mini-grid {
  display: grid;
  gap: 16px;
}

.page-skeleton__summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.page-skeleton__content-grid--report {
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
}

.page-skeleton__content-grid--dashboard {
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.95fr);
}

.page-skeleton__content-grid--equal,
.page-skeleton__toolbar-grid,
.page-skeleton__two-up,
.page-skeleton__mini-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.page-skeleton__three-up {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.page-skeleton__mini-grid--quad {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.page-skeleton__records-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.page-skeleton__summary-card,
.page-skeleton__panel,
.page-skeleton__record-card,
.page-skeleton__toolbar-card,
.page-skeleton__notice-card,
.page-skeleton__record-head {
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background:
    radial-gradient(circle at top right, rgba(195, 192, 180, 0.16), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(244, 242, 236, 0.92));
  box-shadow: 0 14px 32px rgba(26, 25, 23, 0.04);
}

.page-skeleton__summary-card,
.page-skeleton__record-card,
.page-skeleton__toolbar-card {
  border-radius: 22px;
}

.page-skeleton__panel,
.page-skeleton__notice-card,
.page-skeleton__record-head {
  border-radius: 24px;
}

.page-skeleton__summary-card {
  display: flex;
  gap: 16px;
  padding: 20px 22px;
}

.page-skeleton__panel,
.page-skeleton__record-card,
.page-skeleton__toolbar-card,
.page-skeleton__notice-card,
.page-skeleton__record-head {
  padding: 24px;
}

.page-skeleton__summary-copy,
.page-skeleton__panel-copy,
.page-skeleton__notice-copy,
.page-skeleton__metric-copy,
.page-skeleton__record-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.page-skeleton__panel,
.page-skeleton__toolbar-card,
.page-skeleton__record-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-skeleton__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  flex-shrink: 0;
  background: linear-gradient(120deg, rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.56), rgba(235, 233, 225, 0.96));
  background-size: 220% 100%;
  animation: page-skeleton-shimmer 1.8s ease-in-out infinite;
}

.page-skeleton__icon--small {
  width: 40px;
  height: 40px;
  border-radius: 14px;
}

.page-skeleton__block,
.page-skeleton__pill,
.page-skeleton__button,
.page-skeleton__meter,
.page-skeleton__chart {
  position: relative;
  overflow: hidden;
}

.page-skeleton__block::after,
.page-skeleton__pill::after,
.page-skeleton__button::after,
.page-skeleton__meter::after,
.page-skeleton__chart::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  transform: translateX(-120%);
  animation: page-skeleton-sheen 1.9s ease-in-out infinite;
}

.page-skeleton__block {
  display: block;
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(220, 217, 207, 0.56), rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.56));
  background-size: 220% 100%;
  animation: page-skeleton-shimmer 1.8s ease-in-out infinite;
}

.page-skeleton__block--eyebrow,
.page-skeleton__block--label,
.page-skeleton__block--meta {
  height: 12px;
}

.page-skeleton__block--label {
  width: 92px;
}

.page-skeleton__block--headline {
  height: 18px;
  width: 140px;
}

.page-skeleton__block--headline-lg {
  height: 26px;
  width: 200px;
}

.page-skeleton__block--value {
  height: 30px;
}

.page-skeleton__block--text {
  height: 12px;
}

.page-skeleton__block--paragraph {
  height: 14px;
}

.page-skeleton__pill-row,
.page-skeleton__strip-row,
.page-skeleton__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.page-skeleton__pill {
  display: inline-flex;
  width: 112px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.58), rgba(235, 233, 225, 0.96));
  background-size: 220% 100%;
  animation: page-skeleton-shimmer 1.8s ease-in-out infinite;
}

.page-skeleton__pill--short {
  width: 84px;
}

.page-skeleton__button {
  display: inline-flex;
  width: 132px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(120deg, rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.58), rgba(235, 233, 225, 0.96));
  background-size: 220% 100%;
  animation: page-skeleton-shimmer 1.8s ease-in-out infinite;
}

.page-skeleton__button--primary {
  background: linear-gradient(120deg, rgba(88, 86, 80, 0.32), rgba(168, 114, 59, 0.18), rgba(88, 86, 80, 0.32));
}

.page-skeleton__panel-head,
.page-skeleton__record-headline,
.page-skeleton__record-head,
.page-skeleton__notice-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-skeleton__hero-block,
.page-skeleton__subpanel,
.page-skeleton__signal-group,
.page-skeleton__mini-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid rgba(220, 217, 207, 0.9);
  background: rgba(250, 249, 245, 0.9);
}

.page-skeleton__hero-block--compact {
  min-height: 156px;
}

.page-skeleton__chart {
  min-height: 320px;
  border-radius: 20px;
  border: 1px solid rgba(220, 217, 207, 0.9);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(244, 242, 236, 0.94)),
    linear-gradient(120deg, rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.58), rgba(235, 233, 225, 0.96));
}

.page-skeleton__chart--compact {
  min-height: 260px;
}

.page-skeleton__record-head {
  align-items: center;
}

.page-skeleton__record-stack,
.page-skeleton__row-stack,
.page-skeleton__list-stack {
  display: grid;
  gap: 12px;
}

.page-skeleton__record-item,
.page-skeleton__metric-row {
  display: grid;
  gap: 14px;
  align-items: center;
  padding: 14px 0 0;
  border-top: 1px solid rgba(220, 217, 207, 0.72);
}

.page-skeleton__record-item {
  grid-template-columns: minmax(0, 1fr) auto;
}

.page-skeleton__metric-row {
  grid-template-columns: minmax(0, 1.2fr) minmax(120px, 1fr) auto;
  padding: 14px 16px;
  border: 1px solid rgba(220, 217, 207, 0.72);
  border-radius: 18px;
  background: rgba(250, 249, 245, 0.82);
}

.page-skeleton__meter {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(220, 217, 207, 0.56), rgba(235, 233, 225, 0.96), rgba(220, 217, 207, 0.56));
  background-size: 220% 100%;
  animation: page-skeleton-shimmer 1.8s ease-in-out infinite;
}

.page-skeleton__meter--soft {
  background: linear-gradient(120deg, rgba(168, 114, 59, 0.18), rgba(235, 233, 225, 0.96), rgba(168, 114, 59, 0.18));
}

.page-skeleton__notice-card,
.page-skeleton__notice-main,
.page-skeleton__notice-side {
  display: flex;
}

.page-skeleton__notice-card {
  justify-content: space-between;
  gap: 18px;
}

.page-skeleton__notice-main {
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.page-skeleton__notice-side {
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  min-width: 150px;
}

@keyframes page-skeleton-shimmer {
  0%,
  100% {
    background-position: 100% 0;
  }

  50% {
    background-position: 0 0;
  }
}

@keyframes page-skeleton-sheen {
  0% {
    transform: translateX(-120%);
  }

  60%,
  100% {
    transform: translateX(140%);
  }
}

@media (max-width: 1240px) {
  .page-skeleton__summary-grid,
  .page-skeleton__records-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-skeleton__content-grid--report,
  .page-skeleton__content-grid--dashboard,
  .page-skeleton__content-grid--equal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .page-skeleton__summary-grid,
  .page-skeleton__toolbar-grid,
  .page-skeleton__two-up,
  .page-skeleton__three-up,
  .page-skeleton__mini-grid,
  .page-skeleton__records-grid {
    grid-template-columns: 1fr;
  }

  .page-skeleton__notice-card {
    flex-direction: column;
  }

  .page-skeleton__notice-side {
    align-items: flex-start;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .page-skeleton {
    gap: 16px;
  }

  .page-skeleton__panel,
  .page-skeleton__record-card,
  .page-skeleton__toolbar-card,
  .page-skeleton__notice-card,
  .page-skeleton__record-head,
  .page-skeleton__summary-card {
    padding: 18px;
  }

  .page-skeleton__metric-row,
  .page-skeleton__record-item {
    grid-template-columns: 1fr;
  }
}
</style>
