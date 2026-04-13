<template>
  <section class="groups-page">
    <div class="chat-shell">
      <aside class="group-rail">
        <header class="rail-head">
          <div>
            <p class="eyebrow">{{ text("", "Groups") }}</p>
            <h1>{{ text("", "Group chat") }}</h1>
          </div>
          <button type="button" class="icon-button" :disabled="loadingGroups" @click="handleReload">↻</button>
        </header>

        <div v-if="canManageGroups" class="create-group-card">
          <input v-model.trim="newGroupForm.name" type="text" :placeholder="text('', 'New group name')" />
          <textarea v-model.trim="newGroupForm.description" rows="2" :placeholder="text('', 'Description')" />
          <button type="button" class="primary-button" :disabled="creatingGroup || !newGroupForm.name" @click="handleCreateGroup">
            {{ creatingGroup ? text("", "Creating...") : text("", "Create") }}
          </button>
        </div>

        <div class="group-list">
          <button
            v-for="group in groups"
            :key="group.id"
            type="button"
            class="group-card"
            :class="{ 'group-card--active': selectedGroupId === group.id }"
            @click="selectedGroupId = group.id"
          >
            <span class="group-avatar">{{ group.name.charAt(0).toUpperCase() }}</span>
            <span class="group-meta">
              <strong>{{ group.name }}</strong>
              <small>{{ group.memberCount }} {{ text("", "members") }} · {{ group.description || text("", "No description") }}</small>
            </span>
          </button>
        </div>

        <div v-if="!groups.length" class="empty-state">
          {{ text("", "No groups are available yet.") }}
        </div>
      </aside>

      <main class="chat-main">
        <header class="chat-head">
          <div>
            <p class="eyebrow">{{ text("", "Current chat") }}</p>
            <h2>{{ selectedGroup?.name || text("", "Choose a group") }}</h2>
          </div>
          <div class="chat-head__actions">
            <span v-if="selectedGroup" class="status-pill">{{ selectedGroup.memberCount }} {{ text("", "members") }}</span>
            <button
              v-if="selectedGroup"
              type="button"
              class="secondary-button"
              @click="settingsPanelOpen = true"
            >
              {{ text("设置", "Settings") }}
            </button>
          </div>
        </header>

        <div v-if="selectedGroup" class="message-stream">
          <article
            v-for="message in messages"
            :key="message.id"
            class="message-card"
            :class="{ 'message-card--mine': message.authorId === authStore.userid }"
          >
            <span class="message-avatar">{{ message.authorName.charAt(0).toUpperCase() }}</span>
            <div class="message-bubble">
              <div class="message-meta">
                <strong>{{ message.authorName }}</strong>
                <span>{{ roleLabel(message.authorRole) }}</span>
                <small>{{ formatDateTime(message.createdAt) }}</small>
              </div>
              <p>{{ message.content }}</p>
            </div>
          </article>
        </div>
        <div v-else class="empty-state empty-state--center">
          {{ text("", "Choose a group from the left to open its chat.") }}
        </div>

        <div v-if="selectedGroup" class="composer">
          <textarea v-model.trim="messageDraft" rows="3" :placeholder="text('', 'Type a message to the group')" />
          <button type="button" class="primary-button" :disabled="sendingMessage || !messageDraft" @click="handleSendMessage">
            {{ sendingMessage ? text("", "Sending...") : text("", "Send") }}
          </button>
        </div>
      </main>

      <el-drawer
        v-model="settingsPanelOpen"
        class="group-settings-drawer"
        :title="selectedGroup?.name || text('', 'Group settings')"
        size="380px"
      >
      <div class="group-inspector group-inspector--drawer">
        <section class="inspector-card">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ text("", "Settings") }}</p>
              <h3>{{ text("", "Group settings") }}</h3>
            </div>
          </div>

          <div v-if="selectedGroup?.canManage" class="form-grid form-grid--single">
            <label>
              <span>{{ text("", "Group name") }}</span>
              <input v-model.trim="settingsForm.name" type="text" />
            </label>
            <label>
              <span>{{ text("", "Description") }}</span>
              <input v-model.trim="settingsForm.description" type="text" />
            </label>
            <label class="switch-field">
              <input v-model="settingsForm.membersCanInvite" type="checkbox" />
              <span>{{ text("", "Allow members to invite others") }}</span>
            </label>
            <label>
              <span>{{ text("", "Minimum inviter role") }}</span>
              <select v-model="settingsForm.minimumInviterRole">
                <option value="none">{{ text("", "No minimum role") }}</option>
                <option value="user">{{ roleLabel("user") }}</option>
                <option value="manager">{{ roleLabel("manager") }}</option>
                <option value="admin">{{ roleLabel("admin") }}</option>
              </select>
            </label>
            <label>
              <span>{{ text("", "Specific inviters") }}</span>
              <select v-model="settingsForm.specificInviterIds" multiple>
                <option v-for="member in selectedGroup.members" :key="member.id" :value="member.id">
                  {{ member.username }} · {{ roleLabel(member.userrole) }}
                </option>
              </select>
            </label>
            <button type="button" class="primary-button" :disabled="savingSettings" @click="handleSaveGroupSettings">
              {{ savingSettings ? text("", "Saving...") : text("", "Save settings") }}
            </button>
          </div>
          <div v-else class="empty-state">{{ text("", "Only group leaders and administrators can edit settings.") }}</div>
        </section>

        <section class="inspector-card">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ text("", "Files") }}</p>
              <h3>{{ text("", "Group files") }}</h3>
            </div>
          </div>
          <div class="file-drop">
            <strong>{{ text("", "Shared file area") }}</strong>
            <span>{{ text("", "Upload JSON, images, documents, or lightweight deal material up to 2 MB.") }}</span>
            <input type="file" :disabled="!selectedGroup || uploadingFile" @change="handleGroupFileChange" />
          </div>
          <div v-if="groupFiles.length" class="file-list">
            <button v-for="file in groupFiles" :key="file.id" type="button" class="file-item" @click="downloadGroupFile(file)">
              <strong>{{ file.filename }}</strong>
              <span>{{ formatFileSize(file.size) }} · {{ file.uploaderName || text("", "Unknown") }}</span>
            </button>
          </div>
          <div v-else class="empty-state">{{ text("", "No group files yet.") }}</div>
        </section>

        <section v-if="selectedGroup?.canManage" class="inspector-card">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ text("", "Approval") }}</p>
              <h3>{{ text("", "Pending requests") }}</h3>
            </div>
          </div>
          <div v-if="selectedGroupRequests.length" class="request-list">
            <article v-for="request in selectedGroupRequests" :key="request.id" class="request-card">
              <strong>{{ request.username }}</strong>
              <span>{{ request.email }}</span>
              <small>{{ request.note || text("", "No note") }}</small>
              <div class="request-actions">
                <button type="button" class="secondary-button" @click="handleRejectRequest(request.id)">{{ text("", "Reject") }}</button>
                <button type="button" class="primary-button" @click="handleApproveRequest(request.id)">{{ text("", "Approve") }}</button>
              </div>
            </article>
          </div>
          <div v-else class="empty-state">{{ text("", "No pending requests for this group.") }}</div>
        </section>

        <section v-if="selectedGroup?.canManage || selectedGroup?.canInvite" class="inspector-card">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ text("", "24-hour key") }}</p>
              <h3>{{ text("", "Direct entry") }}</h3>
            </div>
          </div>
          <label v-if="authStore.userrole === 'admin'" class="switch-field">
            <input v-model="companyWideKeyMode" type="checkbox" />
            <span>{{ text("", "Company-wide key, user chooses group") }}</span>
          </label>
          <button type="button" class="primary-button" :disabled="creatingKey" @click="handleCreateKey">
            {{ creatingKey ? text("", "Generating...") : text("", "Generate key") }}
          </button>
          <div v-if="latestKey" class="key-card">
            <strong>{{ latestKey.token }}</strong>
            <span>{{ text("", "Expires at") }}: {{ formatDateTime(latestKey.expiresAt) }}</span>
          </div>
        </section>
      </div>
      </el-drawer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useLocalizedText } from "@/composables/useLocalizedText";
