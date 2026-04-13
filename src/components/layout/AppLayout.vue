<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-layout__main">
      <main class="app-layout__body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from "@/components/layout/Sidebar.vue";

defineOptions({
  name: "AppLayout",
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  background: var(--surface-primary);
  overflow: visible;
  transition: grid-template-columns var(--transition-smooth);
}

.app-layout__main {
  min-width: 0;
  min-height: 100vh;
  overflow: visible;
  position: relative;
  background: var(--gradient-mesh);
}

.app-layout__body {
  min-width: 0;
  max-width: min(1440px, 100%);
  margin: 0 auto;
  padding: 28px 32px;
  overflow: visible;
  animation: sp-fade-in 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .app-layout__body {
    padding: 20px 16px;
  }
}

@media (min-width: 1440px) {
  .app-layout__body {
    padding: 32px 40px;
  }
}
</style>
