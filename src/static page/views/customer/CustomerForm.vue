<template>
  <div class="customer-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          Back
        </el-button>
        <h1 class="page-title">{{ isEdit ? "Edit customer" : "Create customer" }}</h1>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="customer-form"
      status-icon
    >
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>Basic information</span>
          </div>
        </template>
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
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><Phone /></el-icon>
            <span>Contact information</span>
          </div>
        </template>
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
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>Address information</span>
          </div>
        </template>
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
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><Briefcase /></el-icon>
            <span>Business information</span>
          </div>
        </template>
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
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><ChatDotRound /></el-icon>
            <span>Social information</span>
          </div>
        </template>
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
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>Notes</span>
          </div>
        </template>
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
      </el-card>

      <div class="form-actions">
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
        <el-button @click="handleBack">
          <el-icon><Close /></el-icon>
          Cancel
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  ArrowLeft,
  Briefcase,
  ChatDotRound,
  Check,
  Close,
  Document,
  Location,
  Phone,
  User,
} from "@element-plus/icons-vue";
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
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { useSubmitGuard } from "@/composables/useSubmitGuard";
import {
  createCustomerFormRules,
  createDefaultCustomerFormData,
  sanitizeCustomerFormData,
} from "@/utils/customerValidation";

const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id));
const customerId = computed(() => String(route.params.id || ""));
const tagOptions = ref<CustomerTagRecord[]>([]);
const submitGuard = useSubmitGuard();
const redirectPath = computed(() => {
  const redirect = route.query.redirect;

  return typeof redirect === "string" && redirect.startsWith("/") ? redirect : "";
});

const formData = reactive<CustomerFormData>(createDefaultCustomerFormData());
const formRules: FormRules = createCustomerFormRules();
const submitLocked = computed(() => submitting.value || submitGuard.isBlocked.value);

const resetFormData = () => {
  Object.assign(formData, createDefaultCustomerFormData());
};

const populateFormData = (customer: Awaited<ReturnType<typeof getCustomerDetail>>["data"]["data"]["customer"]) => {
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
};

const fetchCustomerDetail = async () => {
  try {
    const data = unwrapApiResponseData(
      await getCustomerDetail(customerId.value),
      "Failed to load customer details.",
    );
    populateFormData(data.customer);
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

const syncFormState = async () => {
  formRef.value?.clearValidate();
  resetFormData();
  await fetchTagOptions();

  if (isEdit.value) {
    await fetchCustomerDetail();
  }
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
          ? await updateCustomer(route.params.id as string, payload)
          : await createCustomer(payload),
        isEdit.value ? "Failed to update the customer." : "Failed to create the customer.",
        { successCodes: [200, 201] },
      );

      notifyActionSuccess(
        isEdit.value ? "Customer details were updated successfully." : "The customer record was created successfully.",
        { title: isEdit.value ? "Customer updated" : "Customer created" },
      );

      if (redirectPath.value) {
        router.push(redirectPath.value);
        return;
      }

      if (isEdit.value) {
        router.push(`/customer/${customerId.value}`);
        return;
      }

      router.push("/customer");
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

const handleBack = () => {
  if (redirectPath.value) {
    router.push(redirectPath.value);
    return;
  }

  if (isEdit.value) {
    router.push(`/customer/${customerId.value}`);
    return;
  }

  router.push("/customer");
};

watch(
  () => route.fullPath,
  () => {
    syncFormState();
  },
  { immediate: true },
);
</script>

<style scoped>
.customer-form-container {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  margin: 0;
  color: var(--text-primary, rgb(26, 25, 23));
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.card-header .el-icon {
  font-size: 18px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px 0;
}

.form-actions .el-button {
  min-width: 140px;
}

@media (max-width: 768px) {
  .customer-form-container {
    padding: 0 4px;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .form-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
