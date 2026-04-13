<template>
  <div class="customer-list-container">
    <div class="page-header">
      <h1 class="page-title">Customer directory</h1>
      <div class="header-actions">
        <el-button @click="handleOpenBoard">
          <el-icon><Grid /></el-icon>
          Board view
        </el-button>
        <el-button v-permission="'customers.tags.manage'" @click="handleOpenTags">
          <el-icon><CollectionTag /></el-icon>
          Tag library
        </el-button>
        <div v-permission="'customers.export'" style="display: inline-flex">
          <el-dropdown @command="handleExportCommand">
            <el-button :loading="exporting">
              <el-icon><Download /></el-icon>
              Export
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">Export CSV</el-dropdown-item>
                <el-dropdown-item command="excel">Export Excel</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button v-permission="'customers.create'" type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          New customer
        </el-button>
      </div>
    </div>

    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="Keyword">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Name, email, or phone"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Type">
          <el-select v-model="searchForm.type" placeholder="All" clearable style="width: 140px">
            <el-option label="Individual" value="individual" />
            <el-option label="Enterprise" value="enterprise" />
          </el-select>
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="All" clearable style="width: 140px">
            <el-option label="Potential" value="potential" />
            <el-option label="Active" value="active" />
            <el-option label="Dormant" value="dormant" />
            <el-option label="Lost" value="lost" />
          </el-select>
        </el-form-item>

        <el-form-item label="Tier">
          <el-select v-model="searchForm.level" placeholder="All" clearable style="width: 120px">
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
          </el-select>
        </el-form-item>

        <el-form-item label="Tag">
          <el-select v-model="searchForm.tag" placeholder="All" clearable filterable style="width: 180px">
            <el-option v-for="tag in tagOptions" :key="tag._id" :label="tag.name" :value="tag.name" />
          </el-select>
        </el-form-item>

        <el-form-item label="Scope">
          <el-select v-model="searchForm.scope" style="width: 170px">
            <el-option
              v-for="option in scopeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            Search
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            Reset
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="batch-toolbar" v-if="selectedRows.length > 0">
        <span class="selected-count">{{ selectedRows.length }} selected</span>
        <el-button v-if="canReassignCustomers" type="primary" size="small" @click="handleOpenAssignDialog">
          Reassign owner
        </el-button>
        <el-button v-permission="'customers.delete'" type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          Delete selected
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="customerList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="Name" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="customer-name-cell" @click="handleView(row)">{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="Type" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'enterprise' ? 'primary' : 'success'" size="small">
              {{ row.type === 'enterprise' ? 'Enterprise' : 'Individual' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="level" label="Tier" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small" effect="dark">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="industry" label="Industry" width="140" show-overflow-tooltip />

        <el-table-column prop="source" label="Source" width="130">
          <template #default="{ row }">
            {{ getSourceLabel(row.source) }}
          </template>
        </el-table-column>

        <el-table-column prop="owner" label="Owner" width="140">
          <template #default="{ row }">
            {{ row.owner?.username || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="Created at" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              View
            </el-button>
            <el-button v-permission="'customers.update'" type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              Edit
            </el-button>
            <el-button v-permission="'customers.soft_delete'" type="warning" link size="small" @click="handleSoftDelete(row)">
              <el-icon><Delete /></el-icon>
              Archive
            </el-button>
            <el-button v-permission="'customers.delete'" type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              Delete forever
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

    <CustomerDialog
      v-model="dialogVisible"
      :customer-id="currentCustomerId"
      @success="handleDialogSuccess"
    />

    <el-dialog
      v-model="assignDialogVisible"
      title="Reassign selected customers"
      width="min(460px, 92vw)"
      @closed="handleAssignDialogClosed"
    >
      <div class="assign-dialog__copy">
        <p>Assign {{ selectedRows.length }} selected customer record(s) to a workspace owner.</p>
      </div>

      <el-alert
        v-if="ownerLoadError"
        type="error"
        :closable="false"
        show-icon
        class="assign-dialog__alert"
        :title="ownerLoadError"
      />

      <el-form label-position="top">
        <el-form-item label="New owner">
          <el-select
            v-model="selectedOwnerId"
            placeholder="Select a workspace owner"
            filterable
            style="width: 100%"
            :loading="ownerLoading"
          >
            <el-option
              v-for="owner in ownerOptions"
              :key="owner.id"
              :label="formatOwnerOptionLabel(owner)"
              :value="owner.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="assignDialogVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="assignSubmitting"
          :disabled="ownerLoading || !selectedOwnerId"
          @click="handleAssignSelectedCustomers"
        >
          Assign customers
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, CollectionTag, Delete, Download, Edit, Grid, Plus, Refresh, Search, View } from "@element-plus/icons-vue";
import {
  batchAssignCustomers,
  batchDeleteCustomers,
  deleteCustomer,
  exportCustomers,
  getCustomerTags,
  getCustomerList,
  softDeleteCustomer,
  type Customer,
  type CustomerExportFormat,
  type CustomerListParams,
  type CustomerTagRecord,
} from "@/api/customer";
import { getAdminUserList } from "@/api/admin";
import type { AdminManagedUser } from "@/types/admin";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import { useAuthStore } from "@/stores/auth";
import { usePermissions } from "@/composables/usePermissions";
import CustomerDialog from "./CustomerDialog.vue";

const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

const loading = ref(false);
const exporting = ref(false);
const customerList = ref<Customer[]>([]);
const selectedRows = ref<Customer[]>([]);
const dialogVisible = ref(false);
const currentCustomerId = ref<string | undefined>(undefined);
const tagOptions = ref<CustomerTagRecord[]>([]);
const assignDialogVisible = ref(false);
const assignSubmitting = ref(false);
const ownerLoading = ref(false);
const ownerLoadError = ref("");
const ownerOptions = ref<AdminManagedUser[]>([]);
const selectedOwnerId = ref("");
const canUseCompanyScope = computed(() => (
  permissions.isAdmin.value
  || (permissions.isManager.value && authStore.workspaceRules.managerSharedCustomersEnabled)
));
const canReassignCustomers = computed(() => (
  permissions.hasPermission("customers.assign")
  && (permissions.isAdmin.value || authStore.workspaceRules.managerSharedCustomersEnabled)
));
const scopeOptions = computed<Array<{ label: string; value: "mine" | "company" }>>(() => (
  canUseCompanyScope.value
    ? [
        { label: "Shared team data", value: "company" },
        { label: "My customers", value: "mine" },
      ]
    : [{ label: "My customers", value: "mine" }]
));

const searchForm = reactive<CustomerListParams>({
  scope: "mine",
  keyword: "",
  type: undefined,
  status: undefined,
  level: undefined,
  tag: undefined,
  source: undefined,
  industry: undefined,
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const fetchCustomerList = async () => {
  loading.value = true;

  try {
    const params: CustomerListParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    };

    const data = unwrapApiResponseData(await getCustomerList(params), "Failed to load customers.");
    customerList.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("Failed to load customers:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load customers. Please try again later."));
  } finally {
    loading.value = false;
  }
};

const fetchTagOptions = async () => {
  try {
    const data = unwrapApiResponseData(await getCustomerTags(), "Failed to load customer tags.");
    tagOptions.value = data.list;
  } catch (error) {
    console.error("Failed to load customer tags:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load customer tags."));
  }
};

const getDownloadFilename = (contentDisposition: string | undefined, fallbackExtension: "csv" | "xml") => {
  if (!contentDisposition) {
    return `customers.${fallbackExtension}`;
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i) || contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].trim();
  }

  return `customers.${fallbackExtension}`;
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};

