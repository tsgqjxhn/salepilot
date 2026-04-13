<template>
  <div class="field-manager">
    <div class="field-manager__header">
      <div>
        <h3>字段管理</h3>
        <p>支持批量创建、筛选、编辑和删除用户自定义字段。</p>
      </div>
      <div class="field-manager__actions">
        <el-button type="primary" @click="openBatchDialog">
          <el-icon><Plus /></el-icon>
          批量添加
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedFields.length"
          @click="batchRemoveFields"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <div class="field-manager__toolbar">
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="搜索字段"
        style="max-width: 220px"
        @change="handleFilterChange"
      />
      <el-select
        v-model="filters.fieldType"
        clearable
        placeholder="字段类型"
        style="width: 160px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="option in fieldTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="handleFilterChange"
      />
    </div>

    <el-table
      v-loading="loading"
      :data="fields"
      border
      stripe
      @selection-change="selectedFields = $event"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="fieldName" label="字段名称" min-width="180" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getFieldTypeTagType(row.fieldType)">{{ getFieldTypeLabel(row.fieldType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="字段值" min-width="220">
        <template #default="{ row }">
          <span class="field-manager__value">{{ formatFieldValue(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="160">
        <template #default="{ row }">
          <div class="field-manager__tags">
            <el-tag
              v-for="tag in row.tags.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
            <span v-if="row.tags.length > 3">+{{ row.tags.length - 3 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="记录时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="创建者" width="120">
        <template #default="{ row }">
          {{ row.createdByUserId?.username || "--" }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="removeField(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="pagination.total > pagination.limit" class="field-manager__pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="loadFields"
      />
    </div>

    <el-dialog
      v-model="batchDialogVisible"
      title="批量添加字段"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item label="字段类型">
          <el-select v-model="batchForm.fieldType" style="width: 100%">
            <el-option
              v-for="option in fieldTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字段名称前缀">
          <el-input v-model="batchForm.fieldNamePrefix" placeholder="例如：近七日心情" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="生成数量">
              <el-input-number v-model="batchForm.count" :min="1" :max="30" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间间隔">
              <el-select v-model="batchForm.interval" style="width: 100%">
                <el-option label="按小时" value="hour" />
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签">
          <el-input v-model="batchForm.tagsText" placeholder="用逗号分隔多个标签" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="submitBatchCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑字段"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item label="字段名称">
          <el-input v-model="editForm.fieldName" />
        </el-form-item>
        <el-form-item label="字段值">
          <el-input v-model="editForm.fieldValueText" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tagsText" placeholder="用逗号分隔多个标签" />
        </el-form-item>
        <el-form-item>
          <el-switch v-model="editForm.isVisible" active-text="可见" inactive-text="隐藏" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchCreateFields,
  batchDeleteFields,
  deleteField,
  listFields,
  updateField,
  type FieldType,
  type UserCustomField,
} from "@/api/userCustomField";

interface Props {
  targetUserId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const batchSubmitting = ref(false);
const editSubmitting = ref(false);
const batchDialogVisible = ref(false);
const editDialogVisible = ref(false);
const fields = ref<UserCustomField[]>([]);
const selectedFields = ref<UserCustomField[]>([]);
const editingField = ref<UserCustomField | null>(null);

const filters = reactive<{
  keyword: string;
  fieldType?: FieldType;
  dateRange: string[];
}>({
  keyword: "",
  fieldType: undefined,
  dateRange: [],
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

const batchForm = reactive({
  fieldType: "text" as FieldType,
  fieldNamePrefix: "",
  count: 7,
  interval: "day" as "hour" | "day" | "week",
  tagsText: "",
});

const editForm = reactive({
  fieldName: "",
  fieldValueText: "",
  tagsText: "",
  isVisible: true,
});

const fieldTypeOptions: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "文本" },
  { value: "number", label: "数字" },
  { value: "date", label: "日期" },
  { value: "datetime", label: "日期时间" },
  { value: "boolean", label: "布尔值" },
  { value: "image", label: "图片" },
  { value: "mood", label: "情绪" },
  { value: "rating", label: "评分" },
  { value: "tags", label: "标签数组" },
  { value: "json", label: "JSON" },
  { value: "ai_analysis", label: "AI 分析" },
];

const getFieldTypeLabel = (value: FieldType) =>
  fieldTypeOptions.find((option) => option.value === value)?.label || value;

const getFieldTypeTagType = (value: FieldType) => {
  if (["image", "ai_analysis"].includes(value)) {
    return "danger";
  }
  if (["mood", "number"].includes(value)) {
    return "success";
  }
  if (["date", "datetime", "rating"].includes(value)) {
    return "warning";
  }
  if (["tags", "boolean"].includes(value)) {
    return "info";
  }
  return "";
};

const loadFields = async () => {
  if (!props.targetUserId) {
    return;
  }

  loading.value = true;
  try {
    const data = await listFields({
      targetUserId: props.targetUserId,
      keyword: filters.keyword || undefined,
      fieldType: filters.fieldType,
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
      page: pagination.page,
      limit: pagination.limit,
    });
    fields.value = data.fields;
    pagination.page = data.pagination.page;
    pagination.limit = data.pagination.limit;
    pagination.total = data.pagination.total;
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "加载字段失败");
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadFields();
};

const openBatchDialog = () => {
  batchForm.fieldType = "text";
  batchForm.fieldNamePrefix = "";
  batchForm.count = 7;
  batchForm.interval = "day";
  batchForm.tagsText = "";
  batchDialogVisible.value = true;
};

const buildBatchFieldValue = (fieldType: FieldType, index: number) => {
  if (fieldType === "number") {
    return index + 1;
  }
  if (fieldType === "rating") {
    return ((index % 5) + 1);
  }
  if (fieldType === "boolean") {
    return index % 2 === 0;
  }
  if (fieldType === "mood") {
    return ["calm", "neutral", "happy", "tired", "anxious"][index % 5];
  }
  if (fieldType === "tags") {
    return ["批量导入", `序号${index + 1}`];
  }
  if (fieldType === "json" || fieldType === "ai_analysis") {
    return { index: index + 1, source: "batch" };
  }
  return `批量生成值 ${index + 1}`;
};

const submitBatchCreate = async () => {
  if (!batchForm.fieldNamePrefix.trim()) {
    ElMessage.warning("请输入字段名称前缀");
    return;
  }

  batchSubmitting.value = true;
  try {
    const now = new Date();
    const fieldsPayload = Array.from({ length: batchForm.count }).map((_, index) => {
      const timestamp = new Date(now);
      if (batchForm.interval === "hour") {
        timestamp.setHours(timestamp.getHours() - index);
      } else if (batchForm.interval === "day") {
        timestamp.setDate(timestamp.getDate() - index);
      } else {
        timestamp.setDate(timestamp.getDate() - index * 7);
      }

      return {
        targetUserId: props.targetUserId,
        fieldType: batchForm.fieldType,
        fieldName: `${batchForm.fieldNamePrefix} ${index + 1}`,
        fieldValue: buildBatchFieldValue(batchForm.fieldType, index),
        timestamp: timestamp.toISOString(),
        tags: batchForm.tagsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        isVisible: true,
      };
    });

    const result = await batchCreateFields({ fields: fieldsPayload });
    batchDialogVisible.value = false;
    ElMessage.success(`已创建 ${result.createdFields.length} 条字段记录`);
    if (result.errors.length) {
      ElMessage.warning(`另有 ${result.errors.length} 条记录创建失败`);
    }
    await loadFields();
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "批量创建失败");
  } finally {
    batchSubmitting.value = false;
  }
};

const openEditDialog = (field: UserCustomField) => {
  editingField.value = field;
  editForm.fieldName = field.fieldName;
  editForm.fieldValueText =
    typeof field.fieldValue === "object"
      ? JSON.stringify(field.fieldValue, null, 2)
      : String(field.fieldValue ?? "");
  editForm.tagsText = field.tags.join(", ");
  editForm.isVisible = field.isVisible;
  editDialogVisible.value = true;
};

const parseUpdatedValue = () => {
  if (!editingField.value) {
    return editForm.fieldValueText;
  }

  if (["json", "ai_analysis"].includes(editingField.value.fieldType)) {
    return JSON.parse(editForm.fieldValueText || "{}");
  }

  if (editingField.value.fieldType === "number" || editingField.value.fieldType === "rating") {
    return Number(editForm.fieldValueText);
  }

  if (editingField.value.fieldType === "boolean") {
    return ["true", "1", "yes", "是"].includes(editForm.fieldValueText.trim().toLowerCase());
  }

  if (editingField.value.fieldType === "tags") {
    return editForm.fieldValueText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return editForm.fieldValueText;
};

const submitEdit = async () => {
  if (!editingField.value) {
    return;
  }

  editSubmitting.value = true;
  try {
    await updateField(editingField.value._id, {
      fieldName: editForm.fieldName.trim(),
      fieldValue: parseUpdatedValue(),
      tags: editForm.tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isVisible: editForm.isVisible,
    });
    editDialogVisible.value = false;
    ElMessage.success("字段已更新");
    await loadFields();
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "更新字段失败");
  } finally {
    editSubmitting.value = false;
  }
};

const removeField = async (field: UserCustomField) => {
  try {
    await ElMessageBox.confirm(`确认删除字段“${field.fieldName}”？`, "删除字段", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    await deleteField(field._id);
    ElMessage.success("字段已删除");
    await loadFields();
  } catch (error: unknown) {
    if (error !== "cancel") {
      ElMessage.error((error as Error).message || "删除字段失败");
    }
  }
};

const batchRemoveFields = async () => {
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedFields.value.length} 个字段？`,
      "批量删除字段",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      },
    );
    await batchDeleteFields(selectedFields.value.map((field) => field._id));
    selectedFields.value = [];
    ElMessage.success("选中字段已删除");
    await loadFields();
  } catch (error: unknown) {
    if (error !== "cancel") {
      ElMessage.error((error as Error).message || "批量删除失败");
    }
  }
};

const formatFieldValue = (field: UserCustomField) => {
  if (field.fieldValue === null || field.fieldValue === undefined) {
    return "--";
  }
  if (typeof field.fieldValue === "object") {
    return JSON.stringify(field.fieldValue);
  }
  return String(field.fieldValue);
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

onMounted(() => {
  loadFields();
});
</script>

<style scoped>
.field-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-manager__header,
.field-manager__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.field-manager__header h3 {
  margin: 0;
  font-size: 16px;
}

.field-manager__header p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.field-manager__actions,
.field-manager__tags {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.field-manager__value {
  color: var(--text-secondary);
  word-break: break-word;
}

.field-manager__pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