import { FRONTEND_ONLY_MODE } from "@/utils/frontendOnly";
import {
  approveCompanyAccessRequest,
  createCompanyAccessKey,
  listCompanyAccessRequests,
  rejectCompanyAccessRequest,
  type CompanyAccessKeyRecord,
  type CompanyAccessRequestRecord,
} from "@/api/auth";
import {
  createGroup,
  getGroupMessages,
  getGroupFiles,
  getGroups,
  sendGroupMessage,
  uploadGroupFile,
  updateGroup,
  type GroupFileRecord,
  type GroupMessageRecord,
  type GroupRecord,
} from "@/api/group";
import { notifyActionError, notifyActionSuccess } from "@/utils/actionFeedback";

defineOptions({
  name: "GroupsPage",
});

const authStore = useAuthStore();
const { text, roleLabel } = useLocalizedText();

const groups = ref<GroupRecord[]>([]);
const messages = ref<GroupMessageRecord[]>([]);
const groupFiles = ref<GroupFileRecord[]>([]);
const requests = ref<CompanyAccessRequestRecord[]>([]);
const latestKey = ref<CompanyAccessKeyRecord | null>(null);
const selectedGroupId = ref("");
const loadingGroups = ref(false);
const creatingGroup = ref(false);
const savingSettings = ref(false);
const sendingMessage = ref(false);
const uploadingFile = ref(false);
const creatingKey = ref(false);
const allowGroupChoice = ref(false);
const companyWideKeyMode = ref(false);
const settingsPanelOpen = ref(false);
const messageDraft = ref("");

