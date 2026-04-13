<template>
  <div class="customer-board-container">
    <div class="page-header">
      <div class="page-copy">
        <h1 class="page-title">Customer board</h1>
        <p class="page-subtitle">
          Drag customer cards between lanes to transition lifecycle status. The board uses the same status rules as the backend.
        </p>
      </div>

      <div class="header-actions">
        <el-button @click="handleOpenList">
          <el-icon><List /></el-icon>
          Table view
        </el-button>
        <el-button type="primary" @click="handleCreate">
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

        <el-form-item label="Tier">
          <el-select v-model="searchForm.level" placeholder="All" clearable style="width: 120px">
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
          </el-select>
        </el-form-item>

        <el-form-item label="Source">
          <el-select v-model="searchForm.source" placeholder="All" clearable style="width: 150px">
            <el-option label="Advertisement" value="advertisement" />
            <el-option label="Referral" value="referral" />
            <el-option label="Exhibition" value="exhibition" />
            <el-option label="Online" value="internet" />
            <el-option label="Cold call" value="coldcall" />
            <el-option label="Other" value="other" />
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

      <div class="summary-row">
        <div class="summary-pill">
          <span class="summary-label">Loaded</span>
          <span class="summary-value">{{ customerList.length }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Matching</span>
          <span class="summary-value">{{ totalCustomers }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Dragging</span>
          <span class="summary-value">{{ draggedCustomerId ? "Active" : "Idle" }}</span>
        </div>
      </div>
    </el-card>

    <div v-if="totalCustomers > boardLimit" class="board-note">
      Showing the newest {{ boardLimit }} matching customers. Narrow filters if you need to manage a larger result set.
    </div>

    <div class="board-scroll" v-loading="loading">
      <div class="board-grid">
        <section
          v-for="column in boardColumns"
          :key="column.status"
          class="status-column"
          :class="{
            'is-drop-target': hoverStatus === column.status && isDropAllowed(column.status),
            'is-drop-disabled': Boolean(draggedCustomerId) && !isDropAllowed(column.status) && dragSourceStatus !== column.status,
          }"
          @dragenter="handleLaneDragEnter(column.status, $event)"
          @dragover="handleLaneDragOver(column.status, $event)"
          @dragleave="handleLaneDragLeave(column.status, $event)"
          @drop="handleDrop(column.status, $event)"
        >
          <header class="column-header">
            <div class="column-title-row">
              <span class="column-indicator" :style="{ background: column.accent }"></span>
              <h2 class="column-title">{{ column.label }}</h2>
              <span class="column-count">{{ column.items.length }}</span>
            </div>
            <p class="column-description">{{ column.description }}</p>
          </header>

          <div class="column-body">
            <div
              v-if="column.items.length === 0"
              class="empty-lane"
              :class="{ 'can-drop': hoverStatus === column.status && isDropAllowed(column.status) }"
            >
              Drop a card here or create a new customer.
            </div>

            <article
              v-for="customer in column.items"
              :key="customer._id"
              class="customer-card"
              :class="{
                'is-dragging': draggedCustomerId === customer._id,
                'is-transitioning': transitioningCustomerId === customer._id,
              }"
              :draggable="transitioningCustomerId !== customer._id"
              @dragstart="handleDragStart(customer, $event)"
              @dragend="handleDragEnd"
            >
              <div class="card-top">
                <div class="card-heading">
                  <h3 class="card-name">{{ customer.name }}</h3>
                  <div class="card-badges">
                    <span class="meta-badge">Tier {{ customer.level }}</span>
                    <span class="meta-badge">{{ customer.type === "enterprise" ? "Enterprise" : "Individual" }}</span>
                  </div>
                </div>
              </div>

              <div class="card-contact">
                <span>{{ customer.owner?.username || "Unassigned" }}</span>
                <span>{{ getSourceLabel(customer.source) }}</span>
                <span>{{ customer.email || customer.mobile || customer.phone || "No contact info" }}</span>
              </div>

              <div v-if="customer.tags?.length" class="card-tags">
                <span v-for="tag in customer.tags.slice(0, 3)" :key="tag" class="tag-chip">{{ tag }}</span>
                <span v-if="customer.tags.length > 3" class="tag-chip tag-chip-muted">+{{ customer.tags.length - 3 }}</span>
              </div>

              <div class="card-footer">
                <span class="card-date">Updated {{ formatDate(customer.updatedAt) }}</span>
                <div class="card-actions">
                  <el-button link @click.stop="handleView(customer)">Open</el-button>
                  <el-button link @click.stop="handleEdit(customer)">Edit</el-button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { List, Plus, Refresh, Search } from "@element-plus/icons-vue";
import {
  getCustomerList,
  transitionCustomerStatus,
  type Customer,
  type CustomerListParams,
  type CustomerSource,
  type CustomerStatus,
} from "@/api/customer";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";

