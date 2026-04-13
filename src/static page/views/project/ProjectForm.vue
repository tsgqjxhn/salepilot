<template>
  <div class="project-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">{{ isEditMode ? "编辑项目" : "新建项目" }}</h1>
      </div>
    </div>

    <el-card class="form-card" v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入项目名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择项目状态" style="width: 100%">
                <el-option label="进行中" value="active" />
                <el-option label="已完成" value="completed" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入项目描述（可选）"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="项目成员">
          <el-select
            v-model="formData.memberIds"
            multiple
            filterable
            placeholder="选择项目成员"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user._id"
              :label="user.username"
              :value="user._id"
            >
              <div class="user-option">
                <el-avatar :size="24" class="user-avatar">
                  {{ user.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span>{{ user.username }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="关联客户">
          <el-select
            v-model="formData.customerIds"
            multiple
            filterable
            placeholder="选择关联客户"
            style="width: 100%"
          >
            <el-option
              v-for="customer in customerOptions"
              :key="customer._id"
              :label="customer.name"
              :value="customer._id"
            >
              <div class="customer-option">
                <span>{{ customer.name }}</span>
                <el-tag size="small" type="info">{{ customer.level || "C" }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEditMode ? "保存修改" : "创建项目" }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import {
  getProjectDetail,
  createProject,
  updateProject,
  type ProjectFormData,
} from "@/api/project";
import { getAdminUserList } from "@/api/admin";
import { getCustomerList } from "@/api/customer";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "ProjectForm",
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const userOptions = ref<Array<{ _id: string; username: string; email: string }>>([]);
const customerOptions = ref<Array<{ _id: string; name: string; level?: string }>>([]);

const projectId = computed(() => route.params.id as string);
const isEditMode = computed(() => Boolean(projectId.value));

const formData = ref<ProjectFormData>({
  name: "",
  description: "",
  status: "active",
  memberIds: [],
  customerIds: [],
});

const formRules = ref<FormRules>({
  name: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 2, max: 100, message: "项目名称长度应在 2-100 个字符之间", trigger: "blur" },
  ],
  status: [
    { required: true, message: "请选择项目状态", trigger: "change" },
  ],
});

const loadProjectData = async () => {
  if (!projectId.value) return;

  loading.value = true;
  try {
    const response = await getProjectDetail(projectId.value);
    const payload = unwrapApiResponseData(response, "获取项目详情失败");

    formData.value = {
      name: payload.name,
      description: payload.description || "",
      status: payload.status,
      memberIds: payload.members?.map(m => m._id) || [],
      customerIds: payload.customers?.map(c => c._id) || [],
    };
  } catch (error) {
    console.error("加载项目数据失败:", error);
    ElMessage.error("加载项目数据失败");
  } finally {
    loading.value = false;
  }
};

const loadCustomerOptions = async () => {
  try {
    const response = await getCustomerList({ limit: 100, scope: "company" });
    const payload = unwrapApiResponseData(response, "加载客户列表失败");
    customerOptions.value = payload.list;
  } catch (error) {
    console.error("加载客户列表失败:", error);
  }
};

const loadUserOptions = async () => {
  try {
    const response = await getAdminUserList({
      limit: 100,
      includeSystemReserved: true,
    });
    const payload = unwrapApiResponseData(response, "加载成员列表失败");
    userOptions.value = payload.list.map((user) => ({
      _id: user.id,
      username: user.username,
      email: user.email,
    }));
  } catch {
    const cachedUser = localStorage.getItem("user_info");
    if (!cachedUser) {
      userOptions.value = [];
      return;
    }

    try {
      const parsedUser = JSON.parse(cachedUser) as {
        id?: string;
        _id?: string;
        username?: string;
        email?: string;
      };
      const fallbackId = parsedUser.id || parsedUser._id;
      userOptions.value = fallbackId
        ? [{
            _id: fallbackId,
            username: parsedUser.username || "当前用户",
            email: parsedUser.email || "",
          }]
        : [];
    } catch {
      userOptions.value = [];
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (isEditMode.value) {
        await updateProject(projectId.value, formData.value);
        ElMessage.success("项目更新成功");
      } else {
        await createProject(formData.value);
        ElMessage.success("项目创建成功");
      }
      handleBack();
    } catch (error) {
      console.error("保存项目失败:", error);
      ElMessage.error("保存项目失败");
    } finally {
      submitting.value = false;
    }
  });
};

const handleBack = () => {
  router.push("/project");
};

onMounted(() => {
  loadProjectData();
  loadCustomerOptions();
  loadUserOptions();
});
</script>

<style scoped>
.project-form-container {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.form-card {
  max-width: 900px;
}

.user-option,
.customer-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background: var(--accent-primary);
  color: white;
}

.user-email {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
