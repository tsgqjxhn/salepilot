export interface DailyReportQueryParams {
  date?: string;
  timezone?: string;
  provider?: string;
  model?: string;
}

export interface DailyReportGenerationPayload extends DailyReportQueryParams {
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
}

export interface DailyReportWindow {
  reportDate: string;
  timeZone: string;
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
}

export interface DailyReportActor {
  userId: string;
  username: string;
  email?: string;
  userrole?: string;
}

export interface DailyReportWorkspace {
  companyId: string;
  companyName: string;
  plan?: string;
}

export interface DailyReportMetrics {
  newCustomers: number;
  updatedCustomers: number;
  activitiesToday: number;
  completedActivities: number;
  scheduledFollowups: number;
  completedFollowups: number;
  overdueFollowups: number;
  opportunitiesTouched: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  ordersCreated: number;
  orderAmount: number;
  orderAmountLabel: string;
  notificationsToday: number;
  criticalNotifications: number;
}

export interface DailyReportGeneratedMetrics {
  newCustomers: number;
  updatedCustomers: number;
  activitiesToday: number;
  completedActivities: number;
  scheduledFollowups: number;
  completedFollowups: number;
  overdueFollowups: number;
  opportunitiesTouched: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  ordersCreated: number;
  orderAmount: number;
}

export type DailyReportBreakdownMap = Record<string, number>;

export interface DailyReportBreakdowns {
  activityByType: DailyReportBreakdownMap;
  activityByStatus: DailyReportBreakdownMap;
  followupsByStatus: DailyReportBreakdownMap;
  opportunitiesByStage: DailyReportBreakdownMap;
  notificationsByLevel: DailyReportBreakdownMap;
}

export interface DailyReportLinkedCustomer {
  _id: string;
  name: string;
  status: string;
  level: string;
}

export interface DailyReportCustomerRecord {
  _id: string;
  name: string;
  status: string;
  level: string;
  source: string;
  aiScore: number | null;
  lastContactDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DailyReportActivityRecord {
  _id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  startTime: string | null;
  endTime: string | null;
  customer: DailyReportLinkedCustomer | null;
  result: string;
  nextStep: string;
}

export interface DailyReportFollowupRecord {
  _id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  channel: string;
  scheduledAt: string | null;
  completedAt: string | null;
  customer: DailyReportLinkedCustomer | null;
  contactName: string;
  outcome: string;
  nextStep: string;
}

export interface DailyReportOpportunityRecord {
  _id: string;
  name: string;
  stage: string;
  priority: string;
  customer: DailyReportLinkedCustomer | null;
  estimatedAmount: number;
  estimatedAmountLabel: string;
  expectedCloseDate: string | null;
  nextStep: string;
  remark: string;
  updatedAt: string | null;
}

export interface DailyReportOrderRecord {
  _id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  customer: DailyReportLinkedCustomer | null;
  totalAmount: number;
  totalAmountLabel: string;
  orderDate: string | null;
  completedDate: string | null;
  remark: string;
}

export interface DailyReportNotificationRecord {
  _id: string;
  category: string;
  level: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  createdAt: string | null;
}

export interface DailyReportDailyRecords {
  newCustomers: DailyReportCustomerRecord[];
  updatedCustomers: DailyReportCustomerRecord[];
  activitiesToday: DailyReportActivityRecord[];
  completedFollowups: DailyReportFollowupRecord[];
  scheduledFollowups: DailyReportFollowupRecord[];
  overdueFollowups: DailyReportFollowupRecord[];
  opportunitiesToday: DailyReportOpportunityRecord[];
  ordersToday: DailyReportOrderRecord[];
  notificationsToday: DailyReportNotificationRecord[];
}

export interface DailyReportContextHighlights {
  positives: string[];
  risks: string[];
}

export interface DailyReportContextSummary {
  reportDate: string;
  timeZone: string;
  user: {
    userId: string;
    username: string;
  };
  company: {
    companyId: string;
    companyName: string;
  };
  metrics: DailyReportMetrics;
  highlights: DailyReportContextHighlights;
  missingData: string[];
  confidence: number;
}

export interface DailyReportAggregateResult {
  reportWindow: DailyReportWindow;
  actor: DailyReportActor;
  workspace: DailyReportWorkspace;
  metrics: DailyReportMetrics;
  breakdowns: DailyReportBreakdowns;
  dailyRecords: DailyReportDailyRecords;
  contextSummary: DailyReportContextSummary;
}

export interface DailyReportGeneratedResult {
  summary: string;
  achievements: string[];
  pipelineChanges: string[];
  followupFocus: string[];
  risks: string[];
  nextDayPlan: string[];
  managerBrief: string;
  metrics: DailyReportGeneratedMetrics;
  confidence: number;
  missingData: string[];
}

export type DailyReportSharePlatform = "dingtalk" | "wechat_work";

export interface DailyReportSharePayload {
  platform: DailyReportSharePlatform;
  webhookUrl: string;
  secret?: string;
  title?: string;
  content: string;
}

export interface DailyReportShareResult {
  platform: DailyReportSharePlatform;
  platformLabel: string;
  messageType: "text";
  title: string | null;
  deliveredAt: string;
  webhookHost: string;
}

export type SalesReportScope = "company" | "mine";

export interface SalesReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  days?: number;
  timezone?: string;
  scope?: SalesReportScope;
}

