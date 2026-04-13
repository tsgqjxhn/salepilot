<template>
  <div class="global-loading" aria-live="polite" :aria-busy="loadingStore.isActive">
    <transition name="global-loading-progress">
      <div v-if="showChrome" class="global-loading__progress">
        <span class="global-loading__progress-bar"></span>
      </div>
    </transition>

    <transition name="global-loading-dock">
      <aside v-if="showDock" class="global-loading__dock">
        <span class="global-loading__pulse"></span>
        <div class="global-loading__dock-copy">
          <strong>{{ statusLabel }}</strong>
          <span>{{ helperLabel }}</span>
        </div>
      </aside>
    </transition>

    <transition name="global-loading-overlay">
      <div v-if="showOverlay" class="global-loading__overlay">
        <section class="global-loading__panel">
          <p class="global-loading__eyebrow">Workspace Status</p>
          <div class="global-loading__headline">
            <h2>{{ statusLabel }}</h2>
            <span class="global-loading__pill">{{ taskCountLabel }}</span>
          </div>
          <p class="global-loading__description">{{ helperLabel }}</p>
          <div class="global-loading__meter" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </section>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useLoadingStore } from "@/stores/loading";

defineOptions({
  name: "GlobalLoadingOverlay",
});

const DISPLAY_DELAY_MS = 120;

const loadingStore = useLoadingStore();
const showChrome = ref(false);

let displayTimer: ReturnType<typeof window.setTimeout> | null = null;

const clearDisplayTimer = () => {
  if (displayTimer) {
    clearTimeout(displayTimer);
    displayTimer = null;
  }
};

watch(
  () => loadingStore.isActive,
  (active) => {
    clearDisplayTimer();

    if (active) {
      displayTimer = window.setTimeout(() => {
        showChrome.value = true;
      }, DISPLAY_DELAY_MS);
      return;
    }

    showChrome.value = false;
  },
  { immediate: true },
);

const taskCountLabel = computed(() => {
  const count = loadingStore.activeTaskCount;
  return `${count} active task${count === 1 ? "" : "s"}`;
});

const statusLabel = computed(() => {
  return loadingStore.primaryLabel || "Syncing workspace";
});

const helperLabel = computed(() => {
  const task = loadingStore.primaryTask;

  if (!task) {
    return "";
  }

  switch (task.source) {
    case "route":
      return "Preparing the next workspace view and resolving access checks.";
    case "auth":
      return "Restoring session state and reconnecting the current workspace.";
    case "stream":
      return "Receiving streamed server output and keeping the page state in sync.";
    case "manual":
      return "Finishing the current action before handing control back to the page.";
    case "request":
    default:
      return "Fetching the latest data while keeping page-level loading states aligned.";
  }
});

const showOverlay = computed(() => showChrome.value && loadingStore.isBlocking);
const showDock = computed(() => showChrome.value && loadingStore.isActive && !loadingStore.isBlocking);

onBeforeUnmount(() => {
  clearDisplayTimer();
});
</script>

<style scoped>
.global-loading {
  pointer-events: none;
}

.global-loading__progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 2200;
  height: 4px;
  overflow: hidden;
  background: rgba(220, 217, 207, 0.68);
  backdrop-filter: blur(12px);
}

.global-loading__progress-bar {
  display: block;
  width: 38%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(26, 25, 23, 0.16), rgba(26, 25, 23, 0.92), rgba(168, 114, 59, 0.82));
  box-shadow: 0 0 18px rgba(26, 25, 23, 0.18);
  animation: global-loading-slide 1.2s ease-in-out infinite;
}

.global-loading__dock {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 2190;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 260px;
  max-width: min(420px, calc(100vw - 40px));
  padding: 14px 16px;
  border: 1px solid rgba(220, 217, 207, 0.92);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 38px rgba(26, 25, 23, 0.1);
  backdrop-filter: blur(18px);
}

.global-loading__dock-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.global-loading__dock-copy strong {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.global-loading__dock-copy span {
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 12px;
  line-height: 1.5;
}

.global-loading__pulse {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--text-primary, rgb(26, 25, 23));
  box-shadow: 0 0 0 0 rgba(26, 25, 23, 0.22);
  animation: global-loading-pulse 1.6s ease-out infinite;
  flex-shrink: 0;
}

.global-loading__overlay {
  position: fixed;
  inset: 0;
  z-index: 2180;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(195, 192, 180, 0.16), transparent 24%),
    rgba(250, 249, 245, 0.74);
  backdrop-filter: blur(12px);
}

.global-loading__panel {
  width: min(540px, calc(100vw - 40px));
  padding: 30px 32px;
  border: 1px solid rgba(220, 217, 207, 0.95);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(195, 192, 180, 0.18), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(244, 242, 236, 0.98));
  box-shadow: 0 28px 60px rgba(26, 25, 23, 0.12);
}

.global-loading__eyebrow {
  margin: 0 0 10px;
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.global-loading__headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.global-loading__headline h2 {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1.02;
}

.global-loading__pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(26, 25, 23, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 12px;
  font-weight: 700;
}

.global-loading__description {
  margin: 14px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 15px;
  line-height: 1.75;
}

.global-loading__meter {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 22px;
}

.global-loading__meter span {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(26, 25, 23, 0.12), rgba(26, 25, 23, 0.9), rgba(168, 114, 59, 0.76));
  background-size: 220% 100%;
  animation: global-loading-meter 1.25s ease-in-out infinite;
}

.global-loading__meter span:nth-child(2) {
  animation-delay: 0.15s;
}

.global-loading__meter span:nth-child(3) {
  animation-delay: 0.3s;
}

.global-loading-progress-enter-active,
.global-loading-progress-leave-active,
.global-loading-dock-enter-active,
.global-loading-dock-leave-active,
.global-loading-overlay-enter-active,
.global-loading-overlay-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.global-loading-progress-enter-from,
.global-loading-progress-leave-to,
.global-loading-dock-enter-from,
.global-loading-dock-leave-to,
.global-loading-overlay-enter-from,
.global-loading-overlay-leave-to {
  opacity: 0;
}

.global-loading-dock-enter-from,
.global-loading-dock-leave-to {
  transform: translateY(-8px);
}

.global-loading-overlay-enter-from,
.global-loading-overlay-leave-to {
  transform: scale(0.985);
}

@keyframes global-loading-slide {
  0% {
    transform: translateX(-120%);
  }

  55% {
    transform: translateX(120%);
  }

  100% {
    transform: translateX(260%);
  }
}

@keyframes global-loading-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(26, 25, 23, 0.24);
  }

  70% {
    box-shadow: 0 0 0 12px rgba(26, 25, 23, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(26, 25, 23, 0);
  }
}

@keyframes global-loading-meter {
  0%,
  100% {
    background-position: 100% 0;
    opacity: 0.52;
  }

  50% {
    background-position: 0 0;
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .global-loading__dock {
    left: 16px;
    right: 16px;
    top: 14px;
    max-width: none;
    min-width: 0;
  }

  .global-loading__panel {
    padding: 24px 22px;
  }
}
</style>