const handleSearch = () => {
  pagination.page = 1;
  fetchCustomerList();
};

const handleReset = () => {
  searchForm.scope = canUseCompanyScope.value ? "company" : "mine";
  searchForm.keyword = "";
  searchForm.type = undefined;
  searchForm.status = undefined;
  searchForm.level = undefined;
  searchForm.tag = undefined;
  searchForm.source = undefined;
  searchForm.industry = undefined;
  pagination.page = 1;
  fetchCustomerList();
};

const handleSelectionChange = (selection: Customer[]) => {
  selectedRows.value = selection;
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `Delete ${selectedRows.value.length} selected customer record(s)?`,
      "Confirm deletion",
      {
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    const ids = selectedRows.value.map((item) => item._id);
    unwrapApiResponseData(await batchDeleteCustomers(ids), "Failed to delete selected customers.");
    notifyActionSuccess("The selected customers were removed successfully.", {
      title: "Batch delete complete",
    });
    selectedRows.value = [];
    fetchCustomerList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete selected customers:", error);
      notifyActionError(error, "Failed to delete selected customers.", {
        title: "Batch delete failed",
      });
    }
  }
};

const fetchAssignableOwners = async ({ force = false }: { force?: boolean } = {}) => {
  if (ownerLoading.value || (ownerOptions.value.length > 0 && !force)) {
    return;
  }

  ownerLoading.value = true;
  ownerLoadError.value = "";

  try {
    const data = unwrapApiResponseData(
      await getAdminUserList({
        page: 1,
        limit: 100,
        includeSystemReserved: false,
      }),
      "Failed to load workspace owners.",
    );
    ownerOptions.value = data.list.filter((user) => !user.isSystemReserved);
  } catch (error) {
    console.error("Failed to load assignable owners:", error);
    ownerLoadError.value = getRequestErrorMessage(error, "Failed to load workspace owners.");
  } finally {
    ownerLoading.value = false;
  }
};

