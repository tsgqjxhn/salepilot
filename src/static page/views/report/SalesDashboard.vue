<template>
  <SalesDashboardWorkspace />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const SalesDashboardWorkspace = defineAsyncComponent(
  () => import("@/components/report/SalesDashboardWorkspace.vue"),
);

defineOptions({
  name: "SalesDashboardView",
});
</script>
