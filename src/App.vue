<template>
  <div class="app-root">
    <GlobalLoadingOverlay />
    <router-view />
    <AccountSettingsDialog />
    <CommandPalette />
    <OnboardingCarousel />
  </div>
</template>

<script setup lang="ts">
import GlobalLoadingOverlay from "@/components/layout/GlobalLoadingOverlay.vue";
import AccountSettingsDialog from "@/components/layout/AccountSettingsDialog.vue";
import CommandPalette from "@/components/layout/CommandPalette.vue";
import OnboardingCarousel from "@/components/layout/OnboardingCarousel.vue";
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  color: var(--text-primary);
}
</style>
