<template>
  <section class="verify-page">
    <header class="hero-card">
      <div>
        <p class="eyebrow">{{ text("", "Company verification") }}</p>
        <h1>{{ text("未认证公司身份", "Unverified company identity") }}</h1>
        <p class="hero-copy">
          {{
            text(
              "",
              "Choose the company you belong to, select a group, then either wait for approval from an administrator or group leader, or redeem a 24-hour key to enter immediately.",
            )
          }}
        </p>
      </div>

      <div class="hero-actions">
        <button type="button" class="secondary-button" :disabled="loadingContext" @click="handleRefreshStatus">
          {{ loadingContext ? text("", "Refreshing...") : text("", "Refresh status") }}
        </button>
        <button type="button" class="primary-button" @click="uiStore.openOnboarding()">
          {{ text("", "Open onboarding") }}
        </button>
      </div>
    </header>

    <section class="verify-grid">
      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ text("", "Step 1") }}</p>
            <h2>{{ text("", "Choose company") }}</h2>
          </div>
        </div>

        <div class="form-grid">
          <label>
            <span>{{ text("", "Search company name") }}</span>
            <input
              v-model.trim="searchKeyword"
              type="text"
              :placeholder="text('', 'Search by company name')"
              @input="handleCompanyNameInput"
              @keyup.enter="handleSearchCompanies"
            />
          </label>
          <label>
            <span>{{ text("", "Company ID") }}</span>
            <input
              v-model.trim="companyPublicIdInput"
              type="text"
              :placeholder="text('', 'Enter the permanent company ID')"
            />
          </label>
        </div>

        <div class="panel-actions">
          <button type="button" class="secondary-button" :disabled="searchingCompanies" @click="handleSearchCompanies">
            {{ searchingCompanies ? text("", "Searching...") : text("", "Search company") }}
          </button>
          <button type="button" class="primary-button" :disabled="selectingCompany" @click="handleSelectCompanyTarget">
            {{ selectingCompany ? text("", "Saving...") : text("", "Confirm target company") }}
          </button>
        </div>

        <div v-if="companySummary" class="summary-card">
          <strong>{{ companySummary.name }}</strong>
          <span>{{ text("", "Company ID") }}: {{ companySummary.publicId || text("", "Not available") }}</span>
          <small>{{ text("", "Current plan") }}: {{ companySummary.plan }}</small>
        </div>

        <div v-if="searchResults.length" class="search-results">
          <button
            v-for="company in searchResults"
            :key="company.id"
            type="button"
            class="search-result"
            :class="{ 'search-result--active': activeCompanyId === company.id }"
            @click="selectSearchResult(company)"
          >
            <strong>{{ company.name }}</strong>
            <span>{{ company.publicId || text("", "No company ID") }}</span>
          </button>
        </div>
        <div v-else-if="companySearchNotFound" class="empty-state">
          {{ text("未找到该公司", "Company not found") }}
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ text("", "Step 2") }}</p>
            <h2>{{ text("", "Choose group") }}</h2>
          </div>
          <span class="status-pill">
            {{ verified ? text("", "Verified") : text("", "Pending") }}
          </span>
        </div>

        <div v-if="groups.length" class="group-list">
          <button
            v-for="group in groups"
            :key="group.id"
            type="button"
            class="group-card"
            :class="{ 'group-card--active': selectedGroupId === group.id }"
            @click="selectedGroupId = group.id"
          >
            <strong>{{ group.name }}</strong>
            <span>{{ group.description || text("", "No description") }}</span>
            <small>{{ group.memberCount }} {{ text("", "members") }}</small>
          </button>
        </div>
        <div v-else class="empty-state">
          {{ text("", "No groups are available in the current company yet.") }}
        </div>

        <label class="field-block">
          <span>{{ text("", "Approval note") }}</span>
          <textarea
            v-model.trim="requestNote"
            rows="3"
            :placeholder="text('', 'Optional note for the administrator or group leader')"
          ></textarea>
        </label>

        <div class="panel-actions">
          <button
            type="button"
            class="primary-button"
            :disabled="requestingApproval || !selectedGroupId || verified"
            @click="handleSubmitAccessRequest"
          >
            {{ requestingApproval ? text("", "Submitting...") : text("", "Submit approval request") }}
          </button>
        </div>

        <div v-if="pendingRequest" class="request-card">
          <strong>{{ text("", "Current request") }}</strong>
          <span>{{ pendingRequest.targetGroupName }} · {{ pendingRequest.status }}</span>
          <small>{{ formatDateTime(pendingRequest.createdAt) }}</small>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">{{ text("", "Fast entry") }}</p>
          <h2>{{ text("", "24-hour key") }}</h2>
        </div>
      </div>

      <div class="form-grid">
        <label>
          <span>{{ text("", "Access key") }}</span>
          <input v-model.trim="accessKey" type="text" :placeholder="text('', 'Paste the access key here')" />
        </label>
        <label>
          <span>{{ text("", "Target group") }}</span>
          <select v-model="selectedGroupId">
            <option value="">{{ text("", "Choose group") }}</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </label>
      </div>

      <div class="panel-actions">
        <button type="button" class="primary-button" :disabled="redeemingKey || !accessKey" @click="handleRedeemAccessKey">
          {{ redeemingKey ? text("", "Verifying...") : text("", "Redeem key and enter company") }}
        </button>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useLocalizedText } from "@/composables/useLocalizedText";
