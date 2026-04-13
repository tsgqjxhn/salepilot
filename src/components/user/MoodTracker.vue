<template>
  <section class="mood-tracker">
    <div class="mood-tracker__header">
      <div>
        <h2 class="mood-tracker__title">
          <el-icon><Sunny /></el-icon>
          情绪追踪
        </h2>
        <p class="mood-tracker__subtitle">记录近几天的主观情绪变化，辅助判断用户状态。</p>
      </div>
      <div class="mood-tracker__actions">
        <el-radio-group v-model="days" size="small" @change="loadMoodHistory">
          <el-radio-button :label="7">7 天</el-radio-button>
          <el-radio-button :label="14">14 天</el-radio-button>
          <el-radio-button :label="30">30 天</el-radio-button>
        </el-radio-group>
        <el-button @click="loadMoodHistory">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openRecordDialog">
          <el-icon><EditPen /></el-icon>
          记录情绪
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="mood-tracker__loading">
      <el-skeleton animated :rows="4" />
    </div>

    <template v-else>
      <div class="mood-tracker__stats">
        <article class="stat-card">
          <span class="stat-card__label">记录总数</span>
          <strong class="stat-card__value">{{ moodHistory.statistics.totalRecords }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">平均情绪分</span>
          <strong class="stat-card__value">
            {{ moodHistory.statistics.averageScore !== null ? moodHistory.statistics.averageScore.toFixed(1) : "--" }}
            <small>/ 5</small>
          </strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">主导情绪</span>
          <strong class="stat-card__value">
            <template v-if="moodHistory.statistics.dominantMood">
              {{ getMoodIcon(moodHistory.statistics.dominantMood) }}
              {{ getMoodLabel(moodHistory.statistics.dominantMood) }}
            </template>
            <template v-else>--</template>
          </strong>
        </article>
      </div>

      <el-empty
        v-if="!moodHistory.moodFields.length"
        description="暂无情绪记录"
        class="mood-tracker__empty"
      >
        <el-button type="primary" @click="openRecordDialog">新增第一条记录</el-button>
      </el-empty>

      <template v-else>
        <section class="mood-tracker__panel">
          <div class="panel-header">
            <h3>情绪趋势</h3>
            <span>近 {{ days }} 天</span>
          </div>
          <div class="mood-chart">
            <div
              v-for="item in chartData"
              :key="item.date"
              class="mood-chart__item"
            >
              <div class="mood-chart__bar-shell">
                <div
                  class="mood-chart__bar"
                  :class="getMoodBarClass(item.mood)"
                  :style="{ height: `${Math.max(16, item.score * 20)}%` }"
                >
                  <span>{{ item.icon }}</span>
                </div>
              </div>
              <span class="mood-chart__date">{{ item.dateLabel }}</span>
            </div>
          </div>
        </section>

        <section class="mood-tracker__panel">
          <div class="panel-header">
            <h3>情绪分布</h3>
            <span>{{ moodHistory.statistics.totalRecords }} 条</span>
          </div>
          <div class="mood-grid">
            <article
              v-for="option in moodOptions"
              :key="option.value"
              class="mood-grid__item"
              :class="{ 'mood-grid__item--active': moodHistory.statistics.moodCounts[option.value] > 0 }"
            >
              <span class="mood-grid__icon">{{ option.icon }}</span>
              <span class="mood-grid__label">{{ option.label }}</span>
              <strong>{{ moodHistory.statistics.moodCounts[option.value] || 0 }}</strong>
            </article>
          </div>
        </section>

        <section class="mood-tracker__panel">
          <div class="panel-header">
            <h3>最近记录</h3>
            <span>{{ recentMoods.length }} 条</span>
          </div>
          <div class="timeline">
            <article
              v-for="field in recentMoods"
              :key="field._id"
              class="timeline__item"
            >
              <div class="timeline__icon">
                {{ getMoodIcon(field.fieldValue as MoodValue) }}
              </div>
              <div class="timeline__content">
                <div class="timeline__topline">
                  <strong>{{ getMoodLabel(field.fieldValue as MoodValue) }}</strong>
                  <span>{{ formatTime(field.timestamp) }}</span>
                </div>
                <p v-if="field.description" class="timeline__desc">{{ field.description }}</p>
                <span v-if="field.createdByUserId" class="timeline__meta">
                  记录者：{{ field.createdByUserId.username }}
                </span>
              </div>
            </article>
          </div>
        </section>
      </template>
    </template>

    <el-dialog
      v-model="recordDialogVisible"
      title="记录情绪"
      width="520px"
      @closed="resetRecordDialog"
    >
      <el-form
        ref="formRef"
        :model="recordForm"
        :rules="recordFormRules"
        label-position="top"
      >
        <el-form-item label="情绪状态" prop="fieldValue">
          <div class="mood-option-list">
            <button
              v-for="option in moodOptions"
              :key="option.value"
              class="mood-option"
              :class="{ 'mood-option--selected': recordForm.fieldValue === option.value }"
              type="button"
              @click="recordForm.fieldValue = option.value"
            >
              <span>{{ option.icon }}</span>
              <small>{{ option.label }}</small>
            </button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="recordForm.description"
            type="textarea"
            :rows="3"
            placeholder="补充当天的状态、事件或观察"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="recordForm.tagsText"
            placeholder="用逗号分隔多个标签，例如：晨会, 紧张, 客诉"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRecord">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { EditPen, Refresh, Sunny } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  createField,
  getMoodHistory,
  getMoodIcon,
  getMoodLabel,
  MOOD_ICONS,
  MOOD_LABELS,
  MOOD_SCORES,
  type MoodHistoryResponse,
  type MoodValue,
  type UserCustomField,
} from "@/api/userCustomField";

