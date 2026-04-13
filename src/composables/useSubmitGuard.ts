import { computed, onBeforeUnmount, ref } from "vue";

const DEFAULT_COOLDOWN_MS = 800;

interface UseSubmitGuardOptions {
  cooldownMs?: number;
}

export function useSubmitGuard(options: UseSubmitGuardOptions = {}) {
  const cooldownMs = Math.max(0, options.cooldownMs ?? DEFAULT_COOLDOWN_MS);
  const isRunning = ref(false);
  const isCoolingDown = ref(false);

  let cooldownTimer: ReturnType<typeof window.setTimeout> | null = null;

  const clearCooldownTimer = () => {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
  };

  const reset = () => {
    clearCooldownTimer();
    isCoolingDown.value = false;
  };

  const startCooldown = () => {
    clearCooldownTimer();

    if (cooldownMs === 0) {
      isCoolingDown.value = false;
      return;
    }

    isCoolingDown.value = true;
    cooldownTimer = window.setTimeout(() => {
      isCoolingDown.value = false;
      cooldownTimer = null;
    }, cooldownMs);
  };

  const run = async <T>(action: () => Promise<T> | T) => {
    if (isRunning.value || isCoolingDown.value) {
      return undefined;
    }

    isRunning.value = true;
    startCooldown();

    try {
      return await action();
    } finally {
      isRunning.value = false;
    }
  };

  const isBlocked = computed(() => isRunning.value || isCoolingDown.value);

  onBeforeUnmount(() => {
    reset();
  });

  return {
    run,
    reset,
    isRunning,
    isCoolingDown,
    isBlocked,
  };
}
