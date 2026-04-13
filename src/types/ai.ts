export type SseEventType = "start" | "chunk" | "done" | "error";

export type AiResultType = "deal_prediction" | "churn_warning";

export type AiLevel = "high" | "medium" | "low" | "unknown";

export type AiEvidenceImpact = "positive" | "negative" | "neutral";

export interface AiEvidenceItem {
  signal?: string;
  impact?: AiEvidenceImpact;
  reason?: string;
}

export interface AiResultRecord {
  id: string;
  customerId: string;
  type: AiResultType;
  score: number;
  level: AiLevel;
  positives: string[];
  risks: string[];
  suggestion: string;
  modelUsed: string;
  createdAt: string;
  summary?: string;
  confidence?: number;
  missingData?: string[];
  evidence?: AiEvidenceItem[];
}

export interface AiDisplayMetaItem {
  label: string;
  value: string;
}

export interface AiAnalysisMetadata {
  templateId?: string;
  templateVersion?: string;
  provider?: string | null;
  providerLabel?: string | null;
  modelUsed?: string;
  cached?: boolean;
  cachedAt?: string | null;
  cacheExpiresAt?: string | null;
  cacheTtlHours?: number;
  generatedAt?: string;
}

export interface CustomerAiAnalysisResponse {
  analysisType: AiResultType;
  result: AiResultRecord;
  metadata?: AiAnalysisMetadata;
  contextSummary?: Record<string, unknown> | null;
}

export interface TriggerCustomerAiAnalysisPayload {
  analysisType: AiResultType;
  includePromptTemplate?: boolean;
  useCache?: boolean;
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export type SsePayload =
  | { type: "start"; message: string; cached?: boolean }
  | { type: "chunk"; content: string }
  | { type: "done"; totalTokens?: number; cached?: boolean }
  | { type: "error"; code: string; message: string };

export interface UseSSEStartOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  timeoutMs?: number;
  preserveContent?: boolean;
  loadingLabel?: string;
  loadingBlocking?: boolean;
  onMessage?: (payload: SsePayload) => void;
}
