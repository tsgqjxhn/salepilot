<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Edit customer' : 'Create customer'"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :destroy-on-close="true"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      class="customer-form"
      status-icon
    >
      <el-tabs v-model="activeTab" class="customer-tabs">
        <el-tab-pane label="Basic" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Customer name" prop="name">
                <el-input v-model="formData.name" placeholder="Enter the customer name" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Customer type" prop="type">
                <el-select v-model="formData.type" placeholder="Select a type" style="width: 100%">
                  <el-option label="Individual" value="individual" />
                  <el-option label="Enterprise" value="enterprise" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Status" prop="status">
                <el-select v-model="formData.status" placeholder="Select a status" style="width: 100%">
                  <el-option label="Potential" value="potential" />
                  <el-option label="Active" value="active" />
                  <el-option label="Dormant" value="dormant" />
                  <el-option label="Lost" value="lost" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Tier" prop="level">
                <el-select v-model="formData.level" placeholder="Select a tier" style="width: 100%">
                  <el-option label="A" value="A" />
                  <el-option label="B" value="B" />
                  <el-option label="C" value="C" />
                  <el-option label="D" value="D" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Contact" name="contact">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Email" prop="email">
                <el-input v-model="formData.email" placeholder="Enter the email address" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Phone" prop="phone">
                <el-input v-model="formData.phone" placeholder="Enter the phone number" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Mobile" prop="mobile">
                <el-input v-model="formData.mobile" placeholder="Enter the mobile number" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Fax" prop="fax">
                <el-input v-model="formData.fax" placeholder="Enter the fax number" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Website" prop="website">
                <el-input v-model="formData.website" placeholder="Enter the website URL" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Address" name="address">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="Country" prop="country">
                <el-input v-model="formData.country" placeholder="Enter the country" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Province" prop="province">
                <el-input v-model="formData.province" placeholder="Enter the province" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="City" prop="city">
                <el-input v-model="formData.city" placeholder="Enter the city" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="District" prop="district">
                <el-input v-model="formData.district" placeholder="Enter the district" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="Street" prop="street">
                <el-input v-model="formData.street" placeholder="Enter the street address" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Postal code" prop="postalCode">
                <el-input v-model="formData.postalCode" placeholder="Enter the postal code" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Business" name="business">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Industry" prop="industry">
                <el-input v-model="formData.industry" placeholder="Enter the industry" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Source" prop="source">
                <el-select v-model="formData.source" placeholder="Select a source" style="width: 100%">
                  <el-option label="Advertisement" value="advertisement" />
                  <el-option label="Referral" value="referral" />
                  <el-option label="Exhibition" value="exhibition" />
                  <el-option label="Online" value="internet" />
                  <el-option label="Cold call" value="coldcall" />
                  <el-option label="Other" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Annual revenue" prop="annualRevenue">
                <el-input-number
                  v-model="formData.annualRevenue"
                  :min="0"
                  :precision="2"
                  :step="1000"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Employee count" prop="employeeCount">
                <el-input-number
                  v-model="formData.employeeCount"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Currency" prop="currency">
                <el-select v-model="formData.currency" placeholder="Select a currency" style="width: 100%">
                  <el-option label="Chinese Yuan (CNY)" value="CNY" />
                  <el-option label="US Dollar (USD)" value="USD" />
                  <el-option label="Euro (EUR)" value="EUR" />
                  <el-option label="Pound Sterling (GBP)" value="GBP" />
                  <el-option label="Japanese Yen (JPY)" value="JPY" />
                  <el-option label="Hong Kong Dollar (HKD)" value="HKD" />
                  <el-option label="New Taiwan Dollar (TWD)" value="TWD" />
                  <el-option label="South Korean Won (KRW)" value="KRW" />
                  <el-option label="Australian Dollar (AUD)" value="AUD" />
                  <el-option label="Canadian Dollar (CAD)" value="CAD" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Social" name="social">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="WeChat" prop="wechat">
                <el-input v-model="formData.wechat" placeholder="Enter the WeChat ID" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="QQ" prop="qq">
                <el-input v-model="formData.qq" placeholder="Enter the QQ number" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="LinkedIn" prop="linkedin">
                <el-input v-model="formData.linkedin" placeholder="Enter the LinkedIn URL" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Twitter" prop="twitter">
                <el-input v-model="formData.twitter" placeholder="Enter the Twitter URL" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="Notes" name="notes">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="Description" prop="description">
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="3"
                  placeholder="Enter a customer description"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="Remark" prop="remark">
                <el-input
                  v-model="formData.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="Enter internal notes"
                  maxlength="2000"
                  show-word-limit
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
                  <el-option v-for="tag in tagOptions" :key="tag._id" :label="tag.name" :value="tag.name" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          Reset
        </el-button>
        <el-button @click="handleCancel">
          <el-icon><Close /></el-icon>
          Cancel
        </el-button>
        <el-button
          v-permission="{ permission: isEdit ? 'customers.update' : 'customers.create' }"
          type="primary"
          :loading="submitting"
          :disabled="submitLocked"
          @click="handleSubmit"
        >
          <el-icon><Check /></el-icon>
          {{ isEdit ? "Save changes" : "Create customer" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Check, Close, Refresh } from "@element-plus/icons-vue";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import {
  createCustomer,
  getCustomerTags,
  getCustomerDetail,
  updateCustomer,
  type Currency,
  type CustomerFormData,
  type CustomerLevel,
  type CustomerSource,
  type CustomerStatus,
  type CustomerTagRecord,
  type CustomerType,
} from "@/api/customer";
import { getRequestErrorMessage, unwrapApiResponseData } from "@/utils/requestError";
import {
  createCustomerFormRules,
  createDefaultCustomerFormData,
  sanitizeCustomerFormData,
} from "@/utils/customerValidation";

interface Props {
  modelValue: boolean;
  customerId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  customerId: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [action: "create" | "update", data: CustomerFormData];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const formRef = ref<FormInstance>();
const activeTab = ref("basic");
const submitting = ref(false);
const submitGuard = useSubmitGuard();
const isEdit = computed(() => Boolean(props.customerId));
const tagOptions = ref<CustomerTagRecord[]>([]);
const formData = reactive<CustomerFormData>(createDefaultCustomerFormData());
const formRules: FormRules = createCustomerFormRules();
const submitLocked = computed(() => submitting.value || submitGuard.isBlocked.value);

const resetFormData = () => {
  Object.assign(formData, createDefaultCustomerFormData());
};

const fetchCustomerDetail = async () => {
  if (!props.customerId) return;

  try {
    const data = unwrapApiResponseData(
      await getCustomerDetail(props.customerId),
      "Failed to load customer details.",
    );
    const customer = data.customer;
    formData.name = customer.name;
    formData.type = customer.type as CustomerType;
    formData.status = customer.status as CustomerStatus;
    formData.level = customer.level as CustomerLevel;
    formData.source = customer.source as CustomerSource;
    formData.currency = customer.currency as Currency;
    formData.country = customer.country || "China";
    formData.email = customer.email || "";
    formData.phone = customer.phone || "";
    formData.mobile = customer.mobile || "";
    formData.fax = customer.fax || "";
    formData.website = customer.website || "";
    formData.province = customer.province || "";
    formData.city = customer.city || "";
    formData.district = customer.district || "";
    formData.street = customer.street || "";
    formData.postalCode = customer.postalCode || "";
    formData.industry = customer.industry || "";
    formData.annualRevenue = customer.annualRevenue;
    formData.employeeCount = customer.employeeCount;
    formData.wechat = customer.wechat || "";
    formData.qq = customer.qq || "";
    formData.linkedin = customer.linkedin || "";
    formData.twitter = customer.twitter || "";
    formData.description = customer.description || "";
    formData.remark = customer.remark || "";
    formData.tags = customer.tags || [];
  } catch (error) {
    console.error("Failed to load customer details:", error);
    ElMessage.error(getRequestErrorMessage(error, "Failed to load customer details. Please try again later."));
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

const handleReset = () => {
  formRef.value?.resetFields();
  resetFormData();
  activeTab.value = "basic";
};

const handleCancel = () => {
  dialogVisible.value = false;
};

const handleClosed = () => {
  handleReset();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);

  if (!valid) return;

  await submitGuard.run(async () => {
    submitting.value = true;

    try {
      const payload = sanitizeCustomerFormData(formData);
      unwrapApiResponseData(
        isEdit.value
          ? await updateCustomer(props.customerId!, payload)
          : await createCustomer(payload),
        isEdit.value ? "Failed to update the customer." : "Failed to create the customer.",
        { successCodes: [200, 201] },
      );

      const action = isEdit.value ? "update" : "create";
      notifyActionSuccess(
        isEdit.value ? "Customer details were updated successfully." : "The customer record was created successfully.",
        { title: isEdit.value ? "Customer updated" : "Customer created" },
      );
      emit("success", action, payload);
      dialogVisible.value = false;
    } catch (error) {
      console.error("Failed to submit the customer form:", error);
      notifyActionError(
        error,
        isEdit.value ? "Failed to update the customer." : "Failed to create the customer.",
        { title: isEdit.value ? "Customer update failed" : "Customer creation failed" },
      );
    } finally {
      submitting.value = false;
    }
  });
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    await nextTick();
    handleReset();
    await fetchTagOptions();

    if (isEdit.value) {
      await fetchCustomerDetail();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.customer-form {
  padding: 10px 0;
}

.customer-tabs {
  margin-top: 10px;
}

.customer-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.customer-tabs :deep(.el-tabs__content) {
  padding: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.dialog-footer .el-button {
  min-width: 110px;
}

@media (max-width: 768px) {
  .dialog-footer {
    flex-direction: column;
    align-items: center;
  }
}
</style>
