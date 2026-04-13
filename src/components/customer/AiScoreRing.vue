<template>
  <div class="ai-score-ring" :style="ringVars">
    <div class="ai-score-ring__glow"></div>

    <svg class="ai-score-ring__svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="ai-score-ring__track" cx="60" cy="60" :r="radius" />
      <circle
        class="ai-score-ring__progress"
        cx="60"
        cy="60"
        :r="radius"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>

    <div class="ai-score-ring__content">
      <strong class="ai-score-ring__value">{{ normalizedScore }}</strong>
      <span class="ai-score-ring__label">{{ label }}</span>
      <span v-if="caption" class="ai-score-ring__caption">{{ caption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    score: number;
    label: string;
    caption?: string;
    size?: number;
    strokeWidth?: number;
  }>(),
  {
    caption: "",
    strokeWidth: 10,
  },
);

const normalizedScore = computed(() => Math.min(100, Math.max(0, Math.round(props.score))));
const radius = computed(() => 60 - props.strokeWidth);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - normalizedScore.value / 100));

const ringVars = computed(() => ({
  ...(typeof props.size === "number" ? { "--ring-size": `${props.size}px` } : {}),
  ...(typeof props.strokeWidth === "number" ? { "--ring-stroke": `${props.strokeWidth}px` } : {}),
}));
</script>

<style scoped>
.ai-score-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: min(var(--ring-size, 220px), 100%);
  aspect-ratio: 1;
  border-radius: 50%;
  isolation: isolate;
}

.ai-score-ring__glow {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.92), transparent 46%),
    radial-gradient(circle at center, rgba(235, 233, 225, 0.8), rgba(235, 233, 225, 0.15) 58%, transparent 76%);
}

.ai-score-ring__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  filter: drop-shadow(0 10px 18px rgba(26, 25, 23, 0.08));
}

.ai-score-ring__track,
.ai-score-ring__progress {
  fill: none;
  stroke-width: var(--ring-stroke, 10px);
}

.ai-score-ring__track {
  stroke: rgba(195, 192, 180, 0.34);
}

.ai-score-ring__progress {
  stroke: var(--text-primary, rgb(26, 25, 23));
  stroke-linecap: round;
  transition: stroke-dashoffset 0.65s ease;
}

.ai-score-ring__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: calc(100% - (var(--ring-stroke, 10px) * 3.4));
  aspect-ratio: 1;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    inset 0 0 0 1px rgba(220, 217, 207, 0.92),
    0 16px 28px rgba(26, 25, 23, 0.06);
}

.ai-score-ring__value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: clamp(42px, calc(var(--ring-size, 220px) * 0.24), 56px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
}

.ai-score-ring__label,
.ai-score-ring__caption {
  text-align: center;
}

.ai-score-ring__label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ai-score-ring__caption {
  max-width: 72%;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 13px;
  line-height: 1.4;
}
</style>