interface Props {
  targetUserId: string;
}

const props = defineProps<Props>();

const emptyMoodCounts = (): Record<MoodValue, number> => ({
  very_happy: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  very_sad: 0,
  angry: 0,
  anxious: 0,
  excited: 0,
  calm: 0,
  tired: 0,
});

const createEmptyMoodHistory = (): MoodHistoryResponse => ({
  targetUserId: "",
  days: 7,
  startDate: "",
  endDate: "",
  moodFields: [],
  moodByDate: {},
  statistics: {
    totalRecords: 0,
    moodCounts: emptyMoodCounts(),
    averageScore: null,
    dominantMood: null,
  },
});

const loading = ref(false);
const submitting = ref(false);
const days = ref(7);
const recordDialogVisible = ref(false);
const formRef = ref<FormInstance>();
const moodHistory = reactive<MoodHistoryResponse>(createEmptyMoodHistory());

const recordForm = reactive<{
  fieldValue: MoodValue | "";
  description: string;
  tagsText: string;
}>({
  fieldValue: "",
  description: "",
  tagsText: "",
});

const recordFormRules: FormRules = {
  fieldValue: [{ required: true, message: "请选择情绪状态", trigger: "change" }],
};

const moodOptions: Array<{ value: MoodValue; label: string; icon: string }> = (
  Object.keys(MOOD_LABELS) as MoodValue[]
).map((mood) => ({
  value: mood,
  label: MOOD_LABELS[mood],
  icon: MOOD_ICONS[mood],
}));

const chartData = computed(() =>
  Object.entries(moodHistory.moodByDate)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, moods]) => {
      const totalScore = moods.reduce((sum, item) => sum + (MOOD_SCORES[item.mood] || 3), 0);
      const dominantMood = (moods
        .map((item) => item.mood)
        .sort((left, right) => {
          const leftCount = moods.filter((item) => item.mood === left).length;
          const rightCount = moods.filter((item) => item.mood === right).length;
          return rightCount - leftCount;
        })[0] || "neutral") as MoodValue;
      const dateObj = new Date(date);

      return {
        date,
        dateLabel: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        score: moods.length ? totalScore / moods.length : 0,
        mood: dominantMood,
        icon: getMoodIcon(dominantMood),
      };
    }),
);

const recentMoods = computed<UserCustomField[]>(() =>
  [...moodHistory.moodFields].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 8),
);

