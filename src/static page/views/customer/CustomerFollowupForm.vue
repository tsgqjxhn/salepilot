<template>
  <div class="customer-followup-container" v-loading="pageLoading">
    <div class="page-header">
      <div class="header-copy">
        <div class="header-topline">
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            Back
          </el-button>
          <el-tag effect="plain" size="large" class="customer-chip">
            {{ customerName || "Customer" }}
          </el-tag>
        </div>
        <h1 class="page-title">Create follow-up</h1>
        <p class="page-subtitle">
          Schedule the next customer touchpoint and keep every interaction traceable.
        </p>
      </div>

      <div class="page-actions">
        <el-button @click="handleBack">Cancel</el-button>
        <el-button
          v-permission="'followups.create'"
          type="primary"
          :loading="submitting"
          :disabled="submitLocked"
          @click="handleSubmit"
        >
          Save follow-up
        </el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="followup-form">
      <div class="form-grid">
        <el-card class="section-card">
          <template #header>
            <div class="section-header">
              <div>
                <h2 class="section-title">Overview</h2>
                <p class="section-description">Define what this follow-up is and how it should be handled.</p>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Title" prop="title">
                <el-input
                  v-model="formData.title"
                  maxlength="200"
                  show-word-limit
                  placeholder="Enter a short follow-up title"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Type" prop="type">
                <el-select v-model="formData.type" placeholder="Select a follow-up type">
                  <el-option
                    v-for="option in followupTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Channel" prop="channel">
                <div class="channel-picker">
                  <button
                    v-for="option in followupChannelOptions"
                    :key="option.value"
                    type="button"
                    class="channel-option"
                    :class="{ 'channel-option--active': formData.channel === option.value }"
                    :aria-pressed="formData.channel === option.value"
                    @click="formData.channel = option.value"
                  >
                    <span class="channel-option__icon">
                      <el-icon>
                        <component :is="option.icon" />
                      </el-icon>
                    </span>
                    <span class="channel-option__label">{{ option.label }}</span>
                    <span class="channel-option__description">{{ option.description }}</span>
                  </button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Status" prop="status">
                <el-select v-model="formData.status" placeholder="Select a status">
                  <el-option
                    v-for="option in followupStatusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Priority" prop="priority">
                <el-select v-model="formData.priority" placeholder="Select a priority">
                  <el-option
                    v-for="option in followupPriorityOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="showAssigneeField" :xs="24" :md="12">
              <el-form-item label="Assignee" prop="ownerId">
                <el-select
                  v-model="formData.ownerId"
                  placeholder="Assign this task to a workspace member"
                  filterable
                  :loading="assigneeLoading"
                >
                  <el-option
                    v-for="assignee in assigneeOptions"
                    :key="assignee.id"
                    :label="formatAssigneeLabel(assignee)"
                    :value="assignee.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <p class="helper-text">
                {{
                  showAssigneeField
                    ? "Managers or administrators can assign task follow-ups to a teammate when workspace task delegation is enabled."
                    : "The follow-up will be created under the current signed-in owner and linked to this customer."
                }}
              </p>
              <el-alert
                v-if="showAssigneeField && assigneeLoadError"
                type="error"
                :closable="false"
                show-icon
                :title="assigneeLoadError"
                class="assignee-alert"
              />
            </el-col>
          </el-row>
        </el-card>

        <el-card class="section-card">
          <template #header>
            <div class="section-header">
              <div>
                <h2 class="section-title">Schedule</h2>
                <p class="section-description">Capture when the touchpoint happens and how reminders should behave.</p>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item label="Scheduled time" prop="scheduledAt">
                <el-date-picker
                  v-model="formData.scheduledAt"
                  type="datetime"
                  placeholder="Pick a date and time"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Next follow-up time" prop="nextFollowupAt">
                <el-date-picker
                  v-model="formData.nextFollowupAt"
                  type="datetime"
                  placeholder="Optional next step date"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Duration (minutes)" prop="duration">
                <el-input-number
                  v-model="formData.duration"
                  :min="0"
                  :step="15"
                  :controls="false"
                  placeholder="Optional duration"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="Location" prop="location">
                <el-input
                  v-model="formData.location"
                  maxlength="200"
                  placeholder="Meeting room, office, online link, etc."
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="reminder-panel" :class="{ 'reminder-panel--inactive': !isValidDate(formData.nextFollowupAt) }">
                <div class="reminder-panel__headline">
                  <span class="reminder-panel__icon">
                    <el-icon><Bell /></el-icon>
                  </span>
                  <div>
                    <h3 class="reminder-panel__title">Next follow-up reminder</h3>
                    <p class="reminder-panel__description">
                      Configure when the workspace should remind the team before the next follow-up happens.
                    </p>
                  </div>
                </div>

                <div class="reminder-preset-grid">
                  <button
                    v-for="option in reminderPresetOptions"
                    :key="option.value"
                    type="button"
                    class="reminder-preset"
                    :class="{ 'reminder-preset--active': reminderPreset === option.value }"
                    :disabled="!isValidDate(formData.nextFollowupAt)"
                    @click="applyReminderPreset(option.value)"
                  >
                    <span class="reminder-preset__label">{{ option.label }}</span>
                    <span class="reminder-preset__description">{{ option.description }}</span>
                  </button>
                </div>

                <el-row :gutter="16">
                  <el-col :xs="24" :md="12">
                    <el-form-item label="Reminder channel" prop="remindBy">
                      <el-select v-model="formData.remindBy" placeholder="Select a reminder channel">
                        <el-option
                          v-for="option in reminderOptions"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="Reminder time" prop="remindAt">
                      <el-date-picker
                        v-model="formData.remindAt"
                        type="datetime"
                        placeholder="Select a reminder time"
                        :disabled="!isValidDate(formData.nextFollowupAt)"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-alert
                  :title="reminderSummary.title"
                  :type="reminderSummary.type"
                  :description="reminderSummary.description"
                  :closable="false"
                  show-icon
                />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <el-card class="section-card section-card--full">
        <template #header>
          <div class="section-header">
            <div>
              <h2 class="section-title">Notes and outcomes</h2>
              <p class="section-description">Add the execution context and any follow-through required afterwards.</p>
            </div>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="Description" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                maxlength="2000"
                show-word-limit
                placeholder="Describe the purpose, agenda, or customer context"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="Outcome" prop="outcome">
              <el-input
                v-model="formData.outcome"
                type="textarea"
                :rows="4"
                maxlength="1000"
                show-word-limit
                placeholder="Record the result once the follow-up is completed"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="Next step" prop="nextStep">
              <el-input
                v-model="formData.nextStep"
                type="textarea"
                :rows="4"
                maxlength="500"
                show-word-limit
                placeholder="Capture the next action the team should take"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Tags" prop="tags">
              <el-select
                v-model="formData.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Type a tag and press Enter"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tagOptions"
                  :key="tag._id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormItemRule, type FormRules } from "element-plus";
