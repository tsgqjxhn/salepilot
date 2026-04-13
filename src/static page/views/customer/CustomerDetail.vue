<template>
  <div class="customer-detail-container" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          Back
        </el-button>
        <h1 class="page-title">{{ customerData.name || "Customer details" }}</h1>
        <el-tag :type="getStatusType(customerData.status || 'potential')" size="large">
          {{ getStatusLabel(customerData.status || "potential") }}
        </el-tag>
        <el-tag :type="getLevelType(customerData.level || 'C')" size="large" effect="dark">
          Tier {{ customerData.level || "C" }}
        </el-tag>
      </div>

      <div class="header-right">
        <el-button v-permission="'ai.analysis.run'" @click="handleOpenAiResult">
          <el-icon><DataAnalysis /></el-icon>
          AI result
        </el-button>
        <el-button v-permission="'followups.create'" @click="handleCreateFollowup">
          <el-icon><Plus /></el-icon>
          Add follow-up
        </el-button>
        <el-button v-permission="'customers.update'" type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          Edit
        </el-button>
        <el-button v-permission="'customers.soft_delete'" type="warning" @click="handleSoftDelete">
          <el-icon><Delete /></el-icon>
          Archive
        </el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="left-panel">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>Basic information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="Customer name">{{ customerData.name || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Customer type">
              <el-tag :type="customerData.type === 'enterprise' ? 'primary' : 'success'" size="small">
                {{ customerData.type === "enterprise" ? "Enterprise" : "Individual" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              <el-tag :type="getStatusType(customerData.status || 'potential')" size="small">
                {{ getStatusLabel(customerData.status || "potential") }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Tier">
              <el-tag :type="getLevelType(customerData.level || 'C')" size="small" effect="dark">
                {{ customerData.level || "C" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Created at">{{ formatDate(customerData.createdAt || "") }}</el-descriptions-item>
            <el-descriptions-item label="Updated at">{{ formatDate(customerData.updatedAt || "") }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Phone /></el-icon>
              <span>Contact information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="Email">{{ customerData.email || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Phone">{{ customerData.phone || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Mobile">{{ customerData.mobile || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Fax">{{ customerData.fax || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Website">
              <a v-if="customerData.website" :href="customerData.website" target="_blank" rel="noreferrer" class="link">
                {{ customerData.website }}
              </a>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Location /></el-icon>
              <span>Address information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="Country">{{ customerData.country || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Province">{{ customerData.province || "-" }}</el-descriptions-item>
            <el-descriptions-item label="City">{{ customerData.city || "-" }}</el-descriptions-item>
            <el-descriptions-item label="District">{{ customerData.district || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Street">{{ customerData.street || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Postal code">{{ customerData.postalCode || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Briefcase /></el-icon>
              <span>Business information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="Industry">{{ customerData.industry || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Source">{{ getSourceLabel(customerData.source || "internet") }}</el-descriptions-item>
            <el-descriptions-item label="Owner">{{ customerData.owner?.username || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Company">{{ customerData.company?.name || "-" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><Money /></el-icon>
              <span>Financial information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="Annual revenue">
              {{ customerData.annualRevenue ? formatCurrency(customerData.annualRevenue, customerData.currency || "CNY") : "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Employee count">{{ customerData.employeeCount || "-" }}</el-descriptions-item>
            <el-descriptions-item label="Currency">{{ customerData.currency || "CNY" }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>Social information</span>
            </div>
          </template>
          <el-descriptions :column="1">
            <el-descriptions-item label="WeChat">{{ customerData.wechat || "-" }}</el-descriptions-item>
            <el-descriptions-item label="QQ">{{ customerData.qq || "-" }}</el-descriptions-item>
            <el-descriptions-item label="LinkedIn">
              <a v-if="customerData.linkedin" :href="customerData.linkedin" target="_blank" rel="noreferrer" class="link">
                {{ customerData.linkedin }}
              </a>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="Twitter">
              <a v-if="customerData.twitter" :href="customerData.twitter" target="_blank" rel="noreferrer" class="link">
                {{ customerData.twitter }}
              </a>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>Metrics</span>
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.contactCount }}</div>
              <div class="stat-label">Contacts</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.opportunityCount }}</div>
              <div class="stat-label">Opportunities</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.activityCount }}</div>
              <div class="stat-label">Activities</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(statistics.totalAmount, customerData.currency || "CNY") }}</div>
              <div class="stat-label">Order value</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="ai-panel-section">
      <AiAnalysisPanel
        :customer-name="customerData.name || 'Customer'"
        :result="aiAnalysisResult"
        :metadata="aiAnalysisMetadata"
        :metadata-items="aiAnalysisMetaItems"
        :signal-items="aiSignalItems"
        :loading="aiAnalysisLoading"
        :error="aiAnalysisError || null"
        @run="handleRunAiAnalysis"
        @open-detail="handleOpenAiResult"
      />
    </div>

    <el-card class="info-card full-width">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>Notes</span>
        </div>
      </template>
      <el-descriptions :column="2">
        <el-descriptions-item label="Description" :span="2">
          <p class="description-text">{{ customerData.description || "No description available." }}</p>
        </el-descriptions-item>
        <el-descriptions-item label="Remark" :span="2">
          <p class="description-text">{{ customerData.remark || "No internal notes available." }}</p>
        </el-descriptions-item>
        <el-descriptions-item label="Tags" :span="2">
          <el-tag v-for="tag in customerData.tags" :key="tag" size="small" class="tag-item">
            {{ tag }}
          </el-tag>
          <span v-if="!customerData.tags || customerData.tags.length === 0">No tags</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="info-card full-width">
      <template #header>
        <div class="timeline-header">
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>Timeline</span>
          </div>

          <div class="timeline-toolbar">
            <el-select
              v-model="selectedTimelineTypes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="Filter event types"
              style="width: 240px"
              @change="handleTimelineFilterChange"
            >
              <el-option
                v-for="option in timelineTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-button text @click="resetTimelineFilters">Reset</el-button>
          </div>
        </div>
      </template>

      <div class="timeline-summary-grid">
        <div class="timeline-summary-card">
          <span class="timeline-summary-label">Total events</span>
          <strong class="timeline-summary-value">{{ timelineSummary.totalEvents }}</strong>
        </div>
        <div class="timeline-summary-card">
          <span class="timeline-summary-label">Follow-ups</span>
          <strong class="timeline-summary-value">{{ timelineSummary.followupCount }}</strong>
        </div>
        <div class="timeline-summary-card">
          <span class="timeline-summary-label">Activities</span>
          <strong class="timeline-summary-value">{{ timelineSummary.activityCount }}</strong>
        </div>
        <div class="timeline-summary-card">
          <span class="timeline-summary-label">Status changes</span>
          <strong class="timeline-summary-value">{{ timelineSummary.statusChangeCount }}</strong>
        </div>
      </div>

      <div v-loading="timelineLoading" class="timeline-panel">
        <div v-if="timelineItems.length > 0" class="timeline-list">
          <article v-for="(item, index) in timelineItems" :key="item.id" class="timeline-entry">
            <div class="timeline-rail">
              <div class="timeline-node">
                <el-icon>
                  <component :is="getTimelineIcon(item.eventType)" />
                </el-icon>
              </div>
              <span v-if="index !== timelineItems.length - 1" class="timeline-connector"></span>
            </div>

            <div class="timeline-content">
              <div class="timeline-meta">
                <el-tag size="small" effect="plain" :type="getTimelineTagType(item.eventType)">
                  {{ getTimelineEventLabel(item.eventType) }}
                </el-tag>
                <span class="timeline-date">{{ formatTimelineDate(item) }}</span>
              </div>

              <div class="timeline-headline">
                <h3 class="timeline-entry-title">{{ item.title }}</h3>
                <el-tag v-if="item.status" size="small" effect="plain">
                  {{ formatTimelineToken(item.status) }}
                </el-tag>
              </div>

              <p v-if="item.description" class="timeline-description">
                {{ item.description }}
              </p>

              <div v-if="getTimelineHighlights(item).length > 0" class="timeline-pills">
                <span
                  v-for="detail in getTimelineHighlights(item)"
                  :key="detail"
                  class="timeline-pill"
                >
                  {{ detail }}
                </span>
              </div>

              <div v-if="getTimelineNotes(item).length > 0" class="timeline-notes">
                <p v-for="note in getTimelineNotes(item)" :key="note" class="timeline-note">
                  {{ note }}
                </p>
              </div>

              <div v-if="item.tags && item.tags.length > 0" class="timeline-tags">
                <el-tag v-for="tag in item.tags" :key="tag" size="small" class="tag-item">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-data timeline-empty">
          No timeline events match the selected filters.
        </div>

        <div v-if="hasMoreTimeline" class="timeline-actions">
          <el-button :loading="timelineLoading" @click="handleLoadMoreTimeline">
            Load more events
          </el-button>
        </div>
      </div>
    </el-card>

    <div class="related-section">
      <h2 class="section-title">Related records</h2>

      <el-card class="related-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>Contacts</span>
          </div>
        </template>
        <el-table :data="detailData.contacts" stripe style="width: 100%">
          <el-table-column prop="name" label="Name" width="140" />
          <el-table-column prop="position" label="Position" width="140" />
          <el-table-column prop="mobile" label="Mobile" width="160" />
          <el-table-column prop="email" label="Email" min-width="220" />
          <el-table-column prop="isPrimary" label="Primary" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isPrimary" type="success" size="small">Primary</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="detailData.contacts.length === 0" class="empty-data">No contacts yet.</div>
      </el-card>

      <el-card class="related-card">
        <template #header>
          <div class="card-header">
            <el-icon><Calendar /></el-icon>
            <span>Recent activities</span>
          </div>
        </template>
        <el-table :data="detailData.recentActivities" stripe style="width: 100%">
          <el-table-column prop="type" label="Type" width="120" />
          <el-table-column prop="title" label="Title" min-width="220" />
          <el-table-column prop="status" label="Status" width="120" />
          <el-table-column prop="startTime" label="Time" width="190">
            <template #default="{ row }">
              {{ formatDate(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Owner" width="140">
            <template #default="{ row }">
              {{ row.owner?.username || "-" }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="detailData.recentActivities.length === 0" class="empty-data">No recent activities.</div>
      </el-card>

      <el-card class="related-card">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>Opportunities</span>
          </div>
        </template>
        <el-table :data="detailData.opportunities" stripe style="width: 100%">
          <el-table-column prop="name" label="Name" min-width="220" />
          <el-table-column prop="stage" label="Stage" width="130" />
          <el-table-column prop="amount" label="Amount" width="160">
            <template #default="{ row }">
              {{ row.amount ? formatCurrency(row.amount, row.currency || "CNY") : "-" }}
            </template>
          </el-table-column>
          <el-table-column label="Owner" width="140">
            <template #default="{ row }">
              {{ row.owner?.username || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="Created at" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="detailData.opportunities.length === 0" class="empty-data">No opportunities yet.</div>
      </el-card>

      <el-card class="related-card">
        <template #header>
          <div class="card-header">
            <el-icon><ShoppingCart /></el-icon>
            <span>Orders</span>
          </div>
        </template>
        <el-table :data="detailData.recentOrders" stripe style="width: 100%">
          <el-table-column prop="orderNo" label="Order no." width="160" />
          <el-table-column prop="status" label="Status" width="120" />
          <el-table-column prop="totalAmount" label="Amount" width="160">
            <template #default="{ row }">
              {{ row.totalAmount ? formatCurrency(row.totalAmount, row.currency || "CNY") : "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="paymentStatus" label="Payment" width="120" />
          <el-table-column prop="orderDate" label="Order date" width="180">
            <template #default="{ row }">
              {{ formatDate(row.orderDate) }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="detailData.recentOrders.length === 0" class="empty-data">No orders yet.</div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChatDotRound,
  Clock,
  DataAnalysis,
  Delete,
  Document,
  Edit,
  Location,
  Money,
  Phone,
  Plus,
  RefreshRight,
  ShoppingCart,
  TrendCharts,
  User,
} from "@element-plus/icons-vue";
import AiAnalysisPanel from "@/components/customer/AiAnalysisPanel.vue";
import {
  getCustomerDetail,
  getCustomerTimeline,
  softDeleteCustomer,
  triggerCustomerAiAnalysis,
  type Customer,
  type CustomerTimelineEventType,
  type CustomerTimelineItem,
} from "@/api/customer";
import { FOLLOWUP_CHANNEL_LABELS, type FollowupChannel } from "@/utils/followup";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import type { AiAnalysisMetadata, AiDisplayMetaItem, AiResultRecord } from "@/types/ai";

interface ContactRecord {
  name?: string;
  position?: string;
  mobile?: string;
  email?: string;
  isPrimary?: boolean;
}

interface ActivityRecord {
  type?: string;
  title?: string;
  status?: string;
  startTime?: string;
  owner?: {
    username?: string;
  };
}

interface OpportunityRecord {
  name?: string;
  stage?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  owner?: {
    username?: string;
  };
}

interface OrderRecord {
  orderNo?: string;
  status?: string;
  totalAmount?: number;
  currency?: string;
  paymentStatus?: string;
  orderDate?: string;
}

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const timelineLoading = ref(false);
const aiAnalysisLoading = ref(false);
const aiAnalysisError = ref("");
const timelineItems = ref<CustomerTimelineItem[]>([]);
const timelinePage = ref(1);
const timelineTotal = ref(0);
const aiAnalysisResult = ref<AiResultRecord | null>(null);
const aiAnalysisMetadata = ref<AiAnalysisMetadata | null>(null);

const timelineTypeOptions: Array<{ value: CustomerTimelineEventType; label: string }> = [
  { value: "customer", label: "Customer" },
  { value: "activity", label: "Activity" },
  { value: "status_change", label: "Status change" },
  { value: "followup", label: "Follow-up" },
  { value: "opportunity", label: "Opportunity" },
  { value: "order", label: "Order" },
];

const allTimelineTypes = timelineTypeOptions.map((option) => option.value);
const selectedTimelineTypes = ref<CustomerTimelineEventType[]>([...allTimelineTypes]);
const timelineSummary = reactive({
  totalEvents: 0,
  customerCount: 0,
  activityCount: 0,
  statusChangeCount: 0,
  followupCount: 0,
  opportunityCount: 0,
  orderCount: 0,
});
const timelinePageSize = 8;
const hasMoreTimeline = computed(() => timelineItems.value.length < timelineTotal.value);

const profileCoverage = computed(() => {
  const fields = [
    customerData.email,
    customerData.phone,
    customerData.mobile,
    customerData.website,
    customerData.industry,
    customerData.description,
    customerData.owner?._id,
    customerData.lastContactDate,
  ];
  const completed = fields.filter((value) => Boolean(value)).length;

  return Math.round((completed / fields.length) * 100);
});

const customerData = reactive<Partial<Customer>>({
  _id: "",
  name: "",
  type: "individual",
  status: "potential",
  level: "C",
  source: "internet",
  currency: "CNY",
  createdAt: "",
  updatedAt: "",
  tags: [],
});

const statistics = reactive({
  contactCount: 0,
  opportunityCount: 0,
  activityCount: 0,
  totalAmount: 0,
});

const detailData = reactive({
  contacts: [] as ContactRecord[],
  recentActivities: [] as ActivityRecord[],
  opportunities: [] as OpportunityRecord[],
  recentOrders: [] as OrderRecord[],
});

const aiAnalysisMetaItems = computed<AiDisplayMetaItem[]>(() => {
  if (!aiAnalysisResult.value) {
    return [];
  }

  return [
    { label: "Generated", value: formatDate(aiAnalysisResult.value.createdAt) },
    { label: "Model", value: aiAnalysisMetadata.value?.modelUsed || aiAnalysisResult.value.modelUsed || "-" },
    { label: "Cache", value: aiAnalysisMetadata.value?.cached ? "12h cache hit" : "Fresh run" },
    { label: "Expires", value: formatDate(aiAnalysisMetadata.value?.cacheExpiresAt || "") },
    { label: "Version", value: aiAnalysisMetadata.value?.templateVersion || "-" },
    {
      label: "Confidence",
      value:
        typeof aiAnalysisResult.value.confidence === "number" && aiAnalysisResult.value.confidence > 0
          ? `${Math.round(aiAnalysisResult.value.confidence * 100)}%`
          : "Not provided",
    },
  ];
});

const aiSignalItems = computed<AiDisplayMetaItem[]>(() => [
  { label: "Lifecycle", value: getStatusLabel(customerData.status || "potential") },
  { label: "Profile coverage", value: `${profileCoverage.value}%` },
  { label: "Activities", value: String(statistics.activityCount) },
  {
    label: "Order value",
    value: statistics.totalAmount > 0 ? formatCurrency(statistics.totalAmount, customerData.currency || "CNY") : "No order value",
  },
]);

const fetchCustomerDetail = async () => {
  loading.value = true;

  try {
    const data = unwrapApiResponseData(
      await getCustomerDetail(route.params.id as string),
      "Failed to load customer details.",
    );
    Object.assign(customerData, data.customer);
    statistics.contactCount = data.statistics.contactCount;
    statistics.opportunityCount = data.statistics.opportunityCount;
    statistics.activityCount = data.statistics.activityCount;
    statistics.totalAmount = data.statistics.totalAmount;
    detailData.contacts = (data.contacts || []) as ContactRecord[];
    detailData.recentActivities = (data.recentActivities || []) as ActivityRecord[];
    detailData.opportunities = (data.opportunities || []) as OpportunityRecord[];
    detailData.recentOrders = (data.recentOrders || []) as OrderRecord[];
  } catch (error) {
    console.error("Failed to load customer details:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load customer details. Please try again later."));
  } finally {
    loading.value = false;
  }
};

const fetchCustomerTimeline = async (append = false) => {
  timelineLoading.value = true;

  const nextPage = append ? timelinePage.value + 1 : 1;

  try {
    const activeTypes =
      selectedTimelineTypes.value.length === 0 || selectedTimelineTypes.value.length === allTimelineTypes.length
        ? undefined
        : [...selectedTimelineTypes.value];

    const data = unwrapApiResponseData(
      await getCustomerTimeline(route.params.id as string, {
      page: nextPage,
      limit: timelinePageSize,
      types: activeTypes,
      }),
      "Failed to load the timeline.",
    );
    timelinePage.value = data.page;
    timelineTotal.value = data.total;
    timelineItems.value = append ? [...timelineItems.value, ...data.list] : data.list;
    Object.assign(timelineSummary, data.summary);
  } catch (error) {
    console.error("Failed to load the customer timeline:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load the timeline."));
  } finally {
    timelineLoading.value = false;
  }
};

const handleBack = () => {
  router.back();
};

const handleEdit = () => {
  router.push({
    path: `/customer/form/${customerData._id}`,
    query: {
      redirect: `/customer/${customerData._id}`,
    },
  });
};

const handleCreateFollowup = () => {
  router.push({
    path: `/customer/${customerData._id}/followups/new`,
    query: {
      redirect: `/customer/${customerData._id}`,
    },
  });
};

const handleOpenAiResult = () => {
  router.push(`/customer/${customerData._id}/ai`);
};

const handleRunAiAnalysis = async () => {
  if (!customerData._id) {
    ElMessage.warning("Load the customer profile before running AI analysis.");
    return;
  }

  aiAnalysisLoading.value = true;
  aiAnalysisError.value = "";

  try {
    const useCache = !aiAnalysisResult.value;
    const data = unwrapApiResponseData(
      await triggerCustomerAiAnalysis(customerData._id, {
        analysisType: "deal_prediction",
        useCache,
      }),
      "Failed to build the AI analysis.",
    );

    if (!data.result) {
      throw new Error("Failed to build the AI analysis.");
    }

    aiAnalysisResult.value = data.result;
    aiAnalysisMetadata.value = data.metadata || null;

    ElMessage.success(
      useCache
        ? data.metadata?.cached
          ? "Loaded cached AI analysis."
          : "AI analysis generated."
        : "AI analysis reanalyzed.",
    );
  } catch (error) {
    console.error("Failed to run customer AI analysis:", error);
    aiAnalysisError.value = getRequestErrorMessage(error, "The AI analysis could not be generated right now.");
    ElMessage.error(aiAnalysisError.value);
  } finally {
    aiAnalysisLoading.value = false;
  }
};

const handleTimelineFilterChange = () => {
  if (selectedTimelineTypes.value.length === 0) {
    selectedTimelineTypes.value = [...allTimelineTypes];
  }

  fetchCustomerTimeline();
};

const resetTimelineFilters = () => {
  selectedTimelineTypes.value = [...allTimelineTypes];
  fetchCustomerTimeline();
};

const handleLoadMoreTimeline = () => {
  if (!hasMoreTimeline.value || timelineLoading.value) {
    return;
  }

  fetchCustomerTimeline(true);
};

const handleSoftDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `Archive customer "${customerData.name}"? You can restore it later from Deleted.`,
      "Archive customer",
      {
        confirmButtonText: "Archive",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    unwrapApiResponseData(await softDeleteCustomer(customerData._id!), "Failed to archive the customer.");

    ElMessage.success("Customer archived.");
    router.push("/customer");
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to archive the customer:", error);
      ElMessage.error(getRequestErrorMessage(error, "Failed to archive the customer."));
    }
  }
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

const formatDate = (dateString?: string) => {
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

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const formatTimelineToken = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatTimelineDate = (item: CustomerTimelineItem) => {
  return formatDate(item.occurredAt || item.createdAt || "");
};

const getTimelineEventLabel = (eventType: CustomerTimelineEventType) => {
  const labelMap: Record<CustomerTimelineEventType, string> = {
    customer: "Customer",
    activity: "Activity",
    status_change: "Status change",
    followup: "Follow-up",
    opportunity: "Opportunity",
    order: "Order",
  };

  return labelMap[eventType];
};

const getTimelineTagType = (eventType: CustomerTimelineEventType) => {
  const tagTypeMap: Record<CustomerTimelineEventType, "primary" | "success" | "warning" | "danger" | "info"> = {
    customer: "info",
    activity: "primary",
    status_change: "warning",
    followup: "success",
    opportunity: "danger",
    order: "primary",
  };

  return tagTypeMap[eventType];
};

const getTimelineIcon = (eventType: CustomerTimelineEventType) => {
  const iconMap: Record<CustomerTimelineEventType, typeof User> = {
    customer: User,
    activity: Calendar,
    status_change: RefreshRight,
    followup: ChatDotRound,
    opportunity: TrendCharts,
    order: ShoppingCart,
  };

  return iconMap[eventType];
};

const readStringMetadata = (item: CustomerTimelineItem, key: string) => {
  const value = item.metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : "";
};

const readNumberMetadata = (item: CustomerTimelineItem, key: string) => {
  const value = item.metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const getTimelineHighlights = (item: CustomerTimelineItem) => {
  const details: string[] = [];

  if (item.actor?.username) {
    details.push(`Owner: ${item.actor.username}`);
  }

  if (item.subtype) {
    details.push(`Subtype: ${formatTimelineToken(item.subtype)}`);
  }

  if (item.related?.contact?.name) {
    details.push(`Contact: ${item.related.contact.name}`);
  }

  if (item.related?.opportunity?.name) {
    details.push(`Opportunity: ${item.related.opportunity.name}`);
  }

  if (item.related?.order?.orderNo) {
    details.push(`Order: ${item.related.order.orderNo}`);
  }

  if (item.eventType === "followup") {
    const channel = readStringMetadata(item, "channel");
    const location = readStringMetadata(item, "location");
    const duration = readNumberMetadata(item, "duration");

    if (channel) {
      details.push(`Channel: ${FOLLOWUP_CHANNEL_LABELS[channel as FollowupChannel] || formatTimelineToken(channel)}`);
    }

    if (location) {
      details.push(`Location: ${location}`);
    }

    if (duration !== null) {
      details.push(`Duration: ${duration} min`);
    }
  }

  if (item.eventType === "activity") {
    const location = readStringMetadata(item, "location");

    if (location) {
      details.push(`Location: ${location}`);
    }
  }

  if (item.eventType === "opportunity") {
    const amount = readNumberMetadata(item, "actualAmount") ?? readNumberMetadata(item, "estimatedAmount");
    const currency = readStringMetadata(item, "currency") || customerData.currency || "CNY";

    if (amount !== null) {
      details.push(`Amount: ${formatCurrency(amount, currency)}`);
    }
  }

  if (item.eventType === "order") {
    const amount = readNumberMetadata(item, "totalAmount") ?? readNumberMetadata(item, "amount");
    const currency = readStringMetadata(item, "currency") || customerData.currency || "CNY";
    const paymentStatus = readStringMetadata(item, "paymentStatus");

    if (amount !== null) {
      details.push(`Amount: ${formatCurrency(amount, currency)}`);
    }

    if (paymentStatus) {
      details.push(`Payment: ${formatTimelineToken(paymentStatus)}`);
    }
  }

  if (item.eventType === "customer") {
    const level = readStringMetadata(item, "level");
    const source = readStringMetadata(item, "source");

    if (level) {
      details.push(`Tier: ${level}`);
    }

    if (source) {
      details.push(`Source: ${formatTimelineToken(source)}`);
    }
  }

  return details;
};

const getTimelineNotes = (item: CustomerTimelineItem) => {
  const notes: string[] = [];
  const outcome = readStringMetadata(item, "outcome");
  const nextStep = readStringMetadata(item, "nextStep");
  const result = readStringMetadata(item, "result");
  const lostReason = readStringMetadata(item, "lostReason");

  if (result) {
    notes.push(`Result: ${result}`);
  }

  if (outcome) {
    notes.push(`Outcome: ${outcome}`);
  }

  if (nextStep) {
    notes.push(`Next step: ${nextStep}`);
  }

  if (lostReason) {
    notes.push(`Lost reason: ${lostReason}`);
  }

  return notes;
};

watch(
  () => route.params.id,
  () => {
    aiAnalysisLoading.value = false;
    aiAnalysisError.value = "";
    aiAnalysisResult.value = null;
    aiAnalysisMetadata.value = null;
    fetchCustomerDetail();
    fetchCustomerTimeline();
  },
  { immediate: true },
);
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════
   Customer Detail — Premium Workspace Style
   ══════════════════════════════════════════════════════════════════════════ */
.customer-detail-container {
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
  padding: 22px 28px;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  background:
    radial-gradient(ellipse at top left, rgba(96, 171, 255, 0.06), transparent 40%),
    var(--surface-white);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.page-header::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(96, 171, 255, 0.2), transparent);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(24px, 2.8vw, 32px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

/* ── Content Layout ───────────────────────────────────────────────────────── */
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.ai-panel-section {
  margin: 0;
}

.info-card,
.related-card {
  margin-bottom: 0;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

/* ── Card Headers ─────────────────────────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.card-header .el-icon {
  font-size: 18px;
  color: var(--accent-primary);
}

/* ── Links ────────────────────────────────────────────────────────────────── */
.link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--accent-primary-hover);
  text-decoration: underline;
}

/* ── Stats Grid ───────────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-item {
  padding: 18px 16px;
  text-align: center;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at top, var(--surface-secondary), transparent 70%),
    var(--surface-white);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.stat-value {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: clamp(20px, 2.2vw, 26px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-label {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Description ──────────────────────────────────────────────────────────── */
.description-text {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 14px;
}

/* ── Tags ─────────────────────────────────────────────────────────────────── */
.tag-item {
  margin-right: 8px;
  margin-bottom: 4px;
}

/* ── Timeline ─────────────────────────────────────────────────────────────── */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.timeline-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.timeline-summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at top right, rgba(96, 171, 255, 0.04), transparent 50%),
    var(--surface-secondary);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.timeline-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.timeline-summary-label {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.timeline-summary-value {
  color: var(--text-primary);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.timeline-panel {
  min-height: 160px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
}

.timeline-entry {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 18px;
}

.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-node {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: var(--gradient-card);
  color: var(--accent-primary);
  box-shadow: var(--shadow-xs);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.timeline-entry:hover .timeline-node {
  transform: scale(1.08);
  box-shadow: var(--shadow-sm);
}

.timeline-connector {
  flex: 1;
  width: 2px;
  margin: 8px 0;
  background: linear-gradient(180deg, var(--border-default), var(--border-light));
  border-radius: var(--radius-full);
}

.timeline-content {
  padding: 2px 0 24px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.timeline-date {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 500;
}

.timeline-headline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-entry-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.timeline-description {
  margin: 0 0 14px;
  color: var(--text-secondary);
  line-height: 1.75;
  white-space: pre-wrap;
  font-size: 14px;
}

.timeline-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.timeline-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  background: var(--surface-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.timeline-pill:hover {
  border-color: var(--border-default);
  background: var(--surface-secondary);
}

.timeline-notes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.timeline-note {
  margin: 0;
  padding: 14px 16px;
  border-left: 3px solid var(--accent-primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--accent-soft);
  color: var(--text-secondary);
  line-height: 1.75;
  font-size: 14px;
}

.timeline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-empty {
  padding: 48px 0 16px;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 15px;
}

.timeline-actions {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--border-light);
}

/* ── Related Section ──────────────────────────────────────────────────────── */
.related-section {
  display: grid;
  gap: 22px;
}

.section-title {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(20px, 2.2vw, 26px);
  font-weight: 700;
  letter-spacing: -0.03em;
  position: relative;
  padding-bottom: 12px;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 48px;
  height: 3px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  box-shadow: 0 0 10px var(--accent-glow);
}

.empty-data {
  padding: 32px 0 12px;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 14px;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .timeline-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .timeline-header,
  .timeline-toolbar,
  .timeline-headline {
    flex-direction: column;
    align-items: flex-start;
  }

  .timeline-summary-grid {
    grid-template-columns: 1fr;
  }

  .timeline-toolbar :deep(.el-select) {
    width: 100% !important;
  }
}
</style>
