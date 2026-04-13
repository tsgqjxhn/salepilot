import request from "@/utils/request";
import { unwrapApiResponseData, type ApiEnvelope } from "@/utils/requestError";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "image"
  | "mood"
  | "rating"
  | "tags"
  | "json"
  | "ai_analysis";

export type MoodValue =
  | "very_happy"
  | "happy"
  | "neutral"
  | "sad"
  | "very_sad"
  | "angry"
  | "anxious"
  | "excited"
  | "calm"
  | "tired";

export const MOOD_LABELS: Record<MoodValue, string> = {
  very_happy: "非常开心",
  happy: "开心",
  neutral: "中性",
  sad: "难过",
  very_sad: "非常难过",
  angry: "生气",
  anxious: "焦虑",
  excited: "兴奋",
  calm: "平静",
  tired: "疲惫",
};

export const MOOD_ICONS: Record<MoodValue, string> = {
  very_happy: "😄",
  happy: "🙂",
  neutral: "😐",
  sad: "😔",
  very_sad: "😢",
  angry: "😠",
  anxious: "😟",
  excited: "🤩",
  calm: "😌",
  tired: "😴",
};

export const MOOD_SCORES: Record<MoodValue, number> = {
  very_happy: 5,
  happy: 4,
  excited: 4,
  calm: 3,
  neutral: 3,
  tired: 2,
  sad: 2,
  anxious: 2,
  angry: 1,
  very_sad: 1,
};

export interface FieldCreatorSummary {
  _id: string;
  username: string;
  email: string;
}

export interface UserCustomField {
  _id: string;
  companyId: string;
  targetUserId: string;
  createdByUserId: FieldCreatorSummary | null;
  fieldType: FieldType;
  fieldName: string;
  fieldValue: unknown;
  metadata: Record<string, unknown>;
  timestamp: string;
  isVisible: boolean;
  tags: string[];
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCustomFieldListParams {
  targetUserId: string;
  fieldType?: FieldType;
  keyword?: string;
  isVisible?: boolean;
  tags?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateFieldPayload {
  targetUserId: string;
  fieldType: FieldType;
  fieldName: string;
  fieldValue?: unknown;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  isVisible?: boolean;
  tags?: string[];
  description?: string;
  sortOrder?: number;
}

export interface UpdateFieldPayload {
  fieldType?: FieldType;
  fieldName?: string;
  fieldValue?: unknown;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  isVisible?: boolean;
  tags?: string[];
  description?: string;
  sortOrder?: number;
}

export interface BatchCreateFieldsPayload {
  fields: CreateFieldPayload[];
}

export interface ImageAnalysisResult {
  mood: MoodValue;
  confidence: number;
  analysis: string;
  detectedFeatures: string[];
  provider: string;
  providerLabel: string;
  model: string;
  analyzedAt: string;
}

export interface AnalyzeImagePayload {
  targetUserId: string;
  imageUrl: string;
  fieldName?: string;
  provider?: string;
}

export interface AnalyzeImageResponse {
  imageField: UserCustomField;
  moodField: UserCustomField;
  analysis: ImageAnalysisResult;
}

export interface MoodHistoryStatistics {
  totalRecords: number;
  moodCounts: Record<MoodValue, number>;
  averageScore: number | null;
  dominantMood: MoodValue | null;
}

export interface MoodHistoryPoint {
  mood: MoodValue;
  moodLabel: string;
  moodIcon: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface MoodHistoryResponse {
  targetUserId: string;
  days: number;
  startDate: string;
  endDate: string;
  moodFields: UserCustomField[];
  moodByDate: Record<string, MoodHistoryPoint[]>;
  statistics: MoodHistoryStatistics;
}

export interface UserCustomFieldListResponse {
  fields: UserCustomField[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  targetUser?: {
    _id: string;
    username: string;
    email: string;
  };
}

const unwrap = async <T>(
  promise: Promise<{ data?: ApiEnvelope<T> | null | undefined }>,
  fallback: string,
  successCodes?: number[],
): Promise<T> => {
  const response = await promise;
  return unwrapApiResponseData(response, fallback, successCodes ? { successCodes } : undefined);
};

export const listFields = (params: UserCustomFieldListParams): Promise<UserCustomFieldListResponse> =>
  unwrap(
    request<ApiEnvelope<UserCustomFieldListResponse>>({
      url: "/user-custom-fields",
      method: "get",
      params,
    }),
    "加载用户字段失败",
  );

export const getField = (id: string): Promise<UserCustomField> =>
  unwrap(
    request<ApiEnvelope<UserCustomField>>({
      url: `/user-custom-fields/${id}`,
      method: "get",
    }),
    "加载字段详情失败",
  );

export const createField = (payload: CreateFieldPayload): Promise<UserCustomField> =>
  unwrap(
    request<ApiEnvelope<UserCustomField>>({
      url: "/user-custom-fields",
      method: "post",
      data: payload,
    }),
    "创建字段失败",
    [200, 201],
  );

export const updateField = (id: string, payload: UpdateFieldPayload): Promise<UserCustomField> =>
  unwrap(
    request<ApiEnvelope<UserCustomField>>({
      url: `/user-custom-fields/${id}`,
      method: "patch",
      data: payload,
    }),
    "更新字段失败",
  );

export const deleteField = (id: string): Promise<{ id: string }> =>
  unwrap(
    request<ApiEnvelope<{ id: string }>>({
      url: `/user-custom-fields/${id}`,
      method: "delete",
    }),
    "删除字段失败",
  );

export const batchCreateFields = (
  payload: BatchCreateFieldsPayload,
): Promise<{
  createdFields: UserCustomField[];
  errors: Array<{ index: number; message: string }>;
}> =>
  unwrap(
    request<ApiEnvelope<{
      createdFields: UserCustomField[];
      errors: Array<{ index: number; message: string }>;
    }>>({
      url: "/user-custom-fields/batch",
      method: "post",
      data: payload,
    }),
    "批量创建字段失败",
    [200, 201],
  );

export const batchDeleteFields = (fieldIds: string[]): Promise<{ deletedCount: number }> =>
  unwrap(
    request<ApiEnvelope<{ deletedCount: number }>>({
      url: "/user-custom-fields/batch",
      method: "delete",
      data: { fieldIds },
    }),
    "批量删除字段失败",
  );

export const analyzeImage = (payload: AnalyzeImagePayload): Promise<AnalyzeImageResponse> =>
  unwrap(
    request<ApiEnvelope<AnalyzeImageResponse>>({
      url: "/user-custom-fields/analyze-image",
      method: "post",
      data: payload,
    }),
    "图片情绪分析失败",
    [200, 201],
  );

export const getMoodHistory = (targetUserId: string, days = 7): Promise<MoodHistoryResponse> =>
  unwrap(
    request<ApiEnvelope<MoodHistoryResponse>>({
      url: `/user-custom-fields/${targetUserId}/mood-history`,
      method: "get",
      params: { days },
    }),
    "加载情绪历史失败",
  );

export const getMoodLabel = (mood: MoodValue): string => MOOD_LABELS[mood] || mood;
export const getMoodIcon = (mood: MoodValue): string => MOOD_ICONS[mood] || "❓";
export const getMoodScore = (mood: MoodValue): number => MOOD_SCORES[mood] || 0;