import {
  getCompanyAccessContext,
  redeemCompanyAccessKey,
  searchCompanies,
  selectCompanyAccessTarget,
  submitCompanyAccessRequest,
  type AuthCompanyRecord,
  type AuthPayload,
  type CompanyAccessContextResponse,
  type CompanyGroupRecord,
  type CompanySearchRecord,
} from "@/api/auth";
import request from "@/utils/request";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage } from "@/utils/requestError";

defineOptions({
  name: "CompanyVerifyPage",
});

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { text } = useLocalizedText();

const loadingContext = ref(false);
const selectingCompany = ref(false);
const requestingApproval = ref(false);
const redeemingKey = ref(false);
const searchingCompanies = ref(false);
const searchKeyword = ref("");
const companyPublicIdInput = ref(authStore.companyPublicId || "");
const accessKey = ref("");
const requestNote = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const activeCompanyId = ref("");
const selectedGroupId = ref(authStore.primaryGroupId || "");
const getSafeStoredCompany = (): AuthCompanyRecord | null => {
  const company = authStore.getCompanyInfo();
  if (!company?.id) {
    return null;
  }

  return {
    ...company,
    id: company.id,
  };
};
const companyAccess = ref<CompanyAccessContextResponse["companyAccess"]>({
  company: getSafeStoredCompany(),
  groups: [],
  pendingRequest: null,
});
const searchResults = ref<CompanySearchRecord[]>([]);
const companySearchAttempted = ref(false);

const companySummary = computed(() => companyAccess.value.company);
const groups = computed<CompanyGroupRecord[]>(() => companyAccess.value.groups || []);
const pendingRequest = computed(() => companyAccess.value.pendingRequest);
const verified = computed(() => authStore.companyIdentityVerified);
const companySearchNotFound = computed(() => (
  companySearchAttempted.value
  && !searchingCompanies.value
  && !searchResults.value.length
  && Boolean(searchKeyword.value || companyPublicIdInput.value)
));

const applyAuthPayload = (payload: AuthPayload) => {
  if (payload.accessToken && payload.refreshToken) {
    authStore.setTokens(payload.accessToken, payload.refreshToken);
  }

  if (payload.user && payload.company) {
    authStore.setUserInfo(payload.user, payload.company, payload.rbac);
  }
};

