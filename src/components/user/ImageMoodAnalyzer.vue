<template>
  <section class="image-mood">
    <div class="image-mood__header">
      <div>
        <h2 class="image-mood__title">
          <el-icon><Picture /></el-icon>
          图片情绪分析
        </h2>
        <p class="image-mood__subtitle">
          上传人物照片或填写图片地址，系统会调用当前工作区配置的 AI 进行情绪识别。
        </p>
      </div>
      <el-button @click="loadHistory">
        <el-icon><Refresh /></el-icon>
        刷新历史
      </el-button>
    </div>

    <div class="image-mood__tools">
      <el-upload
        class="image-mood__upload"
        drag
        :show-file-list="false"
        :auto-upload="false"
        accept="image/jpeg,image/png,image/gif,image/webp"
        :before-upload="handleBeforeUpload"
      >
        <el-icon class="image-mood__upload-icon"><UploadFilled /></el-icon>
        <div class="image-mood__upload-text">拖拽图片到这里，或点击选择本地图片</div>
        <div class="image-mood__upload-hint">支持 JPG、PNG、GIF、WebP，大小不超过 5MB</div>
      </el-upload>

      <el-input
        v-model="imageUrl"
        placeholder="也可以输入远程图片 URL"
        clearable
        @keyup.enter="analyzeRemoteImage"
      >
        <template #append>
          <el-button :loading="analyzing" @click="analyzeRemoteImage">
            <el-icon><MagicStick /></el-icon>
            分析
          </el-button>
        </template>
      </el-input>
    </div>

    <div v-if="previewImage" class="image-mood__workspace">
      <div class="image-mood__preview">
        <el-image
          :src="previewImage"
          fit="contain"
          :preview-src-list="[previewImage]"
          class="image-mood__preview-image"
        />
      </div>

      <div class="image-mood__result">
        <div v-if="analyzing" class="image-mood__loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>正在分析图片，请稍候…</p>
        </div>

        <div v-else-if="analysis" class="result-card">
          <div class="result-card__top">
            <div>
              <small>识别情绪</small>
              <h3>
                {{ getMoodIcon(analysis.mood) }}
                {{ getMoodLabel(analysis.mood) }}
              </h3>
            </div>
            <el-tag :type="resultTagType">
              置信度 {{ Math.round(analysis.confidence * 100) }}%
            </el-tag>
          </div>

          <el-progress
            :percentage="Math.round(analysis.confidence * 100)"
            :stroke-width="10"
            :show-text="false"
            :color="progressColor"
          />

          <div class="result-card__section">
            <span>分析说明</span>
            <p>{{ analysis.analysis }}</p>
          </div>

          <div v-if="analysis.detectedFeatures.length" class="result-card__section">
            <span>识别特征</span>
            <div class="result-card__tags">
              <el-tag
                v-for="feature in analysis.detectedFeatures"
                :key="feature"
                size="small"
                type="info"
              >
                {{ feature }}
              </el-tag>
            </div>
          </div>

          <div class="result-card__meta">
            <span>模型：{{ analysis.providerLabel || analysis.provider }} / {{ analysis.model }}</span>
            <span>{{ formatTime(analysis.analyzedAt) }}</span>
          </div>

          <div class="result-card__actions">
            <el-button type="primary" @click="handleSavedNotice">
              <el-icon><Check /></el-icon>
              已保存到用户档案
            </el-button>
            <el-button @click="resetState">
              <el-icon><Refresh /></el-icon>
              重新分析
            </el-button>
          </div>
        </div>

        <el-empty v-else description="选择图片后即可开始分析" />
      </div>
    </div>

    <section v-if="history.length" class="image-mood__history">
      <div class="history-header">
        <h3>最近分析记录</h3>
        <span>{{ history.length }} 条</span>
      </div>
      <div class="history-list">
        <article
          v-for="item in history"
          :key="item._id"
          class="history-item"
        >
          <el-image
            :src="String(item.fieldValue)"
            fit="cover"
            class="history-item__image"
          />
          <div class="history-item__content">
            <div class="history-item__headline">
              <strong>
                {{ getMoodIcon(resolveHistoryMood(item)) }}
                {{ getMoodLabel(resolveHistoryMood(item)) }}
              </strong>
              <span>{{ formatTime(item.timestamp) }}</span>
            </div>
            <p>{{ resolveHistoryAnalysis(item) }}</p>
            <div class="history-item__meta">
              <span v-if="resolveHistoryConfidence(item) !== null">
                置信度 {{ Math.round((resolveHistoryConfidence(item) || 0) * 100) }}%
              </span>
              <span>{{ resolveHistoryProvider(item) }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { UploadRawFile } from "element-plus";
import { ElMessage } from "element-plus";
import {
  Check,
  Loading,
  MagicStick,
  Picture,
  Refresh,
  UploadFilled,
} from "@element-plus/icons-vue";
import {
  analyzeImage,
  getMoodIcon,
  getMoodLabel,
  listFields,
  type ImageAnalysisResult,
  type MoodValue,
  type UserCustomField,
} from "@/api/userCustomField";

interface Props {
  targetUserId: string;
}

const props = defineProps<Props>();

const imageUrl = ref("");
const previewImage = ref("");
const analyzing = ref(false);
const analysis = ref<ImageAnalysisResult | null>(null);
const history = ref<UserCustomField[]>([]);

const progressColor = computed(() => {
  const confidence = analysis.value?.confidence || 0;
  if (confidence >= 0.8) {
    return "#0f766e";
  }
  if (confidence >= 0.6) {
    return "#2563eb";
  }
  if (confidence >= 0.4) {
    return "#d97706";
  }
  return "#dc2626";
});

const resultTagType = computed(() => {
  const mood = analysis.value?.mood;
  if (!mood) {
    return "";
  }

  if (["very_happy", "happy", "excited"].includes(mood)) {
    return "success";
  }
  if (["neutral", "calm"].includes(mood)) {
    return "info";
  }
  if (["sad", "tired", "anxious"].includes(mood)) {
    return "warning";
  }
  return "danger";
});

const toDataUrl = (file: UploadRawFile | File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });

