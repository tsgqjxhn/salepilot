<template>
  <div class="user-profile-page">
    <div class="user-profile-page__header">
      <el-page-header @back="handleBack">
        <template #content>
          <div class="user-profile-page__header-content">
            <h2 class="user-profile-page__title">用户资料</h2>
            <p v-if="user" class="user-profile-page__subtitle">
              {{ user.username }} / {{ user.email || "未填写邮箱" }}
            </p>
          </div>
        </template>
      </el-page-header>
    </div>

    <div class="user-profile-page__content">
      <el-row :gutter="24">
        <el-col :span="8">
          <div class="user-profile-page__sidebar">
            <section class="user-card">
              <el-avatar :size="84" :icon="UserFilled" />
              <h3>{{ user?.username || "未知用户" }}</h3>
              <p>{{ user?.email || "未填写邮箱" }}</p>
              <div class="user-card__meta">
                <el-tag :type="user?.userrole === 'admin' ? 'danger' : user?.userrole === 'manager' ? 'warning' : 'info'">
                  {{ roleLabel }}
                </el-tag>
                <span>加入于 {{ formatDate(user?.createdAt) }}</span>
              </div>
            </section>

            <section class="quick-actions">
              <h4>快捷操作</h4>
              <el-button
                v-permission="'users.manage'"
                type="primary"
                style="width: 100%"
                @click="showFieldManager = true"
              >
                <el-icon><Edit /></el-icon>
                打开字段管理
              </el-button>
            </section>
          </div>
        </el-col>

        <el-col :span="16">
          <div class="user-profile-page__main">
            <section class="user-profile-page__section">
              <MoodTracker :target-user-id="userId" />
            </section>
            <section class="user-profile-page__section">
              <ImageMoodAnalyzer :target-user-id="userId" />
            </section>
            <section class="user-profile-page__section">
              <UserCustomFieldsPanel :target-user-id="userId" />
            </section>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="showFieldManager"
      title="字段管理"
      width="900px"
    >
      <UserFieldManager :target-user-id="userId" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Edit, UserFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ImageMoodAnalyzer from "@/components/user/ImageMoodAnalyzer.vue";
import MoodTracker from "@/components/user/MoodTracker.vue";
import UserCustomFieldsPanel from "@/components/user/UserCustomFieldsPanel.vue";
import UserFieldManager from "@/static page/views/user/UserFieldManager.vue";

interface UserInfo {
  _id: string;
  username: string;
  email: string;
  userrole: string;
  createdAt: string;
}

const router = useRouter();
const route = useRoute();

const userId = ref("");
const user = ref<UserInfo | null>(null);
const showFieldManager = ref(false);

const roleLabel = computed(() => {
  if (user.value?.userrole === "admin") {
    return "管理员";
  }
  if (user.value?.userrole === "manager") {
    return "销售经理";
  }
  return "普通成员";
});

const loadUser = () => {
  const id = String(route.params.id || "");
  if (!id) {
    ElMessage.error("用户 ID 不能为空");
    router.push("/user");
    return;
  }

  userId.value = id;
  user.value = {
    _id: id,
    username: String(route.query.username || "未知用户"),
    email: String(route.query.email || ""),
    userrole: String(route.query.userrole || "user"),
    createdAt: String(route.query.createdAt || new Date().toISOString()),
  };
};

const handleBack = () => {
  router.back();
};

const formatDate = (value?: string) => {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.user-profile-page {
  padding: 24px;
  min-height: 100%;
  background: var(--color-background-soft);
}

.user-profile-page__header {
  margin-bottom: 24px;
}

.user-profile-page__header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-profile-page__title {
  margin: 0;
  font-size: 18px;
  color: var(--color-heading);
}

.user-profile-page__subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-profile-page__content {
  max-width: 1400px;
  margin: 0 auto;
}

.user-profile-page__sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-card,
.quick-actions,
.user-profile-page__section {
  border-radius: 18px;
  background: var(--surface-white);
  box-shadow: var(--shadow-soft);
}

.user-card {
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.user-card h3 {
  margin: 0;
  color: var(--color-heading);
}

.user-card p {
  margin: 0;
  color: var(--text-secondary);
}

.user-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.quick-actions {
  padding: 20px;
}

.quick-actions h4 {
  margin: 0 0 14px;
  color: var(--color-heading);
}

.user-profile-page__main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-profile-page__section {
  padding: 24px;
}
</style>