export interface SalesReportWindow {
  dateFrom: string;
  dateTo: string;
  timeZone: string;
  startAt: string;
  endAt: string;
  days: number;
  scope: SalesReportScope;
  generatedAt: string;
}

export interface SalesComparisonWindow {
  dateFrom: string;
  dateTo: string;
  timeZone: string;
  startAt: string;
  endAt: string;
  days: number;
  scope: SalesReportScope;
}

export interface SalesOverviewBreakdownItem {
  key: string;
  label: string;
  count: number;
  estimatedAmount?: number | null;
  resolvedAmount?: number | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
}

export interface SalesOverviewTrendPoint {
  date: string;
  count: number;
  amount?: number | null;
  paidAmount?: number | null;
}

export interface SalesOverviewSnapshot {
  customerTotal: number;
  activeCustomers: number;
  dormantCustomers: number;
  lostCustomers: number;
  keyCustomers: number;
  averageAiScore: number;
  totalOpportunities: number;
  openOpportunities: number;
  pipelineAmount: number;
  wonOpportunities: number;
  wonAmount: number;
  totalOrders: number;
  completedOrders: number;
  totalOrderAmount: number;
  paidAmount: number;
  overdueFollowups: number;
}

export interface SalesOverviewPeriod {
  newCustomers: number;
  activitiesLogged: number;
  completedActivities: number;
  followupsScheduled: number;
  followupsCompleted: number;
  opportunitiesCreated: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  ordersCreated: number;
  orderAmount: number;
  paidAmount: number;
}

export interface SalesOverviewBreakdowns {
  customersByStatus: SalesOverviewBreakdownItem[];
  customersByLevel: SalesOverviewBreakdownItem[];
  customersBySource: SalesOverviewBreakdownItem[];
  opportunitiesByStage: SalesOverviewBreakdownItem[];
  ordersByStatus: SalesOverviewBreakdownItem[];
  activitiesByType: SalesOverviewBreakdownItem[];
  followupsByStatus: SalesOverviewBreakdownItem[];
}

export interface SalesOverviewTrends {
  customersCreated: SalesOverviewTrendPoint[];
  activitiesLogged: SalesOverviewTrendPoint[];
  wonRevenue: SalesOverviewTrendPoint[];
  orderRevenue: SalesOverviewTrendPoint[];
}

export interface SalesOverviewStats {
  window: SalesReportWindow;
  snapshot: SalesOverviewSnapshot;
  period: SalesOverviewPeriod;
  breakdowns: SalesOverviewBreakdowns;
  trends: SalesOverviewTrends;
}