const syncCurrentUser = async () => {
  const response = await request.get<AuthPayload>("/auth/me");
  if (response.data.user && response.data.company) {
    authStore.setUserInfo(response.data.user, response.data.company, response.data.rbac);
  }
};

const loadContext = async () => {
  loadingContext.value = true;
  try {
    const response = await getCompanyAccessContext();
    companyAccess.value = response.data.companyAccess;
    if (companyAccess.value.company?.publicId) {
      companyPublicIdInput.value = companyAccess.value.company.publicId;
    }
    if (!selectedGroupId.value && companyAccess.value.pendingRequest?.targetGroupId) {
      selectedGroupId.value = companyAccess.value.pendingRequest.targetGroupId;
    }
    if (!selectedGroupId.value && companyAccess.value.groups.length === 1) {
      selectedGroupId.value = companyAccess.value.groups[0]?.id || "";
    }

    if (response.data.verified && authStore.needsCompanyVerification) {
      await syncCurrentUser();
      uiStore.openOnboarding();
      await router.push("/customer");
    }
  } catch (error) {
    notifyActionError(error, text("", "Failed to load company verification context."), {
      title: text("", "Company verification"),
    });
  } finally {
    loadingContext.value = false;
  }
};

const handleSearchCompanies = async () => {
  if (!searchKeyword.value && !companyPublicIdInput.value) {
    searchResults.value = [];
    companySearchAttempted.value = false;
    return;
  }

  companySearchAttempted.value = true;
  searchingCompanies.value = true;
  try {
    const response = await searchCompanies({
      q: searchKeyword.value || undefined,
      companyPublicId: searchKeyword.value ? undefined : companyPublicIdInput.value || undefined,
      limit: 8,
    });
    const companies = response.data.companies || [];
    searchResults.value = companies;
    const normalizedKeyword = searchKeyword.value.trim().toLowerCase();
    const normalizedPublicId = companyPublicIdInput.value.trim().toUpperCase();
    const matchedCompany = companies.find((company) => company.publicId === normalizedPublicId)
      || companies.find((company) => company.name.trim().toLowerCase() === normalizedKeyword)
      || (companies.length === 1 ? companies[0] : null);

    if (matchedCompany) {
      selectSearchResult(matchedCompany);
    } else if (searchKeyword.value) {
      activeCompanyId.value = "";
      companyPublicIdInput.value = "";
    }
  } catch (error) {
    notifyActionError(error, text("", "Failed to search companies."), {
      title: text("", "Company verification"),
    });
  } finally {
    searchingCompanies.value = false;
  }
};

const selectSearchResult = (company: CompanySearchRecord) => {
  activeCompanyId.value = company.id;
  searchKeyword.value = company.name;
  companyPublicIdInput.value = company.publicId || "";
};

const handleCompanyNameInput = () => {
  activeCompanyId.value = "";
  companySearchAttempted.value = false;

  if (searchKeyword.value.trim()) {
    companyPublicIdInput.value = "";
  }
};

watch(searchKeyword, (value) => {
  const activeCompany = searchResults.value.find((company) => company.id === activeCompanyId.value);
  if (!activeCompany || activeCompany.name === value) {
    return;
  }

  activeCompanyId.value = "";
  if (!companyPublicIdInput.value || companyPublicIdInput.value === activeCompany.publicId) {
    companyPublicIdInput.value = "";
  }
});

const handleSelectCompanyTarget = async () => {
  selectingCompany.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const response = await selectCompanyAccessTarget({
      companyName: searchKeyword.value || undefined,
      companyPublicId: companyPublicIdInput.value || undefined,
    });
    applyAuthPayload(response.data);
    companyAccess.value = response.data.companyAccess;
    selectedGroupId.value = companyAccess.value.groups.length === 1 ? companyAccess.value.groups[0]?.id || "" : "";
    notifyActionSuccess(text("", "Target company updated."), {
      title: text("", "Company verification"),
    });
  } catch (error) {
    notifyActionError(error, text("", "Failed to update the target company."), {
      title: text("", "Company verification"),
    });
  } finally {
    selectingCompany.value = false;
  }
};