interface BoardColumnDefinition {
  status: CustomerStatus;
  label: string;
  description: string;
  accent: string;
}

const router = useRouter();
const boardLimit = 100;

const BOARD_COLUMNS: BoardColumnDefinition[] = [
  {
    status: "potential",
    label: "Potential",
    description: "New prospects that still need qualification.",
    accent: "var(--border-default)",
  },
  {
    status: "active",
    label: "Active",
    description: "Customers currently engaged with the team.",
    accent: "var(--text-primary)",
  },
  {
    status: "dormant",
    label: "Dormant",
    description: "Customers that need reactivation follow-up.",
    accent: "var(--text-tertiary)",
  },
  {
    status: "lost",
    label: "Lost",
    description: "Customers that are no longer moving forward.",
    accent: "var(--text-secondary)",
  },
];

const STATUS_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  potential: ["active", "dormant", "lost"],
  active: ["dormant", "lost"],
  dormant: ["active", "lost"],
  lost: ["potential", "active"],
};

const loading = ref(false);
const totalCustomers = ref(0);
const customerList = ref<Customer[]>([]);
const draggedCustomerId = ref<string>();
const dragSourceStatus = ref<CustomerStatus>();
const hoverStatus = ref<CustomerStatus>();
const transitioningCustomerId = ref<string>();

const searchForm = reactive<CustomerListParams>({
  keyword: "",
  type: undefined,
  level: undefined,
  source: undefined,
  industry: undefined,
});

const sortedCustomers = computed(() =>
  [...customerList.value].sort((left, right) => {
    const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
    const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.name.localeCompare(right.name);
  }),
);

const boardColumns = computed(() =>
  BOARD_COLUMNS.map((column) => ({
    ...column,
    items: sortedCustomers.value.filter((customer) => customer.status === column.status),
  })),
);

const fetchCustomerBoard = async () => {
  loading.value = true;

  try {
    const params: CustomerListParams = {
      page: 1,
      limit: boardLimit,
      sortField: "updatedAt",
      sortOrder: "desc",
      keyword: searchForm.keyword || undefined,
      type: searchForm.type,
      level: searchForm.level,
      source: searchForm.source,
      industry: searchForm.industry || undefined,
    };

    const data = unwrapApiResponseData(await getCustomerList(params), "Failed to load the customer board.");
    customerList.value = data.list;
    totalCustomers.value = data.total;
  } catch (error) {
    console.error("Failed to load the customer board:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load the customer board."));
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchCustomerBoard();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.type = undefined;
  searchForm.level = undefined;
  searchForm.source = undefined;
  searchForm.industry = undefined;
  fetchCustomerBoard();
};

const handleOpenList = () => {
  router.push("/customer");
};

const handleCreate = () => {
  router.push({
    path: "/customer/form",
    query: {
      redirect: "/customer/board",
    },
  });
};

const handleView = (customer: Customer) => {
  router.push(`/customer/${customer._id}`);
};

const handleEdit = (customer: Customer) => {
  router.push({
    path: `/customer/form/${customer._id}`,
    query: {
      redirect: "/customer/board",
    },
  });
};

const getSourceLabel = (source: CustomerSource) => {
  const labelMap: Record<CustomerSource, string> = {
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
  if (!dateString) {
    return "just now";
  }

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isDropAllowed = (targetStatus: CustomerStatus) => {
  if (!dragSourceStatus.value) {
    return false;
  }

  return STATUS_TRANSITIONS[dragSourceStatus.value].includes(targetStatus);
};

const resetDragState = () => {
  draggedCustomerId.value = undefined;
  dragSourceStatus.value = undefined;
  hoverStatus.value = undefined;
};

const handleDragStart = (customer: Customer, event: DragEvent) => {
  if (transitioningCustomerId.value) {
    event.preventDefault();
    return;
  }

  draggedCustomerId.value = customer._id;
  dragSourceStatus.value = customer.status;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", customer._id);
  }
};

const handleDragEnd = () => {
  resetDragState();
};

const handleLaneDragEnter = (targetStatus: CustomerStatus, event: DragEvent) => {
  if (!isDropAllowed(targetStatus)) {
    return;
  }

  event.preventDefault();
  hoverStatus.value = targetStatus;
};

const handleLaneDragOver = (targetStatus: CustomerStatus, event: DragEvent) => {
  if (!isDropAllowed(targetStatus)) {
    return;
  }

  event.preventDefault();
  hoverStatus.value = targetStatus;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const handleLaneDragLeave = (targetStatus: CustomerStatus, event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as Node | null;

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }

  if (hoverStatus.value === targetStatus) {
    hoverStatus.value = undefined;
  }
};

const patchCustomerInBoard = (updatedCustomer: Customer) => {
  customerList.value = customerList.value.map((customer) =>
    customer._id === updatedCustomer._id
      ? {
          ...customer,
          ...updatedCustomer,
          owner: updatedCustomer.owner ?? customer.owner,
          company: updatedCustomer.company ?? customer.company,
          tags: updatedCustomer.tags ?? customer.tags,
        }
      : customer,
  );
};

const handleDrop = async (targetStatus: CustomerStatus, event: DragEvent) => {
  event.preventDefault();

  const customerId = draggedCustomerId.value;
  const sourceStatus = dragSourceStatus.value;
  resetDragState();

  if (!customerId || !sourceStatus || !STATUS_TRANSITIONS[sourceStatus].includes(targetStatus)) {
    return;
  }

  const customer = customerList.value.find((item) => item._id === customerId);
  if (!customer || customer.status === targetStatus) {
    return;
  }

  transitioningCustomerId.value = customerId;

  try {
    const data = unwrapApiResponseData(
      await transitionCustomerStatus(customerId, { status: targetStatus }),
      "Failed to update customer status.",
    );
    patchCustomerInBoard(data.customer);
    ElMessage.success(`Moved "${customer.name}" to ${BOARD_COLUMNS.find((column) => column.status === targetStatus)?.label}.`);
  } catch (error) {
    console.error("Failed to update customer status from the board:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to update customer status."));
  } finally {
    transitioningCustomerId.value = undefined;
  }
};