import {
  Bell,
  ArrowLeft,
  Calendar,
  ChatDotRound,
  ChatLineRound,
  Location,
  Message,
  MoreFilled,
  Phone,
} from "@element-plus/icons-vue";
import {
  createCustomerFollowup,
  getCustomerDetail,
  getCustomerTags,
  type CustomerTagRecord,
  type FollowupCreatePayload,
  type FollowupPriority,
  type FollowupStatus,
  type FollowupType,
} from "@/api/customer";
import { getAdminUserList } from "@/api/admin";
import type { AdminManagedUser } from "@/types/admin";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import { notifyActionError, notifyActionSuccess, notifyActionWarning } from "@/utils/actionFeedback";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";
import {
  FOLLOWUP_CHANNEL_OPTIONS,
  type FollowupChannel,
} from "@/utils/followup";

type ReminderChannel = "system" | "email" | "sms" | "wechat";
type ReminderPreset = "at_time" | "15m" | "1h" | "1d" | "custom";

interface FollowupFormState {
  title: string;
  type: FollowupType;
  channel: FollowupChannel;
  status: FollowupStatus;
  priority: FollowupPriority;
  ownerId: string;
  scheduledAt: Date | null;
  remindAt: Date | null;
  remindBy: ReminderChannel;
  duration: number | null;
  location: string;
  description: string;
  outcome: string;
  nextStep: string;
  nextFollowupAt: Date | null;
  tags: string[];
}

const followupTypeOptions: Array<{ value: FollowupType; label: string }> = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "visit", label: "Visit" },
  { value: "task", label: "Task" },
  { value: "wechat", label: "WeChat" },
  { value: "sms", label: "SMS" },
  { value: "note", label: "Note" },
  { value: "other", label: "Other" },
];

