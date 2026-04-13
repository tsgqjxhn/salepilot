<template>
  <section class="user-fields">
    <div class="user-fields__header">
      <div>
        <h2 class="user-fields__title">
          <el-icon><DataBoard /></el-icon>
          自定义字段
        </h2>
        <p class="user-fields__subtitle">
          为这个用户记录任意补充信息，例如心情、评分、图片分析结果或业务备注。
        </p>
      </div>
      <div class="user-fields__actions">
        <el-button @click="loadFields">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          添加字段
        </el-button>
      </div>
    </div>

    <div class="user-fields__toolbar">
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="搜索字段名称、描述或标签"
        style="max-width: 260px"
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
      <el-select
        v-model="filters.isVisible"
        clearable
        placeholder="可见性"
        style="width: 140px"
        @change="handleFilterChange"
      >
        <el-option label="仅可见" :value="true" />
        <el-option label="仅隐藏" :value="false" />
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

    <div v-if="loading" class="user-fields__loading">
      <el-skeleton animated :rows="5" />
    </div>

    <el-empty
      v-else-if="!fields.length"
      description="暂无自定义字段"
      class="user-fields__empty"
    >
      <el-button type="primary" @click="openCreateDialog">创建第一个字段</el-button>
    </el-empty>

    <div v-else class="user-fields__grid">
      <article
        v-for="field in fields"
        :key="field._id"
        class="field-card"
        :class="{ 'field-card--hidden': !field.isVisible }"
      >
        <header class="field-card__header">
          <el-tag :type="getFieldTypeTagType(field.fieldType)">
            {{ getFieldTypeLabel(field.fieldType) }}
          </el-tag>
          <div class="field-card__header-actions">
            <el-button link type="primary" @click="openEditDialog(field)">编辑</el-button>
            <el-button link type="danger" @click="removeField(field)">删除</el-button>
          </div>
        </header>

        <div class="field-card__body">
          <h3>{{ field.fieldName }}</h3>
          <p v-if="field.description" class="field-card__description">{{ field.description }}</p>
          <div class="field-card__value">
            <template v-if="field.fieldType === 'mood'">
              <span class="value-chip">
                {{ getMoodIcon(field.fieldValue as MoodValue) }}
                {{ getMoodLabel(field.fieldValue as MoodValue) }}
              </span>
            </template>
            <template v-else-if="field.fieldType === 'image'">
              <img
                v-if="field.fieldValue"
                class="field-card__image"
                :src="String(field.fieldValue)"
                :alt="field.fieldName"
              />
              <span v-else class="value-muted">暂无图片</span>
            </template>
            <template v-else-if="field.fieldType === 'boolean'">
              <span class="value-chip">{{ field.fieldValue ? "是" : "否" }}</span>
            </template>
            <template v-else-if="field.fieldType === 'tags' && Array.isArray(field.fieldValue)">
              <span class="value-muted">
                {{ field.fieldValue.length ? field.fieldValue.join("，") : "暂无标签值" }}
              </span>
            </template>
            <template v-else-if="(field.fieldType === 'json' || field.fieldType === 'ai_analysis') && field.fieldValue && typeof field.fieldValue === 'object'">
              <pre class="field-card__json">{{ JSON.stringify(field.fieldValue, null, 2) }}</pre>
            </template>
            <template v-else>
              <span class="value-muted">{{ String(field.fieldValue ?? "--") }}</span>
            </template>
          </div>
          <div v-if="field.tags.length" class="field-card__tags">
            <el-tag
              v-for="tag in field.tags"
              :key="tag"
              size="small"
              type="info"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </div>

        <footer class="field-card__footer">
          <span>{{ formatTime(field.timestamp) }}</span>
          <span v-if="field.createdByUserId">创建者：{{ field.createdByUserId.username }}</span>
        </footer>
      </article>
    </div>

    <div v-if="pagination.total > pagination.limit" class="user-fields__pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        layout="total, prev, pager, next"
        :total="pagination.total"
        @current-change="loadFields"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingField ? '编辑字段' : '新建字段'"
      width="640px"
      @closed="resetDialog"
    >
      <el-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        label-position="top"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="字段类型" prop="fieldType">
              <el-select v-model="formState.fieldType" style="width: 100%">
                <el-option
                  v-for="option in fieldTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字段名称" prop="fieldName">
              <el-input v-model="formState.fieldName" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="字段描述">
          <el-input
            v-model="formState.description"
            type="textarea"
            :rows="2"
            placeholder="补充说明这个字段记录什么"
          />
        </el-form-item>

        <el-form-item label="字段值" prop="fieldValueRaw">
          <template v-if="formState.fieldType === 'mood'">
            <el-select v-model="formState.fieldValueRaw" style="width: 100%">
              <el-option
                v-for="option in moodOptions"
                :key="option.value"
                :label="`${option.icon} ${option.label}`"
                :value="option.value"
              />
            </el-select>
          </template>

          <template v-else-if="formState.fieldType === 'boolean'">
            <el-switch
              v-model="formState.booleanValue"
              active-text="是"
              inactive-text="否"
            />
          </template>

          <template v-else-if="formState.fieldType === 'number' || formState.fieldType === 'rating'">
            <el-input-number
              v-model="formState.numberValue"
              :min="0"
              :max="formState.fieldType === 'rating' ? 5 : undefined"
              style="width: 100%"
            />
          </template>

          <template v-else-if="formState.fieldType === 'date'">
            <el-date-picker
              v-model="formState.fieldValueRaw"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </template>

          <template v-else-if="formState.fieldType === 'datetime'">
            <el-date-picker
              v-model="formState.fieldValueRaw"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </template>

          <template v-else>
            <el-input
              v-model="formState.fieldValueRaw"
              :type="formState.fieldType === 'json' || formState.fieldType === 'ai_analysis' ? 'textarea' : 'text'"
              :rows="formState.fieldType === 'json' || formState.fieldType === 'ai_analysis' ? 5 : undefined"
              :placeholder="valuePlaceholder"
            />
          </template>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="记录时间">
              <el-date-picker
                v-model="formState.timestamp"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formState.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签">
          <el-input
            v-model="formState.tagsText"
            placeholder="多个标签请用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="附加元数据（JSON）">
          <el-input
            v-model="formState.metadataText"
            type="textarea"
            :rows="4"
            placeholder='例如：{"source":"manual","operator":"manager"}'
          />
        </el-form-item>

        <el-form-item>
          <el-switch v-model="formState.isVisible" active-text="对前台可见" inactive-text="隐藏字段" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitField">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { DataBoard, Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  createField,
  deleteField,
  getMoodIcon,
  getMoodLabel,
  listFields,
  updateField,
  type FieldType,
  type MoodValue,
  type UserCustomField,
} from "@/api/userCustomField";