const resolveOwnerOptionLabel = (owner: AdminManagedUser) =>
  `${owner.username} · ${owner.roleLabel}${owner.email ? ` · ${owner.email}` : ""}`;

const formatOwnerOptionLabel = (owner: AdminManagedUser) =>
  `${owner.username} | ${owner.roleLabel}${owner.email ? ` | ${owner.email}` : ""}`;

const handleOpenAssignDialog = async () => {
  if (!selectedRows.value.length) {
    return;
  }

  assignDialogVisible.value = true;
  selectedOwnerId.value = "";
  await fetchAssignableOwners();
};

const handleAssignDialogClosed = () => {
  selectedOwnerId.value = "";
  ownerLoadError.value = "";
};

const handleAssignSelectedCustomers = async () => {
  if (!selectedOwnerId.value) {
    ElMessage.warning("Select a workspace owner first.");
    return;
  }

  assignSubmitting.value = true;

  try {
    const ids = selectedRows.value.map((item) => item._id);
    const data = unwrapApiResponseData(
      await batchAssignCustomers({
        ids,
        ownerId: selectedOwnerId.value,
      }),
      "Failed to reassign selected customers.",
    );
    notifyActionSuccess(
      `${data.assignedCount} customer record(s) were assigned to ${data.owner.username}.`,
      {
        title: "Batch assign complete",
      },
    );
    assignDialogVisible.value = false;
    selectedRows.value = [];
    await fetchCustomerList();
  } catch (error) {
    console.error("Failed to reassign selected customers:", error);
    notifyActionError(error, "Failed to reassign selected customers.", {
      title: "Batch assign failed",
    });
  } finally {
    assignSubmitting.value = false;
  }
};

const handleCreate = () => {
  currentCustomerId.value = undefined;
  dialogVisible.value = true;
};

const handleOpenBoard = () => {
  router.push("/customer/board");
};

const handleOpenTags = () => {
  router.push("/customer/tags");
};

const handleExportCommand = async (command: string | number | object) => {
  const format = command === "excel" ? "excel" : command === "csv" ? "csv" : null;
  if (!format) {
    return;
  }

  exporting.value = true;

  try {
    const response = await exportCustomers(searchForm, format as CustomerExportFormat);
    const extension = format === "excel" ? "xml" : "csv";
    const filename = getDownloadFilename(response.headers["content-disposition"], extension);
    triggerFileDownload(response.data, filename);
    notifyActionSuccess(`Customer ${format === "excel" ? "Excel" : "CSV"} export started.`, {
      title: "Export started",
    });
  } catch (error) {
    console.error("Failed to export customers:", error);
    notifyActionError(error, "Failed to export customers.", {
      title: "Export failed",
    });
  } finally {
    exporting.value = false;
  }
};

const handleDialogSuccess = () => {
  fetchCustomerList();
  fetchTagOptions();
};

const handleView = (row: Customer) => {
  router.push(`/customer/${row._id}`);
};

const handleEdit = (row: Customer) => {
  currentCustomerId.value = row._id;
  dialogVisible.value = true;
};

const handleSoftDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `Archive customer "${row.name}"? You can restore it later from Deleted.`,
      "Archive customer",
      {
        confirmButtonText: "Archive",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    unwrapApiResponseData(await softDeleteCustomer(row._id), "Failed to archive the customer.");
    notifyActionSuccess("The customer was archived and moved to Deleted.", {
      title: "Customer archived",
    });
    fetchCustomerList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to archive the customer:", error);
      notifyActionError(error, "Failed to archive the customer.", {
        title: "Archive failed",
      });
    }
  }
};

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `Delete customer "${row.name}" forever? This action cannot be undone.`,
      "Permanent deletion",
      {
        confirmButtonText: "Delete forever",
        cancelButtonText: "Cancel",
        type: "error",
      },
    );

    unwrapApiResponseData(await deleteCustomer(row._id), "Failed to delete the customer permanently.");
    notifyActionSuccess("The customer was deleted permanently.", {
      title: "Customer deleted",
    });
    fetchCustomerList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete the customer permanently:", error);
      notifyActionError(error, "Failed to delete the customer permanently.", {
        title: "Permanent delete failed",
      });
    }
  }
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchCustomerList();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchCustomerList();
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, "success" | "primary" | "warning" | "danger"> = {
    potential: "success",
    active: "primary",
    dormant: "warning",
    lost: "danger",
  };

  return typeMap[status] || "info";
};

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    potential: "Potential",
    active: "Active",
    dormant: "Dormant",
    lost: "Lost",
  };

  return labelMap[status] || status;
};

