<template>
  <teleport to="body">
    <div v-if="uiStore.onboardingOpen" class="shell" @click="closeShell">
      <section class="frame" @click.stop>
        <!-- 右上角关闭按钮 -->
        <button type="button" class="top-close-btn" @click="handleTopClose">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <aside class="rail">
          <p>{{ text("", "Welcome to SalePilot") }}</p>
          <ol>
            <li v-for="(step, index) in steps" :key="step.title" :class="{ active: index === currentStep, done: index < currentStep }">
              <span>{{ index + 1 }}</span>
              <div>
                <span class="step-title">{{ step.title }}</span>
                <small class="step-caption">{{ step.caption }}</small>
              </div>
            </li>
          </ol>
        </aside>

        <div class="main">
          <header class="head">
            <div>
              <p>{{ steps[currentStep]?.caption }}</p>
              <h2>{{ steps[currentStep]?.title }}</h2>
            </div>
          </header>

          <div class="body">
            <section v-if="currentStep === 0" class="panel">
              <p class="copy">{{ text("", "Choose the workspace language and theme. You can change both later in Account settings.") }}</p>
              <div class="grid three">
                <button type="button" class="card" :class="{ active: uiStore.language === 'en-US' }" @click="uiStore.setLanguage('en-US')">
                  <strong>English</strong>
                  <span>{{ text("", "Default workspace language") }}</span>
                </button>
                <button type="button" class="card" :class="{ active: uiStore.language === 'zh-CN' }" @click="uiStore.setLanguage('zh-CN')">
                  <strong>中文</strong>
                  <span>{{ text("", "Simplified Chinese") }}</span>
                </button>
              </div>
              <div class="grid three">
                <button type="button" class="card" :class="{ active: uiStore.theme === 'light' }" @click="uiStore.setTheme('light')">
                  <strong>{{ text("", "Light") }}</strong>
                  <span>{{ text("", "Bright workspace surfaces") }}</span>
                </button>
                <button type="button" class="card" :class="{ active: uiStore.theme === 'dark' }" @click="uiStore.setTheme('dark')">
                  <strong>{{ text("", "Dark") }}</strong>
                  <span>{{ text("", "Dark dashboard mode") }}</span>
                </button>
                <button type="button" class="card" :class="{ active: uiStore.theme === 'system' }" @click="uiStore.setTheme('system')">
                  <strong>{{ text("", "Follow system") }}</strong>
                  <span>{{ text("", "Match the operating system theme") }}</span>
                </button>
              </div>
            </section>

            <!-- 套餐选择步骤 -->
            <section v-else-if="currentStep === 1" class="panel">
              <p class="copy">{{ text("", "Select a workspace plan that fits your team. You can upgrade or downgrade anytime.") }}</p>
              <div class="plan-grid">
                <button
                  v-for="plan in availablePlans"
                  :key="plan.key"
                  type="button"
                  class="plan-card"
                  :class="{ active: selectedPlan === plan.key }"
                  @click="selectedPlan = plan.key"
                >
                  <div class="plan-header">
                    <strong class="plan-name">{{ plan.label }}</strong>
                    <span class="plan-price">{{ formatPlanPrice(plan.priceMonthlyUsd, language) }}<small>/{{ text("", "mo") }}</small></span>
                  </div>
                  <ul class="plan-features">
                    <li>{{ text("", "Up to") }} {{ formatPlanQuota(plan.maxUsers) }} {{ text("", "users") }}</li>
                    <li>{{ text("", "Up to") }} {{ formatPlanQuota(plan.maxCustomers) }} {{ text("", "customers") }}</li>
                    <li>{{ formatPlanQuota(plan.aiCalls) }} {{ text("", "AI calls/month") }}</li>
                  </ul>
                  <p class="plan-summary">{{ plan.summary }}</p>
                </button>
              </div>
            </section>

            <section v-else-if="currentStep === 2" class="panel">
              <p class="copy">{{ text("", "Verify the company you belong to before choosing a role. Search by company name, enter the permanent company ID, submit an approval request, or redeem a 24-hour key.") }}</p>

              <div v-if="companySummary" class="summary">
                <strong>{{ companySummary.name }}</strong>
                <span>{{ text("", "Company ID") }}: {{ companySummary.publicId || text("", "Not available") }}</span>
                <small>{{ verified ? text("", "Company identity verified") : text("", "Company identity pending") }}</small>
              </div>

              <div v-if="!verified" class="form">
                <label>
                  <span>{{ text("", "Search company name") }}</span>
                  <input v-model.trim="searchKeyword" type="text" :placeholder="text('', 'Search by company name')" @input="handleCompanyNameInput" @keyup.enter="handleSearchCompanies" />
                </label>
                <label>
                  <span>{{ text("", "Company ID") }}</span>
                  <input v-model.trim="companyPublicIdInput" type="text" :placeholder="text('', 'Enter the permanent company ID')" />
                </label>
              </div>

              <div v-if="!verified" class="actions">
                <button type="button" class="ghost" :disabled="searchingCompanies" @click="handleSearchCompanies">{{ searchingCompanies ? text("", "Searching...") : text("", "Search company") }}</button>
                <button type="button" class="secondary" :disabled="selectingCompany" @click="handleSelectCompanyTarget">{{ selectingCompany ? text("", "Saving...") : text("", "Confirm target company") }}</button>
                <button type="button" class="ghost" :disabled="loadingContext" @click="loadCompanyContext">{{ loadingContext ? text("", "Refreshing...") : text("", "Refresh status") }}</button>
              </div>

              <div v-if="searchResults.length && !verified" class="grid two">
                <button v-for="company in searchResults" :key="company.id" type="button" class="card" :class="{ active: activeCompanyId === company.id }" @click="selectSearchResult(company)">
                  <strong>{{ company.name }}</strong>
                  <span>{{ company.publicId || text("", "No company ID") }}</span>
                </button>
              </div>
              <div v-else-if="companySearchNotFound && !verified" class="empty-state">
                {{ text("未找到该公司", "Company not found") }}
              </div>

              <div class="grid three">
                <button v-for="group in groups" :key="group.id" type="button" class="card" :class="{ active: selectedGroupId === group.id }" @click="selectedGroupId = group.id">
                  <strong>{{ group.name }}</strong>
                  <span>{{ group.description || text("", "No description") }}</span>
                </button>
              </div>

              <div v-if="!verified" class="form">
                <label>
                  <span>{{ text("", "Approval note") }}</span>
                  <textarea v-model.trim="requestNote" rows="3" :placeholder="text('', 'Optional note for the administrator or group leader')"></textarea>
                </label>
                <label>
                  <span>{{ text("", "24-hour key") }}</span>
                  <input v-model.trim="accessKey" type="text" :placeholder="text('', 'Paste the direct-entry key')" />
                </label>
              </div>

              <div v-if="!verified" class="actions">
                <button type="button" class="secondary" :disabled="requestingApproval || !selectedGroupId" @click="handleSubmitAccessRequest">{{ requestingApproval ? text("", "Submitting...") : text("", "Submit approval request") }}</button>
                <button type="button" class="primary" :disabled="redeemingKey || !accessKey" @click="handleRedeemAccessKey">{{ redeemingKey ? text("", "Verifying...") : text("", "Redeem key and enter company") }}</button>
              </div>

              <div v-if="pendingRequest" class="summary">
                <strong>{{ text("", "Current request") }}</strong>
                <span>{{ pendingRequest.targetGroupName }} · {{ pendingRequest.status }}</span>
                <small>{{ formatDateTime(pendingRequest.createdAt) }}</small>
              </div>
            </section>

            <section v-else-if="founderSetupMode" class="panel">
              <p class="copy">{{ text("", "The first user in each company must be the company administrator or executive owner. This founder account stays locked to Administrator while you define the three company role passcodes.") }}</p>
              <div class="summary">
                <span>{{ text("", "Current role") }}</span>
                <strong>{{ roleLabel("admin") }}</strong>
              </div>
              <div class="form">
                <label><span>{{ text("", "Workspace member passcode") }}</span><input v-model.trim="founderPasscodes.user" type="password" :placeholder="text('', 'Enter the user role passcode')" /></label>
                <label><span>{{ text("", "Sales manager passcode") }}</span><input v-model.trim="founderPasscodes.manager" type="password" :placeholder="text('', 'Enter the sales manager passcode')" /></label>
                <label><span>{{ text("", "Administrator passcode") }}</span><input v-model.trim="founderPasscodes.admin" type="password" :placeholder="text('', 'Enter the administrator passcode')" /></label>
              </div>
            </section>

            <section v-else-if="currentStep === 3" class="panel">
              <p class="copy">{{ text("", "Select the role you want to use in this company. Enter the corresponding role passcode before you continue.") }}</p>
              <div class="grid three role-choice-grid">
                <button v-for="role in roleOptions" :key="role.role" type="button" class="card role-choice-card" :class="{ active: selectedRole === role.role }" @click="selectedRole = role.role">
                  <strong>{{ roleLabel(role.role) }}</strong>
                  <span>{{ role.description }}</span>
                </button>
              </div>
              <label class="field role-passcode-field">
                <span>{{ text("", "Role passcode") }}</span>
                <input v-model.trim="rolePasscode" type="password" :placeholder="text('', 'Enter the selected role passcode')" />
              </label>
            </section>

            <section v-else class="panel">
              <p class="copy">{{ text("", "SalePilot combines CRM records, follow-up tracking, group collaboration, AI analysis, churn alerts, daily reports, and dashboards in one workspace.") }}</p>
              <div class="grid three">
                <article class="summary"><strong>{{ text("", "Customers, follow-ups, AI analysis") }}</strong></article>
                <article class="summary"><strong>{{ text("", "Groups, approvals, and notifications") }}</strong></article>
                <article class="summary"><strong>{{ text("", "Daily report and dashboards") }}</strong></article>
              </div>
              <div class="summary">
                <strong>{{ text("", "Command palette") }}</strong>
                <span>{{ text("", "The quick command menu is explained in the tutorial and can be reopened later from the account menu.") }}</span>
              </div>
            </section>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          </div>

          <footer class="foot">
            <button type="button" class="ghost" :disabled="currentStep === 0 || isSaving" @click="handlePrevious">{{ text("", "Back") }}</button>
            <button type="button" class="primary" :disabled="primaryDisabled" @click="handlePrimary">{{ primaryButtonLabel }}</button>
          </footer>
        </div>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { completeWorkspaceOnboarding, getCompanyAccessContext, redeemCompanyAccessKey, searchCompanies, selectCompanyAccessTarget, submitCompanyAccessRequest, type AuthCompanyRecord, type AuthPayload, type CompanyAccessContextResponse, type CompanySearchRecord } from "@/api/auth";