const newGroupForm = reactive({
  name: "",
  description: "",
});

const settingsForm = reactive({
  name: "",
  description: "",
  membersCanInvite: false,
  minimumInviterRole: "manager" as "none" | "user" | "manager" | "admin",
  specificInviterIds: [] as string[],
});

const canManageGroups = computed(() => ["manager", "admin"].includes(String(authStore.userrole || "")));
const selectedGroup = computed(() => groups.value.find((group) => group.id === selectedGroupId.value) || null);
const selectedGroupRequests = computed(() => requests.value.filter((request) => request.targetGroupId === selectedGroupId.value));

const syncSettingsForm = (group: GroupRecord | null) => {
  settingsForm.name = group?.name || "";
  settingsForm.description = group?.description || "";
  settingsForm.membersCanInvite = Boolean(group?.invitePolicy.membersCanInvite);
  settingsForm.minimumInviterRole = group?.invitePolicy.minimumInviterRole || "manager";
  settingsForm.specificInviterIds = [...(group?.invitePolicy.specificInviterIds || [])];
};

const loadGroups = async () => {
  if (FRONTEND_ONLY_MODE) {
    loadingGroups.value = false;
    return;
  }
  loadingGroups.value = true;
  try {
    const response = await getGroups();
    groups.value = response.data.groups || [];
    if (!selectedGroupId.value && groups.value.length) {
      const primaryGroup = groups.value.find((group) => group.id === authStore.primaryGroupId);
      selectedGroupId.value = primaryGroup?.id || groups.value[0]?.id || "";
    }
    if (selectedGroup.value) {
      syncSettingsForm(selectedGroup.value);
    }
  } catch (error) {
    notifyActionError(error, text("", "Failed to load groups."), {
      title: text("", "Groups"),
    });
  } finally {
    loadingGroups.value = false;
  }
};

const loadMessages = async () => {
  if (!selectedGroupId.value || FRONTEND_ONLY_MODE) {
    messages.value = [];
    return;
  }

  try {
    const response = await getGroupMessages(selectedGroupId.value, { limit: 120 });
    messages.value = response.data.messages || [];
  } catch (error) {
    notifyActionError(error, text("", "Failed to load group messages."), {
      title: text("", "Groups"),
    });
  }
};

const loadFiles = async () => {
  if (!selectedGroupId.value || FRONTEND_ONLY_MODE) {
    groupFiles.value = [];
    return;
  }

  try {
    const response = await getGroupFiles(selectedGroupId.value);
    groupFiles.value = response.data.files || [];
  } catch (error) {
    notifyActionError(error, text("", "Failed to load group files."), {
      title: text("", "Groups"),
    });
  }
};

const loadRequests = async () => {
  if (!canManageGroups.value || FRONTEND_ONLY_MODE) {
    requests.value = [];
    return;
  }

  try {
    const response = await listCompanyAccessRequests({ status: "pending" });
    requests.value = response.data.requests || [];
  } catch (error) {
    notifyActionError(error, text("", "Failed to load company access requests."), {
      title: text("", "Groups"),
    });
  }
};

const handleReload = async () => {
  await Promise.all([loadGroups(), loadMessages(), loadFiles(), loadRequests()]);
};

const handleCreateGroup = async () => {
  if (!newGroupForm.name) {
    return;
  }

  creatingGroup.value = true;
  try {
    await createGroup({
      name: newGroupForm.name,
      description: newGroupForm.description || undefined,
    });
    newGroupForm.name = "";
    newGroupForm.description = "";
    notifyActionSuccess(text("", "Group created."), {
      title: text("", "Groups"),
    });
    await loadGroups();
  } catch (error) {
    notifyActionError(error, text("", "Failed to create the group."), {
      title: text("", "Groups"),
    });
  } finally {
    creatingGroup.value = false;
  }
};

