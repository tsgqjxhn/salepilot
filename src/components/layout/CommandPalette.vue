<template>
  <teleport to="body">
    <div v-if="uiStore.commandPaletteOpen" class="palette-overlay" @click="uiStore.closeCommandPalette()">
      <div class="palette-panel" @click.stop>
        <div class="palette-search">
          <input
            ref="inputRef"
            v-model.trim="keyword"
            type="text"
            :placeholder="text('输入命令或页面名称', 'Search commands or destinations')"
            @keydown.enter.prevent="runAction(filteredActions[0])"
            @keydown.esc.prevent="uiStore.closeCommandPalette()"
          />
          <span>Ctrl + L</span>
        </div>

        <div class="palette-list">
          <button
            v-for="action in filteredActions"
            :key="action.id"
            type="button"
            class="palette-item"
            @click="runAction(action)"
          >
            <strong>{{ action.label }}</strong>
            <span>{{ action.description }}</span>
          </button>

          <p v-if="!filteredActions.length" class="palette-empty">
            {{ text("没有匹配的命令", "No commands match your search") }}
          </p>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { usePermissions } from "@/composables/usePermissions";
import { useLocalizedText } from "@/composables/useLocalizedText";

interface PaletteAction {
  id: string;
  label: string;
  description: string;
  run: () => void | Promise<void>;
}

defineOptions({
  name: "CommandPalette",
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUiStore();
const permissions = usePermissions();
const { text } = useLocalizedText();
const keyword = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const isAuthenticated = computed(() => authStore.isLogedIn() || Boolean(authStore.getRefreshToken()));

const allActions = computed<PaletteAction[]>(() => {
  if (!isAuthenticated.value) {
    return [];
  }

  const actions: PaletteAction[] = [
    {
      id: "settings",
      label: text("打开账户设置", "Open account settings"),
      description: text("语言、主题、资料、导入导出", "Language, theme, profile, import, and export"),
      run: () => uiStore.openSettingsDialog(),
    },
    {
      id: "welcome",
      label: text("重新打开欢迎引导", "Reopen welcome tour"),
      description: text("查看注册后的轮播说明", "Show the onboarding carousel again"),
      run: () => uiStore.openOnboarding(),
    },
  ];

  if (permissions.can("customers.view", { fallbackRoles: ["user", "manager", "admin"] })) {
    actions.push(
      {
        id: "customers",
        label: text("客户列表", "Customers"),
        description: text("查看全部客户记录", "Browse customer records"),
        run: async () => {
          await router.push("/customer");
        },
      },
      {
        id: "customer-board",
        label: text("客户看板", "Customer board"),
        description: text("按阶段查看客户", "View customers by stage"),
        run: async () => {
          await router.push("/customer/board");
        },
      },
    );
  }

  if (permissions.can("notifications.view", { fallbackRoles: ["user", "manager", "admin"] })) {
    actions.push({
      id: "notifications",
      label: text("通知中心", "Notifications"),
      description: text("查看预警和提醒", "Review alerts and reminders"),
      run: async () => {
        await router.push("/notifications");
      },
    });
  }

  if (permissions.can("reports.view", { fallbackRoles: ["user", "manager", "admin"] })) {
    actions.push(
      {
        id: "daily-report",
        label: text("AI 日报", "AI daily report"),
        description: text("打开日报工作区", "Open the report workspace"),
        run: async () => {
          await router.push("/reports/daily");
        },
      },
      {
        id: "sales-dashboard",
        label: text("销售看板", "Sales dashboard"),
        description: text("查看趋势、漏斗和排行", "Review trends, funnel, and ranking"),
        run: async () => {
          await router.push("/reports/sales");
        },
      },
    );
  }

  if (permissions.can("admin.access", { fallbackRoles: ["admin"] })) {
    actions.push({
      id: "admin",
      label: text("管理员控制台", "Admin console"),
      description: text("管理成员和角色权限", "Manage users and role access"),
      run: async () => {
        await router.push("/admin");
      },
    });
  }

  return actions;
});

const filteredActions = computed(() => {
  const search = keyword.value.toLowerCase();
  if (!search) {
    return allActions.value;
  }

  return allActions.value.filter((action) => (
    action.label.toLowerCase().includes(search) || action.description.toLowerCase().includes(search)
  ));
});

const runAction = async (action?: PaletteAction) => {
  if (!action) {
    return;
  }

  uiStore.closeCommandPalette();
  keyword.value = "";
  await action.run();
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (!isAuthenticated.value || route.path.startsWith("/auth") || route.path === "/home") {
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    uiStore.openCommandPalette();
  }
};

watch(
  () => uiStore.commandPaletteOpen,
  async (isOpen) => {
    if (!isOpen) {
      keyword.value = "";
      return;
    }

    await nextTick();
    inputRef.value?.focus();
  },
);

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-color);
  display: grid;
  place-items: start center;
  padding-top: 12vh;
  z-index: 1200;
}

.palette-panel {
  width: min(720px, calc(100vw - 24px));
  border-radius: 24px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.palette-search {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light);
}

.palette-search input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 18px;
  outline: none;
}

.palette-search span {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.palette-list {
  display: grid;
  gap: 10px;
  padding: 18px;
  max-height: 60vh;
  overflow-y: auto;
}

.palette-item {
  display: grid;
  gap: 6px;
  text-align: left;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid var(--border-light);
  background: var(--surface-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.palette-item:hover {
  transform: translateY(-1px);
  border-color: var(--accent-primary);
}

.palette-item span,
.palette-empty {
  color: var(--text-secondary);
  line-height: 1.6;
}

.palette-empty {
  padding: 20px 8px 8px;
}
</style>