import request from "@/utils/request";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";
import { getRequestErrorMessage } from "@/utils/requestError";
import { WORKSPACE_PLAN_DEFINITIONS, formatPlanPrice, formatPlanQuota, type WorkspacePlanKey } from "@/constants/workspacePlans";

defineOptions({ name: "OnboardingCarousel" });

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const { text, roleLabel, language } = useLocalizedText();

const currentStep = ref(0);
const selectedRole = ref<"user" | "manager" | "admin">("user");
const rolePasscode = ref("");
const errorMessage = ref("");
const isSaving = ref(false);
const founderPasscodes = reactive({ user: "", manager: "", admin: "" });
const loadingContext = ref(false);
const searchingCompanies = ref(false);
const selectingCompany = ref(false);
const requestingApproval = ref(false);
const redeemingKey = ref(false);
const searchKeyword = ref("");
const companyPublicIdInput = ref("");
const accessKey = ref("");
const requestNote = ref("");
const activeCompanyId = ref("");
const selectedGroupId = ref("");
const searchResults = ref<CompanySearchRecord[]>([]);
const companySearchAttempted = ref(false);
const selectedPlan = ref<WorkspacePlanKey>("free");
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
const companyAccess = ref<CompanyAccessContextResponse["companyAccess"]>({ company: null, groups: [], pendingRequest: null });