const followupStatusOptions: Array<{ value: FollowupStatus; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed", label: "Missed" },
];

const followupPriorityOptions: Array<{ value: FollowupPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const reminderOptions: Array<{ value: ReminderChannel; label: string }> = [
  { value: "system", label: "System" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "wechat", label: "WeChat" },
];

const reminderPresetOptions: Array<{ value: ReminderPreset; label: string; description: string }> = [
  { value: "at_time", label: "At time", description: "Trigger exactly when the next follow-up starts." },
  { value: "15m", label: "15 min before", description: "Useful for a quick preparation reminder." },
  { value: "1h", label: "1 hour before", description: "Review notes and reopen the customer context." },
  { value: "1d", label: "1 day before", description: "Plan the next outreach in advance." },
  { value: "custom", label: "Custom", description: "Choose a reminder date and time manually." },
];

const reminderChannelLabels: Record<ReminderChannel, string> = {
  system: "system",
  email: "email",
  sms: "SMS",
  wechat: "WeChat",
};

const channelIconMap: Record<FollowupChannel, Component> = {
  call: Phone,
  wechat: ChatDotRound,
  email: Message,
  sms: ChatLineRound,
  meeting: Calendar,
  visit: Location,
  other: MoreFilled,
};

const channelDescriptionMap: Record<FollowupChannel, string> = {
  call: "Direct phone communication",
  wechat: "Instant chat with the customer",
  email: "Formal written follow-up",
  sms: "Short mobile text reminder",
  meeting: "Scheduled online or in-person meeting",
  visit: "On-site customer visit",
  other: "Any custom communication method",
};

const followupChannelOptions = FOLLOWUP_CHANNEL_OPTIONS.map((option) => ({
  ...option,
  icon: channelIconMap[option.value],
  description: channelDescriptionMap[option.value],
}));

const createDefaultFormData = (): FollowupFormState => ({
  title: "",
  type: "call",
  channel: "call",
  status: "scheduled",
  priority: "medium",
  ownerId: "",
  scheduledAt: null,
  remindAt: null,
  remindBy: "system",
  duration: null,
  location: "",
  description: "",
  outcome: "",
  nextStep: "",
  nextFollowupAt: null,
  tags: [],
});

const router = useRouter();
const route = useRoute();
const permissions = usePermissions();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const pageLoading = ref(false);
const submitting = ref(false);
const tagOptions = ref<CustomerTagRecord[]>([]);
const assigneeLoading = ref(false);
const assigneeLoadError = ref("");
const assigneeOptions = ref<AdminManagedUser[]>([]);
const submitGuard = useSubmitGuard();
const customerName = ref("");
const reminderPreset = ref<ReminderPreset>("1d");
const customerId = computed(() => String(route.params.id || ""));
const redirectPath = computed(() => {
  const redirect = route.query.redirect;

  return typeof redirect === "string" && redirect.startsWith("/") ? redirect : `/customer/${customerId.value}`;
});

const formData = reactive<FollowupFormState>(createDefaultFormData());
const submitLocked = computed(() => submitting.value || submitGuard.isBlocked.value);
const canAssignTaskOwner = computed(() => (
  permissions.hasPermission("customers.assign")
  && (
    permissions.isAdmin.value
    || authStore.workspaceRules.managerTaskDelegationEnabled
  )
));
const showAssigneeField = computed(() => canAssignTaskOwner.value && formData.type === "task");

const formatAssigneeLabel = (user: AdminManagedUser) =>
  `${user.username} | ${user.roleLabel}${user.email ? ` | ${user.email}` : ""}`;

const syncDefaultOwner = () => {
  formData.ownerId = authStore.userid || "";
};

const resetFormState = () => {
  Object.assign(formData, createDefaultFormData());
  syncDefaultOwner();
  reminderPreset.value = "1d";
  formRef.value?.clearValidate();
};

const loadAssignableMembers = async ({ force = false }: { force?: boolean } = {}) => {
  if (!canAssignTaskOwner.value) {
    assigneeOptions.value = [];
    assigneeLoadError.value = "";
    return;
  }

  if (assigneeLoading.value || (assigneeOptions.value.length > 0 && !force)) {
    return;
  }

  assigneeLoading.value = true;
  assigneeLoadError.value = "";

  try {
    const payload = unwrapApiResponseData(
      await getAdminUserList({
        page: 1,
        limit: 100,
        includeSystemReserved: false,
      }),
      "Failed to load workspace members.",
    );
    assigneeOptions.value = payload.list.filter((user) => !user.isSystemReserved);

    if (!assigneeOptions.value.some((user) => user.id === formData.ownerId)) {
      syncDefaultOwner();
    }
  } catch (error) {
    assigneeLoadError.value = getRequestErrorMessage(error, "Failed to load workspace members.");
  } finally {
    assigneeLoading.value = false;
  }
};

const loadPageData = async () => {
  if (!customerId.value) {
    return;
  }

  pageLoading.value = true;

  try {
    const [customerRes, tagRes] = await Promise.all([getCustomerDetail(customerId.value), getCustomerTags()]);
    const customerData = unwrapApiResponseData(customerRes, "Failed to load the customer.");
    customerName.value = customerData.customer.name || "";
    tagOptions.value = unwrapApiResponseData(tagRes, "Failed to load tag options.").list;
    await loadAssignableMembers();
  } catch (error) {
    console.error("Failed to load the follow-up page:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load the follow-up page."));
  } finally {
    pageLoading.value = false;
  }
};