interface Props {
  targetUserId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingField = ref<UserCustomField | null>(null);
const formRef = ref<FormInstance>();
const fields = ref<UserCustomField[]>([]);
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

const filters = reactive<{
  keyword: string;
  fieldType?: FieldType;
  isVisible?: boolean;
  dateRange: string[];
}>({
  keyword: "",
  fieldType: undefined,
  isVisible: undefined,
  dateRange: [],
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

const moodOptions: Array<{ value: MoodValue; label: string; icon: string }> = [
  "very_happy",
  "happy",
  "neutral",
  "sad",
  "very_sad",
  "angry",
  "anxious",
  "excited",
  "calm",
  "tired",
].map((value) => ({
  value: value as MoodValue,
  label: getMoodLabel(value as MoodValue),
  icon: getMoodIcon(value as MoodValue),
}));

const formState = reactive({
  fieldType: "text" as FieldType,
  fieldName: "",
  fieldValueRaw: "",
  numberValue: 0,
  booleanValue: true,
  description: "",
  tagsText: "",
  metadataText: "{}",
  timestamp: "",
  isVisible: true,
  sortOrder: 0,
});

const formRules: FormRules = {
  fieldType: [{ required: true, message: "请选择字段类型", trigger: "change" }],
  fieldName: [{ required: true, message: "请输入字段名称", trigger: "blur" }],
  fieldValueRaw: [{
    validator: (_rule, _value, callback) => {
      if (["boolean", "number", "rating"].includes(formState.fieldType)) {
        callback();
        return;
      }

      if (!String(formState.fieldValueRaw || "").trim()) {
        callback(new Error("请输入字段值"));
        return;
      }

      callback();
    },
    trigger: "blur",
  }],
};

const valuePlaceholder = computed(() => {
  if (formState.fieldType === "json" || formState.fieldType === "ai_analysis") {
    return '请输入 JSON，例如 {"summary":"..."}';
  }
  if (formState.fieldType === "tags") {
    return "请输入逗号分隔的标签值";
  }
  if (formState.fieldType === "image") {
    return "请输入图片 URL 或 data URL";
  }
  return "请输入字段值";
});

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

const parseMetadata = () => {
  const value = formState.metadataText.trim();
  if (!value) {
    return {};
  }

  try {
    const payload = JSON.parse(value);
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  } catch {
    throw new Error("附加元数据必须是合法 JSON 对象");
  }
};

const buildFieldValue = () => {
  if (formState.fieldType === "boolean") {
    return formState.booleanValue;
  }

  if (formState.fieldType === "number" || formState.fieldType === "rating") {
    return formState.numberValue;
  }

  if (formState.fieldType === "tags") {
    return formState.fieldValueRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (formState.fieldType === "json" || formState.fieldType === "ai_analysis") {
    const payload = JSON.parse(formState.fieldValueRaw);
    return payload;
  }

  return formState.fieldValueRaw;
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
      isVisible: filters.isVisible,
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
    ElMessage.error((error as Error).message || "加载用户字段失败");
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadFields();
};

const resetDialog = () => {
  editingField.value = null;
  formState.fieldType = "text";
  formState.fieldName = "";
  formState.fieldValueRaw = "";
  formState.numberValue = 0;
  formState.booleanValue = true;
  formState.description = "";
  formState.tagsText = "";
  formState.metadataText = "{}";
  formState.timestamp = "";
  formState.isVisible = true;
  formState.sortOrder = 0;
  formRef.value?.clearValidate();
};

const fillDialog = (field?: UserCustomField) => {
  if (!field) {
    resetDialog();
    return;
  }

  formState.fieldType = field.fieldType;
  formState.fieldName = field.fieldName;
  formState.description = field.description || "";
  formState.tagsText = field.tags.join(", ");
  formState.metadataText = JSON.stringify(field.metadata || {}, null, 2);
  formState.timestamp = field.timestamp.slice(0, 19).replace("T", " ");
  formState.isVisible = field.isVisible;
  formState.sortOrder = field.sortOrder || 0;

  if (field.fieldType === "boolean") {
    formState.booleanValue = Boolean(field.fieldValue);
    formState.fieldValueRaw = "";
    formState.numberValue = 0;
    return;
  }

  if (field.fieldType === "number" || field.fieldType === "rating") {
    formState.numberValue = Number(field.fieldValue || 0);
    formState.fieldValueRaw = "";
    return;
  }

  if (field.fieldType === "tags") {
    formState.fieldValueRaw = Array.isArray(field.fieldValue) ? field.fieldValue.join(", ") : "";
    return;
  }

  if (field.fieldType === "json" || field.fieldType === "ai_analysis") {
    formState.fieldValueRaw = JSON.stringify(field.fieldValue ?? {}, null, 2);
    return;
  }

  formState.fieldValueRaw = typeof field.fieldValue === "string" ? field.fieldValue : String(field.fieldValue ?? "");
};

const openCreateDialog = () => {
  editingField.value = null;
  resetDialog();
  dialogVisible.value = true;
};

const openEditDialog = (field: UserCustomField) => {
  editingField.value = field;
  fillDialog(field);
  dialogVisible.value = true;
};

const submitField = async () => {
  if (!formRef.value) {
    return;
  }

  await formRef.value.validate();

  submitting.value = true;
  try {
    const payload = {
      targetUserId: props.targetUserId,
      fieldType: formState.fieldType,
      fieldName: formState.fieldName.trim(),
      fieldValue: buildFieldValue(),
      metadata: parseMetadata(),
      timestamp: formState.timestamp || undefined,
      isVisible: formState.isVisible,
      tags: formState.tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: formState.description.trim() || undefined,
      sortOrder: formState.sortOrder,
    };

    if (editingField.value) {
      await updateField(editingField.value._id, payload);
      ElMessage.success("字段已更新");
    } else {
      await createField(payload);
      ElMessage.success("字段已创建");
    }

    dialogVisible.value = false;
    resetDialog();
    await loadFields();
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "保存字段失败");
  } finally {
    submitting.value = false;
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

const formatTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
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
.user-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.user-fields__header,
.user-fields__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.user-fields__title {
  margin: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 20px;
}

.user-fields__subtitle {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.user-fields__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-fields__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.field-card {
  background: var(--surface-primary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
}

.field-card--hidden {
  opacity: 0.65;
}

.field-card__header,
.field-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  align-items: center;
}

.field-card__header {
  border-bottom: 1px solid var(--color-border);
}

.field-card__header-actions {
  display: flex;
  gap: 4px;
}

.field-card__body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-card__body h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-heading);
}

.field-card__description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.field-card__value {
  color: var(--text-primary);
  min-height: 24px;
}

.value-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.value-muted {
  color: var(--text-secondary);
  line-height: 1.6;
  word-break: break-word;
}

.field-card__image {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 12px;
}

.field-card__json {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-white);
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

.field-card__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.field-card__footer {
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.user-fields__pagination {
  display: flex;
  justify-content: center;
}
</style>