const getMoodBarClass = (mood: MoodValue) => {
  if (["very_happy", "happy", "excited"].includes(mood)) {
    return "mood-chart__bar--good";
  }
  if (["neutral", "calm"].includes(mood)) {
    return "mood-chart__bar--neutral";
  }
  if (["tired", "sad", "anxious"].includes(mood)) {
    return "mood-chart__bar--warning";
  }
  return "mood-chart__bar--danger";
};

const loadMoodHistory = async () => {
  if (!props.targetUserId) {
    return;
  }

  loading.value = true;
  try {
    const data = await getMoodHistory(props.targetUserId, days.value);
    Object.assign(moodHistory, data);
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "加载情绪历史失败");
  } finally {
    loading.value = false;
  }
};

const openRecordDialog = () => {
  recordDialogVisible.value = true;
};

const resetRecordDialog = () => {
  recordForm.fieldValue = "";
  recordForm.description = "";
  recordForm.tagsText = "";
  formRef.value?.clearValidate();
};

const submitRecord = async () => {
  if (!formRef.value) {
    return;
  }

  await formRef.value.validate();

  submitting.value = true;
  try {
    await createField({
      targetUserId: props.targetUserId,
      fieldType: "mood",
      fieldName: "情绪记录",
      fieldValue: recordForm.fieldValue,
      description: recordForm.description.trim() || undefined,
      tags: recordForm.tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isVisible: true,
    });

    ElMessage.success("情绪记录已保存");
    recordDialogVisible.value = false;
    resetRecordDialog();
    await loadMoodHistory();
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || "保存情绪记录失败");
  } finally {
    submitting.value = false;
  }
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

onMounted(() => {
  loadMoodHistory();
});
</script>

<style scoped>
.mood-tracker {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mood-tracker__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.mood-tracker__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  color: var(--color-heading);
}

.mood-tracker__subtitle {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.mood-tracker__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mood-tracker__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.stat-card,
.mood-tracker__panel {
  background: var(--surface-primary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 18px;
}

.stat-card__label {
  display: block;
  color: var(--text-tertiary);
  font-size: 13px;
}

.stat-card__value {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  color: var(--color-heading);
}

.stat-card__value small {
  font-size: 14px;
  color: var(--text-tertiary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-heading);
}

.panel-header span {
  color: var(--text-tertiary);
  font-size: 13px;
}

.mood-chart {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  gap: 10px;
  align-items: end;
}

.mood-chart__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mood-chart__bar-shell {
  width: 100%;
  min-height: 156px;
  display: flex;
  align-items: end;
  padding: 8px;
  border-radius: 14px;
  background: var(--surface-tertiary);
}

.mood-chart__bar {
  width: 100%;
  min-height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
}

.mood-chart__bar--good {
  background: linear-gradient(180deg, #0ea5a4, #0f766e);
}

.mood-chart__bar--neutral {
  background: linear-gradient(180deg, #64748b, #475569);
}

.mood-chart__bar--warning {
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

.mood-chart__bar--danger {
  background: linear-gradient(180deg, #ef4444, #b91c1c);
}

.mood-chart__date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.mood-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: 12px;
  background: var(--surface-tertiary);
  opacity: 0.6;
}

.mood-grid__item--active {
  opacity: 1;
  background: var(--surface-white);
}

.mood-grid__icon {
  font-size: 28px;
}

.mood-grid__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline__item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-white);
}

.timeline__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-tertiary);
  font-size: 20px;
  flex-shrink: 0;
}

.timeline__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline__topline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.timeline__topline strong {
  color: var(--color-heading);
}

.timeline__topline span,
.timeline__meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

.timeline__desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.mood-option-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 10px;
}

.mood-option {
  border: 1px solid var(--color-border);
  background: var(--surface-primary);
  border-radius: 14px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  cursor: pointer;
}

.mood-option--selected {
  border-color: var(--accent-primary);
  background: var(--accent-soft);
}

.mood-option span {
  font-size: 24px;
}

.mood-option small {
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .mood-tracker__header {
    flex-direction: column;
  }

  .mood-tracker__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