const founderSetupMode = computed(() => authStore.founderNeedsRolePasscodeSetup);
const verified = computed(() => authStore.companyIdentityVerified);
const companySummary = computed(() => companyAccess.value.company);
const groups = computed(() => companyAccess.value.groups || []);
const pendingRequest = computed(() => companyAccess.value.pendingRequest);
const canContinueFromCompanyStep = computed(() => verified.value || Boolean(pendingRequest.value));
const companySearchNotFound = computed(() => (
  companySearchAttempted.value
  && !searchingCompanies.value
  && !searchResults.value.length
  && Boolean(searchKeyword.value || companyPublicIdInput.value)
));
const canClose = computed(() => !(uiStore.onboardingRequired || founderSetupMode.value || authStore.needsCompanyVerification) && !isSaving.value);
const roleOptions = computed(() => [
  { role: "user" as const, description: text("", "Personal pipeline execution and follow-ups.") },
  { role: "manager" as const, description: text("", "Team coordination, approvals, and reporting.") },
  { role: "admin" as const, description: text("", "Workspace governance, permissions, and role security.") },
]);
const availablePlans = computed(() => WORKSPACE_PLAN_DEFINITIONS);
const steps = computed(() => [
  { title: text("", "Workspace language and theme"), caption: text("", "Preferences") },
  { title: text("", "Choose your plan"), caption: text("", "Workspace plan") },
  { title: text("", "Company verification"), caption: text("", "Company and group") },
  { title: founderSetupMode.value ? text("", "Founder setup") : text("", "Choose your working identity"), caption: text("", "Role security") },
  { title: text("", "Ready to work"), caption: text("", "Welcome to SalePilot") },
]);
const primaryButtonLabel = computed(() => {
  if (isSaving.value) return text("", "Saving...");
  if (currentStep.value === 0) return text("", "Continue");
  if (currentStep.value === 1) return text("", "Continue");
  if (currentStep.value === 2) return canContinueFromCompanyStep.value ? text("下一步", "Continue") : text("", "Submit approval request or redeem key first");
  if (currentStep.value === 3) {
    if (!verified.value && !founderSetupMode.value) return text("下一步", "Continue");
    return founderSetupMode.value ? text("", "Save passcodes and continue") : text("", "Confirm role and continue");
  }
  return text("", "Start using it");
});
const primaryDisabled = computed(() => isSaving.value || (currentStep.value === 2 && !canContinueFromCompanyStep.value));