const normalizeTags = (tags: string[]) =>
  Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));

const toIsoString = (value: Date | null) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value.toISOString();
};

const isValidDate = (value: Date | null | undefined): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const sameMoment = (left: Date | null, right: Date | null) => {
  if (!isValidDate(left) || !isValidDate(right)) {
    return false;
  }

  return left.getTime() === right.getTime();
};

const getReminderOffset = (preset: Exclude<ReminderPreset, "custom">) => {
  switch (preset) {
    case "at_time":
      return 0;
    case "15m":
      return 15 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "1d":
      return 24 * 60 * 60 * 1000;
  }
};

const buildReminderDate = (target: Date, preset: Exclude<ReminderPreset, "custom">) =>
  new Date(target.getTime() - getReminderOffset(preset));

const formatDateTime = (value: Date | null | undefined) => {
  if (!isValidDate(value)) {
    return "";
  }

  return value.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const describeReminderGap = (target: Date, reminder: Date) => {
  const diff = target.getTime() - reminder.getTime();

  if (diff <= 0) {
    return "at the same time";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff % day === 0) {
    const days = diff / day;
    return `${days} day${days === 1 ? "" : "s"} before`;
  }

  if (diff % hour === 0) {
    const hours = diff / hour;
    return `${hours} hour${hours === 1 ? "" : "s"} before`;
  }

  if (diff % minute === 0) {
    const minutes = diff / minute;
    return `${minutes} minute${minutes === 1 ? "" : "s"} before`;
  }

  return "before the next follow-up";
};

const applyReminderPreset = (preset: ReminderPreset) => {
  reminderPreset.value = preset;

  if (preset === "custom") {
    return;
  }

  if (!isValidDate(formData.nextFollowupAt)) {
    notifyActionWarning("Set the next follow-up time before configuring the reminder.", {
      title: "Reminder needs a date",
    });
    return;
  }

  formData.remindAt = buildReminderDate(formData.nextFollowupAt, preset);
  formRef.value?.validateField?.("remindAt").catch(() => undefined);
};

const detectReminderPreset = (target: Date | null, reminder: Date | null): ReminderPreset => {
  if (!isValidDate(target) || !isValidDate(reminder)) {
    return "custom";
  }

  const match = reminderPresetOptions.find((option) => {
    if (option.value === "custom") {
      return false;
    }

    return sameMoment(buildReminderDate(target, option.value), reminder);
  });

  return match?.value ?? "custom";
};

const validateNextFollowupAt: FormItemRule["validator"] = (_rule, value, callback) => {
  if (!isValidDate(value)) {
    callback();
    return;
  }

  if (isValidDate(formData.scheduledAt) && value.getTime() < formData.scheduledAt.getTime()) {
    callback(new Error("The next follow-up time cannot be earlier than the scheduled time."));
    return;
  }

  callback();
};

const validateRemindAt: FormItemRule["validator"] = (_rule, value, callback) => {
  if (!isValidDate(value)) {
    callback();
    return;
  }

  if (!isValidDate(formData.nextFollowupAt)) {
    callback(new Error("Set the next follow-up time before choosing a reminder."));
    return;
  }

  if (value.getTime() > formData.nextFollowupAt.getTime()) {
    callback(new Error("The reminder time must be before or equal to the next follow-up time."));
    return;
  }

  callback();
};

const formRules: FormRules<FollowupFormState> = {
  title: [
    { required: true, message: "Please enter a follow-up title.", trigger: "blur" },
    { min: 2, max: 200, message: "The title must be between 2 and 200 characters.", trigger: "blur" },
  ],
  scheduledAt: [{ required: true, message: "Please select a scheduled time.", trigger: "change" }],
  nextFollowupAt: [{ validator: validateNextFollowupAt, trigger: "change" }],
  remindAt: [{ validator: validateRemindAt, trigger: "change" }],
};

const reminderSummary = computed(() => {
  if (!isValidDate(formData.nextFollowupAt)) {
    return {
      type: "info" as const,
      title: "Next follow-up reminder",
      description: "Set the next follow-up time to enable reminder scheduling.",
    };
  }

  if (!isValidDate(formData.remindAt)) {
    return {
      type: "warning" as const,
      title: "Reminder not scheduled yet",
      description: "Pick a preset or select a custom reminder time for the next follow-up.",
    };
  }

  if (formData.remindAt.getTime() > formData.nextFollowupAt.getTime()) {
    return {
      type: "error" as const,
      title: "Reminder timing needs adjustment",
      description: "The reminder must happen before or at the same moment as the next follow-up.",
    };
  }

  return {
    type: "success" as const,
    title: "Reminder scheduled",
    description: `A ${reminderChannelLabels[formData.remindBy]} reminder will trigger ${describeReminderGap(formData.nextFollowupAt, formData.remindAt)} on ${formatDateTime(formData.remindAt)} for the next follow-up at ${formatDateTime(formData.nextFollowupAt)}.`,
  };
});

const buildPayload = (): FollowupCreatePayload => {
  const payload: FollowupCreatePayload = {
    title: formData.title.trim(),
    type: formData.type,
    channel: formData.channel,
    status: formData.status,
    priority: formData.priority,
    scheduledAt: formData.scheduledAt!.toISOString(),
    remindBy: formData.remindBy,
  };

  const remindAt = toIsoString(formData.remindAt);
  const nextFollowupAt = toIsoString(formData.nextFollowupAt);
  const tags = normalizeTags(formData.tags);

  if (showAssigneeField.value && formData.ownerId && formData.ownerId !== authStore.userid) {
    payload.ownerId = formData.ownerId;
  }

  if (remindAt) {
    payload.remindAt = remindAt;
  }

  if (nextFollowupAt) {
    payload.nextFollowupAt = nextFollowupAt;
  }

  if (typeof formData.duration === "number") {
    payload.duration = formData.duration;
  }

  if (formData.location.trim()) {
    payload.location = formData.location.trim();
  }

  if (formData.description.trim()) {
    payload.description = formData.description.trim();
  }

  if (formData.outcome.trim()) {
    payload.outcome = formData.outcome.trim();
  }

  if (formData.nextStep.trim()) {
    payload.nextStep = formData.nextStep.trim();
  }

  if (tags.length > 0) {
    payload.tags = tags;
  }

  return payload;
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
      unwrapApiResponseData(
        await createCustomerFollowup(customerId.value, buildPayload()),
        "Failed to create the follow-up.",
        { successCodes: [200, 201] },
      );

      notifyActionSuccess("The follow-up was created and linked to this customer.", {
        title: "Follow-up saved",
      });
      router.push(redirectPath.value);
    } catch (error) {
      console.error("Failed to create the follow-up:", error);
      notifyActionError(error, "Failed to create the follow-up.", {
        title: "Follow-up save failed",
      });
    } finally {
      submitting.value = false;
    }
  });
};