const getLevelType = (level: string) => {
  const typeMap: Record<string, "success" | "primary" | "warning" | "danger"> = {
    A: "danger",
    B: "primary",
    C: "success",
    D: "warning",
  };

  return typeMap[level] || "info";
};

const getSourceLabel = (source: string) => {
  const labelMap: Record<string, string> = {
    advertisement: "Advertisement",
    referral: "Referral",
    exhibition: "Exhibition",
    internet: "Online",
    coldcall: "Cold call",
    other: "Other",
  };

  return labelMap[source] || source;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  searchForm.scope = canUseCompanyScope.value ? "company" : "mine";
  fetchCustomerList();
  fetchTagOptions();
});

watch(canUseCompanyScope, (allowed) => {
  if (!allowed && searchForm.scope === "company") {
    searchForm.scope = "mine";
  }

  if (allowed && !searchForm.scope) {
    searchForm.scope = "company";
  }
});
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════
   Customer List — Premium Workspace Style
   ══════════════════════════════════════════════════════════════════════════ */
.customer-list-container {
  padding: 0;
  display: grid;
  gap: 22px;
  animation: sp-fade-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Page Header ──────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  position: relative;
}

.page-header::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: clamp(28px, 3.2vw, 38px);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.04em;
  margin: 0;
  position: relative;
}

.page-title::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 48px;
  height: 3px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  box-shadow: 0 0 10px var(--accent-glow);
}

/* ── Search Card — Glassmorphism Panel ─────────────────────────────────────── */
.search-card {
  margin-bottom: 0;
  border-radius: var(--radius-2xl) !important;
  border: 1px solid var(--border-light) !important;
  background:
    radial-gradient(
      ellipse at top right,
      rgba(96, 171, 255, 0.06),
      transparent 40%
    ),
    var(--surface-white) !important;
  box-shadow: var(--shadow-card) !important;
  overflow: hidden;
  position: relative;
}

.search-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(96, 171, 255, 0.18),
    transparent
  );
}

:deep(.search-card .el-card__body) {
  padding: 20px 24px !important;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 10px;
  margin-right: 14px;
}

.search-form :deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Table Card ───────────────────────────────────────────────────────────── */
.table-card {
  min-height: 500px;
  border-radius: var(--radius-2xl) !important;
  overflow: hidden;
  position: relative;
}

:deep(.table-card .el-card__body) {
  padding: 0 !important;
}

:deep(.table-card .el-table) {
  border: none !important;
}

:deep(.table-card .el-table th.el-table__cell) {
  background: var(--surface-secondary) !important;
  border-bottom: 1px solid var(--border-light) !important;
}

:deep(.table-card .el-table td.el-table__cell) {
  border-right: none !important;
}

:deep(.table-card .el-table__body-wrapper) {
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

/* ── Name Column — Clickable link style ──────────────────────────────────── */
:deep(.table-card .el-table .customer-name-cell) {
  color: var(--accent-primary);
  font-weight: 700;
  cursor: pointer;
  transition: color var(--transition-fast);
}

:deep(.table-card .el-table .customer-name-cell:hover) {
  color: var(--accent-primary-hover);
}

/* ── Batch Toolbar ────────────────────────────────────────────────────────── */
.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 20px;
  padding: 12px 18px;
  background: var(--surface-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  animation: sp-slide-down 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.selected-count {
  margin-right: 12px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent-strong);
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 18px 22px;
  border-top: 1px solid var(--border-light);
  background: var(--surface-primary);
}

/* ── Assign Dialog ────────────────────────────────────────────────────────── */
.assign-dialog__copy p {
  margin: 0 0 16px;
  color: var(--text-secondary);
  line-height: 1.75;
  font-size: 14px;
}

.assign-dialog__alert {
  margin-bottom: 16px;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-form {
    flex-direction: column;
  }

  .search-form :deep(.el-form-item) {
    margin-right: 0;
    width: 100%;
  }
}
</style>