const applyAuthPayload = (payload: AuthPayload) => {
  if (payload.accessToken && payload.refreshToken) authStore.setTokens(payload.accessToken, payload.refreshToken);
  if (payload.user && payload.company) authStore.setUserInfo(payload.user, payload.company, payload.rbac);
};

const syncCurrentUser = async () => {
  const response = await request.get<AuthPayload>("/auth/me");
  if (response.data.user && response.data.company) authStore.setUserInfo(response.data.user, response.data.company, response.data.rbac);
};

const resetState = () => {
  currentStep.value = 0;
  selectedRole.value = (authStore.userrole || "user") as "user" | "manager" | "admin";
  rolePasscode.value = "";
  errorMessage.value = "";
  founderPasscodes.user = "";
  founderPasscodes.manager = "";
  founderPasscodes.admin = "";
  searchKeyword.value = authStore.companyname || "";
  companyPublicIdInput.value = authStore.companyPublicId || "";
  accessKey.value = "";
  requestNote.value = "";
  activeCompanyId.value = "";
  selectedGroupId.value = authStore.primaryGroupId || "";
  companyAccess.value = { company: getSafeStoredCompany(), groups: [], pendingRequest: null };
  companySearchAttempted.value = false;
  selectedPlan.value = "free";
};

const closeShell = () => { if (canClose.value) uiStore.closeOnboarding(); };
const handlePrevious = () => { errorMessage.value = ""; if (currentStep.value > 0) currentStep.value -= 1; };