const handleBeforeUpload = async (file: UploadRawFile) => {
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!supportedTypes.includes(file.type)) {
    ElMessage.error("仅支持 JPG、PNG、GIF、WebP 图片");
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过 5MB");
    return false;
  }

  try {
    const dataUrl = await toDataUrl(file);
    previewImage.value = dataUrl;
    await runAnalysis(dataUrl);
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "图片处理失败");
  }

  return false;
};

const runAnalysis = async (payload: string) => {
  if (!props.targetUserId) {
    ElMessage.warning("请先选择用户");
    return;
  }

  analyzing.value = true;
  analysis.value = null;

  try {
    const data = await analyzeImage({
      targetUserId: props.targetUserId,
      imageUrl: payload,
      fieldName: "图片情绪分析",
    });
    analysis.value = data.analysis;
    ElMessage.success("图片情绪分析完成");
    await loadHistory();
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "图片情绪分析失败");
  } finally {
    analyzing.value = false;
  }
};

const analyzeRemoteImage = async () => {
  const value = imageUrl.value.trim();
  if (!value) {
    ElMessage.warning("请输入图片 URL");
    return;
  }

  previewImage.value = value;
  await runAnalysis(value);
};

const loadHistory = async () => {
  if (!props.targetUserId) {
    return;
  }

  try {
    const data = await listFields({
      targetUserId: props.targetUserId,
      fieldType: "image",
      limit: 10,
    });
    history.value = data.fields.filter(
      (field) => field.metadata?.analysisType === "image_mood",
    );
  } catch {
    history.value = [];
  }
};

const handleSavedNotice = () => {
  ElMessage.success("分析结果已同步保存到用户档案");
};

const resetState = () => {
  imageUrl.value = "";
  previewImage.value = "";
  analysis.value = null;
};

const resolveHistoryMood = (field: UserCustomField): MoodValue => {
  const mood = field.metadata?.analysis
    && typeof field.metadata.analysis === "object"
    && "mood" in field.metadata.analysis
    ? String((field.metadata.analysis as Record<string, unknown>).mood)
    : "neutral";
  return mood as MoodValue;
};

const resolveHistoryAnalysis = (field: UserCustomField) => {
  const payload = field.metadata?.analysis as Record<string, unknown> | undefined;
  return typeof payload?.analysis === "string" ? payload.analysis : "无分析说明";
};

const resolveHistoryConfidence = (field: UserCustomField) => {
  const payload = field.metadata?.analysis as Record<string, unknown> | undefined;
  const value = Number(payload?.confidence);
  return Number.isFinite(value) ? value : null;
};

const resolveHistoryProvider = (field: UserCustomField) => {
  const payload = field.metadata?.analysis as Record<string, unknown> | undefined;
  const providerLabel = typeof payload?.providerLabel === "string" ? payload.providerLabel : "";
  const provider = typeof payload?.provider === "string" ? payload.provider : "";
  const model = typeof payload?.model === "string" ? payload.model : "";
  return [providerLabel || provider, model].filter(Boolean).join(" / ") || "未记录模型";
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.image-mood {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-mood__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.image-mood__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
}

.image-mood__subtitle {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.image-mood__tools {
  display: grid;
  gap: 16px;
}

.image-mood__upload :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: 18px;
  padding: 28px 18px;
  background: var(--surface-primary);
}

.image-mood__upload-icon {
  font-size: 42px;
  color: var(--text-tertiary);
}

.image-mood__upload-text {
  margin-top: 10px;
  color: var(--text-secondary);
}

.image-mood__upload-hint {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.image-mood__workspace {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
  gap: 18px;
}

.image-mood__preview,
.image-mood__result,
.image-mood__history {
  background: var(--surface-primary);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 18px;
}

.image-mood__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.image-mood__preview-image {
  width: 100%;
  max-height: 420px;
  border-radius: 14px;
}

.image-mood__loading {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-secondary);
}

.image-mood__loading .el-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.result-card__top small,
.result-card__section span,
.result-card__meta {
  color: var(--text-tertiary);
  font-size: 12px;
}

.result-card__top h3 {
  margin: 4px 0 0;
  font-size: 26px;
}

.result-card__section p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.result-card__tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.result-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
}

.history-header span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: var(--surface-white);
}

.history-item__image {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  flex-shrink: 0;
}

.history-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item__headline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.history-item__headline strong {
  color: var(--color-heading);
}

.history-item__headline span,
.history-item__meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

.history-item__content p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.history-item__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .image-mood__header,
  .result-card__top {
    flex-direction: column;
  }

  .image-mood__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
