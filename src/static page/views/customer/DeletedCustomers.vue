<template>
  <div class="deleted-customers-container">
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

        <el-form-item label="Tier">
          <el-select v-model="searchForm.level" placeholder="All" clearable style="width: 120px">
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
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
      <div class="section-head">
        <h1 class="section-title">Deleted customers</h1>
        <p class="section-copy">Review archived records, restore them, or remove them permanently.</p>
      </div>

      <el-table
        v-loading="loading"
        :data="customerList"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="Name" min-width="170" show-overflow-tooltip />

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

        <el-table-column prop="deletedAt" label="Deleted at" width="180">
          <template #default="{ row }">
            {{ formatDate(row.deletedAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="deletedBy" label="Deleted by" width="140">
          <template #default="{ row }">
            {{ row.deletedBy?.username || "-" }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-permission="'customers.restore'" type="success" link size="small" @click="handleRestore(row)">
              <el-icon><RefreshLeft /></el-icon>
              Restore
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh, RefreshLeft, Search } from "@element-plus/icons-vue";
import {
  deleteCustomer,
  getDeletedCustomers,
  restoreCustomer,
  type Customer,
  type CustomerListParams,
} from "@/api/customer";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";

const loading = ref(false);
const customerList = ref<Customer[]>([]);

const searchForm = reactive<CustomerListParams>({
  keyword: "",
  type: undefined,
  status: undefined,
  level: undefined,
  source: undefined,
  industry: undefined,
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const fetchDeletedCustomers = async () => {
  loading.value = true;

  try {
    const params: CustomerListParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    };

    const data = unwrapApiResponseData(await getDeletedCustomers(params), "Failed to load deleted customers.");
    customerList.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("Failed to load deleted customers:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load deleted customers. Please try again later."));
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchDeletedCustomers();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.type = undefined;
  searchForm.status = undefined;
  searchForm.level = undefined;
  searchForm.source = undefined;
  searchForm.industry = undefined;
  pagination.page = 1;
  fetchDeletedCustomers();
};

const handleRestore = async (row: Customer) => {
  try {
    await ElMessageBox.confirm(
      `Restore customer "${row.name}" to the active directory?`,
      "Restore customer",
      {
        confirmButtonText: "Restore",
        cancelButtonText: "Cancel",
        type: "info",
      },
    );
    unwrapApiResponseData(await restoreCustomer(row._id), "Failed to restore the customer.");
    notifyActionSuccess("The customer was restored to the active directory.", {
      title: "Customer restored",
    });
    fetchDeletedCustomers();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to restore the customer:", error);
      notifyActionError(error, "Failed to restore the customer.", {
        title: "Restore failed",
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
    fetchDeletedCustomers();
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
  fetchDeletedCustomers();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchDeletedCustomers();
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
  fetchDeletedCustomers();
});
</script>

<style scoped>
.deleted-customers-container {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.search-form .el-form-item {
  margin-bottom: 12px;
  margin-right: 16px;
}

.table-card {
  min-height: 420px;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.section-copy {
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  line-height: 1.6;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary, rgb(88, 86, 80));
  font-weight: 600;
}
</style>
