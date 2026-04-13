import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

export type AppLanguage = "en-US" | "zh-CN";
export type AppTheme = "light" | "dark" | "system";

interface PersistedUiPreferences {
  language: AppLanguage;
  theme: AppTheme;
  onboardingCompleted: boolean;
}

const UI_STORAGE_KEY = "salepilot_ui_preferences";

const isLanguage = (value: unknown): value is AppLanguage => value === "en-US" || value === "zh-CN";
const isTheme = (value: unknown): value is AppTheme => value === "light" || value === "dark" || value === "system";

const resolveSystemTheme = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const loadPersistedPreferences = (): PersistedUiPreferences => {
  const fallback: PersistedUiPreferences = {
    language: "en-US",
    theme: "light",
    onboardingCompleted: false,
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = localStorage.getItem(UI_STORAGE_KEY);
    if (!rawValue) {
      return fallback;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedUiPreferences> | null;
    return {
      language: isLanguage(parsed?.language) ? parsed.language : fallback.language,
      theme: isTheme(parsed?.theme) ? parsed.theme : fallback.theme,
      onboardingCompleted: Boolean(parsed?.onboardingCompleted),
    };
  } catch {
    return fallback;
  }
};

const applyDomPreferences = (language: AppLanguage, theme: AppTheme) => {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = theme === "system" ? resolveSystemTheme() : theme;
  document.documentElement.lang = language;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.body.dataset.theme = resolvedTheme;
};

export const useUiStore = defineStore("ui", () => {
  const initialized = ref(false);
  const language = ref<AppLanguage>("en-US");
  const theme = ref<AppTheme>("light");
  const settingsDialogOpen = ref(false);
  const settingsDialogInitialTab = ref<string | null>(null);
  const commandPaletteOpen = ref(false);
  const onboardingOpen = ref(false);
  const onboardingCompleted = ref(false);
  const onboardingRequired = ref(false);

  const persistPreferences = () => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot: PersistedUiPreferences = {
      language: language.value,
      theme: theme.value,
      onboardingCompleted: onboardingCompleted.value,
    };

    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const initialize = () => {
    if (initialized.value) {
      applyDomPreferences(language.value, theme.value);
      return;
    }

    const persistedPreferences = loadPersistedPreferences();
    language.value = persistedPreferences.language;
    theme.value = persistedPreferences.theme;
    onboardingCompleted.value = persistedPreferences.onboardingCompleted;
    applyDomPreferences(language.value, theme.value);
    initialized.value = true;
  };

  watch(
    [language, theme, onboardingCompleted],
    () => {
      if (!initialized.value) {
        return;
      }

      applyDomPreferences(language.value, theme.value);
      persistPreferences();
    },
    { deep: false },
  );

  const setLanguage = (nextLanguage: AppLanguage) => {
    language.value = nextLanguage;
  };

  const setTheme = (nextTheme: AppTheme) => {
    theme.value = nextTheme;
  };

  const openSettingsDialog = (initialTab?: string) => {
    settingsDialogInitialTab.value = initialTab || null;
    settingsDialogOpen.value = true;
  };

  const closeSettingsDialog = () => {
    settingsDialogOpen.value = false;
    settingsDialogInitialTab.value = null;
  };

  const openCommandPalette = () => {
    commandPaletteOpen.value = true;
  };

  const closeCommandPalette = () => {
    commandPaletteOpen.value = false;
  };

  const openOnboarding = () => {
    onboardingOpen.value = true;
  };

  const closeOnboarding = () => {
    if (onboardingRequired.value) {
      return;
    }

    onboardingOpen.value = false;
  };

  const markOnboardingCompleted = () => {
    onboardingCompleted.value = true;
    onboardingOpen.value = false;
    onboardingRequired.value = false;
  };

  const schedulePostRegistrationOnboarding = () => {
    onboardingCompleted.value = false;
    onboardingOpen.value = true;
    onboardingRequired.value = true;
  };

  return {
    initialized,
    language,
    theme,
    settingsDialogOpen,
    settingsDialogInitialTab,
    commandPaletteOpen,
    onboardingOpen,
    onboardingCompleted,
    onboardingRequired,
    isChinese: computed(() => language.value === "zh-CN"),
    resolvedTheme: computed(() => (theme.value === "system" ? resolveSystemTheme() : theme.value)),
    initialize,
    setLanguage,
    setTheme,
    openSettingsDialog,
    closeSettingsDialog,
    openCommandPalette,
    closeCommandPalette,
    openOnboarding,
    closeOnboarding,
    markOnboardingCompleted,
    schedulePostRegistrationOnboarding,
  };
});