const handleBack = () => {
  router.push(redirectPath.value);
};

watch(
  () => formData.type,
  async (type) => {
    if (type === "task") {
      await loadAssignableMembers();
      if (!formData.ownerId) {
        syncDefaultOwner();
      }
      return;
    }

    syncDefaultOwner();
  },
);

watch(
  () => formData.nextFollowupAt,
  (value) => {
    if (!isValidDate(value)) {
      if (reminderPreset.value !== "custom") {
        formData.remindAt = null;
      }
      return;
    }

    if (reminderPreset.value !== "custom") {
      formData.remindAt = buildReminderDate(value, reminderPreset.value);
    } else if (isValidDate(formData.remindAt) && formData.remindAt.getTime() > value.getTime()) {
      formData.remindAt = value;
    }
  },
);

watch(
  () => formData.remindAt,
  (value) => {
    if (!isValidDate(value)) {
      return;
    }

    reminderPreset.value = detectReminderPreset(formData.nextFollowupAt, value);
  },
);

watch(
  () => route.fullPath,
  async () => {
    resetFormState();
    await loadPageData();
  },
  { immediate: true },
);
</script>

<style scoped>
.customer-followup-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-topline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.customer-chip {
  border-color: var(--border-default, rgb(195, 192, 180));
  color: var(--text-secondary, rgb(88, 86, 80));
  background: var(--surface-secondary, rgb(244, 242, 236));
}

