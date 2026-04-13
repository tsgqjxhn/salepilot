<template>
  <div class="project-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">{{ project?.name || "项目详情" }}</h1>
      </div>
      <div class="header-actions">
        <el-button v-permission="'customers.update'" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button v-permission="'customers.create'" type="primary" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入订单
        </el-button>
        <el-button v-permission="'ai.analysis.run'" type="success" @click="handleAnalyze">
          <el-icon><DataAnalysis /></el-icon>
          分析数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <!-- 左侧：项目信息 -->
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">项目信息</span>
          </template>
          <el-descriptions :column="1" border v-if="project">
            <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(project.status)" size="small">
                {{ getStatusLabel(project.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述">{{ project.description || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ project.createdBy?.username || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(project.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDate(project.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card" style="margin-top: 20px">
          <template #header>
            <span class="card-title">项目成员 ({{ project?.members?.length || 0 }})</span>
          </template>
          <el-empty v-if="!project?.members?.length" description="暂无成员" :image-size="80" />
          <div v-else class="member-list">
            <el-tag
              v-for="member in project.members"
              :key="member._id"
              class="member-tag"
              size="large"
            >
              <el-avatar :size="24" class="member-avatar">
                {{ member.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              {{ member.username }}
            </el-tag>
          </div>
        </el-card>

        <el-card class="info-card" style="margin-top: 20px">
          <template #header>
            <span class="card-title">关联客户 ({{ project?.customers?.length || 0 }})</span>
          </template>
          <el-empty v-if="!project?.customers?.length" description="暂无关联客户" :image-size="80" />
          <div v-else class="customer-list">
            <el-tag
              v-for="customer in project.customers"
              :key="customer._id"
              class="customer-tag"
              size="large"
              @click="handleViewCustomer(customer)"
            >
              {{ customer.name }}
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：分析结果 -->
      <el-col :span="16">
        <!-- 核心指标 -->
        <el-card class="stats-card">
          <template #header>
            <span class="card-title">核心指标</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总收入</div>
                <div class="stat-value">{{ formatCurrency(analysisResults?.totalRevenue || 0) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">平均订单值</div>
                <div class="stat-value">{{ formatCurrency(analysisResults?.averageOrderValue || 0) }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">订单数量</div>
                <div class="stat-value">{{ analysisResults?.orderCount || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">同比增长</div>
                <div class="stat-value" :class="getGrowthClass(analysisResults?.trends?.growthRate || 0)">
                  {{ formatPercent(analysisResults?.trends?.growthRate || 0) }}
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 顶级客户 -->
        <el-card class="stats-card" style="margin-top: 20px">
          <template #header>
            <span class="card-title">顶级客户</span>
          </template>
          <el-empty v-if="!analysisResults?.topCustomers?.length" description="暂无数据" :image-size="80" />
          <el-table v-else :data="analysisResults.topCustomers" stripe style="width: 100%">
            <el-table-column prop="customerName" label="客户名称" min-width="150" />
            <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.totalAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
          </el-table>
        </el-card>

        <!-- 月度趋势 -->
        <el-card class="stats-card" style="margin-top: 20px">
          <template #header>
            <span class="card-title">月度趋势</span>
          </template>
          <el-empty v-if="!analysisResults?.trends?.monthlyTrend?.length" description="暂无数据" :image-size="80" />
          <el-table v-else :data="analysisResults.trends.monthlyTrend" stripe style="width: 100%">
            <el-table-column prop="month" label="月份" width="120" />
            <el-table-column prop="revenue" label="收入" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.revenue) }}
              </template>
            </el-table-column>
            <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
          </el-table>
        </el-card>

        <!-- 订单列表 -->
        <el-card class="stats-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">订单列表 ({{ project?.importedOrders?.length || 0 }})</span>
            </div>
          </template>
          <el-empty v-if="!project?.importedOrders?.length" description="暂无订单" :image-size="80" />
          <el-table v-else :data="project.importedOrders" stripe style="width: 100%" max-height="400">
            <el-table-column prop="orderId" label="订单 ID" width="120" show-overflow-tooltip />
            <el-table-column prop="customerName" label="客户名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.source === 'company' ? 'primary' : 'success'" size="small">
                  {{ row.source === 'company' ? "公司" : "用户" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                {{ row.status || "-" }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  DataAnalysis,
  Edit,
  Upload,
} from "@element-plus/icons-vue";
import {
  getProjectDetail,
  analyzeProject,
  type Project,
  type AnalysisResults,
  type ProjectStatus,
} from "@/api/project";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "ProjectDetail",
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const analyzing = ref(false);
const project = ref<Project | null>(null);

const analysisResults = computed<AnalysisResults | undefined>(() => {
  return project.value?.analysisResults;
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

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const getGrowthClass = (value: number): string => {
  if (value > 0) return "growth-positive";
  if (value < 0) return "growth-negative";
  return "";
};

const loadProjectDetail = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const response = await getProjectDetail(id);
    const payload = unwrapApiResponseData(response, "获取项目详情失败");
    project.value = payload;
  } catch (error) {
    console.error("加载项目详情失败:", error);
    ElMessage.error("加载项目详情失败");
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push("/project");
};

const handleEdit = () => {
  router.push(`/project/form/${project.value?._id}`);
};

const handleImport = () => {
  router.push(`/project/${project.value?._id}/import`);
};

const handleAnalyze = async () => {
  if (!project.value?._id) return;

  analyzing.value = true;
  try {
    const response = await analyzeProject(project.value._id);
    const payload = unwrapApiResponseData(response, "分析失败");
    ElMessage.success(`分析完成，共 ${payload.orderCount} 条订单`);
    await loadProjectDetail();
  } catch (error) {
    console.error("分析项目失败:", error);
    ElMessage.error("分析项目失败");
  } finally {
    analyzing.value = false;
  }
};

const handleViewCustomer = (customer: { _id: string }) => {
  router.push(`/customer/${customer._id}`);
};

onMounted(() => {
  loadProjectDetail();
});
</script>

<style scoped>
.project-detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card,
.stats-card {
  min-height: 200px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--surface-secondary);
  border-radius: 12px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.growth-positive {
  color: #16a34a;
}

.growth-negative {
  color: #dc2626;
}

.member-list,
.customer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.member-avatar {
  background: var(--accent-primary);
  color: white;
}

.customer-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.customer-tag:hover {
  background: var(--accent-primary);
  color: white;
}
</style>
