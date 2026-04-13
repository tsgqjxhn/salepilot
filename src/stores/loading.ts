import { computed, ref } from "vue";
import { defineStore } from "pinia";

export type LoadingSource = "request" | "route" | "stream" | "auth" | "manual";

export interface LoadingTaskOptions {
  source?: LoadingSource;
  label?: string;
  blocking?: boolean;
}

interface LoadingTask {
  token: string;
  source: LoadingSource;
  label: string;
  blocking: boolean;
  startedAt: number;
}

const SOURCE_PRIORITY: Record<LoadingSource, number> = {
  route: 0,
  auth: 1,
  stream: 2,
  request: 3,
  manual: 4,
};

let loadingSequence = 0;

const buildToken = () => `loading-${Date.now()}-${loadingSequence += 1}`;

const buildFallbackLabel = (source: LoadingSource) => {
  switch (source) {
    case "route":
      return "Opening workspace";
    case "auth":
      return "Restoring session";
    case "stream":
      return "Receiving live output";
    case "manual":
      return "Processing action";
    case "request":
    default:
      return "Syncing workspace data";
  }
};

export const useLoadingStore = defineStore("loading", () => {
  const tasks = ref<LoadingTask[]>([]);
  const routeTaskToken = ref<string | null>(null);

  const activeTaskCount = computed(() => tasks.value.length);
  const isActive = computed(() => activeTaskCount.value > 0);
  const isBlocking = computed(() => tasks.value.some((task) => task.blocking));

  const counts = computed(() =>
    tasks.value.reduce<Record<LoadingSource, number>>(
      (result, task) => {
        result[task.source] += 1;
        return result;
      },
      {
        request: 0,
        route: 0,
        stream: 0,
        auth: 0,
        manual: 0,
      },
    ),
  );

  const primaryTask = computed(() => {
    if (!tasks.value.length) {
      return null;
    }

    return [...tasks.value].sort((left, right) => {
      if (left.blocking !== right.blocking) {
        return left.blocking ? -1 : 1;
      }

      if (SOURCE_PRIORITY[left.source] !== SOURCE_PRIORITY[right.source]) {
        return SOURCE_PRIORITY[left.source] - SOURCE_PRIORITY[right.source];
      }

      return left.startedAt - right.startedAt;
    })[0] ?? null;
  });

  const primaryLabel = computed(() => {
    const task = primaryTask.value;
    if (!task) {
      return "";
    }

    return task.label || buildFallbackLabel(task.source);
  });

  const beginTask = ({ source = "request", label, blocking = false }: LoadingTaskOptions = {}) => {
    const token = buildToken();
    tasks.value.push({
      token,
      source,
      label: label?.trim() || buildFallbackLabel(source),
      blocking,
      startedAt: Date.now(),
    });
    return token;
  };

  const updateTask = (token: string | null | undefined, patch: Partial<LoadingTaskOptions>) => {
    if (!token) {
      return;
    }

    const task = tasks.value.find((item) => item.token === token);
    if (!task) {
      return;
    }

    if (patch.source) {
      task.source = patch.source;
    }

    if (typeof patch.label === "string") {
      task.label = patch.label.trim() || buildFallbackLabel(task.source);
    }

    if (typeof patch.blocking === "boolean") {
      task.blocking = patch.blocking;
    }
  };

  const endTask = (token: string | null | undefined) => {
    if (!token) {
      return;
    }

    tasks.value = tasks.value.filter((task) => task.token !== token);

    if (routeTaskToken.value === token) {
      routeTaskToken.value = null;
    }
  };

  const clearAllTasks = () => {
    tasks.value = [];
    routeTaskToken.value = null;
  };

  const startRouteLoading = (label?: string) => {
    if (routeTaskToken.value) {
      updateTask(routeTaskToken.value, {
        label: label || buildFallbackLabel("route"),
        blocking: true,
      });
      return routeTaskToken.value;
    }

    const token = beginTask({
      source: "route",
      label: label || buildFallbackLabel("route"),
      blocking: true,
    });
    routeTaskToken.value = token;
    return token;
  };

  const finishRouteLoading = () => {
    endTask(routeTaskToken.value);
  };

  return {
    tasks,
    counts,
    activeTaskCount,
    isActive,
    isBlocking,
    primaryTask,
    primaryLabel,
    beginTask,
    updateTask,
    endTask,
    clearAllTasks,
    startRouteLoading,
    finishRouteLoading,
  };
});