const handleSaveGroupSettings = async () => {
  if (!selectedGroup.value) {
    return;
  }

  savingSettings.value = true;
  try {
    await updateGroup(selectedGroup.value.id, {
      name: settingsForm.name,
      description: settingsForm.description,
      invitePolicy: {
        membersCanInvite: settingsForm.membersCanInvite,
        minimumInviterRole: settingsForm.minimumInviterRole,
        specificInviterIds: settingsForm.specificInviterIds,
      },
    });
    notifyActionSuccess(text("", "Group settings updated."), {
      title: text("", "Groups"),
    });
    await loadGroups();
  } catch (error) {
    notifyActionError(error, text("", "Failed to update the group settings."), {
      title: text("", "Groups"),
    });
  } finally {
    savingSettings.value = false;
  }
};

const handleSendMessage = async () => {
  if (!selectedGroup.value || !messageDraft.value) {
    return;
  }

  sendingMessage.value = true;
  try {
    await sendGroupMessage(selectedGroup.value.id, {
      content: messageDraft.value,
    });
    messageDraft.value = "";
    await loadMessages();
  } catch (error) {
    notifyActionError(error, text("", "Failed to send the message."), {
      title: text("", "Groups"),
    });
  } finally {
    sendingMessage.value = false;
  }
};

const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || "");
    resolve(result.includes(",") ? result.split(",").pop() || "" : result);
  };
  reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
  reader.readAsDataURL(file);
});

const handleGroupFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!selectedGroup.value || !file) {
    return;
  }

  uploadingFile.value = true;
  try {
    const contentBase64 = await readFileAsBase64(file);
    await uploadGroupFile(selectedGroup.value.id, {
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      contentBase64,
    });
    notifyActionSuccess(text("", "Group file uploaded."), {
      title: text("", "Groups"),
    });
    await loadFiles();
  } catch (error) {
    notifyActionError(error, text("", "Failed to upload group file."), {
      title: text("", "Groups"),
    });
  } finally {
    uploadingFile.value = false;
  }
};

const downloadGroupFile = (file: GroupFileRecord) => {
  const byteCharacters = atob(file.contentBase64);
  const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0));
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: file.mimeType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
};

const handleApproveRequest = async (requestId: string) => {
  try {
    await approveCompanyAccessRequest(requestId);
    notifyActionSuccess(text("", "Request approved."), {
      title: text("", "Groups"),
    });
    await loadRequests();
    await loadGroups();
  } catch (error) {
    notifyActionError(error, text("", "Failed to approve the request."), {
      title: text("", "Groups"),
    });
  }
};

const handleRejectRequest = async (requestId: string) => {
  try {
    await rejectCompanyAccessRequest(requestId);
    notifyActionSuccess(text("", "Request rejected."), {
      title: text("", "Groups"),
    });
    await loadRequests();
  } catch (error) {
    notifyActionError(error, text("", "Failed to reject the request."), {
      title: text("", "Groups"),
    });
  }
};

const handleCreateKey = async () => {
  if (!selectedGroup.value) {
    return;
  }

  creatingKey.value = true;
  try {
    const response = await createCompanyAccessKey({
      targetGroupId: companyWideKeyMode.value ? undefined : selectedGroup.value.id,
      allowGroupChoice: companyWideKeyMode.value ? allowGroupChoice.value : false,
    });
    latestKey.value = response.data.key;
    notifyActionSuccess(text("", "24-hour key generated."), {
      title: text("", "Groups"),
    });
  } catch (error) {
    notifyActionError(error, text("", "Failed to generate the key."), {
      title: text("", "Groups"),
    });
  } finally {
    creatingKey.value = false;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return text("", "Not available");
  }

  return new Date(value).toLocaleString();
};

watch(selectedGroup, (group) => {
  if (!group) {
    settingsPanelOpen.value = false;
  }
  syncSettingsForm(group);
  void loadMessages();
  void loadFiles();
});

watch(companyWideKeyMode, (enabled) => {
  allowGroupChoice.value = enabled;
});

onMounted(() => {
  void handleReload();
});
</script>

<style scoped>
.groups-page {
  height: calc(100vh - 48px);
  min-height: 680px;
  overflow: hidden;
}

.chat-shell {
  height: 100%;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
}

.group-rail,
.chat-main,
.group-inspector {
  min-height: 0;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-card);
}

