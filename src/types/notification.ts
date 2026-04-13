export type NotificationScope = "active" | "archived" | "all";

export type NotificationLevel = "info" | "success" | "warning" | "error";

export type NotificationCategory =
  | "system"
  | "customer"
  | "followup"
  | "activity"
  | "opportunity"
  | "order"
  | "ai_analysis"
  | "security"
  | "custom";

export type NotificationRelatedModel =
  | "Customer"
  | "Contact"
  | "Opportunity"
  | "Order"
  | "Activity"
  | "Followup"
  | "AiResult"
  | "Company";

export interface NotificationActor {
  _id: string;
  username: string;
  email: string;
  userrole: string;
}

export interface NotificationRecord {
  id: string;
  recipientId: string | null;
  actorId: string | null;
  actor?: NotificationActor | null;
  companyId: string | null;
  category: NotificationCategory;
  eventKey?: string | null;
  level: NotificationLevel;
  title: string;
  message: string;
  channels: string[];
  actionLabel?: string | null;
  actionUrl?: string | null;
  relatedId?: string | null;
  relatedModel?: NotificationRelatedModel | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  read: boolean;
  readAt?: string | null;
  archived: boolean;
  archivedAt?: string | null;
  expiresAt?: string | null;
  isExpired: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NotificationListFilters {
  scope: NotificationScope;
  read: boolean | null;
  category: NotificationCategory | null;
  level: NotificationLevel | null;
  eventKey: string | null;
  relatedModel: NotificationRelatedModel | null;
  relatedId: string | null;
  includeExpired: boolean;
}

export interface NotificationListResponse {
  list: NotificationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  unreadCount: number;
  filters: NotificationListFilters;
}

export interface NotificationMarkReadResponse {
  notification: NotificationRecord;
  unreadCount: number;
}

export interface NotificationMarkAllReadResponse {
  updatedCount: number;
  unreadCount: number;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  scope?: NotificationScope;
  read?: boolean;
  category?: NotificationCategory;
  level?: NotificationLevel;
  eventKey?: string;
  relatedModel?: NotificationRelatedModel;
  relatedId?: string;
  includeExpired?: boolean;
}
