<template>
  <div class="project-import-page">
    <div class="page-header">
      <div class="page-header__main">
        <el-button @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div>
          <h1>{{ project?.name || "项目导入" }}</h1>
          <p>导入历史交易记录，并基于这些记录生成项目分析结果。</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="9">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>导入方式</span>
            </div>
          </template>

          <div class="source-grid">
            <button
              type="button"
              class="source-card"
              :class="{ 'source-card--active': importMethod === 'file' }"
              @click="importMethod = 'file'"
            >
              <strong>本地文件导入</strong>
              <span>支持 CSV、Excel、JSON 格式的交易记录文件。</span>
            </button>
            <button
              type="button"
              class="source-card"
              :class="{ 'source-card--active': importMethod === 'history' }"
              @click="importMethod = 'history'"
            >
              <strong>系统历史交易导入</strong>
              <span>直接从当前工作区的用户或公司成交记录中导入。</span>
            </button>
          </div>
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>{{ importMethod === "file" ? "文件配置" : "历史交易筛选" }}</span>
            </div>
          </template>

          <div v-if="importMethod === 'file'" class="form-stack">
            <label class="field-block">
              <span>记录归属</span>
              <el-radio-group v-model="fileOrderSource">
                <el-radio-button label="user">用户历史交易</el-radio-button>
                <el-radio-button label="company">公司历史交易</el-radio-button>
              </el-radio-group>
            </label>

            <label class="field-block">
              <span>文件类型</span>
              <el-radio-group v-model="fileType">
                <el-radio-button label="csv">CSV</el-radio-button>
                <el-radio-button label="excel">Excel</el-radio-button>
                <el-radio-button label="json">JSON</el-radio-button>
              </el-radio-group>
            </label>

            <label class="field-block">
              <span>{{ fileTypeLabel }} 文件</span>
              <input
                class="native-file-input"
                type="file"
                :accept="fileAcceptTypes"
                @change="handleFileSelected"
              />
              <small>{{ fileTypeHint }}</small>
            </label>

            <div class="panel-actions">
              <el-button :disabled="!fileRows.length" @click="clearFileSelection">清空文件</el-button>
            </div>
          </div>

          <div v-else class="form-stack">
            <label class="field-block">
              <span>历史范围</span>
              <el-radio-group v-model="historyScope">
                <el-radio-button label="user">当前用户历史交易</el-radio-button>
                <el-radio-button label="company">公司历史交易</el-radio-button>
              </el-radio-group>
            </label>

            <label class="field-block">
              <span>客户筛选</span>
              <el-select
                v-model="selectedCustomerIds"
                multiple
                filterable
                collapse-tags
                placeholder="可选：限定客户"
              >
                <el-option
                  v-for="customer in customerOptions"
                  :key="customer._id"
                  :label="customer.name"
                  :value="customer._id"
                />
              </el-select>
            </label>

            <label class="field-block">
              <span>时间范围</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </label>

            <div class="panel-actions">
              <el-button type="primary" :loading="previewLoading" @click="handlePreviewHistory">
                {{ previewLoading ? "加载中..." : "预览交易记录" }}
              </el-button>
              <el-button @click="clearHistoryPreview">清空预览</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="15">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>导入预览</span>
              <el-tag type="info">{{ previewRows.length }} 条记录</el-tag>
            </div>
          </template>

          <el-empty v-if="!previewRows.length" description="暂无可导入的交易记录" />

          <template v-else>
            <div class="summary-grid">
              <article>
                <strong>{{ previewRows.length }}</strong>
                <span>预览记录数</span>
              </article>
              <article>
                <strong>{{ formatCurrency(previewTotalAmount) }}</strong>
                <span>预估总成交额</span>
              </article>
              <article>
                <strong>{{ activeScopeLabel }}</strong>
                <span>当前导入范围</span>
              </article>
            </div>

            <el-table :data="previewRows.slice(0, 100)" stripe border style="width: 100%">
              <el-table-column prop="orderId" label="订单号" min-width="160" />
              <el-table-column prop="customerName" label="客户" min-width="160" />
              <el-table-column prop="ownerName" label="负责人" min-width="120" />
              <el-table-column prop="date" label="日期" min-width="160">
                <template #default="{ row }">
                  {{ formatDate(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" min-width="120" align="right">
                <template #default="{ row }">
                  {{ formatCurrency(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" min-width="120" />
            </el-table>

            <div class="panel-actions panel-actions--end">
              <el-button type="primary" :loading="importing" @click="handleImport">
                {{ importing ? "导入中..." : "开始导入并分析" }}
              </el-button>
            </div>
          </template>
        </el-card>

        <el-card v-if="importResult" class="panel-card" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>导入结果</span>
              <el-tag type="success">已完成</el-tag>
            </div>
          </template>

          <div class="summary-grid">
            <article>
              <strong>{{ importResult.importedCount }}</strong>
              <span>成功导入记录</span>
            </article>
            <article>
              <strong>{{ formatCurrency(importResult.analysisResults.totalRevenue) }}</strong>
              <span>总成交额</span>
            </article>
            <article>
              <strong>{{ importResult.analysisResults.orderCount }}</strong>
              <span>订单总数</span>
            </article>
            <article>
              <strong>{{ formatCurrency(importResult.analysisResults.averageOrderValue) }}</strong>
              <span>平均客单价</span>
            </article>
          </div>

          <div class="panel-actions panel-actions--end">
            <el-button type="primary" @click="router.push(`/project/${projectId}`)">查看项目详情</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as XLSX from "xlsx";
import { getCustomerList } from "@/api/customer";
import {
  getProjectDetail,
  importCompanyOrders,
  importProjectOrders,
  previewProjectOrders,
  type AnalysisResults,
  type OrderSource,
  type Project,
  type ProjectOrderPreviewRecord,
} from "@/api/project";
import { unwrapApiResponseData } from "@/utils/requestError";

defineOptions({
  name: "ProjectImport",
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const previewLoading = ref(false);
const importing = ref(false);
const importMethod = ref<"file" | "history">("file");
const fileOrderSource = ref<OrderSource>("user");
const historyScope = ref<OrderSource>("user");
const fileType = ref<"csv" | "excel" | "json">("csv");
const fileRows = ref<Array<Record<string, unknown>>>([]);
const historyRows = ref<ProjectOrderPreviewRecord[]>([]);
const customerOptions = ref<Array<{ _id: string; name: string }>>([]);
const selectedCustomerIds = ref<string[]>([]);
const dateRange = ref<[Date, Date] | null>(null);
const project = ref<Project | null>(null);
const importResult = ref<{
  importedCount: number;
  analysisResults: AnalysisResults;
} | null>(null);

const projectId = computed(() => String(route.params.id || ""));

const previewRows = computed<ProjectOrderPreviewRecord[]>(() => {
  if (importMethod.value === "history") {
    return historyRows.value;
  }

  return fileRows.value.map((row, index) => ({
    id: String(index),
    orderId: String(row.orderId || row.order_id || row.OrderID || `CSV-${index + 1}`),
    customerName: String(row.customerName || row.customer_name || row.CustomerName || "未知客户"),
    ownerName: "",
    amount: Number(row.amount || row.Amount || 0),
    date: String(row.date || row.Date || row.orderDate || ""),
    status: String(row.status || row.Status || "completed"),
    source: fileOrderSource.value,
    productInfo: String(row.productInfo || row.product_info || ""),
  }));
});

const previewTotalAmount = computed(() =>
  previewRows.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
);

const activeScopeLabel = computed(() => {
  const scope = importMethod.value === "file" ? fileOrderSource.value : historyScope.value;
  return scope === "user" ? "用户历史交易" : "公司历史交易";
});

const fileTypeLabel = computed(() => {
  switch (fileType.value) {
    case "csv":
      return "CSV";
    case "excel":
      return "Excel";
    case "json":
      return "JSON";
    default:
      return "文件";
  }
});

const fileAcceptTypes = computed(() => {
  switch (fileType.value) {
    case "csv":
      return ".csv,text/csv";
    case "excel":
      return ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
    case "json":
      return ".json,application/json";
    default:
      return "";
  }
});

const fileTypeHint = computed(() => {
  switch (fileType.value) {
    case "csv":
      return "字段支持：orderId / amount / date / customerName / productInfo / status";
    case "excel":
      return "Excel 表格第一行需为表头，字段支持：orderId / amount / date / customerName / productInfo / status";
    case "json":
      return "JSON 数组格式，每项需包含：orderId / amount / date / customerName / productInfo / status";
    default:
      return "";
  }
});

const loadProject = async () => {
  loading.value = true;
  try {
    const response = await getProjectDetail(projectId.value);
    project.value = unwrapApiResponseData(response, "加载项目详情失败");
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "加载项目详情失败");
  } finally {
    loading.value = false;
  }
};

const loadCustomers = async () => {
  try {
    const response = await getCustomerList({ limit: 100, scope: "company" });
    const payload = unwrapApiResponseData(response, "加载客户列表失败");
    customerOptions.value = payload.list || [];
  } catch (error) {
    console.error(error);
  }
};

const parseCsv = (content: string) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV 文件内容不足");
  }

  const headerLine = lines[0];
  if (!headerLine) {
    throw new Error("CSV 文件缺少表头");
  }

  const headers = headerLine.split(",").map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
};

const parseJson = (content: string) => {
  const parsed = JSON.parse(content);
  
  if (!Array.isArray(parsed)) {
    throw new Error("JSON 文件必须包含数组格式的数据");
  }

  if (parsed.length === 0) {
    throw new Error("JSON 文件内容为空");
  }

  return parsed.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("JSON 数组中的每个元素必须是对象");
    }
    return item as Record<string, unknown>;
  });
};

const parseExcel = (buffer: ArrayBuffer): Record<string, unknown>[] => {
  const workbook = XLSX.read(buffer, { type: "array" });
  
  if (!workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error("Excel 文件没有工作表");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Excel 文件没有工作表");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  
  if (!worksheet) {
    throw new Error("无法读取 Excel 工作表");
  }

  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error("Excel 工作表内容为空");
  }

  return jsonData as Record<string, unknown>[];
};

const handleFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  try {
    if (fileType.value === "csv") {
      const content = await file.text();
      fileRows.value = parseCsv(content);
    } else if (fileType.value === "json") {
      const content = await file.text();
      fileRows.value = parseJson(content);
    } else if (fileType.value === "excel") {
      const content = await file.arrayBuffer();
      fileRows.value = await parseExcel(content);
    }
    
    importResult.value = null;
    ElMessage.success(`已解析 ${fileRows.value.length} 条记录`);
  } catch (error: unknown) {
    fileRows.value = [];
    const errorMessage = (error as Error).message || `解析 ${fileTypeLabel.value} 文件失败`;
    ElMessage.error(errorMessage);
  } finally {
    if (input) {
      input.value = "";
    }
  }
};

const clearFileSelection = () => {
  fileRows.value = [];
};

const clearHistoryPreview = () => {
  historyRows.value = [];
};

const handlePreviewHistory = async () => {
  previewLoading.value = true;
  try {
    const response = await previewProjectOrders({
      scope: historyScope.value,
      customerIds: selectedCustomerIds.value,
      startDate: dateRange.value?.[0]?.toISOString(),
      endDate: dateRange.value?.[1]?.toISOString(),
      limit: 120,
    });
    const payload = unwrapApiResponseData(response, "预览交易记录失败");
    historyRows.value = payload.list || [];
    importResult.value = null;
    ElMessage.success(`找到 ${payload.count} 条可导入记录`);
  } catch (error: unknown) {
    historyRows.value = [];
    ElMessage.error((error as Error).message || "预览交易记录失败");
  } finally {
    previewLoading.value = false;
  }
};

const handleImport = async () => {
  if (!previewRows.value.length) {
    ElMessage.warning("请先准备要导入的交易记录");
    return;
  }

  importing.value = true;
  try {
    const response = importMethod.value === "file"
      ? await importProjectOrders(projectId.value, {
          orders: previewRows.value.map((row) => ({
            orderId: row.orderId,
            amount: Number(row.amount),
            date: row.date,
            customerName: row.customerName,
            productInfo: row.productInfo,
            status: row.status,
          })),
          source: fileOrderSource.value,
          importSource: fileType.value,
        })
      : await importCompanyOrders(projectId.value, {
          scope: historyScope.value,
          customerIds: selectedCustomerIds.value,
          dateRange: dateRange.value
            ? {
                startDate: dateRange.value[0].toISOString(),
                endDate: dateRange.value[1].toISOString(),
              }
            : undefined,
        });

    const payload = unwrapApiResponseData(response, "导入失败");
    importResult.value = {
      importedCount: payload.importedCount,
      analysisResults: payload.analysisResults,
    };
    await loadProject();
    ElMessage.success(`成功导入 ${payload.importedCount} 条记录`);
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "导入失败");
  } finally {
    importing.value = false;
  }
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("zh-CN") : "-";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(Number(value || 0));

onMounted(() => {
  void loadProject();
  void loadCustomers();
});
</script>

<style scoped>
.project-import-page {
  display: grid;
  gap: 20px;
}

.page-header__main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: var(--text-primary);
}

.page-header p {
  margin: 8px 0 0;
  color: var(--text-secondary);
}

.panel-card {
  border-radius: 24px;
  border: 1px solid var(--border-light);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.source-grid,
.form-stack,
.summary-grid {
  display: grid;
  gap: 14px;
}

.source-card {
  width: 100%;
  text-align: left;
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  color: var(--text-primary);
}

.source-card--active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.source-card span,
.field-block small {
  color: var(--text-secondary);
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-block > span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.native-file-input {
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 10px 12px;
  background: var(--surface-secondary);
}

.panel-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-actions--end {
  justify-content: flex-end;
  margin-top: 16px;
}

.summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin-bottom: 16px;
}

.summary-grid article {
  border: 1px solid var(--border-light);
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--surface-secondary);
  display: grid;
  gap: 6px;
}

.summary-grid strong {
  font-size: 20px;
  color: var(--text-primary);
}

.summary-grid span {
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