// 任务2：右上角关闭按钮处理函数
const handleTopClose = () => {
  uiStore.closeOnboarding();
  router.push("/customer");
};

const loadCompanyContext = async () => {
  loadingContext.value = true;
  try {
    const response = await getCompanyAccessContext();
    companyAccess.value = response.data.companyAccess;
    if (companySummary.value?.name) searchKeyword.value = companySummary.value.name;
    if (companySummary.value?.publicId) companyPublicIdInput.value = companySummary.value.publicId;
    if (!selectedGroupId.value && pendingRequest.value?.targetGroupId) selectedGroupId.value = pendingRequest.value.targetGroupId;
    if (!selectedGroupId.value && companyAccess.value.groups.length === 1) selectedGroupId.value = companyAccess.value.groups[0]?.id || "";
    if (response.data.verified && authStore.needsCompanyVerification) {
      await syncCurrentUser();
      currentStep.value = Math.max(currentStep.value, 2);
    }
  } catch (error) {
    notifyActionError(error, text("", "Failed to load company verification context."), { title: text("", "Company verification") });
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
    notifyActionError(error, text("", "Failed to search companies."), { title: text("", "Company verification") });
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
  try {
    const response = await selectCompanyAccessTarget({ companyName: searchKeyword.value || undefined, companyPublicId: companyPublicIdInput.value || undefined });
    applyAuthPayload(response.data);
    companyAccess.value = response.data.companyAccess;
    selectedGroupId.value = companyAccess.value.groups.length === 1 ? companyAccess.value.groups[0]?.id || "" : "";
    notifyActionSuccess(text("", "Target company updated."), { title: text("", "Company verification") });
  } catch (error) {
    notifyActionError(error, text("", "Failed to update the target company."), { title: text("", "Company verification") });
  } finally {
    selectingCompany.value = false;
  }
};

const handleSubmitAccessRequest = async () => {
  if (!selectedGroupId.value) {
    errorMessage.value = text("", "Choose a group before submitting the approval request.");
    return;
  }
  requestingApproval.value = true;
  errorMessage.value = "";
  try {
    await submitCompanyAccessRequest({ targetGroupId: selectedGroupId.value, note: requestNote.value || undefined });
    notifyActionSuccess(text("", "Approval request submitted."), { title: text("", "Company verification") });
    await loadCompanyContext();
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to submit the approval request."));
    notifyActionError(error, text("", "Failed to submit the approval request."), { title: text("", "Company verification") });
  } finally {
    requestingApproval.value = false;
  }
};

const handleRedeemAccessKey = async () => {
  redeemingKey.value = true;
  errorMessage.value = "";
  try {
    const response = await redeemCompanyAccessKey({ token: accessKey.value, targetGroupId: selectedGroupId.value || undefined });
    applyAuthPayload(response.data);
    companyAccess.value = response.data.companyAccess;
    currentStep.value = 2;
    notifyActionSuccess(text("", "Company identity verified."), { title: text("", "Company verification") });
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to redeem the access key."));
    notifyActionError(error, text("", "Failed to redeem the access key."), { title: text("", "Company verification") });
    await loadCompanyContext();
  } finally {
    redeemingKey.value = false;
  }
};

const handleFounderSetup = async () => {
  isSaving.value = true;
  try {
    const response = await completeWorkspaceOnboarding({ rolePasscodes: { user: founderPasscodes.user, manager: founderPasscodes.manager, admin: founderPasscodes.admin } });
    applyAuthPayload(response.data);
    notifyActionSuccess(text("", "Passcodes updated."), { title: text("", "Role passcodes") });
    uiStore.markOnboardingCompleted();
    await router.push("/groups");
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to update role passcodes."));
    notifyActionError(error, text("", "Failed to update role passcodes."), { title: text("", "Role passcodes") });
  } finally {
    isSaving.value = false;
  }
};

const handleRoleConfirmation = async () => {
  isSaving.value = true;
  try {
    const response = await completeWorkspaceOnboarding({ desiredRole: selectedRole.value, rolePasscode: rolePasscode.value });
    applyAuthPayload(response.data);
    notifyActionSuccess(text("", "Workspace identity confirmed successfully."), { title: text("", "Workspace identity") });
    if (selectedRole.value === "manager") {
      uiStore.markOnboardingCompleted();
      await router.push("/groups");
      return;
    }
    currentStep.value = 4;
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error, text("", "Failed to confirm workspace identity."));
    notifyActionError(error, text("", "Failed to confirm workspace identity."), { title: text("", "Workspace identity") });
  } finally {
    isSaving.value = false;
  }
};