.page-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.page-subtitle {
  max-width: 720px;
  margin: 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 15px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.followup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.section-card {
  border-radius: 22px;
}

.section-card--full {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.section-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 20px;
  font-weight: 700;
}

.section-description {
  margin: 6px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 14px;
  line-height: 1.6;
}

.helper-text {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 13px;
  line-height: 1.6;
}

.assignee-alert {
  margin-top: 12px;
}

.reminder-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    var(--surface-secondary, rgb(244, 242, 236)) 0%,
    var(--surface-primary, rgb(250, 249, 245)) 100%
  );
}

.reminder-panel--inactive {
  opacity: 0.86;
}

.reminder-panel__headline {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.reminder-panel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--border-default, rgb(195, 192, 180));
  background: var(--surface-white, rgb(255, 255, 255));
  color: var(--text-primary, rgb(26, 25, 23));
  flex-shrink: 0;
}

.reminder-panel__title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 18px;
  font-weight: 700;
}

.reminder-panel__description {
  margin: 6px 0 0;
  color: var(--text-secondary, rgb(88, 86, 80));
  font-size: 14px;
  line-height: 1.65;
}

.reminder-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(152px, 1fr));
  gap: 12px;
}

.reminder-preset {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 96px;
  padding: 14px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 16px;
  background: var(--surface-white, rgb(255, 255, 255));
  text-align: left;
  color: var(--text-secondary, rgb(88, 86, 80));
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.reminder-preset:hover:not(:disabled) {
  border-color: var(--border-default, rgb(195, 192, 180));
  transform: translateY(-1px);
}

.reminder-preset--active {
  border-color: var(--text-primary, rgb(26, 25, 23));
  background: var(--surface-secondary, rgb(244, 242, 236));
  box-shadow: 0 10px 22px rgba(26, 25, 23, 0.07);
  color: var(--text-primary, rgb(26, 25, 23));
}

.reminder-preset:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.reminder-preset__label {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.reminder-preset__description {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  line-height: 1.55;
}

.channel-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(122px, 1fr));
  gap: 12px;
}

.channel-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-height: 124px;
  padding: 16px 14px;
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  border-radius: 18px;
  background: var(--surface-primary, rgb(250, 249, 245));
  color: var(--text-secondary, rgb(88, 86, 80));
  text-align: left;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
  cursor: pointer;
}

.channel-option:hover {
  border-color: var(--border-default, rgb(195, 192, 180));
  background: var(--surface-secondary, rgb(244, 242, 236));
  transform: translateY(-1px);
}

.channel-option--active {
  border-color: var(--text-primary, rgb(26, 25, 23));
  background: var(--surface-secondary, rgb(244, 242, 236));
  box-shadow: 0 10px 24px rgba(26, 25, 23, 0.08);
  color: var(--text-primary, rgb(26, 25, 23));
}

.channel-option__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--surface-white, rgb(255, 255, 255));
  border: 1px solid var(--border-light, rgb(220, 217, 207));
  font-size: 18px;
}

.channel-option--active .channel-option__icon {
  border-color: var(--text-primary, rgb(26, 25, 23));
}

.channel-option__label {
  color: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.channel-option__description {
  color: var(--text-tertiary, rgb(138, 136, 128));
  font-size: 12px;
  line-height: 1.55;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary, rgb(26, 25, 23));
}

:deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
  }

  .page-actions {
    width: 100%;
  }

  .page-actions :deep(.el-button) {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 26px;
  }

  .header-topline {
    align-items: flex-start;
  }

  .page-actions {
    flex-direction: column;
  }

  .reminder-panel__headline {
    flex-direction: column;
  }
}
</style>