export interface SalesFunnelStage {
  key: string;
  label: string;
  order: number;
  isClosed: boolean;
  count: number;
  estimatedAmount: number;
  resolvedAmount: number;
  shareRate: number;
  conversionFromFirst: number;
  conversionFromPrevious: number;
}

export interface SalesFunnelConversionStep {
  fromStage: string;
  fromLabel: string;
  toStage: string;
  toLabel: string;
  fromCount: number;
  toCount: number;
  dropOffCount: number;
  conversionRate: number;
}

export interface SalesFunnelSummary {
  totalOpportunities: number;
  openOpportunities: number;
  closedOpportunities: number;
  pipelineAmount: number;
  wonOpportunities: number;
  lostOpportunities: number;
  wonAmount: number;
  lostAmount: number;
  averageOpenOpportunityAmount: number;
  averageWonAmount: number;
  overallToWonRate: number;
  overallToLostRate: number;
  closeRate: number;
  winRate: number;
}

export interface SalesFunnelPeriod {
  opportunitiesCreated: number;
  createdEstimatedAmount: number;
  createdResolvedAmount: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  wonAmount: number;
  lostAmount: number;
}

export interface SalesFunnelConversions {
  topOfFunnelStage: string;
  topOfFunnelLabel: string;
  topOfFunnelCount: number;
  overallToWonRate: number;
  overallToLostRate: number;
  stageToStage: SalesFunnelConversionStep[];
}

export interface SalesFunnelAggregate {
  window: SalesReportWindow;
  summary: SalesFunnelSummary;
  period: SalesFunnelPeriod;
  stages: SalesFunnelStage[];
  conversions: SalesFunnelConversions;
}

export interface SalesMetricComparison {
  current: number;
  previous: number;
  delta: number;
  changeRate: number;
}

export interface SalesRevenueTrendPoint {
  date: string;
  wonCount: number;
  wonAmount: number;
  orderCount: number;
  orderAmount: number;
  paidAmount: number;
}

export interface SalesRevenueSummary {
  totalWonCount: number;
  totalWonAmount: number;
  totalOrderCount: number;
  totalOrderAmount: number;
  totalPaidAmount: number;
  peakWonAmount: number;
  peakWonDate: string | null;
  peakOrderAmount: number;
  peakOrderDate: string | null;
  averageDailyWonAmount: number;
  averageDailyOrderAmount: number;
  averageDailyPaidAmount: number;
  averageWonTicketSize: number;
  averageOrderTicketSize: number;
}

export interface SalesRevenueComparison {
  wonCount: SalesMetricComparison;
  wonAmount: SalesMetricComparison;
  orderCount: SalesMetricComparison;
  orderAmount: SalesMetricComparison;
  paidAmount: SalesMetricComparison;
}

export interface SalesRevenueTrend {
  window: SalesReportWindow;
  comparisonWindow: SalesComparisonWindow;
  summary: SalesRevenueSummary;
  comparison: SalesRevenueComparison;
  trend: SalesRevenueTrendPoint[];
}

export interface SalesTeamRankingMetrics {
  wonCount: number;
  wonAmount: number;
  orderCount: number;
  orderAmount: number;
  paidAmount: number;
  pipelineCount: number;
  pipelineAmount: number;
}

export interface SalesTeamRankingMember {
  rank: number;
  userId: string;
  username: string;
  email: string;
  userRole: string;
  isCurrentUser: boolean;
  metrics: SalesTeamRankingMetrics;
}

export interface SalesTeamRankingSummary {
  totalMembers: number;
  membersWithPerformance: number;
  topLimit: number;
  totalWonCount: number;
  totalWonAmount: number;
  totalOrderCount: number;
  totalOrderAmount: number;
  totalPaidAmount: number;
  totalPipelineCount: number;
  totalPipelineAmount: number;
}

export interface SalesTeamRanking {
  window: SalesReportWindow;
  summary: SalesTeamRankingSummary;
  rankings: SalesTeamRankingMember[];
  currentUserRank: SalesTeamRankingMember | null;
}
