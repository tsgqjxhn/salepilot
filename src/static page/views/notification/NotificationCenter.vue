<template>
  <NotificationCenterPanel />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const NotificationCenterPanel = defineAsyncComponent(
  () => import("@/components/notification/NotificationCenterPanel.vue"),
);

defineOptions({
  name: "NotificationCenterView",
});
</script>
