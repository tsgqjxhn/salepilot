<template>
  <div class="customer-tags-container">
    <div class="page-header">
      <div class="page-copy">
        <h1 class="page-title">Customer tags</h1>
        <p class="page-subtitle">
          Maintain a shared label library for the customer workspace. Renaming or deleting a tag updates the matching
          customer records across the company.
        </p>
      </div>

      <div class="header-actions">
        <el-button @click="fetchTagLibrary">
          <el-icon><Refresh /></el-icon>
          Refresh
        </el-button>
        <el-button v-permission="'customers.tags.manage'" type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          New tag
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-label">Total tags</div>
        <div class="stat-value">{{ summary.totalTags }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">In use</div>
        <div class="stat-value">{{ summary.usedTags }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Unused</div>
        <div class="stat-value">{{ summary.unusedTags }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Assignments</div>
        <div class="stat-value">{{ summary.activeAssignments + summary.archivedAssignments }}</div>
      </el-card>
    </div>

    <el-card class="library-card">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="Search tag name"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table v-loading="loading" :data="filteredTags" stripe style="width: 100%">
        <el-table-column prop="name" label="Tag" min-width="220">
          <template #default="{ row }">
            <div class="tag-name-cell">
              <el-tag effect="plain" round>{{ row.name }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="activeCustomerCount" label="Active customers" width="150" align="center" />
        <el-table-column prop="archivedCustomerCount" label="Archived customers" width="160" align="center" />
        <el-table-column prop="usageCount" label="Assignments" width="120" align="center" />

        <el-table-column prop="updatedAt" label="Updated at" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'customers.tags.manage'" type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              Rename
            </el-button>
            <el-button v-permission="'customers.tags.manage'" type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? 'Create customer tag' : 'Rename customer tag'"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-position="top">
        <el-form-item label="Tag name" prop="name">
          <el-input
            v-model="formModel.name"
            maxlength="30"
            show-word-limit
            placeholder="Enter a shared customer tag"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button
            v-permission="'customers.tags.manage'"
            type="primary"
            :loading="submitting"
            :disabled="submitLocked"
            @click="handleSubmit"
          >
            {{ dialogMode === "create" ? "Create tag" : "Save changes" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue";
import {
  createCustomerTag,
  deleteCustomerTag,
  getCustomerTags,
  updateCustomerTag,
  type CustomerTagRecord,
  type CustomerTagSummary,
} from "@/api/customer";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";

type DialogMode = "create" | "edit";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const keyword = ref("");
const submitGuard = useSubmitGuard();
const currentTagId = ref("");
const formRef = ref<FormInstance>();
const tagList = ref<CustomerTagRecord[]>([]);
const summary = reactive<CustomerTagSummary>({
  totalTags: 0,
  usedTags: 0,
  unusedTags: 0,
  activeAssignments: 0,
  archivedAssignments: 0,
});
const formModel = reactive({
  name: "",
});
const submitLocked = computed(() => submitting.value || submitGuard.isBlocked.value);

const formRules: FormRules<typeof formModel> = {
  name: [
    { required: true, message: "Please enter a tag name.", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (typeof value !== "string" || value.trim().length === 0) {
          callback(new Error("Please enter a tag name."));
          return;
        }

        if (value.trim().length > 30) {
          callback(new Error("Tag name cannot exceed 30 characters."));
          return;
        }

        callback();
      },
      trigger: "blur",
    },
  ],
};

const filteredTags = computed(() => {
  const searchValue = keyword.value.trim().toLowerCase();
  if (!searchValue) {
    return tagList.value;
  }

  return tagList.value.filter((tag) => tag.name.toLowerCase().includes(searchValue));
});

const resetForm = () => {
  formModel.name = "";
  currentTagId.value = "";
  formRef.value?.clearValidate();
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fetchTagLibrary = async () => {
  loading.value = true;

  try {
    const data = unwrapApiResponseData(await getCustomerTags(), "Failed to load customer tags.");
    tagList.value = data.list;
    Object.assign(summary, data.summary);
  } catch (error) {
    console.error("Failed to load customer tags:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load customer tags."));
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  dialogMode.value = "create";
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (tag: CustomerTagRecord) => {
  dialogMode.value = "edit";
  currentTagId.value = tag._id;
  formModel.name = tag.name;
  formRef.value?.clearValidate();
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);

  if (!valid) {
    return;
  }

  await submitGuard.run(async () => {
    submitting.value = true;

    try {
      const trimmedName = formModel.name.trim();
      if (dialogMode.value === "create") {
        unwrapApiResponseData(await createCustomerTag(trimmedName), "Failed to create the customer tag.", {
          successCodes: [200, 201],
        });
      } else {
        unwrapApiResponseData(await updateCustomerTag(currentTagId.value, trimmedName), "Failed to update the customer tag.", {
          successCodes: [200, 201],
        });
      }

      notifyActionSuccess(
        dialogMode.value === "create" ? "The shared customer tag was created successfully." : "The shared customer tag was updated successfully.",
        { title: dialogMode.value === "create" ? "Tag created" : "Tag updated" },
      );
      dialogVisible.value = false;
      resetForm();
      await fetchTagLibrary();
    } catch (error) {
      console.error("Failed to submit customer tag:", error);
      notifyActionError(
        error,
        dialogMode.value === "create" ? "Failed to create the customer tag." : "Failed to update the customer tag.",
        { title: dialogMode.value === "create" ? "Tag creation failed" : "Tag update failed" },
      );
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (tag: CustomerTagRecord) => {
  try {
    await ElMessageBox.confirm(
      `Delete tag "${tag.name}"? This removes it from ${tag.usageCount} customer assignment(s).`,
      "Delete customer tag",
      {
        confirmButtonText: "Delete tag",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    unwrapApiResponseData(await deleteCustomerTag(tag._id), "Failed to delete the customer tag.");
    notifyActionSuccess("The customer tag was deleted from the shared library.", {
      title: "Tag deleted",
    });
    await fetchTagLibrary();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete customer tag:", error);
      notifyActionError(error, "Failed to delete the customer tag.", {
        title: "Tag deletion failed",
      });
    }
  }
};

onMounted(() => {
  fetchTagLibrary();
});
</script>

<style scoped>
.customer-tags-container {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.page-copy {
  max-width: 760px;
}

.page-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 15px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 8px;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 30px;
  font-weight: 700;
}

.library-card {
  min-height: 480px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.search-input {
  width: 280px;
}

.tag-name-cell {
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 30px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    justify-content: stretch;
  }

  .search-input {
    width: 100%;
  }
}
</style>