const handleSubmitAccessRequest = async () => {
  if (!selectedGroupId.value) {
    errorMessage.value = text("", "Choose a company group before submitting an approval request.");
    return;
  }

  requestingApproval.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await submitCompanyAccessRequest({
      targetGroupId: selectedGroupId.value,
      note: requestNote.value || undefined,
    });
    notifyActionSuccess(text("", "Approval request submitted."), {
      title: text("", "Company verification"),
    });
    successMessage.value = text("", "Approval request submitted. Wait for an administrator or group leader to approve it.");
    await loadContext();
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to submit the approval request."));
    notifyActionError(error, errorMessage.value, {
      title: text("", "Company verification"),
    });
  } finally {
    requestingApproval.value = false;
  }
};

const handleRedeemAccessKey = async () => {
  redeemingKey.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const response = await redeemCompanyAccessKey({
      token: accessKey.value,
      targetGroupId: selectedGroupId.value || undefined,
    });
    applyAuthPayload(response.data);
    companyAccess.value = response.data.companyAccess;
    notifyActionSuccess(text("", "Company identity verified."), {
      title: text("", "Company verification"),
    });
    uiStore.openOnboarding();
    await router.push("/customer");
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to redeem the access key."));
    notifyActionError(error, errorMessage.value, {
      title: text("", "Company verification"),
    });
    await loadContext();
  } finally {
    redeemingKey.value = false;
  }
};

const handleRefreshStatus = async () => {
  await loadContext();
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return text("", "Not available");
  }

  return new Date(value).toLocaleString();
};

onMounted(() => {
  void loadContext();
});
</script>

<style scoped>
.verify-page {
  display: grid;
  gap: 20px;
}

.hero-card,
.panel-card {
  border-radius: 28px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 30px;
}

.hero-card h1,
.panel-head h2 {
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.08;
  color: var(--text-primary);
}

.eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy {
  max-width: 860px;
  margin-top: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.hero-actions,
.panel-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.verify-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.panel-card {
  padding: 24px;
  display: grid;
  gap: 16px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.status-pill,
.summary-card,
.request-card,
.group-card,
.search-result {
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  border-radius: 20px;
}

.status-pill {
  padding: 8px 14px;
  color: var(--text-primary);
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-grid label,
.field-block {
  display: grid;
  gap: 8px;
}

.form-grid span,
.field-block span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.form-grid input,
.form-grid select,
.field-block textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: var(--surface-secondary);
  padding: 12px 14px;
  color: var(--text-primary);
}

.summary-card,
.request-card {
  padding: 16px 18px;
  display: grid;
  gap: 6px;
}

.search-results,
.group-list {
  display: grid;
  gap: 10px;
  max-height: min(360px, 42vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.search-results::-webkit-scrollbar,
.group-list::-webkit-scrollbar {
  display: none;
}

.search-result,
.group-card {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  cursor: pointer;
  color: var(--text-primary);
}

.search-result--active,
.group-card--active {
  box-shadow: inset 3px 0 0 var(--accent-primary);
}

.empty-state {
  padding: 18px;
  border-radius: 18px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
}

.error-message,
.success-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 700;
  line-height: 1.6;
}

.error-message {
  border: 1px solid rgba(190, 62, 62, 0.26);
  background: rgba(190, 62, 62, 0.08);
  color: rgb(174, 48, 48);
}

.success-message {
  border: 1px solid rgba(48, 131, 98, 0.24);
  background: rgba(48, 131, 98, 0.08);
  color: rgb(38, 112, 82);
}

.primary-button,
.secondary-button {
  border-radius: 999px;
  border: 1px solid var(--border-light);
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  background: var(--text-primary);
  color: #fff;
}

.secondary-button {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

@media (max-width: 960px) {
  .hero-card,
  .verify-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    flex-direction: column;
  }
}
</style>
