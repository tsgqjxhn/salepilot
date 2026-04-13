<template>
  <DailyReportWorkspace />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const DailyReportWorkspace = defineAsyncComponent(
  () => import("@/components/report/DailyReportWorkspace.vue"),
);

defineOptions({
  name: "DailyReportView",
});
</script>