const handlePrimary = async () => {
  errorMessage.value = "";
  if (currentStep.value === 0) { currentStep.value = 1; return; }
  if (currentStep.value === 1) { currentStep.value = 2; return; }
  if (currentStep.value === 2) {
    if (!canContinueFromCompanyStep.value) { errorMessage.value = text("", "Submit an approval request or redeem a company key before continuing."); return; }
    currentStep.value = 3; return;
  }
  if (currentStep.value === 3) {
    if (founderSetupMode.value) {
      await handleFounderSetup();
    } else if (verified.value) {
      await handleRoleConfirmation();
    } else {
      currentStep.value = 4;
    }
    return;
  }
  uiStore.markOnboardingCompleted();
  await router.push(authStore.needsCompanyVerification ? "/company/verify" : "/customer");
};

const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : text("", "Not available");

watch(() => uiStore.onboardingOpen, (open) => {
  if (!open) return;
  resetState();
  void loadCompanyContext();
}, { immediate: true });
</script>

<style scoped>
.shell{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;background:rgba(16,15,12,.44);backdrop-filter:blur(20px)}
.frame{position:relative;width:min(1160px,calc(100vw - 36px));height:min(760px,calc(100vh - 36px));display:grid;grid-template-columns:340px minmax(0,1fr);border-radius:32px;overflow:hidden;border:1px solid var(--border-light);background:var(--surface-white);box-shadow:0 30px 90px rgba(16,15,12,.22)}

/* 右上角关闭按钮样式 */
.top-close-btn{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:1px solid var(--border-light);background:rgba(255,255,255,.7);color:var(--text-secondary);display:grid;place-items:center;cursor:pointer;z-index:10;transition:all .2s ease}
.top-close-btn:hover{background:var(--surface-secondary);color:var(--text-primary);border-color:var(--text-primary)}

.rail{min-height:0;overflow:auto;padding:28px 20px;background:linear-gradient(180deg,rgba(245,239,230,.98),rgba(237,228,213,.92));display:grid;gap:18px;align-content:start}
.rail,.body{scrollbar-width:none;-ms-overflow-style:none}
.rail::-webkit-scrollbar,.body::-webkit-scrollbar{display:none}
.rail p,.head p{color:var(--text-secondary);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.rail ol{display:grid;gap:10px}
.rail li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;padding:14px 16px;border-radius:20px;color:var(--text-secondary);align-items:start}
.rail li>span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.7);font-weight:700;flex-shrink:0}

