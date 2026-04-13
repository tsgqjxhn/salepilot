<template>
  <div class="project-list-container">
    <div class="page-header">
      <h1 class="page-title">项目列表</h1>
      <div class="header-actions">
        <el-button v-permission="'reports.view'" @click="handleViewStats">
          <el-icon><DataBoard /></el-icon>
          项目统计
        </el-button>
        <el-button v-permission="'customers.create'" type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
      </div>
    </div>

    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="项目名称或描述"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="projectList"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="项目名称" min-width="200" show-overflow-tooltip />

        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdBy" label="创建人" width="120">
          <template #default="{ row }">
            {{ row.createdBy?.username || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="members" label="成员数" width="80" align="center">
          <template #default="{ row }">
            {{ row.members?.length || 0 }}
          </template>
        </el-table-column>

        <el-table-column prop="customers" label="客户数" width="80" align="center">
          <template #default="{ row }">
            {{ row.customers?.length || 0 }}
          </template>
        </el-table-column>

        <el-table-column prop="analysisResults.totalRevenue" label="总收入" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.analysisResults?.totalRevenue || 0) }}
          </template>
        </el-table-column>

        <el-table-column prop="analysisResults.orderCount" label="订单数" width="80" align="center">
          <template #default="{ row }">
            {{ row.analysisResults?.orderCount || 0 }}
          </template>
        </el-table-column>

        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleImport(row)">
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
            <el-button v-permission="'customers.update'" type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button v-permission="'customers.delete'" type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 项目统计对话框 -->
    <el-dialog
      v-model="statsDialogVisible"
      title="项目统计"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border v-if="statsData">
        <el-descriptions-item label="总项目数">{{ statsData.totalProjects }}</el-descriptions-item>
        <el-descriptions-item label="进行中项目">{{ statsData.activeProjects }}</el-descriptions-item>
        <el-descriptions-item label="已完成项目">{{ statsData.completedProjects }}</el-descriptions-item>
        <el-descriptions-item label="已归档项目">{{ statsData.archivedProjects }}</el-descriptions-item>
        <el-descriptions-item label="总收入">{{ formatCurrency(statsData.totalRevenue) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  DataBoard,
  Delete,
  Edit,
  Plus,
  Refresh,
  Search,
  Upload,
  View,
} from "@element-plus/icons-vue";
import {
  getProjectList,
  getProjectStats,
  deleteProject,
  type Project,
  type ProjectListParams,
  type ProjectStats,
  type ProjectStatus,
} from "@/api/project";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "ProjectList",
});

const router = useRouter();

const loading = ref(false);
const projectList = ref<Project[]>([]);
const statsDialogVisible = ref(false);
const statsData = ref<ProjectStats | null>(null);

const searchForm = ref<{
  keyword: string;
  status: ProjectStatus | "";
}>({
  keyword: "",
  status: "",
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
});

const getStatusType = (status: ProjectStatus): "success" | "warning" | "info" => {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "warning";
    case "archived":
      return "info";
    default:
      return "info";
  }
};

const getStatusLabel = (status: ProjectStatus): string => {
  switch (status) {
    case "active":
      return "进行中";
    case "completed":
      return "已完成";
    case "archived":
      return "已归档";
    default:
      return status;
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amount);
};

const loadProjectList = async () => {
  loading.value = true;
  try {
    const params: ProjectListParams = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchForm.value.keyword || undefined,
      status: searchForm.value.status || undefined,
    };

    const response = await getProjectList(params);
    const payload = unwrapApiResponseData(response, "获取项目列表失败");

    projectList.value = payload.list;
    pagination.value.total = payload.total;
  } catch (error) {
    console.error("加载项目列表失败:", error);
    ElMessage.error("加载项目列表失败");
  } finally {
    loading.value = false;
  }
};

const loadProjectStats = async () => {
  try {
    const response = await getProjectStats();
    const payload = unwrapApiResponseData(response, "获取项目统计失败");
    statsData.value = payload;
  } catch (error) {
    console.error("加载项目统计失败:", error);
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadProjectList();
};

const handleReset = () => {
  searchForm.value.keyword = "";
  searchForm.value.status = "";
  pagination.value.page = 1;
  loadProjectList();
};

const handleSizeChange = () => {
  loadProjectList();
};

const handlePageChange = () => {
  loadProjectList();
};

const handleCreate = () => {
  router.push("/project/form");
};

const handleView = (project: Project) => {
  router.push(`/project/${project._id}`);
};

const handleEdit = (project: Project) => {
  router.push(`/project/form/${project._id}`);
};

const handleImport = (project: Project) => {
  router.push(`/project/${project._id}/import`);
};

const handleDelete = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
      "删除项目",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await deleteProject(project._id);
    ElMessage.success("项目删除成功");
    loadProjectList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除项目失败:", error);
      ElMessage.error("删除项目失败");
    }
  }
};

const handleViewStats = async () => {
  await loadProjectStats();
  statsDialogVisible.value = true;
};

watch(
  () => searchForm.value,
  () => {
    handleSearch();
  },
  { deep: true }
);

onMounted(() => {
  loadProjectList();
});
</script>

<style scoped>
.project-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card {
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-card {
  min-height: 400px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