onMounted(() => {
  fetchCustomerBoard();
});
</script>

<style scoped>
.customer-board-container {
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

.search-card {
  margin-bottom: 18px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.search-form .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
}

.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-secondary, rgb(244, 242, 236));
}

.summary-label {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
  font-weight: 600;
}

.summary-value {
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 14px;
  font-weight: 700;
}

.board-note {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-tertiary, rgb(235, 233, 225));
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 14px;
}

.board-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(280px, 1fr));
  gap: 20px;
  min-width: 1180px;
  align-items: start;
}

.status-column {
  display: flex;
  flex-direction: column;
  min-height: 640px;
  padding: 16px;
  border-radius: 24px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: linear-gradient(180deg, var(--surface-secondary, rgb(244, 242, 236)) 0%, var(--surface-primary, rgb(250, 249, 245)) 100%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.status-column.is-drop-target {
  border-color: var(--text-primary, rgb(26, 25, 23));
  box-shadow: 0 0 0 2px rgba(26, 25, 23, 0.08);
}

.status-column.is-drop-disabled {
  opacity: 0.7;
}

.column-header {
  padding: 4px 4px 14px;
  border-bottom: 1px solid var(--border-light, rgb(220, 217, 207));
}

.column-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-indicator {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.column-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 20px;
  font-weight: 700;
}

.column-count {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-white, rgb(255, 255, 255));
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 12px;
  font-weight: 700;
}

.column-description {
  margin: 8px 0 0;
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
  line-height: 1.5;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 540px;
  padding-top: 14px;
}

.empty-lane {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 132px;
  padding: 16px;
  border-radius: 18px;
  border: 1px dashed var(--border-default, rgb(195, 192, 180));
  background: rgba(255, 255, 255, 0.45);
  color: var(--text-tertiary, rgb(138, 136, 128));
  text-align: center;
  font-size: 14px;
}

.empty-lane.can-drop {
  border-color: var(--text-primary, rgb(26, 25, 23));
  color: var(--text-secondary, rgb(88, 86, 80));
  background: var(--surface-white, rgb(255, 255, 255));
}

.customer-card {
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-white, rgb(255, 255, 255));
  box-shadow: 0 12px 24px rgba(26, 25, 23, 0.05);
  cursor: grab;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.customer-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-default, rgb(195, 192, 180));
  box-shadow: 0 16px 26px rgba(26, 25, 23, 0.08);
}

.customer-card.is-dragging {
  opacity: 0.45;
  transform: rotate(1deg);
}

.customer-card.is-transitioning {
  opacity: 0.7;
  pointer-events: none;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.card-heading {
  min-width: 0;
}

.card-name {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}

.card-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 12px;
  font-weight: 600;
}

.card-contact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 13px;
  line-height: 1.5;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--surface-tertiary, rgb(235, 233, 225));
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 12px;
  font-weight: 600;
}

.tag-chip-muted {
  background: var(--surface-secondary, rgb(244, 242, 236));
  color: var(--text-tertiary, rgb(138, 136, 128));
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, rgb(220, 217, 207));
}

.card-date {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  font-weight: 500;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary, rgb(88, 86, 80));
  font-weight: 600;
}

@media (max-width: 1280px) {
  .board-grid {
    min-width: 1080px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 30px;
  }

  .board-grid {
    gap: 16px;
    min-width: 980px;
  }

  .status-column {
    min-height: 560px;
  }

  .column-body {
    min-height: 470px;
  }
}
</style>