/* 统一左侧边栏文字风格 */
.rail li>div{min-width:0;display:grid;gap:4px}
.rail li .step-title{display:block;font-size:14px;font-weight:500;color:var(--text-secondary);line-height:1.4;white-space:normal;overflow:visible;text-overflow:clip;word-break:break-word}
.rail li .step-caption{display:block;font-size:12px;font-weight:400;color:var(--text-secondary);opacity:.7;line-height:1.35;white-space:normal;overflow:visible;text-overflow:clip;word-break:break-word}
.rail li.active,.rail li.done{background:rgba(255,255,255,.7);color:var(--text-primary)}
.rail li.active .step-title,.rail li.done .step-title{color:var(--text-primary)}
.rail li.active .step-caption,.rail li.done .step-caption{color:var(--text-primary);opacity:.8}
.rail li.active>span,.rail li.done>span{background:var(--accent-primary);color:#fff}

.main{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0;min-height:0;overflow:hidden}
.head,.foot{padding:22px 26px;border-bottom:1px solid var(--border-light)}
.foot{border-top:1px solid var(--border-light);border-bottom:none;display:flex;justify-content:space-between;gap:12px}
.head{display:flex;justify-content:space-between;gap:12px}
.head h2{font-size:clamp(28px,4vw,38px);line-height:1.05;color:var(--text-primary)}
.body{min-height:0;padding:26px;overflow-y:auto;overscroll-behavior:contain}.panel{display:grid;gap:16px;padding-bottom:12px}.copy{color:var(--text-secondary);line-height:1.8}
.grid,.form{display:grid;gap:12px}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.form{grid-template-columns:repeat(2,minmax(0,1fr))}
.card,.summary,.field,.form label{display:grid;gap:8px}.card,.summary,.empty-state{padding:16px;border-radius:20px;border:1px solid var(--border-light);background:var(--surface-secondary);color:var(--text-primary);text-align:left}
.card{cursor:pointer}.card.active{box-shadow:inset 3px 0 0 var(--accent-primary)}.role-choice-grid{display:flex;flex-wrap:wrap;align-items:flex-start;gap:10px}.role-choice-card{width:min(210px,100%);min-height:0;padding:12px 14px;border-radius:8px}.role-choice-card span{line-height:1.45}.role-passcode-field{max-width:420px}.summary span,.summary small{color:var(--text-secondary);line-height:1.6}
.empty-state{color:var(--text-secondary);font-weight:700}
.field span,.form span{font-size:13px;font-weight:700;color:var(--text-primary)}
.field input,.form input,.form textarea{width:100%;border-radius:16px;border:1px solid var(--border-light);background:var(--surface-secondary);padding:12px 14px;color:var(--text-primary)}
.actions{display:flex;gap:12px;flex-wrap:wrap}.primary,.secondary,.ghost{border-radius:999px;border:1px solid var(--border-light);padding:12px 18px;font-weight:700;cursor:pointer}
.primary{background:var(--text-primary);color:#fff}.secondary{background:rgba(35,34,31,.08);color:var(--text-primary)}.ghost{background:transparent;color:var(--text-primary)}.error{color:#be3e3e;font-weight:600}

/* 套餐选择卡片样式 */
.plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
.plan-card{display:grid;gap:12px;padding:20px;border-radius:24px;border:2px solid var(--border-light);background:var(--surface-secondary);color:var(--text-primary);text-align:left;cursor:pointer;transition:all .2s ease}
.plan-card:hover{border-color:var(--accent-primary)}
.plan-card.active{border-color:var(--accent-primary);box-shadow:0 8px 24px rgba(16,15,12,.12)}
.plan-header{display:flex;justify-content:space-between;align-items:center;gap:8px}
.plan-name{font-size:18px;font-weight:700;color:var(--text-primary)}
.plan-price{font-size:20px;font-weight:700;color:var(--accent-primary)}
.plan-price small{font-size:12px;font-weight:400;color:var(--text-secondary)}
.plan-features{display:grid;gap:6px;list-style:none;padding:0;margin:0}
.plan-features li{font-size:13px;color:var(--text-secondary);line-height:1.5}
.plan-summary{font-size:12px;color:var(--text-secondary);line-height:1.6;opacity:.8}

@media (max-width:960px){
  .frame{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  .rail{padding:18px;gap:12px;overflow-x:auto;overflow-y:hidden}
  .rail ol{display:flex;gap:10px;min-width:max-content}
  .rail li{width:210px;grid-template-columns:30px minmax(0,1fr);padding:12px;border-radius:18px}
  .rail li>span{width:30px;height:30px}
  .form,.grid.two{grid-template-columns:1fr}
}

@media (max-width:640px){
  .shell{padding:0;place-items:stretch}
  .frame{width:100vw;height:100vh;border-radius:0;border:none}
  .head,.foot{padding:16px}
  .head h2{font-size:28px}
  .body{padding:16px}
  .rail{padding:14px}
  .rail p{display:none}
  .rail li{width:168px}
  .rail li .step-caption{display:none}
  .actions,.foot{align-items:stretch}
  .primary,.secondary,.ghost{width:100%;justify-content:center}
}
</style>
