<template>
  <section class="forbidden-page">
    <div class="forbidden-card">
      <p class="eyebrow">Restricted Workspace</p>
      <h1>403</h1>
      <p class="title">{{ title }}</p>
      <p class="description">
        {{ description }}
      </p>
      <div class="actions">
        <button type="button" class="action-button action-button--primary" @click="router.push('/home')">
          返回首页
        </button>
        <button type="button" class="action-button" @click="router.back()">
          返回上一页
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const reason = computed(() => String(route.query.reason || ""));
const title = computed(() => {
  if (reason.value === "company-unverified") {
    return "未认证公司身份";
  }

  if (reason.value === "role") {
    return "身份权限不匹配";
  }

  return "访问被拒绝";
});

const description = computed(() => {
  if (reason.value === "company-unverified") {
    return "未获得授权进入公司或销售组，请先完成公司认证、等待审批通过，或使用有效的 24 小时密钥进入。";
  }

  if (reason.value === "role") {
    return "当前账户身份无法打开这个页面，请切换到符合要求的身份或联系公司管理员调整角色。";
  }

  const permission = String(route.query.permission || "").trim();
  return permission
    ? `当前账户缺少权限：${permission}。请检查公司认证、销售组授权或角色口令设置。`
    : "当前账户没有权限打开这个 SalePilot 页面。";
});
</script>

<style scoped>
.forbidden-page {
  min-height: calc(100vh - 48px);
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top, rgba(205, 196, 171, 0.25), transparent 42%),
    linear-gradient(180deg, rgb(250, 249, 245) 0%, rgb(243, 240, 231) 100%);
}

.forbidden-card {
  width: min(100%, 560px);
  padding: 40px 36px;
  border: 1px solid rgb(220, 217, 207);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 28px 60px rgba(26, 25, 23, 0.08);
  text-align: center;
}

.eyebrow {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(120, 113, 93);
}

h1 {
  margin: 0;
  font-size: clamp(72px, 16vw, 108px);
  line-height: 0.9;
  color: rgb(26, 25, 23);
}

.title {
  margin: 18px 0 10px;
  font-size: 28px;
  font-weight: 700;
  color: rgb(26, 25, 23);
}

.description {
  margin: 0 auto;
  max-width: 380px;
  font-size: 15px;
  line-height: 1.7;
  color: rgb(88, 86, 80);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.action-button {
  min-width: 132px;
  padding: 12px 18px;
  border: 1px solid rgb(195, 192, 180);
  border-radius: 999px;
  background: rgb(255, 255, 255);
  color: rgb(26, 25, 23);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(26, 25, 23, 0.08);
  border-color: rgb(171, 164, 145);
}

.action-button--primary {
  background: rgb(26, 25, 23);
  color: rgb(250, 249, 245);
  border-color: rgb(26, 25, 23);
}

@media (max-width: 640px) {
  .forbidden-card {
    padding: 32px 24px;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