.group-rail,
.group-inspector {
  border-radius: 26px;
  padding: 16px;
  overflow-y: auto;
}

.group-rail,
.group-inspector,
.message-stream,
:deep(.group-settings-drawer .el-drawer__body) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.group-rail::-webkit-scrollbar,
.group-inspector::-webkit-scrollbar,
.message-stream::-webkit-scrollbar,
:deep(.group-settings-drawer .el-drawer__body::-webkit-scrollbar) {
  display: none;
}

.group-inspector--drawer {
  border: none;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  background: transparent;
  overflow: visible;
}

:deep(.group-settings-drawer .el-drawer__body) {
  padding: 16px;
  background: var(--surface-primary);
  overflow-y: auto;
}

.chat-main {
  border-radius: 30px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.rail-head,
.chat-head,
.panel-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.rail-head {
  margin-bottom: 14px;
}

.chat-head {
  padding: 20px 22px;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--surface-white), var(--surface-secondary));
}

.chat-head__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rail-head h1,
.chat-head h2,
.panel-head h3 {
  color: var(--text-primary);
  line-height: 1.08;
}

.rail-head h1 {
  font-size: 28px;
}

.chat-head h2 {
  font-size: clamp(28px, 4vw, 42px);
}

.create-group-card,
.inspector-card,
.empty-state,
.key-card,
.request-card,
.file-drop {
  border: 1px solid var(--border-light);
  border-radius: 20px;
  background: var(--surface-secondary);
}

.create-group-card,
.inspector-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  margin-bottom: 14px;
}

.group-list,
.request-list,
.form-grid,
.group-inspector {
  display: grid;
  gap: 10px;
}

.group-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.group-card:hover,
.group-card--active {
  border-color: var(--border-light);
  background: var(--surface-secondary);
}

.group-card--active {
  box-shadow: inset 3px 0 0 var(--accent-primary);
}

.group-avatar,
.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--text-primary);
  color: var(--surface-white);
  font-weight: 800;
}

.group-meta {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.group-meta strong,
.group-meta small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-meta small,
.message-meta,
.file-drop span,
.request-card span,
.request-card small {
  color: var(--text-secondary);
}

.message-stream {
  min-height: 0;
  overflow-y: auto;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background:
    radial-gradient(circle at top left, rgba(205, 196, 171, 0.18), transparent 34%),
    var(--surface-primary);
}

.message-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 78%;
}

.message-card--mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble {
  padding: 12px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  box-shadow: var(--shadow-soft);
}

.message-card--mine .message-bubble {
  border-color: rgba(35, 113, 196, 0.24);
  background: linear-gradient(135deg, rgba(35, 113, 196, 0.1), var(--surface-white));
  color: var(--text-primary);
}

.message-card--mine .message-meta,
.message-card--mine .message-bubble p {
  color: var(--text-primary);
}

.message-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: baseline;
  font-size: 12px;
  margin-bottom: 6px;
}

.message-bubble p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
}

.composer {
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  border-top: 1px solid var(--border-light);
  background: var(--surface-white);
}

input,
textarea,
select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  background: var(--surface-white);
  padding: 12px 14px;
  color: var(--text-primary);
}

textarea {
  resize: vertical;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.switch-field {
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
}

.primary-button,
.secondary-button,
.icon-button {
  border: 1px solid var(--border-light);
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  padding: 12px 18px;
  background: var(--text-primary);
  color: var(--surface-white);
}

.secondary-button {
  padding: 10px 14px;
  background: var(--surface-white);
  color: var(--text-primary);
}

.icon-button {
  width: 40px;
  height: 40px;
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.status-pill {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--surface-white);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  font-weight: 700;
}

.empty-state,
.key-card,
.request-card,
.file-drop {
  padding: 14px;
}

.empty-state--center {
  align-self: center;
  justify-self: center;
}

.key-card,
.request-card,
.file-drop {
  display: grid;
  gap: 8px;
}

.file-list {
  display: grid;
  gap: 8px;
}

.file-item {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background: var(--surface-white);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.file-item span {
  color: var(--text-secondary);
  font-size: 12px;
}

.key-card strong {
  word-break: break-all;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1180px) {
  .groups-page {
    height: auto;
  }

  .chat-shell {
    grid-template-columns: 280px minmax(0, 1fr);
  }
}

@media (max-width: 820px) {
  .chat-shell {
    grid-template-columns: 1fr;
  }

  .message-card {
    max-width: 94%;
  }

  .composer {
    grid-template-columns: 1fr;
  }
}
</style>
